create function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_username is not null
    and not exists (
      select 1
      from public.profiles
      where username = pg_catalog.lower(pg_catalog.btrim(p_username))
    );
$$;

revoke all on function public.is_username_available(text) from public, anon, authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
