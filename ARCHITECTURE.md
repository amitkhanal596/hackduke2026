# Toro Architecture

Technical architecture and design decisions for Toro.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                    http://localhost:3000                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTP/REST
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   Next.js Frontend                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React Components                                    │   │
│  │  - Dashboard                                         │   │
│  │  - StockCard (shows events)                         │   │
│  │  - NewsFeed (shows articles)                        │   │
│  │  - AddStockForm                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API Client (lib/api.ts)                            │   │
│  │  - axios HTTP client                                 │   │
│  │  - TypeScript interfaces                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ REST API Calls
                  │
┌─────────────────▼───────────────────────────────────────────┐
│               FastAPI Backend (Python)                       │
│                http://localhost:8000                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API Endpoints (main.py)                            │   │
│  │  - POST /add_ticker                                  │   │
│  │  - POST /fetch_news                                  │   │
│  │  - POST /analyze_event                               │   │
│  │  - GET  /events/past                                 │   │
│  │  - GET  /events/upcoming                             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Core Services                                       │   │
│  │  ┌────────────────────────────────────────────┐    │   │
│  │  │ NewsService (app/news_service.py)          │    │   │
│  │  │ - Fetch from NewsAPI/Finnhub               │    │   │
│  │  │ - Sentiment analysis (TextBlob)            │    │   │
│  │  │ - Article summarization                    │    │   │
│  │  │ - Mock data fallback                       │    │   │
│  │  └────────────────────────────────────────────┘    │   │
│  │  ┌────────────────────────────────────────────┐    │   │
│  │  │ EventAnalyzer (app/event_analyzer.py)      │    │   │
│  │  │ - Market model regression                  │    │   │
│  │  │ - CAR calculation                          │    │   │
│  │  │ - Volatility analysis                      │    │   │
│  │  │ - Earnings event detection                 │    │   │
│  │  └────────────────────────────────────────────┘    │   │
│  │  ┌────────────────────────────────────────────┐    │   │
│  │  │ Database (app/database.py)                 │    │   │
│  │  │ - SQLAlchemy ORM                           │    │   │
│  │  │ - Models: User, Stock, Event, Article      │    │   │
│  │  │ - SQLite/PostgreSQL support                │    │   │
│  │  └────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────┬───────────────────────┘
                  │                   │
                  │                   │
        ┌─────────▼───────┐ ┌────────▼─────────┐
        │  External APIs  │ │    Database      │
        │                 │ │                  │
        │ - NewsAPI       │ │ - SQLite (dev)   │
        │ - Finnhub       │ │ - PostgreSQL     │
        │ - Yahoo Finance │ │   (production)   │
        │ - AlphaVantage  │ │                  │
        └─────────────────┘ └──────────────────┘
```

## Component Details

### Frontend Architecture

#### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Charts**: Recharts (ready to add)

#### Component Hierarchy

```
App (page.tsx)
├── Header
├── AddStockForm
│   └── Input + Button
└── Dashboard
    ├── StockCard (for each ticker)
    │   ├── Header (ticker + remove button)
    │   ├── Toggle (Past/Upcoming)
    │   ├── EventList
    │   │   └── EventCard (metrics, sentiment, CAR)
    │   └── UpcomingEventList
    └── NewsFeed
        └── NewsArticle (title, summary, sentiment)
```

#### State Management
- **Local State**: React useState for UI state
- **API State**: Direct API calls (could add React Query)
- **Props Drilling**: Simple prop passing (sufficient for hackathon)

Future: Add Redux/Zustand for global state

### Backend Architecture

#### Technology Stack
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **ORM**: SQLAlchemy
- **ML/Stats**: scikit-learn, numpy, pandas
- **NLP**: TextBlob (sentiment analysis)
- **Data**: yfinance (stock data)

#### Service Layer

**NewsService** (`app/news_service.py`)
```python
class NewsService:
    - fetch_news_for_tickers()      # Main entry point
    - _fetch_ticker_news()           # Per-ticker fetching
    - _fetch_from_newsapi()          # NewsAPI integration
    - _fetch_from_finnhub()          # Finnhub integration
    - _analyze_article()             # Sentiment + summarization
    - _get_sentiment()               # TextBlob polarity
    - _generate_summary()            # Extract key sentences
    - _generate_mock_news()          # Fallback demo data
```

**EventAnalyzer** (`app/event_analyzer.py`)
```python
class EventAnalyzer:
    - analyze_event()                # Main CAR calculation
    - get_past_earnings_events()     # Fetch historical earnings
    - get_upcoming_events()          # Fetch future events
    - _generate_mock_events()        # Fallback demo data
```

#### Event Analysis Algorithm

```python
# Simplified flow of CAR calculation

1. Data Collection
   - Download 120 days of historical data (estimation window)
   - Download event window data (-5 to +5 days)
   - Get benchmark (SPY) data

2. Market Model Regression
   - Run OLS regression: R_stock = α + β * R_market
   - Estimate α (alpha) and β (beta) from estimation window

3. Calculate Abnormal Returns
   - Expected Return = α + β * R_market
   - Abnormal Return (AR) = Actual Return - Expected Return
   - For each day in event window

4. Cumulative Abnormal Return (CAR)
   - CAR = Σ AR over event window
   - Convert to percentage

5. Volatility Analysis
   - Pre-event volatility = std(returns) in estimation window
   - Post-event volatility = std(returns) in event window
   - Ratio = Post / Pre

6. Generate Insights
   - Classify sentiment based on CAR magnitude
   - Generate natural language conclusion
```

### Database Schema

```sql
users
├── id (PK)
├── email (unique)
└── created_at

stocks
├── id (PK)
├── ticker (unique, indexed)
└── company_name

events
├── id (PK)
├── ticker (indexed)
├── type (earnings, announcement, etc.)
├── date (indexed)
├── meta (JSONB - flexible data)
├── car_0_1 (CAR percentage)
├── volatility_ratio
└── sentiment

articles
├── id (PK)
├── ticker (indexed)
├── title
├── url
├── published_at (indexed)
├── sentiment
└── summary
```

## Data Flow

### Adding a Stock

```
User Input: "AAPL"
    ↓
Frontend: AddStockForm
    ↓
POST /add_ticker {"ticker": "AAPL"}
    ↓
Backend: Validate ticker with yfinance
    ↓
Database: Store in stocks table
    ↓
Response: {ticker, company_name}
    ↓
Frontend: Update tracked stocks list
```

### Fetching News

```
Frontend: Dashboard loads
    ↓
POST /fetch_news {"tickers": ["AAPL", "TSLA"]}
    ↓
NewsService: For each ticker
    ↓
Try NewsAPI → Fetch articles
    ↓
Try Finnhub → Fetch articles
    ↓
For each article:
  - Analyze sentiment (TextBlob)
  - Generate summary
  - Add ticker tag
    ↓
Sort by date, return top 20
    ↓
Frontend: Render in NewsFeed
```

### Analyzing Events

```
Frontend: Request past events
    ↓
GET /events/past?ticker=AAPL
    ↓
EventAnalyzer: Get earnings dates
    ↓
For each earnings date:
    ↓
  Download stock + market data (yfinance)
    ↓
  Run market model regression
    ↓
  Calculate CAR in event window
    ↓
  Analyze volatility change
    ↓
  Generate conclusion
    ↓
Return list of analyzed events
    ↓
Frontend: Render in StockCard
```

## API Design

### REST Endpoints

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/` | Health check | - | `{message}` |
| POST | `/add_ticker` | Add stock | `{ticker}` | `{ticker, company_name}` |
| POST | `/fetch_news` | Get news | `{tickers[]}` | `NewsArticle[]` |
| POST | `/analyze_event` | Analyze event | `{ticker, date}` | `EventAnalysis` |
| GET | `/events/past` | Past events | `?ticker=` | `EventAnalysis[]` |
| GET | `/events/upcoming` | Future events | `?ticker=` | `UpcomingEvent[]` |

### Data Models (TypeScript)

```typescript
interface NewsArticle {
  ticker: string;
  title: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  url: string;
  published_at: string;
}

interface EventAnalysis {
  ticker: string;
  event: string;
  date: string;
  car_0_1: number;        // CAR percentage
  volatility_change: number;
  sentiment: string;
  conclusion: string;
}

interface UpcomingEvent {
  ticker: string;
  type: string;
  date: string;
  expected_impact: string;
}
```

## Performance Considerations

### Current Implementation
- **Response Time**: ~1-2s for most endpoints
- **Concurrent Requests**: Handled by FastAPI/Uvicorn
- **Caching**: None (all data fetched fresh)
- **Database**: File-based SQLite

### Optimization Opportunities

1. **Caching**
   - Cache news articles (15 min TTL)
   - Cache stock data (5 min TTL)
   - Cache event analysis (24 hour TTL)
   - Use Redis for distributed cache

2. **Database**
   - Add indexes on ticker, date columns ✓
   - Connection pooling for PostgreSQL
   - Query optimization with EXPLAIN
   - Archive old data

3. **API Calls**
   - Batch API requests where possible
   - Rate limiting with exponential backoff
   - Circuit breaker for failing APIs
   - Async/await for parallel fetching

4. **Frontend**
   - Lazy loading for components
   - Virtual scrolling for long lists
   - Debounce search inputs
   - Service worker for offline support

## Security

### Current Implementation
- CORS enabled (all origins for hackathon)
- No authentication
- No rate limiting
- Environment variables for API keys

### Production Requirements

1. **Authentication**
   - JWT tokens
   - OAuth2 integration
   - Session management

2. **Authorization**
   - Role-based access control
   - API key management
   - Rate limiting per user

3. **Data Protection**
   - HTTPS only
   - SQL injection prevention (SQLAlchemy ORM ✓)
   - XSS prevention (React ✓)
   - CSRF tokens

4. **API Security**
   - API key rotation
   - Request signing
   - IP whitelisting
   - DDoS protection

## Deployment

### Development
```
Frontend: localhost:3000 (Next.js dev server)
Backend: localhost:8000 (Uvicorn)
Database: SQLite file (toro.db)
```

### Production Options

**Frontend (Vercel - Recommended)**
```bash
cd frontend
vercel deploy
```

**Backend (Railway/Render/AWS)**
```bash
# Railway
railway up

# Render
render deploy

# AWS EC2
# Set up EC2 instance, install dependencies, run with gunicorn
```

**Database (PostgreSQL)**
```bash
# Railway PostgreSQL
# Render PostgreSQL
# AWS RDS
# Supabase
```

## Testing Strategy

### Unit Tests
```python
# Backend
pytest tests/test_event_analyzer.py
pytest tests/test_news_service.py

# Frontend
npm test
```

### Integration Tests
```python
# Test API endpoints
pytest tests/test_api.py
```

### E2E Tests
```typescript
// Playwright/Cypress
test('add stock and view events', async () => {
  // Test user flow
});
```

## Monitoring

### Metrics to Track
- API response times
- Error rates
- Active users
- API quota usage
- Database performance

### Tools
- **Logging**: Python logging, Winston (Node)
- **APM**: Sentry for error tracking
- **Analytics**: PostHog, Mixpanel
- **Uptime**: Pingdom, UptimeRobot

## Scalability

### Current Limits
- Single server
- Synchronous API calls
- No caching
- SQLite (single writer)

### Scaling Strategy

1. **Vertical Scaling**
   - Larger server instance
   - More RAM for caching
   - Faster CPU for calculations

2. **Horizontal Scaling**
   - Load balancer (Nginx)
   - Multiple API servers
   - Shared PostgreSQL
   - Redis cache cluster

3. **Microservices** (Future)
   ```
   API Gateway
   ├── News Service
   ├── Event Analysis Service
   ├── User Service
   └── Notification Service
   ```

## Technology Choices

### Why Next.js?
- Server-side rendering (SEO)
- File-based routing
- Built-in API routes (if needed)
- Excellent DX
- Vercel deployment

### Why FastAPI?
- Fast (async support)
- Auto-generated docs
- Type hints (Pydantic)
- Easy to learn
- Great for ML/data science

### Why SQLAlchemy?
- ORM abstraction
- SQL injection protection
- Supports multiple databases
- Migration support (Alembic)

### Why TextBlob?
- Simple API
- Good for hackathon
- Decent accuracy
- No API keys needed

## Future Architecture

### Event-Driven Architecture
```
User Action → API → Message Queue → Workers → Database
                         ↓
                  Notification Service
```

### Real-Time Updates
```
WebSocket Connection → Redis Pub/Sub → Client Updates
```

### ML Pipeline
```
Data Collection → Feature Engineering → Model Training
     ↓                                        ↓
  Data Lake                            Model Registry
                                             ↓
                                    Prediction Service
```

## Questions?

See [SETUP.md](SETUP.md) for detailed setup or [ROADMAP.md](ROADMAP.md) for future plans.
