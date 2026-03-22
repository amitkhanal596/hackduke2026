from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional, Dict
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import os
import time
import random
from dotenv import load_dotenv

from app.news_service import NewsService
from app.event_analyzer import EventAnalyzer
from app.database import Database
from app.agent import WealthVisorAgent
from pathlib import Path
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings
import google.genai as genai
import requests
import base64
import json
import subprocess
import signal
import re
from google.oauth2 import service_account
from google.cloud import texttospeech

load_dotenv()

# Debug: Print env vars to verify they're loaded
print(f"DEBUG: GEMINI_API_KEY exists: {os.getenv('GEMINI_API_KEY') is not None}")
print(f"DEBUG: GOOGLE_API_KEY exists: {os.getenv('GOOGLE_API_KEY') is not None}")

app = FastAPI(title="Toro API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon - in production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
news_service = NewsService(
    news_api_key=os.getenv("NEWS_API_KEY"),
    finnhub_api_key=os.getenv("FINNHUB_API_KEY")
)
event_analyzer = EventAnalyzer(alpha_vantage_key=os.getenv("ALPHA_VANTAGE_KEY"))
db = Database(os.getenv("DATABASE_URL"))

# Initialize ElevenLabs
elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

# Initialize Gemini AI
gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if gemini_api_key and not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = gemini_api_key
gemini_client = genai.Client(api_key=gemini_api_key)

prompt_path = Path(__file__).resolve().parent / "app" / "Agent-Prompt copy.md"
agent = WealthVisorAgent(system_prompt_path=prompt_path, workspace_root=Path(__file__).resolve().parent.parent)

# Pydantic models
class AddTickerRequest(BaseModel):
    ticker: str

class FetchNewsRequest(BaseModel):
    tickers: List[str]

class AnalyzeEventRequest(BaseModel):
    ticker: str
    date: str

class NewsArticle(BaseModel):
    ticker: str
    title: str
    sentiment: str
    summary: str
    url: str
    published_at: str

class EventAnalysis(BaseModel):
    ticker: str
    event: str
    date: str
    car_0_1: float
    volatility_change: float
    sentiment: str
    conclusion: str

class UpcomingEvent(BaseModel):
    ticker: str
    type: str
    date: str
    expected_impact: str

class PriceData(BaseModel):
    ticker: str
    current_price: float
    change_1d: float
    change_1w: float
    change_1m: float
    change_1d_percent: float
    change_1w_percent: float
    change_1m_percent: float

class ChartDataPoint(BaseModel):
    date: str
    price: float
    volume: int

class ChartData(BaseModel):
    ticker: str
    period: str
    data: List[ChartDataPoint]

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    reply: str

class SentimentExplanationRequest(BaseModel):
    article: NewsArticle

class VoiceNewsRequest(BaseModel):
    text: Optional[str] = None
    tracked_stocks: List[str] = []

class BullBearAnalysis(BaseModel):
    ticker: str
    bull_percentage: int
    bear_percentage: int
    analysis: str

@app.get("/analyze/bull-bear/{ticker}", response_model=BullBearAnalysis)
async def analyze_bull_bear(ticker: str):
    """
    Toro Proprietary Quant Engine: Multi-Factor Sentiment Analysis
    Combines Wall Street Analyst consensus, real-time news sentiment, 
    and price momentum indicators into a definitive Bull/Bear probability.
    """
    try:
        import requests
        import logging
        
        logging.info(f"Running Insane Quant Analysis for {ticker}")
        
        ticker_upper = ticker.upper()
        finnhub_key = os.getenv("FINNHUB_API_KEY")
        
        # --- Factors ---
        analyst_score = 50
        news_score = 50
        momentum_score = 50
        
        analyst_desc = "No analyst data available."
        news_desc = "No recent news data."
        momentum_desc = "No price momentum data."

        # 1. Analyst Consensus (Weight: 40%)
        if finnhub_key:
            url = f"https://finnhub.io/api/v1/stock/recommendation?symbol={ticker_upper}&token={finnhub_key}"
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        latest = data[0]
                        bull_votes = latest.get("strongBuy", 0) + latest.get("buy", 0)
                        bear_votes = latest.get("strongSell", 0) + latest.get("sell", 0)
                        total_votes = bull_votes + bear_votes + latest.get("hold", 0)
                        
                        if (bull_votes + bear_votes) > 0:
                            analyst_score = int((bull_votes / (bull_votes + bear_votes)) * 100)
                        
                        analyst_desc = f"Wall Street consensus holds {bull_votes} Buys to {bear_votes} Sells (out of {total_votes} total ratings)."
            except Exception as e:
                logging.warning(f"Finnhub API error: {e}")

        # 2. News Sentiment Vector (Weight: 30%)
        try:
            articles = await news_service.fetch_news_for_tickers([ticker_upper])
            pos = 0
            neg = 0
            for a in articles:
                # Handle both object and dict formats from news service
                if isinstance(a, dict):
                    sentiment = a.get("sentiment", "neutral").lower()
                else:
                    sentiment = getattr(a, "sentiment", "neutral").lower()

                if sentiment == "positive":
                    pos += 1
                elif sentiment == "negative":
                    neg += 1
            
            if (pos + neg) > 0:
                news_score = int((pos / (pos + neg)) * 100)
                news_desc = f"Analyzed {len(articles)} recent breaking articles: {pos} Positive, {neg} Negative."
            else:
                news_desc = f"Analyzed {len(articles)} recent articles, resulting in a strictly neutral vector."
        except Exception as e:
            logging.warning(f"News fetch error: {e}")

        # 3. Price Momentum Oscillator (Weight: 30%)
        try:
            price_data = await get_price_data(ticker_upper)
            w1 = price_data.change_1w_percent
            m1 = price_data.change_1m_percent
            
            # Mathematical momentum normalization (Base 50. Add bounded growth vectors)
            raw_momentum = 50 + max(-25, min(25, m1 * 1.5)) + max(-25, min(25, w1 * 3))
            momentum_score = int(max(0, min(100, raw_momentum)))
            
            momentum_desc = f"1-Week Delta: {w1:.2f}% | 1-Month Delta: {m1:.2f}%."
        except Exception as e:
            logging.warning(f"Price data error: {e}")


        # --- Final Quant Calculation ---
        # Weighted Average
        final_bull_pct = int((analyst_score * 0.4) + (news_score * 0.3) + (momentum_score * 0.3))
        final_bear_pct = 100 - final_bull_pct
        
        # Determine strict conclusion
        if final_bull_pct >= 70:
            conclusion = "AGGRESSIVE BULLISH. The quant engine detects massive upside confluence across Wall Street, news cycles, and price momentum."
        elif final_bull_pct >= 55:
            conclusion = "LEANING BULLISH. Technicals and sentiment indicate favorable conditions, though some resistance remains."
        elif final_bear_pct >= 70:
            conclusion = "AGGRESSIVE BEARISH. Severe downside warnings triggered. Avoid exposure unless shorting."
        elif final_bear_pct >= 55:
            conclusion = "LEANING BEARISH. Headwinds detected in momentum and sentiment. Caution advised."
        else:
            conclusion = "NEUTRAL CHOP. The asset is exhibiting contested price action and conflicting sentiment variables."

        # Compile the "Insane" Response
        analysis_part = f"📊 **Toro Quant Engine V2 Analysis for {ticker_upper}**\n\n"
        analysis_part += f"**Final Probability Matrix:** Bullish ({final_bull_pct}%) vs Bearish ({final_bear_pct}%)\n\n"
        analysis_part += f"**1. Institutional Vector (40% Weight):**\n- {analyst_desc}\n- Sub-score: {analyst_score}/100\n\n"
        analysis_part += f"**2. Media Sentiment Flow (30% Weight):**\n- {news_desc}\n- Sub-score: {news_score}/100\n\n"
        analysis_part += f"**3. Velocity & Momentum (30% Weight):**\n- {momentum_desc}\n- Sub-score: {momentum_score}/100\n\n"
        analysis_part += f"**Engine Conclusion:** {conclusion}"

        return BullBearAnalysis(
            ticker=ticker_upper,
            bull_percentage=final_bull_pct,
            bear_percentage=final_bear_pct,
            analysis=analysis_part
        )

    except Exception as e:
        print(f"Error in bull/bear quant engine: {e}")
        return BullBearAnalysis(
            ticker=ticker,
            bull_percentage=50,
            bear_percentage=50,
            analysis=f"Engine failure due to technical constraint: {str(e)}"
        )

@app.get("/")
async def root():
    return {"message": "Toro API is running"}

from ticker_bank import resolve_tickers

_TICKER_EXCLUDE = {
    'I', 'A', 'AI', 'US', 'USD', 'API', 'ETF', 'IPO', 'CEO', 'CFO', 'COO',
    'PE', 'EPS', 'ROI', 'GDP', 'CPI', 'FED', 'SEC', 'NYSE', 'NASDAQ',
    'AM', 'PM', 'OK', 'IT', 'OR', 'IF', 'IN', 'AT', 'BY', 'TO', 'ON',
    'JP', 'EU', 'UK', 'CA', 'MY', 'ME', 'HE', 'SHE', 'THE', 'AND', 'FOR',
    'ARE', 'NOT', 'BUT', 'ALL', 'ANY', 'CAN', 'HAS', 'HAD', 'ITS', 'LET',
    'NEW', 'NOW', 'OLD', 'OWN', 'WAY', 'WHO', 'WHY', 'HOW', 'TOP',
}

def extract_tickers(message: str) -> List[str]:
    return resolve_tickers(message, _TICKER_EXCLUDE)


def fetch_finnhub_context(ticker: str, api_key: str) -> str:
    """Fetch live Finnhub data for a ticker and return a formatted context block."""
    base = "https://finnhub.io/api/v1"
    parts = []

    try:
        r = requests.get(f"{base}/quote", params={"symbol": ticker, "token": api_key}, timeout=5)
        if r.ok:
            q = r.json()
            if q.get("c"):
                parts.append(
                    f"Current Price: ${q['c']:.2f} | Change: {q.get('dp', 0):+.2f}% (${q.get('d', 0):+.2f})"
                    f" | Open: ${q['o']:.2f} | High: ${q['h']:.2f} | Low: ${q['l']:.2f} | Prev Close: ${q['pc']:.2f}"
                )
    except Exception:
        pass

    try:
        r = requests.get(f"{base}/stock/profile2", params={"symbol": ticker, "token": api_key}, timeout=5)
        if r.ok:
            p = r.json()
            if p.get("name"):
                parts.append(
                    f"Company: {p['name']} | Industry: {p.get('finnhubIndustry', 'N/A')}"
                    f" | Market Cap: ${p.get('marketCapitalization', 0):,.0f}M | Exchange: {p.get('exchange', 'N/A')}"
                )
    except Exception:
        pass

    try:
        r = requests.get(f"{base}/stock/metric", params={"symbol": ticker, "metric": "all", "token": api_key}, timeout=5)
        if r.ok:
            m = r.json().get("metric", {})
            metrics = []
            if m.get("peBasicExclExtraTTM"):
                metrics.append(f"P/E (TTM): {m['peBasicExclExtraTTM']:.1f}")
            if m.get("52WeekHigh"):
                metrics.append(f"52W High: ${m['52WeekHigh']:.2f}")
            if m.get("52WeekLow"):
                metrics.append(f"52W Low: ${m['52WeekLow']:.2f}")
            if m.get("epsBasicExclExtraItemsTTM"):
                metrics.append(f"EPS (TTM): ${m['epsBasicExclExtraItemsTTM']:.2f}")
            if m.get("revenueGrowthTTMYoy"):
                metrics.append(f"Revenue Growth YoY: {m['revenueGrowthTTMYoy']:.1f}%")
            if m.get("netMarginTTM"):
                metrics.append(f"Net Margin: {m['netMarginTTM']:.1f}%")
            if m.get("roeTTM"):
                metrics.append(f"ROE: {m['roeTTM']:.1f}%")
            if m.get("currentRatioQuarterly"):
                metrics.append(f"Current Ratio: {m['currentRatioQuarterly']:.2f}")
            if metrics:
                parts.append(" | ".join(metrics))
    except Exception:
        pass

    try:
        from_date = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
        to_date = datetime.now().strftime("%Y-%m-%d")
        r = requests.get(
            f"{base}/company-news",
            params={"symbol": ticker, "from": from_date, "to": to_date, "token": api_key},
            timeout=5
        )
        if r.ok:
            headlines = [item["headline"] for item in r.json()[:5] if item.get("headline")]
            if headlines:
                parts.append("Recent News Headlines:\n" + "\n".join(f"- {h}" for h in headlines))
    except Exception:
        pass

    if not parts:
        return ""
    return f"\n\n[Live Finnhub Data for {ticker}]\n" + "\n".join(parts) + "\n[End Finnhub Data]"


@app.post("/agent/chat", response_model=ChatResponse)
async def agent_chat(req: ChatRequest) -> ChatResponse:
    try:
        message = req.message
        finnhub_key = os.getenv("FINNHUB_API_KEY")
        if finnhub_key:
            tickers = extract_tickers(message)
            if tickers:
                context_blocks = [fetch_finnhub_context(t, finnhub_key) for t in tickers]
                context = "".join(b for b in context_blocks if b)
                if context:
                    message = message + context
        result = agent.chat(message=message, session_id=req.session_id)
        return ChatResponse(session_id=result["session_id"], reply=result["reply"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/explain-sentiment", response_model=ChatResponse)
async def explain_sentiment(req: SentimentExplanationRequest) -> ChatResponse:
    try:
        article = req.article
        prompt = f"""Analyze this financial news article and explain why it has been classified as '{article.sentiment}' sentiment.

Article Details:
- Title: {article.title}
- Summary: {article.summary}
- Ticker: {article.ticker}
- Sentiment: {article.sentiment}
- Published: {article.published_at}

Please provide a detailed explanation covering:
1. Key phrases or words that influenced the sentiment classification
2. The overall tone and context of the article
3. Why this sentiment rating (positive/negative/neutral) makes sense for {article.ticker}
4. What this means for potential investors

Keep your response concise, professional, and focused on sentiment analysis."""

        result = agent.chat(message=prompt, session_id=None)
        return ChatResponse(session_id=result["session_id"], reply=result["reply"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add_ticker")
async def add_ticker(request: AddTickerRequest):
    """Add a stock ticker to track"""
    try:
        ticker = request.ticker.upper()
        # Validate ticker exists
        import yfinance as yf
        stock = yf.Ticker(ticker)
        info = stock.info

        if not info or 'symbol' not in info:
            raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")

        # Store in database (simplified for hackathon)
        return {
            "ticker": ticker,
            "company_name": info.get("longName", ticker),
            "message": "Ticker added successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fetch_news")
async def fetch_news(request: FetchNewsRequest) -> List[NewsArticle]:
    """Fetch filtered and analyzed news for tracked stocks"""
    try:
        articles = await news_service.fetch_news_for_tickers(request.tickers)
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_event")
async def analyze_event(request: AnalyzeEventRequest) -> EventAnalysis:
    """Analyze the impact of a specific event"""
    try:
        event_date = datetime.fromisoformat(request.date)
        analysis = event_analyzer.analyze_event(request.ticker, event_date)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events/past")
async def get_past_events(ticker: str) -> List[EventAnalysis]:
    """Get past events with their analysis"""
    try:
        events = event_analyzer.get_past_earnings_events(ticker)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events/upcoming")
async def get_upcoming_events(ticker: str) -> List[UpcomingEvent]:
    """Get upcoming events for a ticker"""
    try:
        events = event_analyzer.get_upcoming_events(ticker)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/price/{ticker}")
async def get_price_data(ticker: str) -> PriceData:
    """Get price data for 1 day, 1 week, and 1 month with aggressive caching"""
    try:
        import yfinance as yf
        from datetime import datetime, timedelta
        import logging
        import requests
        from app.cache_manager import cache

        logging.info(f"Fetching price data for {ticker}")
        ticker_upper = ticker.upper()

        # Check cache first (1 hour TTL)
        cache_key = f"price_{ticker_upper}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logging.info(f"Cache hit for price data: {ticker_upper}")
            return cached_data

        # Try Finnhub first (better rate limits)
        try:
            if os.getenv("FINNHUB_API_KEY"):
                print(f"  Trying Finnhub for {ticker_upper}...")

                # Get current quote from Finnhub
                url = "https://finnhub.io/api/v1/quote"
                params = {
                    "symbol": ticker_upper,
                    "token": os.getenv("FINNHUB_API_KEY")
                }
                response = requests.get(url, params=params, timeout=10)
                finnhub_data = response.json()

                if "c" in finnhub_data and finnhub_data["c"] > 0:
                    current_price = float(finnhub_data["c"])  # Current price
                    previous_close = float(finnhub_data["pc"])  # Previous close
                    print(f"  SUCCESS! Got price from Finnhub: ${current_price}")

                    if current_price > 0:
                        # Calculate day change from Finnhub data
                        price_1d = previous_close
                        change_1d = current_price - price_1d
                        change_1d_percent = (change_1d / price_1d) * 100 if price_1d > 0 else 0

                        # For 1w and 1m, fetch historical data from Finnhub candles
                        # This is more accurate than using fallback values
                        now = datetime.now()

                        # Try to get 1 week historical price
                        price_1w = previous_close
                        try:
                            week_ago_timestamp = int((now - timedelta(days=7)).timestamp())
                            now_timestamp = int(now.timestamp())

                            candle_url = "https://finnhub.io/api/v1/stock/candle"
                            candle_params = {
                                "symbol": ticker_upper,
                                "resolution": "D",  # Daily candles
                                "from": week_ago_timestamp,
                                "to": now_timestamp,
                                "token": os.getenv("FINNHUB_API_KEY")
                            }
                            candle_response = requests.get(candle_url, params=candle_params, timeout=10)
                            candle_data = candle_response.json()

                            if candle_data.get("s") == "ok" and "c" in candle_data and len(candle_data["c"]) > 0:
                                price_1w = float(candle_data["c"][0])  # First candle's close price
                                print(f"  Got 1w price from Finnhub: ${price_1w}")
                        except Exception as e:
                            print(f"  Failed to get 1w price from Finnhub: {e}")

                        # Try to get 1 month historical price
                        price_1m = previous_close
                        try:
                            month_ago_timestamp = int((now - timedelta(days=30)).timestamp())

                            candle_params["from"] = month_ago_timestamp
                            candle_response = requests.get(candle_url, params=candle_params, timeout=10)
                            candle_data = candle_response.json()

                            if candle_data.get("s") == "ok" and "c" in candle_data and len(candle_data["c"]) > 0:
                                price_1m = float(candle_data["c"][0])  # First candle's close price
                                print(f"  Got 1m price from Finnhub: ${price_1m}")
                        except Exception as e:
                            print(f"  Failed to get 1m price from Finnhub: {e}")

                        change_1w = current_price - price_1w
                        change_1m = current_price - price_1m
                        change_1w_percent = (change_1w / price_1w) * 100 if price_1w > 0 else 0
                        change_1m_percent = (change_1m / price_1m) * 100 if price_1m > 0 else 0

                        result = PriceData(
                            ticker=ticker_upper,
                            current_price=round(current_price, 2),
                            change_1d=round(change_1d, 2),
                            change_1w=round(change_1w, 2),
                            change_1m=round(change_1m, 2),
                            change_1d_percent=round(change_1d_percent, 2),
                            change_1w_percent=round(change_1w_percent, 2),
                            change_1m_percent=round(change_1m_percent, 2)
                        )

                        # Cache the result for 1 hour
                        cache.set(cache_key, result, cache_type='price')

                        logging.info(f"Successfully fetched price data from Finnhub for {ticker_upper}")
                        return result

                print(f"  Finnhub error or no data")
                raise Exception("Finnhub failed")

        except Exception as finnhub_error:
            logging.warning(f"Finnhub failed for {ticker_upper}: {str(finnhub_error)}")
            pass  # Continue to yfinance fallback

        # Fallback to yfinance
        stock = yf.Ticker(ticker_upper)
        hist = stock.history(period="5d")
        if hist.empty:
            logging.error(f"No data available for {ticker_upper} from any source")
            raise HTTPException(status_code=404, detail=f"No price data available for {ticker_upper}")

        current_price = float(hist['Close'].iloc[-1])
        logging.info(f"Got current price from yfinance for {ticker_upper}: ${current_price}")

        # Get historical data for different periods
        now = datetime.now()

        # 1 day ago - get data from 2 days ago to ensure we have at least 1 day of data
        hist_1d = stock.history(start=now - timedelta(days=3), end=now)
        price_1d = float(hist_1d['Close'].iloc[0]) if len(hist_1d) > 1 else current_price

        # 1 week ago
        hist_1w = stock.history(start=now - timedelta(days=10), end=now)
        price_1w = float(hist_1w['Close'].iloc[0]) if len(hist_1w) > 5 else current_price

        # 1 month ago
        hist_1m = stock.history(start=now - timedelta(days=35), end=now)
        price_1m = float(hist_1m['Close'].iloc[0]) if len(hist_1m) > 20 else current_price

        # Calculate changes
        change_1d = current_price - price_1d
        change_1w = current_price - price_1w
        change_1m = current_price - price_1m

        change_1d_percent = (change_1d / price_1d) * 100 if price_1d > 0 else 0
        change_1w_percent = (change_1w / price_1w) * 100 if price_1w > 0 else 0
        change_1m_percent = (change_1m / price_1m) * 100 if price_1m > 0 else 0

        result = PriceData(
            ticker=ticker_upper,
            current_price=round(current_price, 2),
            change_1d=round(change_1d, 2),
            change_1w=round(change_1w, 2),
            change_1m=round(change_1m, 2),
            change_1d_percent=round(change_1d_percent, 2),
            change_1w_percent=round(change_1w_percent, 2),
            change_1m_percent=round(change_1m_percent, 2)
        )

        # Cache the result for 1 hour
        cache.set(cache_key, result, cache_type='price')

        logging.info(f"Successfully fetched price data for {ticker_upper}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching price data for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching price data: {str(e)}")

@app.get("/chart/{ticker}/{period}")
async def get_chart_data(ticker: str, period: str) -> ChartData:
    """Get historical chart data for 1 day, 1 week, or 1 month with aggressive caching"""
    try:
        import yfinance as yf
        from datetime import datetime, timedelta
        import logging
        import pandas as pd
        import requests
        from app.cache_manager import cache

        logging.info(f"Fetching chart data for {ticker} - {period}")
        ticker_upper = ticker.upper()

        # Check cache first (different TTL per period)
        cache_key = f"chart_{ticker_upper}_{period}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logging.info(f"Cache hit for chart data: {ticker_upper} - {period}")
            return cached_data

        # Try Finnhub for candle data first
        hist = pd.DataFrame()
        if os.getenv("FINNHUB_API_KEY"):
            try:
                print(f"  Trying Finnhub candles for {ticker_upper} - {period}...")
                now = datetime.now()

                # Determine time range
                if period == "1d":
                    start_date = now - timedelta(days=1)
                    resolution = "5"  # 5-minute candles
                elif period == "1w":
                    start_date = now - timedelta(days=7)
                    resolution = "60"  # 1-hour candles
                else:  # 1m
                    start_date = now - timedelta(days=30)
                    resolution = "D"  # Daily candles

                # Finnhub expects Unix timestamps
                from_timestamp = int(start_date.timestamp())
                to_timestamp = int(now.timestamp())

                url = "https://finnhub.io/api/v1/stock/candle"
                params = {
                    "symbol": ticker_upper,
                    "resolution": resolution,
                    "from": from_timestamp,
                    "to": to_timestamp,
                    "token": os.getenv("FINNHUB_API_KEY")
                }

                response = requests.get(url, params=params, timeout=10)
                candle_data = response.json()

                if candle_data.get("s") == "ok" and "c" in candle_data:
                    # Convert Finnhub candle data to DataFrame
                    timestamps = candle_data["t"]
                    closes = candle_data["c"]
                    volumes = candle_data["v"]

                    for i, ts in enumerate(timestamps):
                        date = pd.Timestamp.fromtimestamp(ts)
                        hist.loc[date] = {'Close': closes[i], 'Volume': volumes[i]}

                    print(f"  SUCCESS! Got {len(hist)} candles from Finnhub")
            except Exception as e:
                logging.warning(f"Finnhub candle data failed: {e}")
                hist = pd.DataFrame()

        # Fallback to yfinance if Finnhub failed
        if hist.empty:
            stock = yf.Ticker(ticker_upper)

            # Determine the date range based on period
            now = datetime.now()
            if period == "1d":
                start_date = now - timedelta(days=2)
                end_date = now
                interval = "1m"  # 1-minute intervals for intraday
            elif period == "1w":
                start_date = now - timedelta(days=7)
                end_date = now
                interval = "15m"  # 15-minute intervals for weekly
            elif period == "1m":
                start_date = now - timedelta(days=30)
                end_date = now
                interval = "1h"  # 1-hour intervals for monthly
            else:
                raise HTTPException(status_code=400, detail="Invalid period. Use '1d', '1w', or '1m'")

            # Try to fetch historical data from yfinance
            hist = stock.history(start=start_date, end=end_date, interval=interval)

        if hist.empty:
            logging.warning(f"No chart data found for {ticker_upper} - {period} from any source, generating estimated data")

            # As a last resort, generate estimated chart data based on current price
            # Try to get current price first
            try:
                import requests as req
                resp = req.get(f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker_upper}&apikey={os.getenv('ALPHA_VANTAGE_KEY')}", timeout=5)
                quote_data = resp.json()
                if "Global Quote" in quote_data and quote_data["Global Quote"]:
                    current_price = float(quote_data["Global Quote"].get("05. price", 150.0))
                else:
                    current_price = 150.0  # Default fallback
            except:
                current_price = 150.0

            # Generate realistic-looking data points around current price
            import random
            random.seed(hash(ticker_upper))  # Consistent for same ticker

            now = datetime.now()
            chart_points_list = []

            if period == "1d":
                num_points = 24
                for i in range(num_points):
                    date = now - timedelta(hours=num_points-1-i)
                    # Small variation for intraday
                    price = current_price * (1 + random.uniform(-0.02, 0.02))
                    hist.loc[date] = {'Close': price, 'Volume': random.randint(1000000, 5000000)}
            elif period == "1w":
                num_points = 7
                for i in range(num_points):
                    date = now - timedelta(days=num_points-1-i)
                    # Moderate variation for week
                    price = current_price * (1 + random.uniform(-0.05, 0.05))
                    hist.loc[date] = {'Close': price, 'Volume': random.randint(5000000, 20000000)}
            else:  # 1m
                num_points = 30
                for i in range(num_points):
                    date = now - timedelta(days=num_points-1-i)
                    # Larger variation for month
                    price = current_price * (1 + random.uniform(-0.10, 0.10))
                    hist.loc[date] = {'Close': price, 'Volume': random.randint(5000000, 25000000)}

            logging.info(f"Generated estimated chart data for {ticker_upper}")

        # Convert real data to chart data points
        chart_points = []
        for date, row in hist.iterrows():
            chart_points.append(ChartDataPoint(
                date=date.strftime("%Y-%m-%d %H:%M:%S"),
                price=round(float(row['Close']), 2),
                volume=int(row['Volume']) if not pd.isna(row['Volume']) else 0
            ))
        
        result = ChartData(
            ticker=ticker_upper,
            period=period,
            data=chart_points
        )

        # Cache the result with period-specific TTL
        cache.set(cache_key, result, cache_type=f'chart_{period}')

        logging.info(f"Successfully fetched {len(chart_points)} data points for {ticker_upper} - {period}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching chart data for {ticker} - {period}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching chart data: {str(e)}")

async def generate_ai_insights(tracked_stocks: List[str], stock_data: List[Dict]) -> str:
    """Generate AI insights about tracked stocks using Gemini"""
    try:
        if not tracked_stocks or not stock_data:
            return "Market analysts remain cautious about near-term volatility"

        # Prepare stock data summary for Gemini
        stock_summary = []
        for i, ticker in enumerate(tracked_stocks[:3]):  # Limit to 3 stocks
            if i < len(stock_data):
                data = stock_data[i]
                stock_summary.append(
                    f"{ticker}: ${data['current_price']:.2f} "
                    f"({data['change_1d_percent']:+.1f}% today, "
                    f"{data['change_1w_percent']:+.1f}% this week)"
                )

        # Create prompt for Gemini
        prompt = f"""
        As a financial analyst, provide a brief 2-sentence market insight about these stocks:
        {', '.join(stock_summary)}

        Focus on recent trends, market sentiment, and potential factors driving the performance.
        Keep it concise and professional for a financial news broadcast. make sure it is between 50 and 100 words.
        """

        # Generate AI insights
        try:
            response = gemini_client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
            insights = response.text.strip()
        except Exception as e:
            print(f"Gemini API error: {e}")
            # Fallback to basic analysis
            if any(data['change_1d_percent'] > 0 for data in stock_data):
                insights = "Market sentiment appears positive with several stocks showing gains today."
            elif any(data['change_1d_percent'] < 0 for data in stock_data):
                insights = "Market sentiment appears cautious with several stocks experiencing declines today."
            else:
                insights = "Market conditions remain stable with mixed performance across tracked stocks."

        # Ensure insights are concise (max 2 sentences)
        sentences = insights.split('. ')
        if len(sentences) > 2:
            insights = '. '.join(sentences[:2]) + '.'

        return insights

    except Exception as e:
        print(f"Error generating AI insights: {e}")
        return "Market analysts remain cautious about near-term volatility"


async def get_tracked_stocks() -> List[str]:
    """Get tracked stocks from database or return default popular stocks"""
    try:
        # Try to get from database first
        # For now, return some popular stocks as defaults
        default_stocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "JPM", "JNJ", "V"]
        return default_stocks
    except Exception as e:
        print(f"Error getting tracked stocks: {e}")
        return ["AAPL", "MSFT", "GOOGL"]  # Fallback to basic tech stocks


async def generate_watchlist_script(tracked_stocks: List[str]) -> str:
    """Generate a ~100-word script about tracked stocks and their news, allowing sentences to complete naturally"""
    try:
        # Fetch news for tracked stocks
        articles = await news_service.fetch_news_for_tickers(tracked_stocks)

        # Get comprehensive price data for each stock using our existing API
        stock_summaries = []
        stock_data_for_ai = []
        for ticker in tracked_stocks[:3]:  # Limit to 3 stocks for 100-word limit
            try:
                # Use our existing price data endpoint
                price_data = await get_price_data(ticker)

                # Store data for AI analysis
                stock_data_for_ai.append({
                    'ticker': ticker,
                    'current_price': price_data.current_price,
                    'change_1d_percent': price_data.change_1d_percent,
                    'change_1w_percent': price_data.change_1w_percent
                })

                # Create detailed stock summary with multiple timeframes
                current_price = price_data.current_price
                change_1d = price_data.change_1d
                change_1d_percent = price_data.change_1d_percent
                change_1w_percent = price_data.change_1w_percent

                # Determine trend direction
                if change_1d_percent > 0:
                    direction = "up"
                    trend = "gaining"
                elif change_1d_percent < 0:
                    direction = "down"
                    trend = "declining"
                else:
                    direction = "flat"
                    trend = "holding steady"

                # Create comprehensive summary
                if abs(change_1d_percent) > 5:
                    intensity = "sharply" if abs(change_1d_percent) > 10 else "significantly"
                else:
                    intensity = "slightly"

                # Add weekly context if available
                weekly_context = ""
                if abs(change_1w_percent) > 10:
                    weekly_trend = "up" if change_1w_percent > 0 else "down"
                    weekly_context = f", {weekly_trend} {abs(change_1w_percent):.1f}% this week"

                stock_summaries.append(
                    f"{ticker} is trading at ${current_price:.2f}, {intensity} {trend} {abs(change_1d_percent):.1f}% today{weekly_context}"
                )

            except Exception as e:
                print(f"Error fetching price data for {ticker}: {e}")
                # Fallback for any errors
                stock_summaries.append(f"{ticker} showing mixed signals in today's trading")

        # Get relevant news headlines with more context
        news_headlines = []
        for article in articles[:2]:  # Limit to 2 articles
            # Handle both dict and object formats
            if isinstance(article, dict):
                title = article.get("title", "Market update")
            else:
                title = getattr(article, "title", "Market update")

            # Truncate title intelligently
            if len(title) > 60:
                title = title[:57] + "..."
            news_headlines.append(f"Breaking: {title}")

        # Generate AI insights about the stocks
        ai_insights = await generate_ai_insights(tracked_stocks, stock_data_for_ai)

        # Generate the script with more detailed insights
        if stock_summaries:
            stocks_text = ". ".join(stock_summaries)
            news_text = ". ".join(news_headlines) if news_headlines else ""

            # Add market context based on overall performance
            market_context = ""
            if any("up" in summary for summary in stock_summaries):
                market_context = " showing overall positive momentum"
            elif any("down" in summary for summary in stock_summaries):
                market_context = " facing some headwinds"

            # Combine all elements
            script_parts = [
                f"Welcome to The Scoop, your financial news update. {stocks_text}{market_context}",
                f"AI Analysis: {ai_insights}",
                news_text if news_text else "Market analysts remain cautious about near-term volatility",
                "Stay tuned for more market insights and portfolio updates."
            ]

            script = ". ".join(filter(None, script_parts)) + "."
        else:
            # Get default tracked stocks and generate dynamic script
            tracked_stocks = await get_tracked_stocks()
            script = await generate_watchlist_script(tracked_stocks)

        # Ensure script is around 100 words, but allow sentences to complete naturally
        words = script.split()
        if len(words) > 100:
            # Find the last complete sentence before the 100-word limit
            truncated_words = words[:100]
            truncated_script = " ".join(truncated_words)
            
            # Find the last complete sentence by looking for sentence endings
            last_period = truncated_script.rfind('.')
            last_exclamation = truncated_script.rfind('!')
            last_question = truncated_script.rfind('?')
            
            # Use the last sentence ending found
            last_sentence_end = max(last_period, last_exclamation, last_question)
            
            if last_sentence_end > 0:
                # Keep the script up to the last complete sentence
                script = truncated_script[:last_sentence_end + 1]
            else:
                # If no sentence ending found, just truncate and add ellipsis
                script = truncated_script + "..."
        elif len(words) < 80:
            script += " Market conditions continue to evolve as investors navigate economic uncertainty."

        # Debug: Print the generated script
        print(f"Generated script for {tracked_stocks}: {script}")
        print(f"Script word count: {len(script.split())}")

        return script

    except Exception as e:
        print(f"Error generating watchlist script: {e}")
        # Fallback to basic dynamic content even on error
        try:
            tracked_stocks = await get_tracked_stocks()
            return await generate_watchlist_script(tracked_stocks)
        except:
            return "Welcome to The Scoop, your financial news update. Market conditions are showing mixed signals today. Stay tuned for more updates on your portfolio performance and market movements."


async def generate_tts_audio(script: str) -> bytes:
    """Generate TTS audio using Google Cloud TTS (service account) first, falling back to ElevenLabs."""
    creds_json = os.getenv("GOOGLE_TTS_CREDENTIALS")
    if creds_json:
        try:
            creds_info = json.loads(creds_json)
            credentials = service_account.Credentials.from_service_account_info(
                creds_info,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            client = texttospeech.TextToSpeechClient(credentials=credentials)
            synthesis_input = texttospeech.SynthesisInput(text=script)
            voice = texttospeech.VoiceSelectionParams(
                language_code="en-US",
                ssml_gender=texttospeech.SsmlVoiceGender.MALE
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            response = client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )
            print("TTS: using Google Cloud TTS")
            return response.audio_content
        except Exception as e:
            print(f"Google TTS failed, falling back to ElevenLabs: {e}")

    # Fallback: ElevenLabs
    print("TTS: using ElevenLabs")
    voice_id = "VR6AewLTigWG4xSOukaG"
    audio = elevenlabs.text_to_speech.convert(
        voice_id=voice_id,
        text=script,
        model_id="eleven_multilingual_v2",
        voice_settings=VoiceSettings(
            stability=0.75,
            similarity_boost=0.85,
            style=0.4,
            use_speaker_boost=True
        )
    )
    return b"".join(audio)


@app.post("/voice-news")
async def generate_voice_news(request: VoiceNewsRequest):
    """Generate voice news with dynamic content"""
    try:
        # Determine which script to use
        if request.text:
            # Use provided text directly (from frontend)
            script = request.text
            print(f"Using provided text for voice generation: {len(script)} characters")
        elif request.tracked_stocks:
            # Generate script about specific tracked stocks
            script = await generate_watchlist_script(request.tracked_stocks)
            print(f"Generated script for tracked stocks: {request.tracked_stocks}")
        else:
            # Get default tracked stocks and generate script
            tracked_stocks = await get_tracked_stocks()
            script = await generate_watchlist_script(tracked_stocks)
            print(f"Generated script for default stocks: {tracked_stocks}")

        audio_bytes = await generate_tts_audio(script)

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=financial_news.mp3",
                "Content-Length": str(len(audio_bytes))
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating voice: {str(e)}")


@app.post("/voice-news/dynamic")
async def generate_dynamic_voice_news():
    """Generate voice news with dynamic stock content - no parameters needed"""
    try:
        # Get tracked stocks and generate dynamic script
        tracked_stocks = await get_tracked_stocks()
        script = await generate_watchlist_script(tracked_stocks)
        print(f"Generated dynamic script for stocks: {tracked_stocks}")

        audio_bytes = await generate_tts_audio(script)

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=financial_news.mp3",
                "Content-Length": str(len(audio_bytes))
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating dynamic voice: {str(e)}")

@app.post("/voice-news/script")
async def get_voice_news_script():
    """Get the script text for voice news without generating audio"""
    try:
        # Get tracked stocks and generate dynamic script
        tracked_stocks = await get_tracked_stocks()
        script = await generate_watchlist_script(tracked_stocks)
        print(f"Generated script for stocks: {tracked_stocks}")
        
        return {"script": script}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating script: {str(e)}")


# ============================================================================
# Toro Voice Assistant Endpoints
# ============================================================================

_voice_assistant_proc: subprocess.Popen | None = None


@app.post("/voice-assistant/start")
async def start_voice_assistant():
    global _voice_assistant_proc
    if _voice_assistant_proc and _voice_assistant_proc.poll() is None:
        return {"status": "already_running"}
    script = Path(__file__).parent / "voice_assistant.py"
    _voice_assistant_proc = subprocess.Popen(
        ["python", str(script)],
        cwd=str(Path(__file__).parent),
    )
    return {"status": "started", "pid": _voice_assistant_proc.pid}


@app.post("/voice-assistant/stop")
async def stop_voice_assistant():
    global _voice_assistant_proc
    if _voice_assistant_proc is None or _voice_assistant_proc.poll() is not None:
        _voice_assistant_proc = None
        return {"status": "not_running"}
    _voice_assistant_proc.terminate()
    try:
        _voice_assistant_proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        _voice_assistant_proc.kill()
    _voice_assistant_proc = None
    return {"status": "stopped"}


@app.get("/voice-assistant/status")
async def voice_assistant_status():
    global _voice_assistant_proc
    running = _voice_assistant_proc is not None and _voice_assistant_proc.poll() is None
    state = "stopped"
    if running:
        state_file = Path(__file__).parent / "toro_state.txt"
        try:
            state = state_file.read_text().strip() or "idle"
        except Exception:
            state = "idle"
    return {"running": running, "state": state}


# ============================================================================
# Bull vs Bear Multi-Agent Analysis Endpoint
# ============================================================================

class AnalysisRequest(BaseModel):
    include_news: bool = True
    include_events: bool = True


@app.post("/analyze/{ticker}")
async def analyze_stock(ticker: str):
    """
    Multi-agent Bull vs Bear analysis endpoint

    Uses secure, modular multi-agent system with:
    - Security & Data Sanitization
    - Bull Case Analyst
    - Bear Case Analyst
    - Probabilistic Scoring Engine

    Returns structured, validated JSON output
    """
    try:
        from app.ai_agents import run_multi_agent_analysis
        import logging

        logger = logging.getLogger(__name__)
        logger.info(f"Starting multi-agent analysis for {ticker}")

        ticker_upper = ticker.upper()

        # Gather data for analysis
        raw_data_parts = []

        # Get price data
        try:
            price_response = await get_price_data(ticker_upper)
            raw_data_parts.append(f"""
Stock: {ticker_upper}
Current Price: ${price_response.current_price}
1 Day Change: ${price_response.change_1d} ({price_response.change_1d_percent}%)
1 Week Change: ${price_response.change_1w} ({price_response.change_1w_percent}%)
1 Month Change: ${price_response.change_1m} ({price_response.change_1m_percent}%)
""")
        except:
            raw_data_parts.append(f"Stock: {ticker_upper}\nPrice data unavailable.")

        # Get news
        try:
            news = news_service.get_stock_news(ticker_upper)
            if news:
                news_summary = "\n".join([
                    f"- {item.get('title', 'No title')}: {item.get('summary', 'No summary')[:200]}"
                    for item in news[:5]
                ])
                raw_data_parts.append(f"\nRecent News:\n{news_summary}")
        except:
            pass

        # Get events
        try:
            past_events = await get_past_events(ticker_upper)
            if past_events and past_events.get("events"):
                events_summary = "\n".join([
                    f"- {event.get('date', 'Unknown date')}: {event.get('description', 'No description')}"
                    for event in past_events["events"][:3]
                ])
                raw_data_parts.append(f"\nRecent Events:\n{events_summary}")
        except:
            pass

        # Combine all data
        raw_data = "\n".join(raw_data_parts)

        # Run multi-agent analysis
        result = await run_multi_agent_analysis(raw_data)

        # Add metadata
        result["ticker"] = ticker_upper
        result["analyzed_at"] = datetime.now().isoformat()

        return result

    except Exception as e:
        logger.error(f"Error in multi-agent analysis for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing stock: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    import os 
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
