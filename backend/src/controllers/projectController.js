import pool from '../db/pool.js'

export async function getProjects(req, res, next) {
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
        where pm.user_id = $1;
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
    next(e)
  }
}

export async function createProject(req, res, next) {
  const { name, description, project_type, tech_stack } = req.body
  const userId = req.user.user_id
  const client = await pool.connect() // pool connected
  try {
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
    next(e)
  } finally {
    client.release() // returns that connection back to the pool so another request can use it
  }
}

export async function getProjectStats(req, res, next) {
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
    next(e)
  }
}

export async function getProjectById(req, res, next) {
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
    next(e)
  }
}

export async function putProjectById(req, res, next) {
  const id = req.params.id
  const { name, description, project_type, tech_stack } = req.body
  try {
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
    if (updateResult.rowCount === 0) {
      return res.status(404).json('Project does not exist')
    }
    res.status(200).json({
      msg: 'Project updated successfully',
      project_id: updateResult.rows[0].project_id,
    })
  } catch (e) {
    next(e)
  }
}

export async function deleteProjectById(req, res, next) {
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
    next(e)
  }
}

export async function addMemberbyId(req, res, next) {
  const projectId = req.params.id
  const userId = req.body.userId
  try {
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
      return res.status(409).json('User is already a member')
    }
    const query = `
      insert into project_members (user_id,project_id,role)
      values ($1,$2,'MEMBER')
      returning user_id
    `
    const result = await pool.query(query, [userId, projectId])
    res.status(200).json({
      msg: 'User is added as a member',
      userId: result.rows[0],
    })
  } catch (e) {
    next(e)
  }
}

export async function getProjectMembers(req, res, next) {
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
    next(e)
  }
}

export async function deleteMemberById(req, res, next) {
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
    next(e)
  }
}
