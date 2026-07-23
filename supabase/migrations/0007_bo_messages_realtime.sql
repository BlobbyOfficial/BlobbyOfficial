-- blobbyofficial: enable Supabase Realtime postgres_changes for the
-- messaging inbox so a reply appears live without a page refresh.

alter publication supabase_realtime add table public.bo_messages;
