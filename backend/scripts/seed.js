import bcrypt from 'bcrypt'
import pool from '../src/db/pool.js'
async function seed() {
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
    await client.query(truncateQuery) //? just to reset the development seed for testing
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
    // * generate UserIds
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
    const nonMemberInsertQueryResult = await client.query(
      nonMemberInsertQuery,
      [
        details.nonmember.username,
        details.nonmember.email,
        nonMemberHashPassword,
      ],
    )

    // * Generate projectId
    const projectInserQuery = `
        insert into projects(name,description,project_type,tech_stack)
        values ($1,$2,$3,$4)
        returning project_id;
    `
    const projectInsertQueryResult = await client.query(projectInserQuery, [
      details.project.name,
      details.project.description,
      details.project.project_type,
      details.project.tech_stack,
    ])
    const projectId = projectInsertQueryResult.rows[0].project_id

    // * Generate Membershp Ids
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

    // * Generate Project Phases
    const currentTime = new Date().toISOString()
    const projectPhasesInsertQuery = `
        insert into project_phases(project_id,name,status,position,start_time,finished_time)
        values  ($1,$2,$3,$4,null,null),
		($1,$5,$6,$7,$8,null),
		($1,$9,$10,$11,$8,$8)
        returning phase_id;
    `
    await client.query(projectPhasesInsertQuery, [
      projectId, //1
      details.project_phases.phase1.name, //2
      details.project_phases.phase1.status, //3
      details.project_phases.phase1.position, //4
      details.project_phases.phase2.name, //5
      details.project_phases.phase2.status, //6
      details.project_phases.phase2.position, //7
      currentTime, // 8
      details.project_phases.phase3.name, //9
      details.project_phases.phase3.status, //10
      details.project_phases.phase3.position, //11
    ])
    console.log('Testing : Data is inserted into db')
    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    console.error(e.message)
  } finally {
    client.release()
    await pool.end()
  }
}
seed()
