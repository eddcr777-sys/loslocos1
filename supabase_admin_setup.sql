-- Enable Extensions
create extension if not exists "uuid-ossp";

-- 1. ADMIN LOGS TABLE
create table if not exists admin_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references auth.users(id) on delete cascade,
  action text not null, -- e.g., 'BROADCAST', 'BAN_USER', 'PURGE_CACHE'
  details text,
  target_id uuid, -- Optional: ID of the user/post affected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for admin_logs
alter table admin_logs enable row level security;

create policy "Admins can view all logs"
  on admin_logs for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and user_type in ('admin', 'ceo')
    )
  );

create policy "Admins can insert logs"
  on admin_logs for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and user_type in ('admin', 'ceo')
    )
  );

-- 2. SCHEDULED POSTS TABLE
create table if not exists scheduled_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  image_url text,
  scheduled_for timestamp with time zone not null,
  is_official boolean default false,
  status text default 'pending' check (status in ('pending', 'published', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for scheduled_posts
alter table scheduled_posts enable row level security;

create policy "Users can manage their own scheduled posts"
  on scheduled_posts for all
  using (auth.uid() = user_id);

-- 3. ANALYTICS FUNCTION (Simple version for MVP)
create or replace function get_weekly_growth()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'users_last_7_days', (
      select json_agg(cnt) from (
        select count(*) as cnt
        from profiles
        where created_at > now() - interval '7 days'
        group by date_trunc('day', created_at)
        order by date_trunc('day', created_at)
      ) t
    ),
    'posts_last_7_days', (
      select json_agg(cnt) from (
        select count(*) as cnt
        from posts
        where created_at > now() - interval '7 days'
        group by date_trunc('day', created_at)
        order by date_trunc('day', created_at)
      ) t
    )
  ) into result;
  
  return result;
end;
$$;
