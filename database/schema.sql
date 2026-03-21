-- Toro Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stocks table
CREATE TABLE IF NOT EXISTS stocks (
  id SERIAL PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  company_name TEXT
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  ticker TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  meta JSONB,
  car_0_1 FLOAT,
  volatility_ratio FLOAT,
  sentiment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMP,
  sentiment TEXT,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_ticker ON events(ticker);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_articles_ticker ON articles(ticker);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);

-- Comments
COMMENT ON TABLE users IS 'User accounts for Toro';
COMMENT ON TABLE stocks IS 'Tracked stock tickers and company information';
COMMENT ON TABLE events IS 'Historical and upcoming events with analysis';
COMMENT ON TABLE articles IS 'News articles with sentiment analysis';
