-- Reconstructed from live schema (Supabase MCP) — original file was never committed.

insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', true)
on conflict (id) do nothing;

drop policy if exists public_read_community_media on storage.objects;
create policy public_read_community_media on storage.objects
  for select to public
  using (bucket_id = 'community-media');

drop policy if exists auth_users_upload_own_folder on storage.objects;
create policy auth_users_upload_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists auth_users_manage_own_files on storage.objects;
create policy auth_users_manage_own_files on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
