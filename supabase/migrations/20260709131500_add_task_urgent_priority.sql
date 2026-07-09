alter table public.tasks
add column if not exists priority text default 'Media';

update public.tasks
set priority = 'Media'
where priority is null;

alter table public.tasks
alter column priority set default 'Media';

alter table public.tasks
alter column priority set not null;

alter table public.tasks
drop constraint if exists tasks_priority_check;

alter table public.tasks
add constraint tasks_priority_check
check (priority in ('Urgente', 'Alta', 'Media', 'Baja'));
