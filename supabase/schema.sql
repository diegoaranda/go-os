-- Go OS Sprint 2A base schema.
-- Scope: projects, tasks and inbox_items only.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client text not null default '',
  status text not null default 'Activo'
    check (status in ('Activo', 'En pausa', 'Planificación', 'Completado')),
  priority text not null default 'Media'
    check (priority in ('Alta', 'Media', 'Baja')),
  next_action text not null default '',
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'Pendiente'
    check (status in ('Pendiente', 'En curso', 'En revisión', 'Bloqueado', 'Terminado')),
  priority text not null default 'Media'
    check (priority in ('Alta', 'Media', 'Baja')),
  due text not null default 'Sin fecha',
  source text not null default 'Manual'
    check (source in ('Manual', 'ClickUp', 'Inbox')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  suggested_project_id uuid references public.projects(id) on delete set null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_user_status_idx on public.projects(user_id, status);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_project_id_idx on public.tasks(user_id, project_id);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);
create index if not exists inbox_items_user_archived_idx on public.inbox_items(user_id, archived);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_inbox_items_updated_at on public.inbox_items;
create trigger set_inbox_items_updated_at
before update on public.inbox_items
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.inbox_items enable row level security;

drop policy if exists "Users can view their own projects" on public.projects;
create policy "Users can view their own projects"
on public.projects for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own projects" on public.projects;
create policy "Users can insert their own projects"
on public.projects for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
on public.projects for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects"
on public.projects for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks"
on public.tasks for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
on public.tasks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
on public.tasks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
on public.tasks for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own inbox items" on public.inbox_items;
create policy "Users can view their own inbox items"
on public.inbox_items for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own inbox items" on public.inbox_items;
create policy "Users can insert their own inbox items"
on public.inbox_items for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own inbox items" on public.inbox_items;
create policy "Users can update their own inbox items"
on public.inbox_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own inbox items" on public.inbox_items;
create policy "Users can delete their own inbox items"
on public.inbox_items for delete
to authenticated
using (auth.uid() = user_id);
