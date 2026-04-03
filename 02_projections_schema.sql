-- Table: projections
create table public.projections (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    triggered_by_routine_id uuid references public.routines(id),
    week_start date not null,
    projected_oiliness numeric(3, 1) not null,
    projected_dryness numeric(3, 1) not null,
    projected_irritation numeric(3, 1) not null,
    projected_breakouts numeric(3, 1) not null,
    projected_satisfaction numeric(3, 1) not null,
    narrative text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table public.projections enable row level security;

create policy "Users can view own projections"
    on public.projections for select
    using ( auth.uid() = user_id );

create policy "Users can insert own projections"
    on public.projections for insert
    with check ( auth.uid() = user_id );

create policy "Users can update own projections"
    on public.projections for update
    using ( auth.uid() = user_id );
