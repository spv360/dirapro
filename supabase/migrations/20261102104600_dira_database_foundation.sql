create function public.text_array_within_limits(p_values text[], p_max_items integer, p_max_item_length integer)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select p_values is not null
    and pg_catalog.cardinality(p_values) <= p_max_items
    and pg_catalog.array_position(p_values, null::text) is null
    and not exists (
      select 1
        from pg_catalog.unnest(p_values) as items(item)
       where pg_catalog.char_length(item) > p_max_item_length
          or pg_catalog.char_length(pg_catalog.btrim(item)) = 0
    );
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique
    check (
      username = lower(username)
      and char_length(username) between 3 and 30
      and username ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
      and position('--' in username) = 0
      and username <> all (array[
        'admin', 'administrator', 'api', 'app', 'about', 'account', 'auth', 'billing',
        'blog', 'contact', 'dashboard', 'dira', 'dirapro', 'help', 'home', 'login',
        'logout', 'me', 'new', 'onboarding', 'privacy', 'profile', 'profiles', 'register',
        'root', 'settings', 'share', 'signin', 'signup', 'static', 'support', 'system',
        'terms', 'user', 'users', 'www', 'alex-morgan'
      ]::text[])
    ),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  headline text not null default '' check (char_length(headline) <= 160),
  biography text not null default '' check (char_length(biography) <= 4000),
  known_for text not null default '' check (char_length(known_for) <= 300),
  career_focus text not null default '' check (char_length(career_focus) <= 300),
  location text not null default '' check (char_length(location) <= 120),
  interests text[] not null default '{}'
    check (public.text_array_within_limits(interests, 20, 60)),
  profile_image_path text,
  cover_image_path text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  onboarding_step smallint not null default 0 check (onboarding_step between 0 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  check (status <> 'published' or published_at is not null),
  check (profile_image_path is null or char_length(profile_image_path) <= 200),
  check (cover_image_path is null or char_length(cover_image_path) <= 200),
  check (
    profile_image_path is null
    or profile_image_path ~ (
      '^profile/' || id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    )
  ),
  check (
    cover_image_path is null
    or cover_image_path ~ (
      '^profile/' || id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    )
  )
);

create table public.expertise (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 0,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category text not null default 'expertise'
    check (category in ('expertise', 'skill', 'technology', 'industry', 'domain')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 0,
  organization text not null check (char_length(btrim(organization)) between 1 and 120),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  employment_type text not null default 'Full-time'
    check (employment_type in (
      'Full-time', 'Part-time', 'Contract', 'Freelance', 'Self-employed',
      'Board / advisory', 'Internship', 'Volunteer'
    )),
  location text not null default '' check (char_length(location) <= 120),
  start_date text not null default ''
    check (start_date = '' or start_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  end_date text not null default ''
    check (end_date = '' or end_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  is_current boolean not null default false,
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_current or end_date = ''),
  check (start_date = '' or end_date = '' or start_date <= end_date)
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 0,
  institution text not null check (char_length(btrim(institution)) between 1 and 120),
  qualification text not null default '' check (char_length(qualification) <= 120),
  field_of_study text not null default '' check (char_length(field_of_study) <= 120),
  start_date text not null default ''
    check (start_date = '' or start_date ~ '^[0-9]{4}$'),
  end_date text not null default ''
    check (end_date = '' or end_date ~ '^[0-9]{4}$'),
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date = '' or end_date = '' or start_date <= end_date)
);

create table public.recognition (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 0,
  kind text not null check (kind in ('certification', 'award', 'recognition')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  issuer text not null default '' check (char_length(issuer) <= 120),
  issue_date text not null default ''
    check (issue_date = '' or issue_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  credential_url text not null default ''
    check (credential_url = '' or (char_length(credential_url) <= 500 and credential_url ~ '^https?://[^[:space:]]+$')),
  description text not null default '' check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  type text not null default 'project'
    check (type in ('project', 'open-source', 'publication', 'achievement')),
  description text not null default '' check (char_length(description) <= 2000),
  url text not null default '' check (url = '' or (char_length(url) <= 500 and url ~ '^https?://[^[:space:]]+$')),
  media_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    media_path is null
    or media_path ~ (
      '^profile/' || profile_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    )
  )
);

create table public.knowledge (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  relevant_topics text[] not null default '{}'
    check (public.text_array_within_limits(relevant_topics, 12, 40)),
  url text not null default '' check (url = '' or (char_length(url) <= 500 and url ~ '^https?://[^[:space:]]+$')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  media_path text,
  external_url text not null default '' check (external_url = '' or (char_length(external_url) <= 500 and external_url ~ '^https?://[^[:space:]]+$')),
  category text not null default '' check (char_length(category) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (media_path is not null or external_url <> ''),
  check (
    media_path is null
    or media_path ~ (
      '^profile/' || profile_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    )
  )
);

create table public.public_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 0,
  platform text not null
    check (platform in ('LinkedIn', 'GitHub', 'YouTube', 'X', 'Instagram', 'Website', 'Other')),
  label text not null default '' check (char_length(label) <= 80),
  url text not null check (char_length(url) <= 500 and url ~ '^https?://[^[:space:]]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.journey_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null
    check (type in ('Insight', 'Building', 'Speaking', 'Achievement', 'Publication', 'Learning', 'Event', 'Announcement')),
  title text not null check (char_length(btrim(title)) between 1 and 140),
  description text not null default '' check (char_length(description) <= 2000),
  item_date date not null,
  organization text not null default '' check (char_length(organization) <= 120),
  external_url text not null default '' check (external_url = '' or (char_length(external_url) <= 500 and external_url ~ '^https?://[^[:space:]]+$')),
  tags text[] not null default '{}'
    check (public.text_array_within_limits(tags, 8, 32)),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (id, profile_id),
  check (status <> 'published' or published_at is not null)
);

create table public.journey_media (
  id uuid primary key default gen_random_uuid(),
  journey_item_id uuid not null unique,
  profile_id uuid not null,
  kind text not null check (kind in ('image', 'video')),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  alt text check (alt is null or char_length(alt) <= 200),
  created_at timestamptz not null default now(),
  foreign key (journey_item_id, profile_id)
    references public.journey_items(id, profile_id) on delete cascade,
  unique (journey_item_id, profile_id),
  check (
    (
      kind = 'image'
      and mime_type in ('image/jpeg', 'image/png', 'image/webp')
      and size_bytes <= 8388608
      and storage_path ~ (
        '^journey/' || profile_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      )
    )
    or
    (
      kind = 'video'
      and mime_type in ('video/mp4', 'video/webm')
      and size_bytes <= 62914560
      and storage_path ~ (
        '^journey/' || profile_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|webm)$'
      )
    )
  )
);

create table public.current_moment_refs (
  journey_item_id uuid primary key,
  profile_id uuid not null,
  featured_at timestamptz not null default now(),
  foreign key (journey_item_id, profile_id)
    references public.journey_items(id, profile_id) on delete cascade,
  foreign key (journey_item_id, profile_id)
    references public.journey_media(journey_item_id, profile_id) on delete cascade
);

create index profiles_status_username_idx on public.profiles(status, username);
create index expertise_profile_sort_idx on public.expertise(profile_id, sort_order);
create index experience_profile_sort_idx on public.experience(profile_id, sort_order);
create index education_profile_sort_idx on public.education(profile_id, sort_order);
create index recognition_profile_sort_idx on public.recognition(profile_id, sort_order);
create index contributions_profile_sort_idx on public.contributions(profile_id, sort_order);
create index knowledge_profile_sort_idx on public.knowledge(profile_id, sort_order);
create index portfolio_profile_sort_idx on public.portfolio(profile_id, sort_order);
create index public_links_profile_sort_idx on public.public_links(profile_id, sort_order);
create index contributions_media_path_idx on public.contributions(media_path) where media_path is not null;
create index portfolio_media_path_idx on public.portfolio(media_path) where media_path is not null;
create index journey_items_public_feed_idx
  on public.journey_items(profile_id, item_date desc, created_at desc)
  where status = 'published' and visibility = 'public';
create unique index journey_items_one_featured_per_profile_idx
  on public.journey_items(profile_id) where featured;
create index journey_media_profile_idx on public.journey_media(profile_id);
create index current_moment_refs_profile_featured_idx
  on public.current_moment_refs(profile_id, featured_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create function public.set_journey_publication_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  if tg_op = 'INSERT' then
    if new.status = 'published' then
      new.published_at := coalesce(new.published_at, pg_catalog.now());
    end if;
  else
    new.published_at := coalesce(
      old.published_at,
      case when new.status = 'published' then pg_catalog.now() else null end
    );
  end if;
  return new;
end;
$$;

create function public.is_profile_owner(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.owner_id = (select auth.uid())
  );
$$;

create function public.set_profile_published(p_profile_id uuid, p_published boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.profiles%rowtype;
begin
  if p_published is null then
    raise exception 'A publish state is required.'
      using errcode = '22023';
  end if;

  select p.*
    into target
    from public.profiles p
   where p.id = p_profile_id
     and p.owner_id = (select auth.uid())
   for update;

  if not found then
    raise exception 'Profile not found or not owned by the current user.'
      using errcode = '42501';
  end if;

  if p_published and (char_length(btrim(target.full_name)) = 0 or char_length(btrim(target.headline)) = 0) then
    raise exception 'Add a name and headline before publishing.'
      using errcode = '23514';
  end if;

  update public.profiles
     set status = case when p_published then 'published' else 'draft' end,
         published_at = case
           when p_published then coalesce(target.published_at, pg_catalog.now())
           else target.published_at
         end,
         updated_at = pg_catalog.now()
   where id = target.id;
end;
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_username text := pg_catalog.lower(pg_catalog.btrim(new.raw_user_meta_data ->> 'username'));
  new_full_name text := pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name');
begin
  if new_username is null or new_username = '' or new_full_name is null or new_full_name = '' then
    raise exception 'Sign-up requires username and full_name metadata.'
      using errcode = '23514';
  end if;

  insert into public.profiles (owner_id, username, full_name)
  values (new.id, new_username, new_full_name);

  return new;
end;
$$;

create function public.validate_current_moment_media()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
      from public.journey_media jm
     where jm.journey_item_id = new.journey_item_id
       and jm.profile_id = new.profile_id
       and jm.kind = 'image'
  ) then
    raise exception 'Current Moment requires an image attached to the Journey item.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create function public.validate_referenced_journey_media()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind <> 'image' and exists (
    select 1
      from public.current_moment_refs cm
     where cm.journey_item_id = new.journey_item_id
       and cm.profile_id = new.profile_id
  ) then
    raise exception 'Current Moment requires image media.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create function public.can_manage_media(p_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_profile_id uuid;
begin
  if p_path !~ '^profile/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
     and p_path !~ '^journey/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|mp4|webm)$' then
    return false;
  end if;

  target_profile_id := pg_catalog.split_part(p_path, '/', 2)::uuid;
  return exists (
    select 1
      from public.profiles p
     where p.id = target_profile_id
       and p.owner_id = (select auth.uid())
  );
end;
$$;

create function public.can_read_media(p_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_path !~ '^profile/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
     and p_path !~ '^journey/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|mp4|webm)$' then
    return false;
  end if;

  if p_path like 'profile/%' then
    return exists (
      select 1
        from public.profiles p
       where p.status = 'published'
         and (
           p.profile_image_path = p_path
           or p.cover_image_path = p_path
           or exists (
             select 1 from public.contributions c
              where c.profile_id = p.id and c.media_path = p_path
           )
           or exists (
             select 1 from public.portfolio po
              where po.profile_id = p.id and po.media_path = p_path
           )
         )
    );
  end if;

  return exists (
    select 1
      from public.journey_media jm
      join public.journey_items ji
        on ji.id = jm.journey_item_id and ji.profile_id = jm.profile_id
      join public.profiles p on p.id = ji.profile_id
     where jm.storage_path = p_path
       and ji.status = 'published'
       and ji.visibility = 'public'
       and p.status = 'published'
  );
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger expertise_set_updated_at
before update on public.expertise
for each row execute function public.set_updated_at();
create trigger experience_set_updated_at
before update on public.experience
for each row execute function public.set_updated_at();
create trigger education_set_updated_at
before update on public.education
for each row execute function public.set_updated_at();
create trigger recognition_set_updated_at
before update on public.recognition
for each row execute function public.set_updated_at();
create trigger contributions_set_updated_at
before update on public.contributions
for each row execute function public.set_updated_at();
create trigger knowledge_set_updated_at
before update on public.knowledge
for each row execute function public.set_updated_at();
create trigger portfolio_set_updated_at
before update on public.portfolio
for each row execute function public.set_updated_at();
create trigger public_links_set_updated_at
before update on public.public_links
for each row execute function public.set_updated_at();
create trigger journey_items_set_publication_metadata
before insert or update on public.journey_items
for each row execute function public.set_journey_publication_metadata();
create trigger current_moment_refs_validate_image
before insert or update on public.current_moment_refs
for each row execute function public.validate_current_moment_media();
create trigger journey_media_validate_current_moment
before update on public.journey_media
for each row execute function public.validate_referenced_journey_media();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create view public.public_profiles
with (security_invoker = true)
as
select
  id, username, full_name, headline, biography, known_for, career_focus,
  location, interests, profile_image_path, cover_image_path, published_at
from public.profiles
where status = 'published';

create view public.public_journey_items
with (security_invoker = true)
as
select
  ji.id, ji.profile_id, ji.type, ji.title, ji.description, ji.item_date,
  ji.organization, ji.external_url, ji.tags, ji.featured, ji.published_at, ji.created_at
from public.journey_items ji
join public.profiles p on p.id = ji.profile_id
where ji.status = 'published'
  and ji.visibility = 'public'
  and p.status = 'published';

alter table public.profiles enable row level security;
alter table public.expertise enable row level security;
alter table public.experience enable row level security;
alter table public.education enable row level security;
alter table public.recognition enable row level security;
alter table public.contributions enable row level security;
alter table public.knowledge enable row level security;
alter table public.portfolio enable row level security;
alter table public.public_links enable row level security;
alter table public.journey_items enable row level security;
alter table public.journey_media enable row level security;
alter table public.current_moment_refs enable row level security;

create policy profiles_read_published
on public.profiles for select to anon, authenticated
using (status = 'published');
create policy profiles_read_owner
on public.profiles for select to authenticated
using (public.is_profile_owner(id));
create policy profiles_update_owner
on public.profiles for update to authenticated
using (public.is_profile_owner(id))
with check (public.is_profile_owner(id));

create policy expertise_read_published
on public.expertise for select to anon, authenticated
using (exists (select 1 from public.profiles p where p.id = expertise.profile_id and p.status = 'published'));
create policy expertise_manage_owner
on public.expertise for all to authenticated
using (public.is_profile_owner(profile_id))
with check (public.is_profile_owner(profile_id));

create policy experience_read_published
on public.experience for select to anon, authenticated
using (exists (select 1 from public.profiles p where p.id = experience.profile_id and p.status = 'published'));
create policy experience_manage_owner
on public.experience for all to authenticated
using (public.is_profile_owner(profile_id))
with check (public.is_profile_owner(profile_id));

create policy education_read_published
on public.education for select to anon, authenticated
using (exists (select 1 from public.profiles p where p.id = education.profile_id and p.status = 'published'));
create policy education_manage_owner
on public.education for all to authenticated
using (public.is_profile_owner(profile_id))
with check (public.is_profile_owner(profile_id));

create policy recognition_read_published
on public.recognition for select to anon, authenticated
using (exists (select 1 from public.profiles p where p.id = recognition.profile_id and p.status = 'published'));
create policy recognition_manage_owner
on public.recognition for all to authenticated
using (public.is_profile_owner(profile_id))
with check (public.is_profile_owner(profile_id));

create policy contributions_read_published
on public.contributions for select to anon, authenticated
using (exists (select 1 from public.profiles p where p.id = contributions.profile_id and p.status = 'published'));
create policy contributions_manage_owner
on public.contributions for all to authenticated
using (public.is_profile_owner(profile_id))
with check (public.is_profile_owner(profile_id));

create policy knowledge_read_published
on public.knowledge for select to anon, authenticated
using (exists (select 1 from public.profiles p where p.id = knowledge.profile_id and p.status = 'published'));
create policy knowledge_manage_owner
on public.knowledge for all to authenticated
using (public.is_profile_owner(profile_id))
with check (public.is_profile_owner(profile_id));

create policy portfolio_read_published
on public.portfolio for select to anon, authenticated
using (exists (select 1 from public.profiles p where p.id = portfolio.profile_id and p.status = 'published'));
create policy portfolio_manage_owner
on public.portfolio for all to authenticated
using (public.is_profile_owner(profile_id))
with check (public.is_profile_owner(profile_id));

create policy public_links_read_published
on public.public_links for select to anon, authenticated
using (exists (select 1 from public.profiles p where p.id = public_links.profile_id and p.status = 'published'));
create policy public_links_manage_owner
on public.public_links for all to authenticated
using (public.is_profile_owner(profile_id))
with check (public.is_profile_owner(profile_id));

create policy journey_items_read_published
on public.journey_items for select to anon, authenticated
using (
  status = 'published'
  and visibility = 'public'
  and exists (select 1 from public.profiles p where p.id = journey_items.profile_id and p.status = 'published')
);
create policy journey_items_manage_owner
on public.journey_items for all to authenticated
using (public.is_profile_owner(profile_id))
with check (public.is_profile_owner(profile_id));

create policy journey_media_read_published
on public.journey_media for select to anon, authenticated
using (
  exists (
    select 1
      from public.journey_items ji
      join public.profiles p on p.id = ji.profile_id
     where ji.id = journey_media.journey_item_id
       and ji.profile_id = journey_media.profile_id
       and ji.status = 'published'
       and ji.visibility = 'public'
       and p.status = 'published'
  )
);
create policy journey_media_manage_owner
on public.journey_media for all to authenticated
using (public.is_profile_owner(profile_id))
with check (
  public.is_profile_owner(profile_id)
  and exists (
    select 1 from public.journey_items ji
     where ji.id = journey_media.journey_item_id
       and ji.profile_id = journey_media.profile_id
  )
);

create policy current_moment_refs_read_published
on public.current_moment_refs for select to anon, authenticated
using (
  exists (
    select 1
      from public.journey_items ji
      join public.profiles p on p.id = ji.profile_id
     where ji.id = current_moment_refs.journey_item_id
       and ji.profile_id = current_moment_refs.profile_id
       and ji.status = 'published'
       and ji.visibility = 'public'
       and p.status = 'published'
  )
);
create policy current_moment_refs_manage_owner
on public.current_moment_refs for all to authenticated
using (public.is_profile_owner(profile_id))
with check (
  public.is_profile_owner(profile_id)
  and exists (
    select 1 from public.journey_items ji
     where ji.id = current_moment_refs.journey_item_id
       and ji.profile_id = current_moment_refs.profile_id
  )
);

grant usage on schema public to anon, authenticated;

revoke all on public.profiles, public.expertise, public.experience, public.education,
  public.recognition, public.contributions, public.knowledge, public.portfolio,
  public.public_links, public.journey_items, public.journey_media,
  public.current_moment_refs from public, anon, authenticated;
revoke all on public.public_profiles, public.public_journey_items from public, anon, authenticated;

grant select (id, username, full_name, headline, biography, known_for, career_focus, location, interests, profile_image_path, cover_image_path, status, published_at)
  on public.profiles to anon;
grant select (id, username, full_name, headline, biography, known_for, career_focus, location, interests, profile_image_path, cover_image_path, status, onboarding_step, published_at, created_at, updated_at)
  on public.profiles to authenticated;
grant update (username, full_name, headline, biography, known_for, career_focus, location, interests, profile_image_path, cover_image_path, onboarding_step)
  on public.profiles to authenticated;

grant select (id, profile_id, sort_order, name, category, created_at, updated_at) on public.expertise to anon, authenticated;
grant insert (profile_id, sort_order, name, category) on public.expertise to authenticated;
grant update (sort_order, name, category) on public.expertise to authenticated;
grant delete on public.expertise to authenticated;

grant select (id, profile_id, sort_order, organization, title, employment_type, location, start_date, end_date, is_current, description, created_at, updated_at) on public.experience to anon, authenticated;
grant insert (profile_id, sort_order, organization, title, employment_type, location, start_date, end_date, is_current, description) on public.experience to authenticated;
grant update (sort_order, organization, title, employment_type, location, start_date, end_date, is_current, description) on public.experience to authenticated;
grant delete on public.experience to authenticated;

grant select (id, profile_id, sort_order, institution, qualification, field_of_study, start_date, end_date, description, created_at, updated_at) on public.education to anon, authenticated;
grant insert (profile_id, sort_order, institution, qualification, field_of_study, start_date, end_date, description) on public.education to authenticated;
grant update (sort_order, institution, qualification, field_of_study, start_date, end_date, description) on public.education to authenticated;
grant delete on public.education to authenticated;

grant select (id, profile_id, sort_order, kind, title, issuer, issue_date, credential_url, description, created_at, updated_at) on public.recognition to anon, authenticated;
grant insert (profile_id, sort_order, kind, title, issuer, issue_date, credential_url, description) on public.recognition to authenticated;
grant update (sort_order, kind, title, issuer, issue_date, credential_url, description) on public.recognition to authenticated;
grant delete on public.recognition to authenticated;

grant select (id, profile_id, sort_order, title, type, description, url, media_path, created_at, updated_at) on public.contributions to anon, authenticated;
grant insert (profile_id, sort_order, title, type, description, url, media_path) on public.contributions to authenticated;
grant update (sort_order, title, type, description, url, media_path) on public.contributions to authenticated;
grant delete on public.contributions to authenticated;

grant select (id, profile_id, sort_order, title, description, relevant_topics, url, created_at, updated_at) on public.knowledge to anon, authenticated;
grant insert (profile_id, sort_order, title, description, relevant_topics, url) on public.knowledge to authenticated;
grant update (sort_order, title, description, relevant_topics, url) on public.knowledge to authenticated;
grant delete on public.knowledge to authenticated;

grant select (id, profile_id, sort_order, title, description, media_path, external_url, category, created_at, updated_at) on public.portfolio to anon, authenticated;
grant insert (profile_id, sort_order, title, description, media_path, external_url, category) on public.portfolio to authenticated;
grant update (sort_order, title, description, media_path, external_url, category) on public.portfolio to authenticated;
grant delete on public.portfolio to authenticated;

grant select (id, profile_id, sort_order, platform, label, url, created_at, updated_at) on public.public_links to anon, authenticated;
grant insert (profile_id, sort_order, platform, label, url) on public.public_links to authenticated;
grant update (sort_order, platform, label, url) on public.public_links to authenticated;
grant delete on public.public_links to authenticated;

grant select (id, profile_id, type, title, description, item_date, organization, external_url, tags, visibility, status, featured, created_at, updated_at, published_at)
  on public.journey_items to anon, authenticated;
grant insert (profile_id, type, title, description, item_date, organization, external_url, tags, visibility, status, featured)
  on public.journey_items to authenticated;
grant update (type, title, description, item_date, organization, external_url, tags, visibility, status, featured)
  on public.journey_items to authenticated;
grant delete on public.journey_items to authenticated;

grant select (id, journey_item_id, profile_id, kind, storage_path, mime_type, size_bytes, alt, created_at)
  on public.journey_media to anon, authenticated;
grant insert (journey_item_id, profile_id, kind, storage_path, mime_type, size_bytes, alt)
  on public.journey_media to authenticated;
grant update (kind, storage_path, mime_type, size_bytes, alt) on public.journey_media to authenticated;
grant delete on public.journey_media to authenticated;

grant select (journey_item_id, profile_id, featured_at) on public.current_moment_refs to anon, authenticated;
grant insert (journey_item_id, profile_id) on public.current_moment_refs to authenticated;
grant delete on public.current_moment_refs to authenticated;

grant select on public.public_profiles, public.public_journey_items to anon, authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.set_journey_publication_metadata() from public, anon, authenticated;
revoke all on function public.is_profile_owner(uuid) from public, anon, authenticated;
revoke all on function public.set_profile_published(uuid, boolean) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validate_current_moment_media() from public, anon, authenticated;
revoke all on function public.validate_referenced_journey_media() from public, anon, authenticated;
revoke all on function public.can_manage_media(text) from public, anon, authenticated;
revoke all on function public.can_read_media(text) from public, anon, authenticated;
grant execute on function public.text_array_within_limits(text[], integer, integer) to public, anon, authenticated;
grant execute on function public.is_profile_owner(uuid) to authenticated;
grant execute on function public.set_profile_published(uuid, boolean) to authenticated;
grant execute on function public.can_manage_media(text) to authenticated;
grant execute on function public.can_read_media(text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dira-media',
  'dira-media',
  false,
  62914560,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']::text[]
)
on conflict (id) do update
  set name = excluded.name,
      public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy dira_media_read_owner
on storage.objects for select to authenticated
using (bucket_id = 'dira-media' and public.can_manage_media(name));
create policy dira_media_read_published
on storage.objects for select to anon, authenticated
using (bucket_id = 'dira-media' and public.can_read_media(name));
create policy dira_media_insert_owner
on storage.objects for insert to authenticated
with check (bucket_id = 'dira-media' and public.can_manage_media(name));
create policy dira_media_update_owner
on storage.objects for update to authenticated
using (bucket_id = 'dira-media' and public.can_manage_media(name))
with check (bucket_id = 'dira-media' and public.can_manage_media(name));
create policy dira_media_delete_owner
on storage.objects for delete to authenticated
using (bucket_id = 'dira-media' and public.can_manage_media(name));
