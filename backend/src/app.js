import express from 'express'

// * application
export const app = express() // express application obj

// * configuration
app.get('/', (req, res) => { // '/' verifies the path and then executes the cb func , req and res are also obj
  res.send('hello world')
})
