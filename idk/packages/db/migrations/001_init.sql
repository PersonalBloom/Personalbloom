-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  name              text,
  auth_mode         text not null default 'email' check (auth_mode in ('email', 'guest')),
  school_system     text,
  subjects          text[] default '{}',
  plan              text not null default 'free' check (plan in ('free', 'trial', 'soulplus')),
  trial_started_at  timestamptz,
  trial_days        int default 7,
  growth_points     int not null default 0,
  streak            int not null default 0,
  last_active       date,
  total_sessions    int not null default 0,
  heatmap           jsonb default '{}',
  achievements      text[] default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── QUIZ RESULTS ────────────────────────────────────────────────────────────
create table public.quiz_results (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  subject     text not null,
  correct     int  not null default 0,
  total       int  not null default 1,
  created_at  timestamptz not null default now()
);

-- ─── STUDY SESSIONS / TASKS ──────────────────────────────────────────────────
create table public.study_sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  subject     text,
  due_date    date,
  done        boolean not null default false,
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  duration_m  int,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ─── FLASHCARD DECKS ─────────────────────────────────────────────────────────
create table public.flashcard_decks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  subject     text,
  card_count  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── FLASHCARDS ──────────────────────────────────────────────────────────────
create table public.flashcards (
  id          uuid primary key default uuid_generate_v4(),
  deck_id     uuid not null references public.flashcard_decks(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  front       text not null,
  back        text not null,
  ease_factor real not null default 2.5,
  interval_d  int  not null default 1,
  next_review date not null default current_date,
  created_at  timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index on public.quiz_results    (user_id, created_at desc);
create index on public.study_sessions  (user_id, due_date);
create index on public.flashcards      (user_id, next_review);
create index on public.flashcards      (deck_id);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ─── NEW USER TRIGGER ────────────────────────────────────────────────────────
-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, plan, trial_started_at, trial_days)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'trial',
    now(),
    7
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.quiz_results    enable row level security;
alter table public.study_sessions  enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards      enable row level security;

-- Profiles: users can only see/edit their own
create policy "own profile"        on public.profiles        for all using (auth.uid() = id);

-- Quiz results: own rows only
create policy "own quiz results"   on public.quiz_results    for all using (auth.uid() = user_id);

-- Study sessions: own rows only
create policy "own study sessions" on public.study_sessions  for all using (auth.uid() = user_id);

-- Flashcard decks: own rows only
create policy "own decks"          on public.flashcard_decks for all using (auth.uid() = user_id);

-- Flashcards: own rows only
create policy "own flashcards"     on public.flashcards      for all using (auth.uid() = user_id);
