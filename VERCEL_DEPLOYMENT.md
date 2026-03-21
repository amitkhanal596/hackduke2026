# Vercel Deployment Guide for Toro

This guide will help you deploy your Toro application to Vercel with both frontend and backend running on the same domain.

## Prerequisites

- GitHub repository with your code
- Vercel account (free at [vercel.com](https://vercel.com))
- API keys for external services (optional for demo mode)

## Quick Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. **Important**: Set the **Root Directory** to `frontend`

### 2. Configure Build Settings

Vercel should auto-detect Next.js, but verify these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

### 3. Set Environment Variables

Go to **Project Settings** → **Environment Variables** and add:

#### Required Variables
```
NEXT_PUBLIC_API_URL=https://your-project-name.vercel.app/api/backend
```

#### Optional Variables (for full functionality)
```
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
DATABASE_URL=sqlite:///./toro.db
NEWS_API_KEY=your_news_api_key_here
FINNHUB_API_KEY=your_finnhub_api_key_here
ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
```

**Note**: The app works with mock data if no API keys are provided, perfect for demos!

### 4. Deploy

1. Click **Deploy**
2. Wait for deployment to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## How It Works

### Architecture
- **Frontend**: Next.js app served from the root domain
- **Backend**: FastAPI app served from `/api/backend/*` routes
- **Database**: SQLite (can be upgraded to PostgreSQL later)

### API Routing
- Frontend makes requests to `/api/backend/*`
- Vercel routes these to the Python backend
- Backend processes requests and returns JSON responses

### File Structure
```
frontend/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility functions
├── api/                    # Vercel API routes
│   └── backend/           # FastAPI backend
│       ├── main.py        # FastAPI app
│       ├── requirements.txt
│       └── app/           # Backend modules
└── vercel.json            # Vercel configuration
```

## Testing Your Deployment

### 1. Test Frontend
Visit your Vercel URL and verify:
- [ ] Page loads without errors
- [ ] Can add stock tickers
- [ ] News articles display
- [ ] Charts render properly

### 2. Test Backend API
Test these endpoints directly:
```bash
# Health check
curl https://your-project.vercel.app/api/backend/

# Add a ticker
curl -X POST https://your-project.vercel.app/api/backend/add_ticker \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL"}'

# Get price data
curl https://your-project.vercel.app/api/backend/price/AAPL
```

### 3. Test Integration
- [ ] Frontend successfully communicates with backend
- [ ] No CORS errors in browser console
- [ ] Voice news feature works (if API keys provided)

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Vercel build logs
   - Ensure all dependencies are in `package.json`
   - Verify Python dependencies in `api/backend/requirements.txt`

2. **API Calls Fail**
   - Check if `NEXT_PUBLIC_API_URL` is set correctly
   - Verify backend is accessible at `/api/backend/`
   - Check browser network tab for errors

3. **Environment Variables Not Working**
   - Ensure variables are set in Vercel dashboard
   - Redeploy after adding new variables
   - Check variable names match exactly

4. **Backend Not Starting**
   - Check Vercel function logs
   - Verify `api/backend/index.py` exists
   - Ensure `requirements.txt` is in the right location

### Debug Commands

```bash
# Test locally
cd frontend
npm run dev

# Check environment variables
echo $NEXT_PUBLIC_API_URL
```

## Production Considerations

### Performance
- Vercel automatically handles scaling
- Functions have a 30-second timeout
- Consider upgrading to Pro plan for longer timeouts

### Security
- Never commit API keys to version control
- Use Vercel's environment variables for secrets
- Consider implementing rate limiting

### Database
- SQLite works for demos
- For production, consider upgrading to PostgreSQL
- Use Vercel's database integrations

## Next Steps

After successful deployment:

1. **Custom Domain**: Add your own domain in Vercel
2. **Monitoring**: Set up error tracking (Sentry)
3. **Database**: Upgrade to PostgreSQL for production
4. **CI/CD**: Automatic deployments on git push

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test API endpoints individually
4. Review this guide for common solutions
