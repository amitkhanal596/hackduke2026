# Toro Setup Guide

Complete setup instructions for the Toro hackathon project.

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL (optional - SQLite fallback included)
- Git

## Quick Start (5 minutes)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit backend/.env and add your API keys (optional for demo)
# The app works with mock data if no API keys are provided

# Run the backend
python main.py
```

The backend will start on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## Detailed Setup

### Backend Configuration

1. **API Keys (Optional for Demo)**

Edit `backend/.env`:

```env
# For real news data
NEWS_API_KEY=get_from_newsapi.org
FINNHUB_API_KEY=get_from_finnhub.io

# For additional stock data
ALPHA_VANTAGE_KEY=get_from_alphavantage.co

# Database (optional - uses SQLite by default)
DATABASE_URL=postgresql://user:password@localhost/toro
```

2. **Get Free API Keys**

- NewsAPI: https://newsapi.org/ (100 requests/day free)
- Finnhub: https://finnhub.io/ (60 calls/minute free)
- AlphaVantage: https://www.alphavantage.co/ (5 calls/minute free)

3. **Database Setup**

**Option A: SQLite (Default - No Setup Required)**
- The app automatically creates `toro.db`
- Perfect for hackathons and demos

**Option B: PostgreSQL (Production)**
```bash
# Create database
createdb toro

# Run schema
psql toro < database/schema.sql

# Update backend/.env with connection string
DATABASE_URL=postgresql://user:password@localhost/toro
```

### Frontend Configuration

The frontend is pre-configured to connect to `http://localhost:8000`.

To change the API URL, edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Testing the Application

### 1. Start Backend
```bash
cd backend
python main.py
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Features

1. **Add a Stock**: Enter "AAPL" or "TSLA" in the input field
2. **View News**: See filtered news articles with sentiment
3. **Past Events**: Click on stock cards to see historical event analysis
4. **Upcoming Events**: Toggle to view future events

### Sample Test Data

Try these tickers:
- `AAPL` - Apple Inc.
- `TSLA` - Tesla
- `NVDA` - NVIDIA
- `MSFT` - Microsoft
- `GOOGL` - Google

## API Endpoints

### Test Endpoints with curl

```bash
# Health check
curl http://localhost:8000/

# Add ticker
curl -X POST http://localhost:8000/add_ticker \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL"}'

# Fetch news
curl -X POST http://localhost:8000/fetch_news \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL", "TSLA"]}'

# Get past events
curl http://localhost:8000/events/past?ticker=AAPL

# Get upcoming events
curl http://localhost:8000/events/upcoming?ticker=AAPL
```

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError`
```bash
# Solution: Reinstall dependencies
pip install -r requirements.txt
```

**Problem**: API rate limits
```bash
# Solution: The app falls back to mock data automatically
# Or use different API keys
```

**Problem**: Port 8000 already in use
```bash
# Solution: Change port in main.py
uvicorn main:app --reload --port 8001
```

### Frontend Issues

**Problem**: Module not found errors
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Connection refused to backend
```bash
# Solution: Ensure backend is running on port 8000
# Check NEXT_PUBLIC_API_URL in .env.local
```

**Problem**: Port 3000 already in use
```bash
# Solution: Use different port
PORT=3001 npm run dev
```

## Architecture Overview

```
StockLens/
├── frontend/              # Next.js React app
│   ├── app/              # Next.js 13+ app directory
│   ├── components/       # React components
│   └── lib/              # API client and utilities
├── backend/              # FastAPI Python backend
│   ├── app/              # Core services
│   │   ├── news_service.py      # News fetching & sentiment
│   │   ├── event_analyzer.py    # CAR calculation & events
│   │   └── database.py          # Database models
│   └── main.py           # FastAPI app and routes
└── database/             # SQL schemas
```

## Key Features Implemented

- News aggregation with sentiment analysis (TextBlob)
- Event analysis with CAR (Cumulative Abnormal Return) calculation
- Market model regression using scikit-learn
- Volatility analysis
- Real-time data from Yahoo Finance
- Mock data fallback for demos without API keys
- Responsive dashboard with Tailwind CSS
- Stock tracking with add/remove functionality

## Demo Mode

The app works perfectly without any API keys by using mock data:

1. Realistic mock news articles
2. Sample past event analysis
3. Upcoming event predictions
4. All UI features functional

This makes it perfect for:
- Quick demos
- Development without API setup
- Hackathon presentations

## Next Steps

### Production Deployment

For complete deployment instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md).

**Quick Deploy Steps:**
1. **Backend**: Deploy to [Render](https://render.com) or [Railway](https://railway.app)
2. **Frontend**: Deploy to [Vercel](https://vercel.com)
3. **Configure**: Set environment variables in both platforms
4. **Test**: Verify all features work in production

### Additional Features

1. Set up proper API keys for real data
2. Configure PostgreSQL database for production
3. Add user authentication
4. Implement caching and rate limiting
5. Add monitoring and error tracking

## Support

For issues or questions:
1. Check this setup guide
2. Review the main README.md
3. Check API documentation at http://localhost:8000/docs
