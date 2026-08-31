create table projects(
	project_id int generated always as identity not null primary key,
	name text not null,
	description text,
	project_type text not null,
	tech_stack text,
	created_at timestamptz not null default current_timestamp,
	updated_at timestamptz not null default current_timestamp
);

insert into projects(name,project_type)
values  ('Project1','web app'),
	 	('Project2','mobile app'),
		('Project3','desktop app');

truncate table projects restart identity;
drop table projects;

select * from projects;

drop table projects;

create table projects_phase(
	phase_id int generated always as identity not null primary key,
	project_id int not null,
	name text not null,
	description text,
	status text not null check(status in ('NOT_STARTED','IN_PROGRESS','COMPLETED')), -- diff status have start & finished time different
	position int not null check(position >= 1),
	start_time timestamptz,
	finished_time timestamptz, -- should not be before the start_time
	created_at timestamptz not null default current_timestamp,
	updated_at timestamptz not null default current_timestamp,
	constraint fk_project_id
	foreign key (project_id)
	references projects(project_id),
	unique(project_id,position),
	constraint check_phase_finished_time
		check(
			finished_time is null
			or(
				start_time is not null
				and finished_time >= start_time
			)
		)
);

truncate table projects_phase restart identity;

insert into projects_phase(project_id,name,status,position)
values  (1,'srs','NOT_STARTED',1),
		(1,'authentication','COMPLETED',2),
		(3,'authentication','COMPLETED',2);


select * from projects_phase;

drop table projects_phase;

-- Info
select a.name,b.name,b.status,b.position
from projects as a
join projects_phase as b
on a.project_id = b.project_id;

-- Phase_stats => cte
with phase_stats as( -- creates a temopary table with the columns
select  a.name,
		count(b.phase_id) as total_phases,
		count(b.status) filter (where b.status = 'COMPLETED') as completed_phases
from projects as a
left join projects_phase as b
on a.project_id = b.project_id
group by a.project_id
)
select  name,
		total_phases,
		completed_phases,
		case
			when total_phases = 0
				then 0
			else
		((completed_phases::numeric/total_phases)*100)::int -- type cast ::int
		end as progress
from phase_stats;


select project_id,count(phase_id) from projects_phase
group by project_id;

-- transaction
begin;
	insert into projects(name,project_type)
	values  ('Project4','web app');
	select * from projects;
commit;
-- rollback;
	select * from projects;

--create project and insert
insert into projects(name,project_type)
values  ('Project4','web app')
returning project_id; --gives the generated id not to do individual seleect
insert into projects_phase(project_id,name,status,position)
values (11,'srs','NOT_STARTED',1);
select * from projects_phase;

-- rollback
begin;
insert into projects(name,project_type)
values  ('Project5','web app')
returning project_id;
insert into projects_phase(project_id,name,status,position)
values (10,'srs','PAUSED',1);
rollback;
SELECT * FROM projects
WHERE name = 'Project5';

-- order by,limit,offsets -> used for pagination

select name from projects
order by created_at desc,project_id desc
limit 2
offset 2;

-- in,between,like,ilike
-- Alternative of this is
-- WHERE project_type = 'web app'
--   OR project_type = 'mobile app'

select * from projects
where project_type in ('web app','mobile app');

select * from projects
where project_id between 2 and 6;

select * from projects
where project_type like 'web %';

--ilike => case insensitive

select * from projects
where name ilike 'project%';

select * from projects
where project_type in ('web app','desktop app')
and name ilike 'project%'
order by created_at desc;

-- having

select a.name , count(b.phase_id) from projects as a
left join projects_phase as b
on a.project_id = b.project_id
group by a.project_id,a.name
having count(b.phase_id) >= 2;

-- Subqueries

select * from projects
where project_id > (
select avg(project_id)
from projects
);

-- explain
explain
select * from projects
where project_id = 3; -- has primary key so it does an index scan

explain
select * from projects
where project_type = 'web app'; -- sequential scan because it is not a primary key condn

--create index
create index idx_projects_project_type
on projects(project_type);

DROP INDEX idx_projects_project_type;

-- explain analyze
explain analyze
select * from projects
where project_id = 3; -- has primary key so it does an index scan not guarantee but for large data might use it

--schema hardening
select * from projects;
select * from projects_phase;
insert into projects_phase(project_id,name,status,position,start_time,finished_time)
values (1,'deployment','COMPLETED',3,NULL,NULL);

delete from projects_phase
where name = 'deployment';

-- add constriant
alter table projects_phase
add constraint check_phase_finished_time
check(
	finished_time is null
	or(
		start_time is not null
		and finished_time >= start_time
	)
);

alter table projects_phase
add constraint check_phase_status_condition
check(
	(status = 'NOT_STARTED' and start_time is null and finished_time is null)
	or
	(status = 'IN_PROGRESS' and start_time is not null and finished_time is null)
	or
	(status = 'COMPLETED' and start_time is not null and finished_time is not null)
);

SELECT phase_id, status, start_time, finished_time
FROM projects_phase
WHERE
    (status = 'NOT_STARTED' AND (start_time IS NOT NULL OR finished_time IS NOT NULL))
    OR
    (status = 'IN_PROGRESS' AND (start_time IS NULL OR finished_time IS NOT NULL))
    OR
    (status = 'COMPLETED' AND (start_time IS NULL OR finished_time IS NULL));

SELECT *
FROM projects_phase
WHERE phase_id IN (2, 3);

update projects_phase
set start_time = '2026-08-31 19:00:00+05:30',
    finished_time = '2026-08-31 20:00:00+05:30'
where phase_id in (2,3);

DROP TABLE IF EXISTS projects_phase CASCADE;
DROP TABLE IF EXISTS projects CASCADE;