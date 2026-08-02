-- blobbyofficial: portfolio clips now come from the video files committed under
-- public/media/videos instead of Google Drive links pasted into the admin
-- dashboard. New files are picked up automatically and land as PRIVATE clips,
-- so `published` defaults to false and video_url is unique (the sync keys off
-- it and must never insert the same file twice).

delete from public.portfolio_clips
  where video_url like 'https://drive.google.com/%';

alter table public.portfolio_clips
  alter column published set default false;

create unique index if not exists portfolio_clips_video_url_key
  on public.portfolio_clips (video_url);

insert into public.portfolio_clips (title, category, video_url, sort_order, published)
values
  ('Bad Edit', 'tiktok', '/media/videos/TikTok/Bad%20Edit.mp4', 0, false),
  ('Dangerous (Vmas 1995) Edit', 'tiktok', '/media/videos/TikTok/Dangerous%20(Vmas%201995)%20Edit.mp4', 1, false),
  ('Michael (The Movie) Edit', 'tiktok', '/media/videos/TikTok/Michael%20(The%20Movie)%20Edit.mp4', 2, false),
  ('Smooth Criminal Edit', 'tiktok', '/media/videos/TikTok/Smooth%20Criminal%20Edit.mp4', 3, false),
  ('Speed Demon Edit', 'tiktok', '/media/videos/TikTok/Speed%20Demon%20Edit.mp4', 4, false),
  ('The King Of Pop  Edit', 'tiktok', '/media/videos/TikTok/The%20King%20Of%20Pop%20%20Edit.mp4', 5, false),
  ('Clicks Just Made A Map', 'clients', '/media/videos/clients/Clicks%20Just%20Made%20A%20Map.mp4', 0, false),
  ('Delta Executor Tutorial', 'clients', '/media/videos/clients/Delta%20Executor%20Tutorial.mp4', 1, false),
  ('F.R.I.E.N.D.S. Edit', 'clients', '/media/videos/clients/F.R.I.E.N.D.S.%20Edit.mp4', 2, false),
  ('Ranking Funniest Big Cat Moments', 'clients', '/media/videos/clients/Ranking%20Funniest%20Big%20Cat%20Moments.mp4', 3, false),
  ('Skooby Edit', 'clients', '/media/videos/clients/Skooby%20Edit.mp4', 4, false),
  ('The Reason Why Your Family Hates You', 'clients', '/media/videos/clients/The%20Reason%20Why%20Your%20Family%20Hates%20You.mp4', 5, false),
  ('This Moment Could Cost Neymar', 'clients', '/media/videos/clients/This%20Moment%20Could%20Cost%20Neymar.mp4', 6, false),
  ('Yandere Simulator - Class of ''59 Trailer', 'clients', '/media/videos/clients/Yandere%20Simulator%20-%20Class%20of%20''59%20Trailer.mp4', 7, false),
  ('Your Perm If You...', 'clients', '/media/videos/clients/Your%20Perm%20If%20You....mp4', 8, false)
on conflict (video_url) do nothing;
