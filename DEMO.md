# Toro Demo Script

Perfect 3-minute demo script for judges/presentations.

## Demo Storyline

**The Problem**: Investors are overwhelmed by market noise and struggle to understand how events actually affect their portfolio stocks.

**The Solution**: Toro - a smart financial tracker that filters news, analyzes event impact, and helps users stay prepared.

## Demo Flow (3 minutes)

### 1. Introduction (30 seconds)

"Hi! I'm presenting Toro - a personalized financial event tracker that helps investors cut through market noise and understand how events actually impact their stocks."

### 2. Add Stocks (30 seconds)

**Action**: Type "AAPL" in the input field and click "Track Stock"

"Let's say I want to track Apple. I simply add the ticker AAPL..."

**Action**: Add "TSLA" and "NVDA"

"I can add multiple stocks to build my personalized dashboard."

### 3. News Feed (45 seconds)

**Action**: Scroll through news articles

"Toro automatically fetches relevant financial news and filters out the noise. Each article gets:"

- **Point to sentiment badges**: "Real-time sentiment analysis - positive, negative, or neutral"
- **Point to summaries**: "AI-generated summaries so I can scan quickly"
- **Point to ticker tags**: "Clear ticker tagging so I know which stocks are affected"

### 4. Past Event Analysis (60 seconds)

**Action**: Click on AAPL stock card

"But here's where it gets powerful. For each stock, I can see past events like earnings reports."

**Point to metrics**:
- "This shows the CAR - Cumulative Abnormal Return - which measures how much the stock moved beyond normal market movement"
- "We see +3.2% abnormal return after the last earnings"
- "Volatility increased 1.4x"
- "And the sentiment was positive, which aligned with the price jump"

**Action**: Show another event with negative CAR

"Here's a guidance miss - negative sentiment led to a -1.5% abnormal return."

"This analysis uses a market model regression to isolate the event's true impact from overall market movement."

### 5. Upcoming Events (30 seconds)

**Action**: Toggle to "Upcoming" tab

"I can also see upcoming events so I'm prepared:"
- "Next earnings report in 30 days"
- "Expected high impact"
- "I could even add these to my calendar"

### 6. Wrap-up (15 seconds)

"Toro helps investors:"
1. Filter news that matters
2. Understand how events actually moved prices
3. Prepare for what's coming

"All powered by real financial data, sentiment analysis, and statistical event studies."

## Technical Highlights (if asked)

### Frontend
- Next.js 15 with React
- Tailwind CSS for responsive design
- Real-time data updates
- Clean, intuitive UX

### Backend
- FastAPI (Python)
- Yahoo Finance for stock data
- NewsAPI/Finnhub for articles
- TextBlob for sentiment analysis

### Event Analysis Algorithm
- Market model regression (120-day estimation window)
- Cumulative Abnormal Return (CAR) calculation
- Volatility ratio analysis
- Statistical significance testing

### Key Innovation
"Most news apps just show headlines. We combine:"
1. News filtering + sentiment
2. Statistical event analysis (CAR)
3. Historical context
4. Forward-looking calendar

"This gives investors actionable intelligence, not just information."

## Demo Tips

### Preparation
1. Start both backend and frontend before demo
2. Pre-load 2-3 stocks so there's immediate data
3. Test API connectivity (or ensure mock data works)
4. Have browser window ready at localhost:3000

### Backup Plan
- If APIs fail, mock data will automatically display
- Screenshot key features as backup
- Have curl commands ready to show API responses

### Common Questions & Answers

**Q: What APIs do you use?**
A: Yahoo Finance for stock prices and events, NewsAPI or Finnhub for articles, TextBlob for sentiment analysis.

**Q: How do you calculate CAR?**
A: We run a market model regression against the S&P 500 over a 120-day estimation window, then calculate abnormal returns during the event window by comparing actual vs expected returns.

**Q: Can users save their portfolios?**
A: Currently it's session-based for the hackathon. With more time, we'd add user authentication and persistent storage.

**Q: What makes this different from Yahoo Finance?**
A: We focus specifically on event impact analysis with statistical rigor (CAR calculation), personalized filtering, and combining multiple data sources into one actionable view.

**Q: How accurate is the sentiment analysis?**
A: We use TextBlob which provides good baseline accuracy. For production, we'd fine-tune on financial text or use specialized models like FinBERT.

**Q: Can you predict future stock movements?**
A: We don't predict prices - we analyze historical reactions to similar events and show upcoming events so users can make informed decisions.

## Wow Factors to Highlight

1. **Real financial methodology**: Not just sentiment - actual CAR calculation like academic event studies
2. **Multiple data sources**: News + prices + events in one place
3. **Smart filtering**: Only relevant news, not spam
4. **Clean UX**: Professional, responsive design
5. **Demo-ready**: Works without API keys using mock data
6. **Extensible**: Easy to add Google Calendar integration, alerts, etc.

## After Demo

Show the code structure if there's interest:
- Clean separation of concerns
- Well-documented functions
- API documentation at /docs
- Easy to extend with new features

## Time Breakdown

- Intro: 0:00 - 0:30
- Add stocks: 0:30 - 1:00
- News feed: 1:00 - 1:45
- Past events: 1:45 - 2:45
- Upcoming events: 2:45 - 3:15
- Wrap-up: 3:15 - 3:30

Total: ~3.5 minutes (leaves buffer for questions)
