-- blobbyofficial: optional client review shown on hover for "clients" clips
-- (star rating, comment, and the client's Discord username).

alter table public.portfolio_clips
  add column if not exists review_rating smallint,
  add column if not exists review_comment text,
  add column if not exists review_discord_username text;

alter table public.portfolio_clips
  add constraint portfolio_clips_review_rating_check
  check (review_rating is null or (review_rating between 1 and 5));
