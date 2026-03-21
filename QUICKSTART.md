# Toro Quick Start

Get up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check Python (need 3.9+)
python --version
# or
python3 --version

# Check npm
npm --version
```

## Installation

### Option 1: Use Start Scripts (Easiest)

**Windows:**
```bash
# Terminal 1 - Backend
start-backend.bat

# Terminal 2 - Frontend
start-frontend.bat
```

**Mac/Linux:**
```bash
# Terminal 1 - Backend
chmod +x start-backend.sh
./start-backend.sh

# Terminal 2 - Frontend
chmod +x start-frontend.sh
./start-frontend.sh
```

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## First Use

1. Open browser to `http://localhost:3000`
2. Add a stock ticker (try "AAPL", "TSLA", or "NVDA")
3. Explore the dashboard:
   - View news with sentiment analysis
   - Check past event impacts
   - See upcoming events

## That's It!

The app works immediately with demo data. No API keys required for testing.

## Optional: Add Real Data

Edit `backend/.env` to add API keys:

```env
NEWS_API_KEY=your_key_from_newsapi.org
FINNHUB_API_KEY=your_key_from_finnhub.io
```

Get free keys:
- NewsAPI: https://newsapi.org/register
- Finnhub: https://finnhub.io/register

## Troubleshooting

**Backend won't start:**
```bash
# Windows
pip install --upgrade pip
pip install -r requirements.txt

# Mac/Linux
pip3 install --upgrade pip
pip3 install -r requirements.txt
```

**Frontend won't start:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Backend - edit main.py, change port:
uvicorn.run(app, host="0.0.0.0", port=8001)

# Frontend - run with different port:
PORT=3001 npm run dev
```

## Next Steps

- Read [SETUP.md](SETUP.md) for detailed configuration
- Check [DEMO.md](DEMO.md) for presentation tips
- See [ROADMAP.md](ROADMAP.md) for future features

## Test API Directly

```bash
# Health check
curl http://localhost:8000/

# Add ticker
curl -X POST http://localhost:8000/add_ticker \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL"}'

# View API docs
# Open: http://localhost:8000/docs
```

## Project Structure

```
Toro/
├── frontend/          Next.js app (port 3000)
├── backend/           FastAPI app (port 8000)
├── database/          SQL schemas
├── start-*.bat/.sh   Quick start scripts
├── SETUP.md          Detailed setup guide
└── DEMO.md           Demo presentation script
```

## Support

- Full setup guide: [SETUP.md](SETUP.md)
- Issues? Check the troubleshooting section above
- API docs: http://localhost:8000/docs (after starting backend)

Happy tracking!
