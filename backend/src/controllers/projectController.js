import pool from '../../db/pool.js'
// ! never make circular dependencies
// * experimental data
// const data = {
//   1: { name: 'Project1', id: 1, type: 'software' },
//   2: { name: 'Project2', id: 2, type: 'hardware' },
//   3: { name: 'Project3', id: 3, type: 'software' },
// }
const dataStats = {
  1: { workDone: '10%', id: 1, type: 'software' },
  2: { workDone: '30%', id: 2, type: 'hardware' },
  3: { workDone: '100%', id: 3, type: 'software' },
}

// * without db connection
// export function getProjects(req, res) {
// * http handler
// * route handler
//   const query = req.query //ex GET /projects?type=web%20app
//   const filteredData =
//     query.type === undefined
//       ? data
//       : Object.fromEntries(
//           Object.entries(data).filter(([k, v]) => v.type === query.type),
//         )
//   res.json(filteredData)
// }

// export function getProjectById(req, res) {
//   const id = req.params.id //ex GET /projects/1
//   if (Object.hasOwn(data, id)) res.json(data[id])
//   else {
//     res.status(404).json({ error: 'Id does not exists' }) // http status code and msg
//   }
// }

// export function createProject(req, res) {
//   const response = req.body
//   if (response != undefined && Object.keys(response).length !== 0) {
//     res.json({ msg: 'Received new project' })
//   } else {
//     res.status(400).json({ error: 'New project cannot be received' })
//   }
// }

// export function deleteProjectById(req, res) {
//   const id = req.params.id
//   if (Object.hasOwn(data, id)) {
//     delete data[id]
//     res.json(`Project ID ${id} is deleted successfully`)
//   } else {
//     res.status(404).json({ error: 'Id does not exists' })
//   }
//}

export async function getProjects(req, res) {
  const type = req.query.type
  try {
    let result
    if (type === undefined) {
      result = await pool.query('select * from projects')
    } else {
      result = await pool.query(
        'select * from projects where project_type = $1',
        [type], // ! it is done to prevent sql injection
      ) // to check the db and db_user
    }
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ databaseError: `${e.message}` })
  }
}

export async function createProject(req, res) {
  const { name, description, project_type, tech_stack } = req.body
  try {
    if (
      typeof name !== 'string' ||
      name.trim() === '' ||
      typeof project_type !== 'string' ||
      project_type.trim() === ''
    ) {
      return res.status(400).json({ error: 'New project cannot be received' })
    }
    const result = await pool.query(
      'insert into projects(name,description,project_type,tech_stack) values ($1,$2,$3,$4) returning project_id',
      [name.trim(), description, project_type.trim(), tech_stack],
    )
    res.status(201).json({
      msg: 'Project created successfully',
      project_id: result.rows[0].project_id,
    })
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export function getProjectStats(req, res) {
  res.json(dataStats)
}

export async function getProjectById(req, res) {
  const id = req.params.id
  try {
    const result = await pool.query(
      'select * from projects where project_id = $1',
      [id],
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Id does not exist' })
    }
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function deleteProjectById(req, res) {
  const id = req.params.id
  try {
    const result = await pool.query(
      'delete from projects where project_id = $1',
      [id],
    )
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Id does not exist' })
    }
    res.json('successfully deleted')
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}
