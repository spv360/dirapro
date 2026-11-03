create function public.ensure_my_profile()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  profile_id uuid;
  user_metadata jsonb;
  profile_username text;
  profile_full_name text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select p.id
    into profile_id
    from public.profiles p
   where p.owner_id = current_user_id;

  if profile_id is not null then
    return profile_id;
  end if;

  select u.raw_user_meta_data
    into user_metadata
    from auth.users u
   where u.id = current_user_id;

  profile_username := pg_catalog.lower(pg_catalog.btrim(user_metadata ->> 'username'));
  profile_full_name := pg_catalog.btrim(user_metadata ->> 'full_name');
  if profile_username is null or profile_username = ''
     or profile_full_name is null or profile_full_name = '' then
    raise exception 'Profile setup metadata is missing.'
      using errcode = '23514';
  end if;

  insert into public.profiles (owner_id, username, full_name)
  values (current_user_id, profile_username, profile_full_name)
  on conflict (owner_id) do nothing
  returning id into profile_id;

  if profile_id is null then
    select p.id
      into profile_id
      from public.profiles p
     where p.owner_id = current_user_id;
  end if;

  return profile_id;
end;
$$;

create function public.replace_profile_section(
  p_profile_id uuid,
  p_section text,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  item_order bigint;
  existing_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if p_section is null or p_section not in ('expertise', 'knowledge', 'portfolio')
     or p_items is null or pg_catalog.jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid profile section replacement.'
      using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(p_items) > 40 then
    raise exception 'Invalid profile section replacement.'
      using errcode = '22023';
  end if;

  perform 1
    from public.profiles p
   where p.id = p_profile_id
     and p.owner_id = (select auth.uid())
   for update;

  if not found then
    raise exception 'Profile not found or not owned by the current user.'
      using errcode = '42501';
  end if;

  if p_section = 'expertise' then
    for item, item_order in
      select entry.value, entry.ordinality
        from pg_catalog.jsonb_array_elements(p_items) with ordinality as entry(value, ordinality)
    loop
      existing_id := null;
      if (item ->> 'id') ~ '^[0-9a-fA-F-]{36}$' then
        select e.id into existing_id
          from public.expertise e
         where e.profile_id = p_profile_id
           and e.id::text = (item ->> 'id');
      end if;

      insert into public.expertise as target (id, profile_id, sort_order, name, category)
      values (
        coalesce(existing_id, pg_catalog.gen_random_uuid()),
        p_profile_id,
        item_order - 1,
        item ->> 'name',
        coalesce(item ->> 'category', 'expertise')
      )
      on conflict (id) do update
        set sort_order = excluded.sort_order,
            name = excluded.name,
            category = excluded.category
      where target.profile_id = p_profile_id;
    end loop;

    delete from public.expertise e
     where e.profile_id = p_profile_id
       and not exists (
         select 1
           from pg_catalog.jsonb_array_elements(p_items) as entry(value)
          where entry.value ->> 'id' = e.id::text
       );
  elsif p_section = 'knowledge' then
    for item, item_order in
      select entry.value, entry.ordinality
        from pg_catalog.jsonb_array_elements(p_items) with ordinality as entry(value, ordinality)
    loop
      existing_id := null;
      if (item ->> 'id') ~ '^[0-9a-fA-F-]{36}$' then
        select k.id into existing_id
          from public.knowledge k
         where k.profile_id = p_profile_id
           and k.id::text = (item ->> 'id');
      end if;

      insert into public.knowledge as target (id, profile_id, sort_order, title, description, relevant_topics, url)
      values (
        coalesce(existing_id, pg_catalog.gen_random_uuid()),
        p_profile_id,
        item_order - 1,
        item ->> 'title',
        coalesce(item ->> 'description', ''),
        array(
          select pg_catalog.jsonb_array_elements_text(
            coalesce(item -> 'relevantTopics', '[]'::jsonb)
          )
        ),
        coalesce(item ->> 'url', '')
      )
      on conflict (id) do update
        set sort_order = excluded.sort_order,
            title = excluded.title,
            description = excluded.description,
            relevant_topics = excluded.relevant_topics,
            url = excluded.url
      where target.profile_id = p_profile_id;
    end loop;

    delete from public.knowledge k
     where k.profile_id = p_profile_id
       and not exists (
         select 1
           from pg_catalog.jsonb_array_elements(p_items) as entry(value)
          where entry.value ->> 'id' = k.id::text
       );
  else
    for item, item_order in
      select entry.value, entry.ordinality
        from pg_catalog.jsonb_array_elements(p_items) with ordinality as entry(value, ordinality)
    loop
      existing_id := null;
      if (item ->> 'id') ~ '^[0-9a-fA-F-]{36}$' then
        select po.id into existing_id
          from public.portfolio po
         where po.profile_id = p_profile_id
           and po.id::text = (item ->> 'id');
      end if;

      insert into public.portfolio as target (id, profile_id, sort_order, title, description, media_path, external_url, category)
      values (
        coalesce(existing_id, pg_catalog.gen_random_uuid()),
        p_profile_id,
        item_order - 1,
        item ->> 'title',
        coalesce(item ->> 'description', ''),
        item ->> 'media_path',
        coalesce(item ->> 'external_url', ''),
        coalesce(item ->> 'category', '')
      )
      on conflict (id) do update
        set sort_order = excluded.sort_order,
            title = excluded.title,
            description = excluded.description,
            media_path = excluded.media_path,
            external_url = excluded.external_url,
            category = excluded.category
      where target.profile_id = p_profile_id;
    end loop;

    delete from public.portfolio po
     where po.profile_id = p_profile_id
       and not exists (
         select 1
           from pg_catalog.jsonb_array_elements(p_items) as entry(value)
          where entry.value ->> 'id' = po.id::text
       );
  end if;

  update public.profiles
     set updated_at = pg_catalog.now()
   where id = p_profile_id;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon, authenticated;
revoke all on function public.replace_profile_section(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.ensure_my_profile() to authenticated;
grant execute on function public.replace_profile_section(uuid, text, jsonb) to authenticated;
