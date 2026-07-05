-- Go OS schema.
-- Core scope: areas, projects, tasks, inbox_items, library_items, weekly_reviews, content_posts and clickup_mirror_tasks.

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

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  area_id uuid references public.areas(id) on delete set null,
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

alter table public.projects
add column if not exists area_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_area_id_fkey'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
    add constraint projects_area_id_fkey
    foreign key (area_id)
    references public.areas(id)
    on delete set null;
  end if;
end;
$$;

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

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null
    check (type in ('note', 'link', 'resource')),
  content text,
  url text,
  area_id uuid references public.areas(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  publish_date date not null,
  channel text not null default '',
  status text not null default 'Idea'
    check (status in ('Idea', 'Pendiente', 'Diseñado', 'Programado', 'Publicado', 'Cancelado')),
  project_id uuid references public.projects(id) on delete set null,
  area_id uuid references public.areas(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clickup_mirror_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'clickup',
  external_id text not null,
  list_id text not null,
  task_name text not null,
  status text not null default 'Sin estado',
  priority text,
  assignees_json jsonb,
  due_date timestamptz,
  task_url text,
  raw_payload jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, list_id, external_id)
);

create index if not exists areas_user_id_idx on public.areas(user_id);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_user_area_id_idx on public.projects(user_id, area_id);
create index if not exists projects_user_status_idx on public.projects(user_id, status);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_project_id_idx on public.tasks(user_id, project_id);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);
create index if not exists inbox_items_user_archived_idx on public.inbox_items(user_id, archived);
create index if not exists library_items_user_id_idx on public.library_items(user_id);
create index if not exists library_items_user_type_idx on public.library_items(user_id, type);
create index if not exists library_items_user_area_id_idx on public.library_items(user_id, area_id);
create index if not exists library_items_user_project_id_idx on public.library_items(user_id, project_id);
create index if not exists weekly_reviews_user_week_idx on public.weekly_reviews(user_id, week_start);
create index if not exists content_posts_user_publish_date_idx on public.content_posts(user_id, publish_date);
create index if not exists content_posts_user_status_idx on public.content_posts(user_id, status);
create index if not exists content_posts_user_channel_idx on public.content_posts(user_id, channel);
create index if not exists content_posts_user_project_id_idx on public.content_posts(user_id, project_id);
create index if not exists content_posts_user_area_id_idx on public.content_posts(user_id, area_id);
create index if not exists clickup_mirror_tasks_user_list_idx on public.clickup_mirror_tasks(user_id, list_id);
create index if not exists clickup_mirror_tasks_user_status_idx on public.clickup_mirror_tasks(user_id, status);
create index if not exists clickup_mirror_tasks_user_synced_at_idx on public.clickup_mirror_tasks(user_id, synced_at);

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

drop trigger if exists set_weekly_reviews_updated_at on public.weekly_reviews;
create trigger set_weekly_reviews_updated_at
before update on public.weekly_reviews
for each row execute function public.set_updated_at();

drop trigger if exists set_content_posts_updated_at on public.content_posts;
create trigger set_content_posts_updated_at
before update on public.content_posts
for each row execute function public.set_updated_at();

drop trigger if exists set_clickup_mirror_tasks_updated_at on public.clickup_mirror_tasks;
create trigger set_clickup_mirror_tasks_updated_at
before update on public.clickup_mirror_tasks
for each row execute function public.set_updated_at();

alter table public.areas enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.inbox_items enable row level security;
alter table public.library_items enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.content_posts enable row level security;
alter table public.clickup_mirror_tasks enable row level security;

drop policy if exists "Users can view their own areas" on public.areas;
create policy "Users can view their own areas"
on public.areas for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own areas" on public.areas;
create policy "Users can insert their own areas"
on public.areas for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own areas" on public.areas;
create policy "Users can update their own areas"
on public.areas for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own areas" on public.areas;
create policy "Users can delete their own areas"
on public.areas for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own projects" on public.projects;
create policy "Users can view their own projects"
on public.projects for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own projects" on public.projects;
create policy "Users can insert their own projects"
on public.projects for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    area_id is null
    or exists (
      select 1
      from public.areas
      where areas.id = projects.area_id
        and areas.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
on public.projects for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    area_id is null
    or exists (
      select 1
      from public.areas
      where areas.id = projects.area_id
        and areas.user_id = auth.uid()
    )
  )
);

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

drop policy if exists "Users can view their own library items" on public.library_items;
create policy "Users can view their own library items"
on public.library_items for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own library items" on public.library_items;
create policy "Users can insert their own library items"
on public.library_items for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    area_id is null
    or exists (
      select 1
      from public.areas
      where areas.id = library_items.area_id
        and areas.user_id = auth.uid()
    )
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects
      where projects.id = library_items.project_id
        and projects.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update their own library items" on public.library_items;
create policy "Users can update their own library items"
on public.library_items for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    area_id is null
    or exists (
      select 1
      from public.areas
      where areas.id = library_items.area_id
        and areas.user_id = auth.uid()
    )
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects
      where projects.id = library_items.project_id
        and projects.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can delete their own library items" on public.library_items;
create policy "Users can delete their own library items"
on public.library_items for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own weekly reviews" on public.weekly_reviews;
create policy "Users can view their own weekly reviews"
on public.weekly_reviews for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own weekly reviews" on public.weekly_reviews;
create policy "Users can insert their own weekly reviews"
on public.weekly_reviews for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own weekly reviews" on public.weekly_reviews;
create policy "Users can update their own weekly reviews"
on public.weekly_reviews for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own weekly reviews" on public.weekly_reviews;
create policy "Users can delete their own weekly reviews"
on public.weekly_reviews for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own content posts" on public.content_posts;
create policy "Users can view their own content posts"
on public.content_posts for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own content posts" on public.content_posts;
create policy "Users can insert their own content posts"
on public.content_posts for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    area_id is null
    or exists (
      select 1
      from public.areas
      where areas.id = content_posts.area_id
        and areas.user_id = auth.uid()
    )
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects
      where projects.id = content_posts.project_id
        and projects.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update their own content posts" on public.content_posts;
create policy "Users can update their own content posts"
on public.content_posts for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    area_id is null
    or exists (
      select 1
      from public.areas
      where areas.id = content_posts.area_id
        and areas.user_id = auth.uid()
    )
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects
      where projects.id = content_posts.project_id
        and projects.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can delete their own content posts" on public.content_posts;
create policy "Users can delete their own content posts"
on public.content_posts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own ClickUp mirror tasks" on public.clickup_mirror_tasks;
create policy "Users can view their own ClickUp mirror tasks"
on public.clickup_mirror_tasks for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own ClickUp mirror tasks" on public.clickup_mirror_tasks;
create policy "Users can insert their own ClickUp mirror tasks"
on public.clickup_mirror_tasks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own ClickUp mirror tasks" on public.clickup_mirror_tasks;
create policy "Users can update their own ClickUp mirror tasks"
on public.clickup_mirror_tasks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own ClickUp mirror tasks" on public.clickup_mirror_tasks;
create policy "Users can delete their own ClickUp mirror tasks"
on public.clickup_mirror_tasks for delete
to authenticated
using (auth.uid() = user_id);
