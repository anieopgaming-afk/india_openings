-- =====================================================================
-- India Openings: schema, RLS, employer verification triggers
-- =====================================================================

-- Free / personal email providers that cannot be used to register employers
create table public.blocked_email_domains (domain text primary key);
insert into public.blocked_email_domains(domain) values
 ('gmail.com'),('googlemail.com'),('yahoo.com'),('yahoo.co.in'),('yahoo.in'),('ymail.com'),
 ('outlook.com'),('hotmail.com'),('live.com'),('msn.com'),('rediffmail.com'),('rediff.com'),
 ('icloud.com'),('me.com'),('aol.com'),('proton.me'),('protonmail.com'),('mail.com'),
 ('gmx.com'),('yandex.com'),('inbox.com'),('tutanota.com'),('mailinator.com'),
 ('guerrillamail.com'),('10minutemail.com'),('tempmail.com'),('sharklasers.com')
on conflict do nothing;
alter table public.blocked_email_domains enable row level security;  -- no policies: only the trigger (security definer) reads it

create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  domain      text not null unique check (domain = lower(domain)),
  logo_url    text,
  gstin       text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  cin         text check (cin   is null or cin   ~ '^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$'),
  is_verified boolean not null default false,
  hq_city     text,
  industry    text,
  careers_url text,
  ats_type    text check (ats_type in ('greenhouse','lever','ashby')),
  ats_slug    text,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  title           text not null,
  work_type       text not null default 'On-site' check (work_type in ('Remote','Hybrid','On-site')),
  job_type        text not null default 'Full-time' check (job_type in ('Full-time','Part-time','Internship')),
  category        text not null default 'Other',
  location_city   text not null,
  location_state  text,
  salary_min_inr  bigint,
  salary_max_inr  bigint,
  application_url text not null check (application_url ~* '^https?://'),
  description     text,
  status          text not null default 'active' check (status in ('active','closed')),
  source          text not null default 'employer' check (source in ('employer','aggregator')),
  external_id     text,
  created_at      timestamptz not null default now(),
  check (salary_min_inr is null or salary_max_inr is null or salary_max_inr >= salary_min_inr),
  unique (company_id, external_id)
);
create index jobs_active_recent_idx on public.jobs (status, created_at desc);
create index jobs_city_idx on public.jobs (location_city);
create index jobs_company_idx on public.jobs (company_id);

-- ---------------------------------------------------------------------
-- Helper: the company the signed-in employer belongs to
-- ---------------------------------------------------------------------
create or replace function public.my_company_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.profiles  enable row level security;
alter table public.jobs      enable row level security;

-- Companies: public read. No write policy => only service role / admins can edit,
-- which is what stops anyone from flipping is_verified themselves.
create policy "companies are public" on public.companies for select using (true);

create policy "own profile" on public.profiles for select using (id = auth.uid());

-- Jobs: everyone sees active jobs; employers also see their own closed ones.
create policy "public reads active jobs" on public.jobs for select
  using (status = 'active' or company_id = public.my_company_id());
create policy "employers insert own jobs" on public.jobs for insert to authenticated
  with check (company_id = public.my_company_id() and source = 'employer');
create policy "employers update own jobs" on public.jobs for update to authenticated
  using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "employers delete own jobs" on public.jobs for delete to authenticated
  using (company_id = public.my_company_id());

-- ---------------------------------------------------------------------
-- Employer onboarding: enforced in the database so it cannot be bypassed
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  dom   text  := lower(split_part(new.email, '@', 2));
  comp  uuid;
  gst   text  := nullif(upper(trim(meta->>'gstin')), '');
  cin_  text  := nullif(upper(trim(meta->>'cin')), '');
begin
  if coalesce(meta->>'role', '') <> 'employer' then
    return new;                         -- job seekers need no profile
  end if;

  if exists (select 1 from public.blocked_email_domains where domain = dom) then
    raise exception 'Use your official work email; free email domains are not allowed.';
  end if;

  select id into comp from public.companies where domain = dom;
  if comp is null then
    if nullif(trim(meta->>'company_name'), '') is null then
      raise exception 'Company name is required.';
    end if;
    -- GSTIN / CIN are only accepted when creating a brand-new company record
    insert into public.companies(name, domain, gstin, cin)
    values (trim(meta->>'company_name'), dom, gst, cin_)
    returning id into comp;
  end if;

  insert into public.profiles(id, company_id) values (new.id, comp);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Once the work email is confirmed (proves control of the domain), mark new companies
-- verified only if they also supplied a format-valid GSTIN or CIN. Seeded companies are
-- already verified. Everything else stays unverified until an admin reviews it.
create or replace function public.handle_email_confirmed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.companies c set is_verified = true
    from public.profiles p
    where p.id = new.id and c.id = p.company_id
      and (c.gstin is not null or c.cin is not null);
  end if;
  return new;
end $$;

create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function public.handle_email_confirmed();
