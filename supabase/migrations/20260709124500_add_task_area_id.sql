alter table public.tasks
add column if not exists area_id uuid references public.areas(id) on delete set null;

alter table public.tasks
alter column project_id drop not null;

alter table public.tasks
drop constraint if exists tasks_project_id_fkey;

alter table public.tasks
add constraint tasks_project_id_fkey
foreign key (project_id)
references public.projects(id)
on delete set null;

create index if not exists tasks_user_area_id_idx
on public.tasks(user_id, area_id);
