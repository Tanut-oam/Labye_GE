-- รันไฟล์นี้ครั้งเดียวใน Supabase SQL Editor สำหรับฐานข้อมูลที่สร้างไว้แล้ว
-- schema หลักและ RLS สำหรับลบโพสต์/ความคิดเห็นของเจ้าของอยู่ใน supabase/schema.sql

create or replace function public.get_post_comments(p_post_id uuid)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  author_avatar text,
  is_own boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.body,
    c.created_at,
    coalesce(p.fruit_avatar, 'orange') as author_avatar,
    c.user_id = auth.uid() as is_own
  from public.comments c
  left join public.profiles p on p.id = c.user_id
  where c.post_id = p_post_id
    and auth.uid() is not null
  order by c.created_at asc;
$$;

revoke all on function public.get_post_comments(uuid) from public;
grant execute on function public.get_post_comments(uuid) to authenticated;

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete to authenticated using (auth.uid() = user_id);

-- รายการโพสต์ที่กดถูกใจเป็นข้อมูลส่วนตัวของผู้ใช้แต่ละคน
drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes
  for select to authenticated using (auth.uid() = user_id);
