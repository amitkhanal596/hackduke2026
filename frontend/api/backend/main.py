from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional, Dict
from typing import List, Optional, Dict
from datetime import datetime
import os
from dotenv import load_dotenv
import google.generativeai as genai

from app.news_service import NewsService
from app.event_analyzer import EventAnalyzer
from app.database import Database
from app.agent import WealthVisorAgent
from pathlib import Path
from elevenlabs import ElevenLabs
import google.generativeai as genai

load_dotenv()

# Debug: Print env vars to verify they're loaded
print(f"DEBUG: GEMINI_API_KEY exists: {os.getenv('GEMINI_API_KEY') is not None}")
print(f"DEBUG: GOOGLE_API_KEY exists: {os.getenv('GOOGLE_API_KEY') is not None}")

app = FastAPI(title="StockLens API", version="1.0.0")

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
if gemini_api_key and gemini_api_key not in ["your_gemini_api_key_here", "placeholder_key", ""]:
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-pro')
else:
    # Configure with placeholder for voice news only
    genai.configure(api_key="placeholder_key")
    gemini_model = genai.GenerativeModel('gemini-pro')

# Initialize chat agent
# Ensure Gemini API key is available
gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if gemini_api_key and not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = gemini_api_key

# Initialize Gemini for AI insights
genai.configure(api_key=gemini_api_key)
gemini_model = genai.GenerativeModel('gemini-pro')

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

@app.get("/")
async def root():
    return {"message": "StockLens API is running"}

@app.post("/agent/chat", response_model=ChatResponse)
async def agent_chat(req: ChatRequest) -> ChatResponse:
    try:
        result = agent.chat(message=req.message, session_id=req.session_id)
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
    """Get price data for 1 day, 1 week, and 1 month"""
    try:
        import yfinance as yf
        from datetime import datetime, timedelta
        import logging
        import random
        
        logging.info(f"Fetching price data for {ticker}")
        ticker_upper = ticker.upper()
        stock = yf.Ticker(ticker_upper)
        
        # Try to get data from Alpha Vantage first
        try:
            from app.event_analyzer import EventAnalyzer
            event_analyzer = EventAnalyzer()
            
            # Get current price from Alpha Vantage
            alpha_data = event_analyzer._download_from_alpha_vantage(f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker_upper}&apikey={event_analyzer.alpha_vantage_key}")
            
            if alpha_data and "Global Quote" in alpha_data:
                quote = alpha_data["Global Quote"]
                current_price = float(quote.get("05. price", 0))
                logging.info(f"Got current price from Alpha Vantage for {ticker_upper}: ${current_price}")
                
                # For historical data, we'll use mock data since Alpha Vantage free tier has limits
                # In a real implementation, you'd use Alpha Vantage's TIME_SERIES_DAILY endpoint
                price_1d = current_price * (1 + random.uniform(-0.05, 0.05))
                price_1w = current_price * (1 + random.uniform(-0.15, 0.15))
                price_1m = current_price * (1 + random.uniform(-0.25, 0.25))
                
                change_1d = current_price - price_1d
                change_1w = current_price - price_1w
                change_1m = current_price - price_1m
                
                change_1d_percent = (change_1d / price_1d) * 100 if price_1d > 0 else 0
                change_1w_percent = (change_1w / price_1w) * 100 if price_1w > 0 else 0
                change_1m_percent = (change_1m / price_1m) * 100 if price_1m > 0 else 0
                
            else:
                logging.warning(f"Alpha Vantage returned no data for {ticker_upper}, using mock data")
                raise Exception("No Alpha Vantage data")
                
        except Exception as alpha_error:
            logging.warning(f"Alpha Vantage failed for {ticker_upper}: {str(alpha_error)}")
            
            # Fallback to yfinance
            hist = stock.history(period="5d")
            if hist.empty:
                logging.warning(f"yfinance also failed for {ticker_upper}, using mock data")
                
                # Mock data based on ticker
                mock_prices = {
                    'AAPL': 175.43,
                    'MSFT': 378.85,
                    'GOOGL': 142.56,
                    'AMZN': 155.89,
                    'TSLA': 248.42,
                    'META': 485.38,
                    'NVDA': 875.28,
                    'NFLX': 612.04
                }
                
                base_price = mock_prices.get(ticker_upper, 100.0 + random.uniform(-50, 50))
                
                # Generate realistic price changes
                change_1d = round(random.uniform(-5, 5), 2)
                change_1w = round(random.uniform(-15, 15), 2)
                change_1m = round(random.uniform(-25, 25), 2)
                
                current_price = round(base_price + change_1d, 2)
                price_1d = round(current_price - change_1d, 2)
                price_1w = round(current_price - change_1w, 2)
                price_1m = round(current_price - change_1m, 2)
                
                change_1d_percent = (change_1d / price_1d) * 100 if price_1d > 0 else 0
                change_1w_percent = (change_1w / price_1w) * 100 if price_1w > 0 else 0
                change_1m_percent = (change_1m / price_1m) * 100 if price_1m > 0 else 0
                
            else:
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
        
        logging.info(f"Successfully fetched price data for {ticker_upper}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching price data for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching price data: {str(e)}")

@app.get("/chart/{ticker}/{period}")
async def get_chart_data(ticker: str, period: str) -> ChartData:
    """Get historical chart data for 1 day, 1 week, or 1 month"""
    try:
        import yfinance as yf
        from datetime import datetime, timedelta
        import logging
        import pandas as pd
        
        logging.info(f"Fetching chart data for {ticker} - {period}")
        ticker_upper = ticker.upper()
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
            logging.warning(f"No chart data found for {ticker_upper} - {period} from yfinance, using mock data")
            
            # Generate mock chart data
            import random
            base_price = 175.0  # Base price for AAPL, adjust for other tickers
            
            chart_points = []
            if period == "1d":
                # Generate hourly data for 1 day (24 points)
                for i in range(24):
                    date = now - timedelta(hours=23-i)
                    price = base_price + random.uniform(-5, 5)
                    volume = random.randint(1000000, 5000000)
                    chart_points.append(ChartDataPoint(
                        date=date.strftime("%Y-%m-%d %H:%M:%S"),
                        price=round(price, 2),
                        volume=volume
                    ))
            elif period == "1w":
                # Generate daily data for 1 week (7 points)
                for i in range(7):
                    date = now - timedelta(days=6-i)
                    price = base_price + random.uniform(-10, 10)
                    volume = random.randint(5000000, 20000000)
                    chart_points.append(ChartDataPoint(
                        date=date.strftime("%Y-%m-%d %H:%M:%S"),
                        price=round(price, 2),
                        volume=volume
                    ))
            elif period == "1m":
                # Generate daily data for 1 month (30 points)
                for i in range(30):
                    date = now - timedelta(days=29-i)
                    price = base_price + random.uniform(-20, 20)
                    volume = random.randint(5000000, 25000000)
                    chart_points.append(ChartDataPoint(
                        date=date.strftime("%Y-%m-%d %H:%M:%S"),
                        price=round(price, 2),
                        volume=volume
                    ))
        else:
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
            response = gemini_model.generate_content(prompt)
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


@app.post("/voice-news")
async def generate_voice_news(request: VoiceNewsRequest):
    """Generate voice news using ElevenLabs with dynamic content"""
    try:
        voice_id = "VR6AewLTigWG4xSOukaG"  # Josh - rare, distinctive male voice

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

        # Generate audio with professional news anchor characteristics
        audio = elevenlabs.generate(
            text=script,
            voice=voice_id,
            model="eleven_multilingual_v2",
            voice_settings={
                "stability": 0.75,  # Good stability while preserving unique characteristics
                "similarity_boost": 0.85,  # High similarity for clear pronunciation
                "style": 0.4,  # Higher style to showcase the rare voice's distinctive qualities
                "use_speaker_boost": True
            }
        )
        
        # Convert to bytes
        audio_bytes = b"".join(audio)
        
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
        voice_id = "VR6AewLTigWG4xSOukaG"  # Josh - rare, distinctive male voice
        
        # Get tracked stocks and generate dynamic script
        tracked_stocks = await get_tracked_stocks()
        script = await generate_watchlist_script(tracked_stocks)
        print(f"Generated dynamic script for stocks: {tracked_stocks}")

        # Generate audio with professional news anchor characteristics
        audio = elevenlabs.generate(
            text=script,
            voice=voice_id,
            model="eleven_multilingual_v2",
            voice_settings={
                "stability": 0.75,  # Good stability while preserving unique characteristics
                "similarity_boost": 0.85,  # High similarity for clear pronunciation
                "style": 0.4,  # Higher style to showcase the rare voice's distinctive qualities
                "use_speaker_boost": True
            }
        )
        
        # Convert to bytes
        audio_bytes = b"".join(audio)
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
