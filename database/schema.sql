-- Projects table
create table projects(
	project_id int generated always as identity not null primary key,
	name text not null,
	description text,
	project_type text not null,
	tech_stack text,
	created_at timestamptz not null default current_timestamp,
	updated_at timestamptz not null default current_timestamp
);

-- Projects_phase table
create table project_phases(
	phase_id int generated always as identity not null primary key,
	project_id int not null,
	name text not null,
	description text,
	status text not null ,
	position int not null ,
	start_time timestamptz,
	finished_time timestamptz,
	created_at timestamptz not null default current_timestamp,
	updated_at timestamptz not null default current_timestamp,
    constraint check_phase_status
        check(
            status in ('NOT_STARTED','IN_PROGRESS','COMPLETED')
            ),
    constraint check_phase_position
        check(position >= 1),
    constraint check_phase_finished_time
        check(
            finished_time is null
            or(
                start_time is not null
                and finished_time >= start_time
            )
        ),
    constraint check_phase_status_condition
        check(
            (status = 'NOT_STARTED' and start_time is null and finished_time is null)
            or
            (status = 'IN_PROGRESS' and start_time is not null and finished_time is null)
            or
            (status = 'COMPLETED' and start_time is not null and finished_time is not null)
        ),
	constraint fk_project_id
        foreign key (project_id)
        references projects(project_id)
        on delete cascade,
    constraint unique_project_position
	    unique(project_id,position)
);

-- Users table
create table users(
	user_id int generated always as identity primary key,
	username text not null,
	email text not null,
	password_hash text not null,
	created_at timestamptz not null default current_timestamp,
	updated_at timestamptz not null default current_timestamp,
	unique (email)
);
