import pool from './pool.js'

export async function getProjectRole(userId, projectId) {
  const membership = `
        select role
        from project_members
        where user_id = $1
        and project_id = $2
        `
  const membershipResult = await pool.query(membership, [userId, projectId])
  if (membershipResult.rowCount === 0) {
    return null
  }
  return membershipResult.rows[0].role
}

export async function getProjectIdFromPhase(phaseId) {
  const phaseProjectQuery = `
            select project_id
            from project_phases
            where phase_id = $1;
        `
  const phaseProjectResult = await pool.query(phaseProjectQuery, [phaseId])
  if (phaseProjectResult.rowCount === 0) {
    return null
  }
  return phaseProjectResult.rows[0].project_id
}
