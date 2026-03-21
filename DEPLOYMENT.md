# Toro Deployment Guide

Complete deployment instructions for the Toro application to Vercel (frontend) and Render/Railway (backend).

## Overview

This guide covers deploying:
- **Frontend**: Next.js application on Vercel
- **Backend**: FastAPI application on Render or Railway
- **Database**: PostgreSQL (optional, SQLite fallback included)

## Prerequisites

- GitHub repository with your code
- Vercel account (free)
- Render or Railway account (free tiers available)
- API keys for external services (optional for demo mode)

## Deployment Steps

### Step 1: Deploy Backend

#### Option A: Deploy to Render (Recommended)

1. **Create a new Web Service on Render**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service**
   - **Name**: `toro-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables**
   ```
   DATABASE_URL=sqlite:///./toro.db
   NEWS_API_KEY=your_news_api_key
   FINNHUB_API_KEY=your_finnhub_api_key
   ALPHA_VANTAGE_KEY=your_alpha_vantage_key
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_API_KEY=your_google_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://stocklens-backend.onrender.com`)

#### Option B: Deploy to Railway

1. **Create a new project on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure the service**
   - Set root directory to `backend`
   - Railway will auto-detect Python and install dependencies

3. **Set Environment Variables**
   - Go to Variables tab
   - Add all environment variables from the list above

4. **Deploy**
   - Railway will automatically deploy
   - Note the service URL

### Step 2: Deploy Frontend to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure the project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (auto-detected)

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add the following variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_API_KEY=your_google_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be available at `https://your-project.vercel.app`

### Step 3: Update Backend URL

1. **Update Vercel Environment Variables**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` with your actual backend URL
   - Redeploy the frontend

2. **Update vercel.json (if needed)**
   - Edit `/frontend/vercel.json`
   - Update the rewrite destination URL to match your backend

## Environment Variables Reference

### Backend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | No | `sqlite:///./stocklens.db` |
| `NEWS_API_KEY` | NewsAPI.org API key | No | Mock data |
| `FINNHUB_API_KEY` | Finnhub.io API key | No | Mock data |
| `ALPHA_VANTAGE_KEY` | Alpha Vantage API key | No | Mock data |
| `GEMINI_API_KEY` | Google Gemini API key | No | Mock responses |
| `GOOGLE_API_KEY` | Google API key (alternative) | No | Mock responses |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | No | Mock audio |

### Frontend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `http://localhost:8000` |
| `GEMINI_API_KEY` | Google Gemini API key | No | Mock responses |
| `GOOGLE_API_KEY` | Google API key (alternative) | No | Mock responses |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | No | Mock audio |

## Getting API Keys

### Free API Keys (for demo)

1. **NewsAPI**: [newsapi.org](https://newsapi.org/)
   - 100 requests/day free
   - Sign up and get API key

2. **Finnhub**: [finnhub.io](https://finnhub.io/)
   - 60 calls/minute free
   - Sign up and get API key

3. **Alpha Vantage**: [alphavantage.co](https://www.alphavantage.co/)
   - 5 calls/minute free
   - Sign up and get API key

4. **Google Gemini**: [makersuite.google.com](https://makersuite.google.com/app/apikey)
   - Free tier available
   - Sign up and get API key

5. **ElevenLabs**: [elevenlabs.io](https://elevenlabs.io/)
   - Free tier available
   - Sign up and get API key

## Testing Your Deployment

### 1. Test Backend

```bash
# Health check
curl https://your-backend-url.onrender.com/

# Test API endpoints
curl https://your-backend-url.onrender.com/price/AAPL
curl -X POST https://your-backend-url.onrender.com/add_ticker \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL"}'
```

### 2. Test Frontend

1. Visit your Vercel URL
2. Try adding a stock ticker (e.g., "AAPL")
3. Check if news articles load
4. Test the voice news feature
5. Verify all components are working

### 3. Test Integration

- Frontend should successfully communicate with backend
- API calls should work without CORS errors
- Voice generation should work (if API keys are provided)

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Backend is configured to allow all origins (`*`)
   - If issues persist, check backend CORS settings

2. **Environment Variables Not Working**
   - Ensure variables are set in the correct environment (production)
   - Redeploy after adding new variables
   - Check variable names match exactly

3. **Backend Not Starting**
   - Check logs in Render/Railway dashboard
   - Verify all dependencies are installed
   - Check if port is correctly configured

4. **Frontend Build Fails**
   - Check Vercel build logs
   - Ensure all dependencies are in package.json
   - Verify TypeScript compilation

5. **API Calls Failing**
   - Check if backend URL is correct
   - Verify backend is running and accessible
   - Check network tab in browser dev tools

### Debug Commands

```bash
# Test backend locally
cd backend
python main.py

# Test frontend locally
cd frontend
npm run dev

# Check environment variables
echo $NEXT_PUBLIC_API_URL
```

## Production Considerations

### Security

1. **API Keys**
   - Never commit API keys to version control
   - Use environment variables for all secrets
   - Rotate keys regularly

2. **CORS**
   - Update CORS settings to only allow your frontend domain
   - Remove wildcard (`*`) origins in production

3. **Database**
   - Use PostgreSQL for production
   - Set up proper database backups
   - Use connection pooling

### Performance

1. **Caching**
   - Implement Redis for caching
   - Cache API responses
   - Use CDN for static assets

2. **Rate Limiting**
   - Implement rate limiting on API endpoints
   - Monitor API usage
   - Handle rate limit errors gracefully

3. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor API performance
   - Set up alerts for downtime

## Next Steps

After successful deployment:

1. **Custom Domain**
   - Add custom domain in Vercel
   - Update CORS settings with new domain

2. **Database Migration**
   - Set up PostgreSQL database
   - Migrate from SQLite to PostgreSQL

3. **CI/CD**
   - Set up automatic deployments
   - Add testing pipeline
   - Implement staging environment

4. **Monitoring**
   - Set up application monitoring
   - Add error tracking
   - Monitor performance metrics

## Support

If you encounter issues:

1. Check the logs in your deployment platform
2. Verify all environment variables are set correctly
3. Test API endpoints individually
4. Check the troubleshooting section above
5. Review the main README.md for additional help

