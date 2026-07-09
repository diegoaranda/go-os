alter table public.library_items
add column if not exists tag text;

alter table public.library_items
drop constraint if exists library_items_type_check;

alter table public.library_items
add constraint library_items_type_check
check (type in ('note', 'link', 'resource', 'email'));

create index if not exists library_items_user_tag_idx
on public.library_items(user_id, tag);
