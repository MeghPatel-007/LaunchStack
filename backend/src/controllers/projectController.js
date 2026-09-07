import pool from '../db/pool.js'
// ! never make circular dependencies
// * experimental data
// const data = {
//   1: { name: 'Project1', id: 1, type: 'software' },
//   2: { name: 'Project2', id: 2, type: 'hardware' },
//   3: { name: 'Project3', id: 3, type: 'software' },
// }
// const dataStats = {
//   1: { workDone: '10%', id: 1, type: 'software' },
//   2: { workDone: '30%', id: 2, type: 'hardware' },
//   3: { workDone: '100%', id: 3, type: 'software' },
// }

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

// export function getProjectStats(req, res) {
//   res.json(dataStats)
// }

// ? handles these request and responses
// GET /projects
// POST /projects
// PUT /projects/:id
// DELETE /projects/:id
// GET /projects/stats
// POST /project/:id/members
// GET /project/:id/members
// DELETE /project/:id/members

export async function getProjects(req, res) {
  const type = req.query.type
  const userId = req.user.user_id
  try {
    let result
    let query
    if (type === undefined) {
      query = `
        select p.project_id,name,description,project_type,tech_stack,role
        from projects as p
        join project_members as pm
        on p.project_id = pm.project_id
        where user_id = $1;
      `
      result = await pool.query(query, [userId])
    } else {
      query = `
        select p.project_id,name,description,project_type,tech_stack,role
        from projects as p
        join project_members as pm
        on p.project_id = pm.project_id
        where pm.user_id = $1
        and p.project_type = $2;
      `
      result = await pool.query(
        query,
        [userId, type], // ! it is done to prevent sql injection
      ) // to check the db and db_user
    }
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function createProject(req, res) {
  const { name, description, project_type, tech_stack } = req.body
  const userId = req.user.user_id
  const client = await pool.connect() // pool connected
  try {
    //validation
    if (
      typeof name !== 'string' ||
      name.trim() === '' ||
      typeof project_type !== 'string' ||
      project_type.trim() === ''
    ) {
      return res.status(400).json({ error: 'New project cannot be received' })
    }
    // transaction
    await client.query('begin') // transcation started
    const newProjectQuery = `
    insert into projects(name,description,project_type,tech_stack)
    values ($1,$2,$3,$4)
    returning project_id
    `
    const newProjectQueryResult = await client.query(newProjectQuery, [
      name.trim(),
      description,
      project_type.trim(),
      tech_stack,
    ])
    const ownershipQuery = `
    insert into project_members (user_id,project_id,role)
    values ($1,$2,'OWNER')
    returning project_id
    `
    const newProjectId = newProjectQueryResult.rows[0].project_id
    const result = await client.query(ownershipQuery, [userId, newProjectId])
    await client.query('commit') // commit and transaction done
    res.status(201).json({
      msg: 'Project created successfully',
      projectID: result.rows[0].project_id,
    })
  } catch (e) {
    await client.query('rollback')
    res.status(500).json({ databaseError: e.message })
  } finally {
    client.release() // returns that connection back to the pool so another request can use it
  }
}

export async function getProjectStats(req, res) {
  const userId = req.user.user_id
  try {
    const query = `with phase_stats as (
      select pp.project_id,
      count(pp.phase_id) as total_phases,
      count(pp.status) filter(where pp.status = 'COMPLETED') as completed_phases
      from project_phases as pp
      group by pp.project_id
      )
      select p.project_id,
      p.name,
      p.project_type,
      coalesce(ps.total_phases,0)::int as total_phases,
      count(pp.status) filter(where pp.status = 'NOT_STARTED')::int as not_started_phases,
      count(pp.status) filter(where pp.status = 'IN_PROGRESS')::int as in_progress_phases,
      coalesce(ps.completed_phases,0)::int as completed_phases,
      case
        when coalesce(ps.total_phases,0) = 0
          then 0
        else
        ((ps.completed_phases::numeric / ps.total_phases)*100)::int
        end as work_done
      from projects as p
      left join project_phases as pp
      on p.project_id = pp.project_id
      left join phase_stats as ps
      on ps.project_id = p.project_id
      join project_members as pm
      on p.project_id = pm.project_id
      where pm.user_id = $1
      group by p.project_id,ps.total_phases,ps.completed_phases
      order by p.project_id;`
    const result = await pool.query(query, [userId])
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function getProjectById(req, res) {
  const id = req.params.id
  const userId = req.user.user_id
  try {
    const query = `
      select p.project_id,name,description,project_type,tech_stack,role
      from projects as p
      join project_members as pm
      on p.project_id = pm.project_id
      where pm.user_id = $1 and p.project_id = $2;
    `
    const result = await pool.query(query, [userId, id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Id does not exist' })
    }
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function putProjectById(req, res) {
  const id = req.params.id
  const { name, description, project_type, tech_stack } = req.body
  try {
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Project Name is empty or missing' })
    }
    if (typeof project_type !== 'string' || project_type.trim() === '') {
      return res.status(400).json({ error: 'Project Type is empty or missing' })
    }
    const query = `
      update projects
      set name = $2,
      description = $3,
      project_type = $4,
      tech_stack = $5,
      updated_at = current_timestamp
      where project_id = $1
      returning project_id;
    `
    const updateResult = await pool.query(query, [
      id,
      name.trim(),
      description,
      project_type.trim(),
      tech_stack,
    ])
    res.status(200).json({
      msg: 'Project updated successfully',
      project_id: updateResult.rows[0].project_id,
    })
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

export async function addMemberbyId(req, res) {
  const projectId = req.params.id
  const userId = req.body.userId
  try {
    if (
      typeof userId !== 'number' ||
      Number.isNaN(userId) ||
      !Number.isInteger(userId)
    ) {
      return res.status(400).json('UserId is invalid')
    }
    const userCheck = `
      select user_id
      from users
      where user_id = $1
    `
    const userCheckResult = await pool.query(userCheck, [userId])
    if (userCheckResult.rowCount === 0) {
      return res.status(404).json('User id does not exists')
    }
    const memberCheck = `
      select user_id
      from project_members
      where user_id = $1 and project_id = $2 and role = 'MEMBER'
    `
    const memberCheckResult = await pool.query(memberCheck, [userId, projectId])
    if (memberCheckResult.rowCount === 1) {
      return res.status(200).json('User is already a member')
    }
    const query = `
      insert into project_members (user_id,project_id,role)
      values ($1,$2,'MEMBER')
      returning user_id
    `
    const result = await pool.query(query, [userId, projectId])
    res.status(200).json({
      msg: 'User is add as a member',
      userId: result.rows[0],
    })
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function getProjectMembers(req, res) {
  const id = req.params.id
  try {
    const query = `
      select u.user_id,
      u.username,
      u.email,
      pm.role,
      pm.created_at
      from project_members pm
      join users u
      on pm.user_id = u.user_id
      where project_id = $1
      order by
      case
      when pm.role = 'OWNER' then 1
      when pm.role = 'MEMBER' then 2
      end,
      u.username;
    `
    const result = await pool.query(query, [id])
    res.status(200).json(result.rows)
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function deleteMemberById(req, res) {
  const projectId = req.params.id
  const memberId = Number(req.params.userId)
  const ownerId = req.user.user_id
  try {
    if (ownerId === memberId) {
      return res.status(403).json('Project owner cannot remove themselves')
    }
    const query = `
      delete from project_members
      where project_id = $1
      and user_id = $2
      returning user_id;
    `
    const result = await pool.query(query, [projectId, memberId])
    if (result.rowCount === 0) {
      return res.status(404).json('User is not a member of this project')
    }
    res.status(200).json({
      msg: 'User is removed from the project',
      userId: result.rows[0].user_id,
    })
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}
