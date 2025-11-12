-- Add published_at column to news table
ALTER TABLE news
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);








