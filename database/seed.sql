
-- testcases
-- 1
INSERT INTO projects (name, project_type)
VALUES
    ('LaunchStack', 'web app'),
    ('TestProject', 'mobile app')
RETURNING project_id, name;

-- 2
INSERT INTO project_phases
    (project_id, name, status, position)
VALUES
    (1, 'SRS', 'NOT_STARTED', 1)
RETURNING phase_id, project_id, name, status, position;

-- 3
INSERT INTO project_phases
    (project_id, name, status, position, start_time)
VALUES
    (1, 'Authentication', 'IN_PROGRESS', 2, CURRENT_TIMESTAMP)
RETURNING phase_id, project_id, name, status, position, start_time, finished_time;

-- 4
INSERT INTO project_phases
    (project_id, name, status, position, start_time, finished_time)
VALUES
    (
        1,
        'Database',
        'COMPLETED',
        3,
        '2026-08-31 180000+0530',
        '2026-08-31 200000+0530'
    )
RETURNING phase_id, project_id, name, status, position, start_time, finished_time;

-- NEGATIVE testcases
-- -- 5
-- INSERT INTO project_phases
--     (project_id, name, status, position)
-- VALUES
--     (1, 'Invalid Phase', 'COMPLETED', 4);

-- -- 6
-- INSERT INTO project_phases
--     (project_id, name, status, position)
-- VALUES
--     (999, 'Fake Phase', 'NOT_STARTED', 1);

-- -- 7
-- INSERT INTO project_phases
--     (project_id, name, status, position)
-- VALUES
--     (1, 'Duplicate Position', 'NOT_STARTED', 1);

