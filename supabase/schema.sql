-- ล้าบาย (give-and-take) — Supabase schema + Row Level Security
--
-- วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- รันซ้ำได้ (ใช้ if not exists / drop trigger ก่อนสร้าง)
--
-- หลักการเดียวกับ firestore.rules เดิม
--   - ต้องเข้าสู่ระบบก่อนถึงจะอ่านหรือเขียนได้ (role authenticated)
--   - ทุกคนอ่านโพสต์/คอมเมนต์ได้ แต่แก้/ลบได้เฉพาะของตัวเอง
--   - คะแนนความเครียดและแบบประเมิน เจ้าของเท่านั้นที่อ่านของตัวเองได้ และแก้/ลบไม่ได้
-- การวิเคราะห์ผลวิจัยให้ดึงข้อมูลจาก SQL Editor หรือ service_role key ฝั่งเซิร์ฟเวอร์
-- ไม่ใช่เปิดสิทธิ์อ่านให้ทุกคนใน policy นี้

-- ── ตาราง ────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  faculty    text not null,
  year       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  mood          text not null,
  body          text not null check (char_length(body) between 10 and 500),
  comments_open boolean not null default true,
  like_count    int not null default 0,
  comment_count int not null default 0,
  hidden        boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  body       text not null check (char_length(body) between 10 and 300),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- รหัสหลักคือ (post_id, user_id) จึงกดใจซ้ำไม่ได้โดยธรรมชาติ
create table if not exists public.likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.stress_tests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  phase      text not null check (phase in ('pre','post')),
  total      int not null,
  answers    jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists stress_tests_user_created_idx on public.stress_tests (user_id, created_at desc);

create table if not exists public.satisfaction (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  answers    jsonb not null,
  created_at timestamptz not null default now()
);

-- ลบ trigger รุ่นที่รองรับ Confirm email หากเคยติดตั้งไว้
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ── trigger นับ like / comment (ทำงานฝั่งเซิร์ฟเวอร์ ข้าม RLS) ──
-- ผู้ใช้จึงไม่ต้องมีสิทธิ์แก้ตัวนับบนโพสต์ของคนอื่น
create or replace function public.bump_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists likes_count_trg on public.likes;
create trigger likes_count_trg
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

create or replace function public.bump_comment_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists comments_count_trg on public.comments;
create trigger comments_count_trg
  after insert or delete on public.comments
  for each row execute function public.bump_comment_count();

-- ── เปิด Row Level Security ───────────────────────────────
alter table public.profiles     enable row level security;
alter table public.posts        enable row level security;
alter table public.comments     enable row level security;
alter table public.likes        enable row level security;
alter table public.stress_tests enable row level security;
alter table public.satisfaction enable row level security;

-- profiles: เจ้าของเท่านั้น
drop policy if exists profiles_owner on public.profiles;
create policy profiles_owner on public.profiles
  for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- posts
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts
  for select to authenticated using (true);

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts
  for insert to authenticated
  with check (auth.uid() = user_id and hidden = false and like_count = 0 and comment_count = 0);

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts
  for delete to authenticated using (auth.uid() = user_id);

-- comments: สร้างได้เฉพาะเมื่อโพสต์นั้นยังเปิดความคิดเห็น
drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments
  for select to authenticated using (true);

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.posts p where p.id = post_id and p.comments_open = true)
  );

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete to authenticated using (auth.uid() = user_id);

-- likes
drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes
  for select to authenticated using (true);

drop policy if exists likes_insert on public.likes;
create policy likes_insert on public.likes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own on public.likes
  for delete to authenticated using (auth.uid() = user_id);

-- stress_tests: เจ้าของอ่าน/เพิ่มได้ ไม่มี policy update/delete = แก้ย้อนหลังไม่ได้
drop policy if exists stress_read_own on public.stress_tests;
create policy stress_read_own on public.stress_tests
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists stress_insert_own on public.stress_tests;
create policy stress_insert_own on public.stress_tests
  for insert to authenticated with check (auth.uid() = user_id);

-- บันทึกโปรไฟล์และผลประเมินครั้งแรกใน transaction เดียวหลัง Auth สร้าง session แล้ว
create or replace function public.complete_registration(
  p_faculty text,
  p_year text,
  p_total int,
  p_answers jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if nullif(trim(p_faculty), '') is null or nullif(trim(p_year), '') is null then
    raise exception 'profile fields are required';
  end if;
  if p_total < 20 or p_total > 100 or jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> 20 then
    raise exception 'invalid assessment';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(p_answers) answer
    where answer !~ '^[1-5]$'
  ) or p_total <> (
    select sum(answer::int) from jsonb_array_elements_text(p_answers) answer
  ) then
    raise exception 'assessment score does not match answers';
  end if;

  insert into public.profiles (id, faculty, year)
  values (auth.uid(), trim(p_faculty), trim(p_year))
  on conflict (id) do update set faculty = excluded.faculty, year = excluded.year;

  if not exists (
    select 1 from public.stress_tests where user_id = auth.uid() and phase = 'pre'
  ) then
    insert into public.stress_tests (user_id, phase, total, answers)
    values (auth.uid(), 'pre', p_total, p_answers);
  end if;
end;
$$;

revoke all on function public.complete_registration(text, text, int, jsonb) from public;
grant execute on function public.complete_registration(text, text, int, jsonb) to authenticated;

-- satisfaction: เจ้าของอ่าน/เพิ่มได้ แก้/ลบไม่ได้
drop policy if exists sat_read_own on public.satisfaction;
create policy sat_read_own on public.satisfaction
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists sat_insert_own on public.satisfaction;
create policy sat_insert_own on public.satisfaction
  for insert to authenticated with check (auth.uid() = user_id);
