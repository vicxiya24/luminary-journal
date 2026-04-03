-- Table: journal_entries
create table public.journal_entries (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    week_start date not null,
    oiliness integer not null check (oiliness >= 1 and oiliness <= 5),
    dryness integer not null check (dryness >= 1 and dryness <= 5),
    irritation integer not null check (irritation >= 1 and irritation <= 5),
    breakouts integer not null check (breakouts >= 1 and breakouts <= 5),
    satisfaction integer not null check (satisfaction >= 1 and satisfaction <= 5),
    diet_tags text[] default '{}'::text[],
    routine_id uuid references public.routines(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table public.journal_entries enable row level security;

create policy "Users can view own journal entries"
    on public.journal_entries for select
    using ( auth.uid() = user_id );

create policy "Users can insert own journal entries"
    on public.journal_entries for insert
    with check ( auth.uid() = user_id );

create policy "Users can update own journal entries"
    on public.journal_entries for update
    using ( auth.uid() = user_id );
