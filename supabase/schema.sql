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
  area_id uuid references public.areas(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  status text not null default 'Pendiente'
    check (status in ('Pendiente', 'En curso', 'En revisión', 'Bloqueado', 'Terminado')),
  priority text not null default 'Media'
    check (priority in ('Urgente', 'Alta', 'Media', 'Baja')),
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
    check (type in ('note', 'link', 'resource', 'email')),
  tag text,
  content text,
  url text,
  area_id uuid references public.areas(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.library_items
add column if not exists tag text;

alter table public.library_items
drop constraint if exists library_items_type_check;

alter table public.library_items
add constraint library_items_type_check
check (type in ('note', 'link', 'resource', 'email'));

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

create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  title text not null,
  slug text,
  asset_type text not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'published', 'archived')),
  channel text,
  product_name text,
  campaign_name text,
  content_pillar text,
  objective text,
  current_version_id uuid,
  cover_image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.content_assets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null,
  title text,
  hook text,
  body_copy text,
  caption text,
  cta text,
  hashtags text,
  offer_text text,
  design_brief text,
  image_url text,
  image_alt_urls jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'rejected', 'published')),
  change_summary text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (asset_id, version_number)
);

create table if not exists public.content_asset_files (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.content_assets(id) on delete cascade,
  version_id uuid references public.content_asset_versions(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_type text not null,
  file_url text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- Storage note: Fase 1 stores manual file/image URLs.
-- Create a private "content-assets" Supabase Storage bucket manually before enabling direct uploads.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'content_assets_current_version_id_fkey'
      and conrelid = 'public.content_assets'::regclass
  ) then
    alter table public.content_assets
    add constraint content_assets_current_version_id_fkey
    foreign key (current_version_id)
    references public.content_asset_versions(id)
    on delete set null;
  end if;
end;
$$;

alter table public.content_posts
add column if not exists content_asset_id uuid references public.content_assets(id) on delete set null;

create table if not exists public.content_planning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  week_label text not null default '',
  target_date date not null,
  product_line text not null default '',
  goal text not null default '',
  format text not null default '',
  message_angle text not null default '',
  cta text not null default '',
  channel text not null default '',
  responsible text not null default '',
  planning_status text not null default 'pendiente de producción'
    check (planning_status in ('pendiente de producción', 'en diseño', 'copy listo', 'listo para programar')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_publishing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  planning_item_id uuid references public.content_planning_items(id) on delete set null,
  brand text not null,
  publish_date date not null,
  publish_time time,
  product_line text not null default '',
  channel text not null default '',
  final_copy text not null default '',
  asset_url text,
  publishing_status text not null default 'pendiente'
    check (publishing_status in ('pendiente', 'programado', 'publicado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  publishing_item_id uuid references public.content_publishing_items(id) on delete set null,
  brand text not null,
  week_label text not null default '',
  publish_date date not null,
  product_line text not null default '',
  reach integer not null default 0 check (reach >= 0),
  impressions integer not null default 0 check (impressions >= 0),
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
create index if not exists tasks_user_area_id_idx on public.tasks(user_id, area_id);
create index if not exists tasks_user_project_id_idx on public.tasks(user_id, project_id);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);
create index if not exists inbox_items_user_archived_idx on public.inbox_items(user_id, archived);
create index if not exists library_items_user_id_idx on public.library_items(user_id);
create index if not exists library_items_user_type_idx on public.library_items(user_id, type);
create index if not exists library_items_user_tag_idx on public.library_items(user_id, tag);
create index if not exists library_items_user_area_id_idx on public.library_items(user_id, area_id);
create index if not exists library_items_user_project_id_idx on public.library_items(user_id, project_id);
create index if not exists weekly_reviews_user_week_idx on public.weekly_reviews(user_id, week_start);
create index if not exists content_posts_user_publish_date_idx on public.content_posts(user_id, publish_date);
create index if not exists content_posts_user_status_idx on public.content_posts(user_id, status);
create index if not exists content_posts_user_channel_idx on public.content_posts(user_id, channel);
create index if not exists content_posts_user_project_id_idx on public.content_posts(user_id, project_id);
create index if not exists content_posts_user_area_id_idx on public.content_posts(user_id, area_id);
create index if not exists content_posts_user_content_asset_id_idx on public.content_posts(user_id, content_asset_id);
create index if not exists content_assets_user_id_idx on public.content_assets(user_id);
create index if not exists content_assets_brand_idx on public.content_assets(brand);
create index if not exists content_assets_status_idx on public.content_assets(status);
create index if not exists content_assets_asset_type_idx on public.content_assets(asset_type);
create index if not exists content_asset_versions_asset_id_idx on public.content_asset_versions(asset_id);
create index if not exists content_asset_versions_user_id_idx on public.content_asset_versions(user_id);
create index if not exists content_asset_files_asset_id_idx on public.content_asset_files(asset_id);
create index if not exists content_asset_files_user_id_idx on public.content_asset_files(user_id);
create index if not exists content_planning_items_user_brand_idx on public.content_planning_items(user_id, brand);
create index if not exists content_planning_items_user_week_idx on public.content_planning_items(user_id, week_label);
create index if not exists content_planning_items_user_target_date_idx on public.content_planning_items(user_id, target_date);
create index if not exists content_planning_items_user_status_idx on public.content_planning_items(user_id, planning_status);
create index if not exists content_publishing_items_user_brand_idx on public.content_publishing_items(user_id, brand);
create index if not exists content_publishing_items_user_publish_date_idx on public.content_publishing_items(user_id, publish_date);
create index if not exists content_publishing_items_user_channel_idx on public.content_publishing_items(user_id, channel);
create index if not exists content_publishing_items_user_status_idx on public.content_publishing_items(user_id, publishing_status);
create index if not exists content_results_user_brand_idx on public.content_results(user_id, brand);
create index if not exists content_results_user_week_idx on public.content_results(user_id, week_label);
create index if not exists content_results_user_publish_date_idx on public.content_results(user_id, publish_date);
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

drop trigger if exists set_content_assets_updated_at on public.content_assets;
create trigger set_content_assets_updated_at
before update on public.content_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_content_planning_items_updated_at on public.content_planning_items;
create trigger set_content_planning_items_updated_at
before update on public.content_planning_items
for each row execute function public.set_updated_at();

drop trigger if exists set_content_publishing_items_updated_at on public.content_publishing_items;
create trigger set_content_publishing_items_updated_at
before update on public.content_publishing_items
for each row execute function public.set_updated_at();

drop trigger if exists set_content_results_updated_at on public.content_results;
create trigger set_content_results_updated_at
before update on public.content_results
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
alter table public.content_assets enable row level security;
alter table public.content_asset_versions enable row level security;
alter table public.content_asset_files enable row level security;
alter table public.content_planning_items enable row level security;
alter table public.content_publishing_items enable row level security;
alter table public.content_results enable row level security;
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
  and (
    content_asset_id is null
    or exists (
      select 1
      from public.content_assets
      where content_assets.id = content_posts.content_asset_id
        and content_assets.user_id = auth.uid()
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
  and (
    content_asset_id is null
    or exists (
      select 1
      from public.content_assets
      where content_assets.id = content_posts.content_asset_id
        and content_assets.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can delete their own content posts" on public.content_posts;
create policy "Users can delete their own content posts"
on public.content_posts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own content assets" on public.content_assets;
create policy "Users can view their own content assets"
on public.content_assets for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own content assets" on public.content_assets;
create policy "Users can insert their own content assets"
on public.content_assets for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own content assets" on public.content_assets;
create policy "Users can update their own content assets"
on public.content_assets for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own content assets" on public.content_assets;
create policy "Users can delete their own content assets"
on public.content_assets for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own content asset versions" on public.content_asset_versions;
create policy "Users can view their own content asset versions"
on public.content_asset_versions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own content asset versions" on public.content_asset_versions;
create policy "Users can insert their own content asset versions"
on public.content_asset_versions for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.content_assets
    where content_assets.id = content_asset_versions.asset_id
      and content_assets.user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own content asset versions" on public.content_asset_versions;
create policy "Users can update their own content asset versions"
on public.content_asset_versions for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.content_assets
    where content_assets.id = content_asset_versions.asset_id
      and content_assets.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own content asset versions" on public.content_asset_versions;
create policy "Users can delete their own content asset versions"
on public.content_asset_versions for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own content asset files" on public.content_asset_files;
create policy "Users can view their own content asset files"
on public.content_asset_files for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own content asset files" on public.content_asset_files;
create policy "Users can insert their own content asset files"
on public.content_asset_files for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.content_assets
    where content_assets.id = content_asset_files.asset_id
      and content_assets.user_id = auth.uid()
  )
  and (
    version_id is null
    or exists (
      select 1
      from public.content_asset_versions
      where content_asset_versions.id = content_asset_files.version_id
        and content_asset_versions.asset_id = content_asset_files.asset_id
        and content_asset_versions.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update their own content asset files" on public.content_asset_files;
create policy "Users can update their own content asset files"
on public.content_asset_files for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.content_assets
    where content_assets.id = content_asset_files.asset_id
      and content_assets.user_id = auth.uid()
  )
  and (
    version_id is null
    or exists (
      select 1
      from public.content_asset_versions
      where content_asset_versions.id = content_asset_files.version_id
        and content_asset_versions.asset_id = content_asset_files.asset_id
        and content_asset_versions.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can delete their own content asset files" on public.content_asset_files;
create policy "Users can delete their own content asset files"
on public.content_asset_files for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own content planning items" on public.content_planning_items;
create policy "Users can view their own content planning items"
on public.content_planning_items for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own content planning items" on public.content_planning_items;
create policy "Users can insert their own content planning items"
on public.content_planning_items for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own content planning items" on public.content_planning_items;
create policy "Users can update their own content planning items"
on public.content_planning_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own content planning items" on public.content_planning_items;
create policy "Users can delete their own content planning items"
on public.content_planning_items for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own content publishing items" on public.content_publishing_items;
create policy "Users can view their own content publishing items"
on public.content_publishing_items for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own content publishing items" on public.content_publishing_items;
create policy "Users can insert their own content publishing items"
on public.content_publishing_items for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own content publishing items" on public.content_publishing_items;
create policy "Users can update their own content publishing items"
on public.content_publishing_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own content publishing items" on public.content_publishing_items;
create policy "Users can delete their own content publishing items"
on public.content_publishing_items for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own content results" on public.content_results;
create policy "Users can view their own content results"
on public.content_results for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own content results" on public.content_results;
create policy "Users can insert their own content results"
on public.content_results for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own content results" on public.content_results;
create policy "Users can update their own content results"
on public.content_results for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own content results" on public.content_results;
create policy "Users can delete their own content results"
on public.content_results for delete
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
