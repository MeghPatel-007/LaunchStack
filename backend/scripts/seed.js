import bcrypt from 'bcrypt'
import pool from '../src/db/pool.js'
async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed script cannot run in production')
  }
  const client = await pool.connect()
  try {
    await client.query('begin')
    const truncateQuery = `
            truncate table
            project_phases,
            project_members,
            projects,
            users
            restart identity cascade;
        `
    await client.query(truncateQuery)
    const details = {
      owner: {
        username: 'testOwner',
        email: 'testowner@gmail.com',
        password: 'testOwner@123',
      },
      member: {
        username: 'testMember',
        email: 'testmember@gmail.com',
        password: 'testMember@123',
      },
      nonmember: {
        username: 'testNonMember',
        email: 'testnonmember@gmail.com',
        password: 'testNonMember@123',
      },
      project: {
        name: 'LaunchStack Seed',
        description: 'Development seed project',
        project_type: 'web app',
        tech_stack: 'Node.js, Express, PostgreSQL',
      },
      project_phases: {
        phase1: {
          name: 'Deployment',
          status: 'NOT_STARTED',
          position: 1,
        },
        phase2: {
          name: 'authentication',
          status: 'IN_PROGRESS',
          position: 2,
        },
        phase3: {
          name: 'srs',
          status: 'COMPLETED',
          position: 3,
        },
      },
    }
    const ownerHashPassword = await bcrypt.hash(details.owner.password, 10)
    const ownerInsertQuery = `
        insert into users(username,email,password_hash)
        values ($1,$2,$3)
        returning user_id;
    `
    const ownerInsertQueryResult = await client.query(ownerInsertQuery, [
      details.owner.username,
      details.owner.email,
      ownerHashPassword,
    ])
    const ownerId = ownerInsertQueryResult.rows[0].user_id
    const memberHashPassword = await bcrypt.hash(details.member.password, 10)
    const memberInsertQuery = `
        insert into users(username,email,password_hash)
        values ($1,$2,$3)
        returning user_id;
    `
    const memberInsertQueryResult = await client.query(memberInsertQuery, [
      details.member.username,
      details.member.email,
      memberHashPassword,
    ])
    const memberId = memberInsertQueryResult.rows[0].user_id
    const nonMemberHashPassword = await bcrypt.hash(
      details.nonmember.password,
      10,
    )
    const nonMemberInsertQuery = `
        insert into users(username,email,password_hash)
        values ($1,$2,$3)
        returning user_id;
    `
    await client.query(
      nonMemberInsertQuery,
      [
        details.nonmember.username,
        details.nonmember.email,
        nonMemberHashPassword,
      ],
    )

    const projectInsertQuery = `
        insert into projects(name,description,project_type,tech_stack)
        values ($1,$2,$3,$4)
        returning project_id;
    `
    const projectInsertQueryResult = await client.query(projectInsertQuery, [
      details.project.name,
      details.project.description,
      details.project.project_type,
      details.project.tech_stack,
    ])
    const projectId = projectInsertQueryResult.rows[0].project_id

    const projectMembersInsertQuery = `
        insert into project_members(user_id,project_id,role)
        values ($1,$2,'OWNER'),
        ($3,$2,'MEMBER')
        returning user_id,project_id,role;
    `
    await client.query(projectMembersInsertQuery, [
      ownerId,
      projectId,
      memberId,
    ])

    const currentTime = new Date().toISOString()
    const projectPhasesInsertQuery = `
        insert into project_phases(project_id,name,status,position,start_time,finished_time)
        values  ($1,$2,$3,$4,null,null),
		($1,$5,$6,$7,$8,null),
		($1,$9,$10,$11,$8,$8)
        returning phase_id;
    `
    await client.query(projectPhasesInsertQuery, [
      projectId,
      details.project_phases.phase1.name,
      details.project_phases.phase1.status,
      details.project_phases.phase1.position,
      details.project_phases.phase2.name,
      details.project_phases.phase2.status,
      details.project_phases.phase2.position,
      currentTime,
      details.project_phases.phase3.name,
      details.project_phases.phase3.status,
      details.project_phases.phase3.position,
    ])
    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    console.error(e.message)
    throw e
  } finally {
    client.release()
    await pool.end()
  }
}
seed()
