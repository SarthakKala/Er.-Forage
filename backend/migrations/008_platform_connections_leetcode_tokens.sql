-- Add LeetCode auth tokens to platform_connections.
-- This is required for LeetCode GraphQL (authenticated submission list + details).
ALTER TABLE platform_connections
  ADD COLUMN IF NOT EXISTS leetcode_session TEXT,
  ADD COLUMN IF NOT EXISTS csrf_token TEXT;

-- Optional: If you want to fully remove old access_token column once you migrate
-- all users, you can uncomment the following line.
-- ALTER TABLE platform_connections DROP COLUMN IF EXISTS access_token;

