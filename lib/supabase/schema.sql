-- ============================================================
-- HealingPal Phase 1 — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── 1. Profiles ─────────────────────────────────────────────
-- Auto-created when a user signs up via trigger below
create table if not exists public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  email        text,
  display_name text,
  is_pro       boolean default false,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 2. Chat Sessions ─────────────────────────────────────────
create table if not exists public.chat_sessions (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  title      text default 'New conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chat_sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.chat_sessions for all
  using (auth.uid() = user_id);


-- ── 3. Chat Messages ─────────────────────────────────────────
create table if not exists public.chat_messages (
  id         uuid default uuid_generate_v4() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  role       text check (role in ('user', 'assistant')) not null,
  content    text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can manage their own messages"
  on public.chat_messages for all
  using (auth.uid() = user_id);

-- Index for fast history lookup
create index if not exists chat_messages_session_idx on public.chat_messages(session_id, created_at);


-- ── 4. Daily Usage Tracking ───────────────────────────────────
create table if not exists public.daily_usage (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  date       date not null default current_date,
  msg_count  integer default 0,
  unique(user_id, date)
);

alter table public.daily_usage enable row level security;

create policy "Users can view their own usage"
  on public.daily_usage for select
  using (auth.uid() = user_id);

-- Service role can update (API routes use service role)
create policy "Service role manages usage"
  on public.daily_usage for all
  using (auth.role() = 'service_role');


-- ── 5. Mood Check-ins ─────────────────────────────────────────
create table if not exists public.mood_checkins (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  score      integer check (score between 1 and 10) not null,
  note       text,
  date       date not null default current_date,
  created_at timestamptz default now(),
  unique(user_id, date)  -- one check-in per day
);

alter table public.mood_checkins enable row level security;

create policy "Users can manage their own mood check-ins"
  on public.mood_checkins for all
  using (auth.uid() = user_id);
