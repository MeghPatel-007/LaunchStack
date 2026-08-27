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
	status text not null check(status in ('NOT_STARTED','IN_PROGRESS','COMPLETED')),
	position int not null check(position >= 1),
	start_time timestamptz,
	finished_time timestamptz,
	created_at timestamptz not null default current_timestamp,
	updated_at timestamptz not null default current_timestamp,
	constraint fk_project_id
	foreign key (project_id)
	references projects(project_id),
	unique(project_id,position)
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

-- Phase_stats
with phase_stats as(
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
		((completed_phases::numeric/total_phases)*100)::int
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
returning project_id;
insert into projects_phase(project_id,name,status,position)
values (v_id,'srs','NOT_STARTED',1);
select * from project_phases;

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