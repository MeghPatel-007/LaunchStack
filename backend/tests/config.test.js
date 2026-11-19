import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { validatePortNumber, getDatabaseConfig } from '../src/config.js'

const envKeys = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
]
const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))

after(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
})

function withEnv(overrides, fn) {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  try {
    return fn()
  } finally {
    for (const key of envKeys) {
      if (savedEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = savedEnv[key]
      }
    }
  }
}

test('validatePortNumber - rejects missing, empty, and non-numeric ports', () => {
  const invalid = [
    [undefined, 'PORT env var is missing or empty'],
    ['', 'PORT env var is missing or empty'],
    ['   ', 'PORT env var is missing or empty'],
    ['abc', 'PORT env var is invalid'],
    ['0', 'PORT env var is invalid'],
    ['-1', 'PORT env var is invalid'],
    ['1.5', 'PORT env var is invalid'],
    ['65536', 'PORT env var is invalid'],
    ['NaN', 'PORT env var is invalid'],
  ]

  for (const [port, message] of invalid) {
    withEnv({ PORT: port }, () => {
      assert.throws(validatePortNumber, { message })
    })
  }
})

test('validatePortNumber - accepts ports inside the valid range', () => {
  for (const [port, expected] of [
    ['1', 1],
    ['8000', 8000],
    ['65535', 65535],
    [' 8000 ', 8000],
  ]) {
    withEnv({ PORT: port }, () => {
      assert.equal(validatePortNumber(), expected)
    })
  }
})

test('getDatabaseConfig - rejects missing or empty database settings', () => {
  const invalid = [
    [{ DB_HOST: undefined }, 'Database Host name is empty or missing'],
    [{ DB_HOST: '  ' }, 'Database Host name is empty or missing'],
    [{ DB_PORT: undefined }, 'Database port number is empty or missing'],
    [{ DB_PORT: 'abc' }, 'Database port number is not valid'],
    [{ DB_PORT: '0' }, 'Database port number is not valid'],
    [{ DB_PORT: '70000' }, 'Database port number is not valid'],
    [{ DB_PORT: '5.5' }, 'Database port number is not valid'],
    [{ DB_NAME: undefined }, 'Database name is empty or missing'],
    [{ DB_USER: '' }, 'Database user name is empty or missing'],
    [{ DB_PASSWORD: '   ' }, 'Database password is empty or missing'],
  ]

  for (const [overrides, message] of invalid) {
    withEnv(overrides, () => {
      assert.throws(getDatabaseConfig, { message })
    })
  }
})

test('getDatabaseConfig - returns trimmed values and a numeric port', () => {
  withEnv(
    {
      DB_HOST: ' localhost ',
      DB_PORT: '5432',
      DB_NAME: ' launchstack_test ',
      DB_USER: ' postgres ',
      DB_PASSWORD: ' secret ',
    },
    () => {
      assert.deepEqual(getDatabaseConfig(), {
        host: 'localhost',
        port: 5432,
        database: 'launchstack_test',
        user: 'postgres',
        password: 'secret',
      })
    },
  )
})
