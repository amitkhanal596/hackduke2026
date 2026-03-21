import requests
from typing import List, Dict
from datetime import datetime, timedelta
from textblob import TextBlob
import re

class NewsService:
    def __init__(self, news_api_key: str = None, finnhub_api_key: str = None):
        self.news_api_key = news_api_key
        self.finnhub_api_key = finnhub_api_key
        self.news_api_url = "https://newsapi.org/v2/everything"
        self.finnhub_url = "https://finnhub.io/api/v1/company-news"

    async def fetch_news_for_tickers(self, tickers: List[str]) -> List[Dict]:
        """Fetch and analyze news for given tickers"""
        all_articles = []

        for ticker in tickers:
            articles = await self._fetch_ticker_news(ticker)
            all_articles.extend(articles)

        # Sort by published date (newest first)
        all_articles.sort(key=lambda x: x["published_at"], reverse=True)

        return all_articles[:20]  # Return top 20 articles

    async def _fetch_ticker_news(self, ticker: str) -> List[Dict]:
        """Fetch news for a specific ticker"""
        articles = []

        # Try NewsAPI first
        if self.news_api_key and self.news_api_key != "your_newsapi_key_here":
            articles.extend(await self._fetch_from_newsapi(ticker))

        # Fallback to Finnhub
        if self.finnhub_api_key and self.finnhub_api_key != "your_finnhub_key_here":
            articles.extend(await self._fetch_from_finnhub(ticker))

        # If no API keys, return mock data for demo
        if not articles:
            articles = self._generate_mock_news(ticker)

        return articles

    async def _fetch_from_newsapi(self, ticker: str) -> List[Dict]:
        """Fetch news from NewsAPI"""
        try:
            # Get company name from yfinance
            import yfinance as yf
            stock = yf.Ticker(ticker)
            company_name = stock.info.get("longName", ticker)

            params = {
                "q": f"{ticker} OR {company_name}",
                "apiKey": self.news_api_key,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 10,
                "from": (datetime.now() - timedelta(days=7)).isoformat()
            }

            response = requests.get(self.news_api_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            articles = []
            for article in data.get("articles", []):
                analyzed = self._analyze_article(ticker, article)
                if analyzed:
                    articles.append(analyzed)

            return articles
        except Exception as e:
            print(f"NewsAPI error for {ticker}: {e}")
            return []

    async def _fetch_from_finnhub(self, ticker: str) -> List[Dict]:
        """Fetch news from Finnhub"""
        try:
            from_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
            to_date = datetime.now().strftime("%Y-%m-%d")

            params = {
                "symbol": ticker,
                "from": from_date,
                "to": to_date,
                "token": self.finnhub_api_key
            }

            response = requests.get(self.finnhub_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            articles = []
            for item in data[:10]:
                analyzed = self._analyze_finnhub_article(ticker, item)
                if analyzed:
                    articles.append(analyzed)

            return articles
        except Exception as e:
            print(f"Finnhub error for {ticker}: {e}")
            return []

    def _analyze_article(self, ticker: str, article: Dict) -> Dict:
        """Analyze sentiment and summarize article"""
        try:
            title = article.get("title", "")
            description = article.get("description", "") or ""
            content = article.get("content", "") or ""

            # Combine text for analysis
            full_text = f"{title}. {description}"

            # Check if article is actually relevant to the ticker
            if not self._is_relevant_to_ticker(ticker, full_text):
                return None

            # Sentiment analysis using TextBlob
            sentiment = self._get_sentiment(full_text)

            # Generate summary (first 2 sentences)
            summary = self._generate_summary(description or title)

            return {
                "ticker": ticker,
                "title": title,
                "sentiment": sentiment,
                "summary": summary,
                "url": article.get("url", ""),
                "published_at": article.get("publishedAt", datetime.now().isoformat())
            }
        except Exception as e:
            print(f"Error analyzing article: {e}")
            return None

    def _analyze_finnhub_article(self, ticker: str, article: Dict) -> Dict:
        """Analyze Finnhub article"""
        try:
            headline = article.get("headline", "")
            summary_text = article.get("summary", "")

            full_text = f"{headline}. {summary_text}"
            
            # Check if article is actually relevant to the ticker
            if not self._is_relevant_to_ticker(ticker, full_text):
                return None
                
            sentiment = self._get_sentiment(full_text)

            return {
                "ticker": ticker,
                "title": headline,
                "sentiment": sentiment,
                "summary": summary_text[:200] + "..." if len(summary_text) > 200 else summary_text,
                "url": article.get("url", ""),
                "published_at": datetime.fromtimestamp(article.get("datetime", 0)).isoformat()
            }
        except Exception as e:
            print(f"Error analyzing Finnhub article: {e}")
            return None

    def _is_relevant_to_ticker(self, ticker: str, text: str) -> bool:
        """Check if article is actually relevant to the ticker using scoring system"""
        try:
            text_lower = text.lower()
            ticker_lower = ticker.lower()
            relevance_score = 0
            
            # Direct ticker mention (highest priority)
            if ticker_lower in text_lower:
                relevance_score += 10
            
            # Check for common company name variations
            company_variations = self._get_company_variations(ticker)
            for variation in company_variations:
                if variation.lower() in text_lower:
                    relevance_score += 8
                    break  # Only count once for company name
            
            # Check for financial keywords that indicate stock-specific content
            stock_specific_keywords = [
                "earnings", "revenue", "profit", "loss", "stock", "shares", 
                "dividend", "ipo", "merger", "acquisition", "partnership",
                "quarterly", "annual", "guidance", "forecast", "analyst",
                "price target", "upgrade", "downgrade", "rating", "trading",
                "market cap", "valuation", "investor", "shareholder"
            ]
            
            # Count financial keyword mentions
            financial_mentions = sum(1 for keyword in stock_specific_keywords if keyword in text_lower)
            relevance_score += min(financial_mentions * 2, 6)  # Cap at 6 points
            
            # Check for industry-specific terms that might be relevant
            industry_terms = self._get_industry_terms(ticker)
            for term in industry_terms:
                if term.lower() in text_lower:
                    relevance_score += 3
                    break
            
            # Check for competitor mentions (might be relevant)
            competitors = self._get_competitors(ticker)
            for competitor in competitors:
                if competitor.lower() in text_lower:
                    relevance_score += 2
                    break
            
            # Minimum threshold for relevance
            return relevance_score >= 5
            
        except Exception as e:
            print(f"Error checking relevance for {ticker}: {e}")
            return True  # Default to including if we can't determine relevance

    def _get_industry_terms(self, ticker: str) -> List[str]:
        """Get industry-specific terms for a ticker"""
        industry_mappings = {
            "AAPL": ["smartphone", "iphone", "ipad", "mac", "ios", "app store", "services"],
            "MSFT": ["software", "cloud", "azure", "office", "windows", "enterprise"],
            "GOOGL": ["search", "advertising", "youtube", "android", "cloud", "ai"],
            "AMZN": ["e-commerce", "aws", "retail", "logistics", "prime", "marketplace"],
            "TSLA": ["electric vehicle", "ev", "autonomous", "battery", "solar", "energy"],
            "META": ["social media", "facebook", "instagram", "whatsapp", "vr", "metaverse"],
            "NVDA": ["gpu", "ai", "gaming", "data center", "cuda", "machine learning"],
            "NFLX": ["streaming", "entertainment", "content", "subscription", "movies"],
            "AMD": ["processor", "cpu", "gpu", "semiconductor", "gaming", "data center"],
            "INTC": ["processor", "cpu", "semiconductor", "manufacturing", "foundry"],
            "CRM": ["crm", "sales", "customer", "enterprise", "saas", "cloud"],
            "ORCL": ["database", "enterprise", "cloud", "software", "erp"],
            "IBM": ["enterprise", "cloud", "ai", "consulting", "mainframe", "watson"],
            "CSCO": ["networking", "infrastructure", "security", "routing", "switching"],
            "ADBE": ["creative", "design", "photoshop", "pdf", "document", "marketing"],
            "PYPL": ["payment", "fintech", "digital wallet", "venmo", "online payment"],
            "UBER": ["ride-sharing", "transportation", "mobility", "delivery", "logistics"],
            "LYFT": ["ride-sharing", "transportation", "mobility", "sharing economy"],
            "SNAP": ["social media", "snapchat", "camera", "messaging", "ar"],
            "TWTR": ["twitter", "social media", "microblogging", "news", "x"],
            "SQ": ["payment", "fintech", "point of sale", "pos", "block"],
            "ROKU": ["streaming", "tv", "entertainment", "device", "platform"],
            "ZM": ["video conferencing", "remote work", "communication", "meeting"],
            "DOCU": ["document", "signature", "agreement", "workflow", "digital"],
            "SNOW": ["data warehouse", "analytics", "cloud", "database", "snowflake"],
            "PLTR": ["data analytics", "government", "defense", "intelligence", "palantir"],
            "COIN": ["cryptocurrency", "bitcoin", "crypto", "trading", "exchange"],
            "HOOD": ["trading", "brokerage", "commission", "retail investor", "robinhood"],
            "SPOT": ["music", "streaming", "podcast", "entertainment", "subscription"],
            "PINS": ["pinterest", "visual", "shopping", "inspiration", "social"],
            "SHOP": ["e-commerce", "online store", "retail", "merchant", "shopify"],
            "OKTA": ["identity", "authentication", "security", "sso", "cybersecurity"],
            "CRWD": ["cybersecurity", "endpoint", "security", "threat", "crowdstrike"],
            "ZS": ["cybersecurity", "zero trust", "security", "zscaler", "cloud"],
            "NET": ["cloudflare", "cdn", "security", "performance", "infrastructure"],
            "DDOG": ["monitoring", "observability", "devops", "apm", "datadog"],
            "MDB": ["database", "nosql", "document", "mongodb", "developer"],
            "ESTC": ["search", "elasticsearch", "analytics", "logging", "elastic"],
            "SPLK": ["splunk", "log analysis", "security", "monitoring", "data"],
            "WDAY": ["hr", "workday", "human resources", "payroll", "hcm"],
            "NOW": ["servicenow", "it service", "workflow", "automation", "platform"],
            "TEAM": ["atlassian", "jira", "confluence", "collaboration", "devops"],
            "PTON": ["peloton", "fitness", "exercise", "bike", "subscription"],
            "ABNB": ["airbnb", "travel", "accommodation", "sharing economy", "tourism"],
            "DASH": ["doordash", "food delivery", "restaurant", "logistics", "delivery"]
        }
        
        return industry_mappings.get(ticker.upper(), [])

    def _get_competitors(self, ticker: str) -> List[str]:
        """Get competitor companies for a ticker"""
        competitor_mappings = {
            "AAPL": ["Samsung", "Google", "Microsoft", "Amazon"],
            "MSFT": ["Google", "Amazon", "Oracle", "Salesforce"],
            "GOOGL": ["Microsoft", "Amazon", "Apple", "Meta"],
            "AMZN": ["Walmart", "Target", "eBay", "Shopify"],
            "TSLA": ["Ford", "GM", "BMW", "Mercedes", "Toyota"],
            "META": ["Google", "TikTok", "Snapchat", "Twitter"],
            "NVDA": ["AMD", "Intel", "Qualcomm"],
            "NFLX": ["Disney", "Hulu", "Amazon Prime", "HBO"],
            "AMD": ["Intel", "NVIDIA", "Qualcomm"],
            "INTC": ["AMD", "NVIDIA", "Qualcomm", "TSMC"],
            "CRM": ["Microsoft", "Oracle", "Salesforce", "HubSpot"],
            "ORCL": ["Microsoft", "Amazon", "Google", "IBM"],
            "IBM": ["Microsoft", "Amazon", "Google", "Oracle"],
            "CSCO": ["Juniper", "Arista", "HPE", "Fortinet"],
            "ADBE": ["Microsoft", "Canva", "Figma", "Sketch"],
            "PYPL": ["Square", "Stripe", "Apple Pay", "Google Pay"],
            "UBER": ["Lyft", "DoorDash", "Grab", "Bolt"],
            "LYFT": ["Uber", "DoorDash", "Grab", "Bolt"],
            "SNAP": ["TikTok", "Instagram", "Facebook", "Twitter"],
            "TWTR": ["Facebook", "LinkedIn", "TikTok", "Mastodon"],
            "SQ": ["PayPal", "Stripe", "Square", "Block"],
            "ROKU": ["Apple TV", "Fire TV", "Chromecast", "Smart TV"],
            "ZM": ["Microsoft Teams", "Google Meet", "Skype", "Webex"],
            "DOCU": ["Adobe", "PandaDoc", "HelloSign", "SignNow"],
            "SNOW": ["Amazon Redshift", "Google BigQuery", "Databricks", "Teradata"],
            "PLTR": ["Palantir", "Splunk", "Tableau", "Qlik"],
            "COIN": ["Binance", "Kraken", "Gemini", "FTX"],
            "HOOD": ["E*TRADE", "TD Ameritrade", "Fidelity", "Schwab"],
            "SPOT": ["Apple Music", "Amazon Music", "YouTube Music", "Pandora"],
            "PINS": ["Instagram", "TikTok", "Facebook", "Tumblr"],
            "SHOP": ["WooCommerce", "BigCommerce", "Magento", "Squarespace"],
            "OKTA": ["Microsoft", "Google", "Auth0", "Ping Identity"],
            "CRWD": ["Symantec", "McAfee", "Palo Alto", "FireEye"],
            "ZS": ["Palo Alto", "Fortinet", "Check Point", "Cisco"],
            "NET": ["Cloudflare", "AWS", "Google Cloud", "Azure"],
            "DDOG": ["New Relic", "AppDynamics", "Splunk", "DataDog"],
            "MDB": ["PostgreSQL", "MySQL", "Redis", "Cassandra"],
            "ESTC": ["Splunk", "Logstash", "Kibana", "ELK"],
            "SPLK": ["Elastic", "Datadog", "New Relic", "Splunk"],
            "WDAY": ["SAP", "Oracle", "Workday", "BambooHR"],
            "NOW": ["ServiceNow", "Jira", "Cherwell", "BMC"],
            "TEAM": ["Microsoft", "Slack", "Asana", "Monday.com"],
            "PTON": ["Peloton", "Nike", "Apple Fitness", "Mirror"],
            "ABNB": ["Booking.com", "Expedia", "VRBO", "TripAdvisor"],
            "DASH": ["Uber Eats", "Grubhub", "Postmates", "DoorDash"]
        }
        
        return competitor_mappings.get(ticker.upper(), [])

    def _get_company_variations(self, ticker: str) -> List[str]:
        """Get common variations of company names for a ticker"""
        # Common ticker to company name mappings
        ticker_mappings = {
            "AAPL": ["Apple", "Apple Inc", "Apple Computer"],
            "MSFT": ["Microsoft", "Microsoft Corporation"],
            "GOOGL": ["Google", "Alphabet", "Google Inc"],
            "GOOG": ["Google", "Alphabet", "Google Inc"],
            "AMZN": ["Amazon", "Amazon.com", "Amazon Inc"],
            "TSLA": ["Tesla", "Tesla Motors", "Tesla Inc"],
            "META": ["Meta", "Facebook", "Meta Platforms"],
            "NVDA": ["NVIDIA", "Nvidia Corporation"],
            "NFLX": ["Netflix", "Netflix Inc"],
            "AMD": ["Advanced Micro Devices", "AMD Inc"],
            "INTC": ["Intel", "Intel Corporation"],
            "CRM": ["Salesforce", "Salesforce.com"],
            "ORCL": ["Oracle", "Oracle Corporation"],
            "IBM": ["IBM", "International Business Machines"],
            "CSCO": ["Cisco", "Cisco Systems"],
            "ADBE": ["Adobe", "Adobe Inc", "Adobe Systems"],
            "PYPL": ["PayPal", "PayPal Holdings"],
            "UBER": ["Uber", "Uber Technologies"],
            "LYFT": ["Lyft", "Lyft Inc"],
            "SNAP": ["Snapchat", "Snap Inc"],
            "TWTR": ["Twitter", "X Corp"],
            "SQ": ["Square", "Block Inc"],
            "ROKU": ["Roku", "Roku Inc"],
            "ZM": ["Zoom", "Zoom Video Communications"],
            "DOCU": ["DocuSign", "DocuSign Inc"],
            "SNOW": ["Snowflake", "Snowflake Inc"],
            "PLTR": ["Palantir", "Palantir Technologies"],
            "COIN": ["Coinbase", "Coinbase Global"],
            "HOOD": ["Robinhood", "Robinhood Markets"],
            "SPOT": ["Spotify", "Spotify Technology"],
            "PINS": ["Pinterest", "Pinterest Inc"],
            "SHOP": ["Shopify", "Shopify Inc"],
            "OKTA": ["Okta", "Okta Inc"],
            "CRWD": ["CrowdStrike", "CrowdStrike Holdings"],
            "ZS": ["Zscaler", "Zscaler Inc"],
            "NET": ["Cloudflare", "Cloudflare Inc"],
            "DDOG": ["Datadog", "Datadog Inc"],
            "MDB": ["MongoDB", "MongoDB Inc"],
            "ESTC": ["Elastic", "Elastic N.V."],
            "SPLK": ["Splunk", "Splunk Inc"],
            "WDAY": ["Workday", "Workday Inc"],
            "NOW": ["ServiceNow", "ServiceNow Inc"],
            "TEAM": ["Atlassian", "Atlassian Corporation"],
            "ZM": ["Zoom", "Zoom Video Communications"],
            "PTON": ["Peloton", "Peloton Interactive"],
            "ABNB": ["Airbnb", "Airbnb Inc"],
            "DASH": ["DoorDash", "DoorDash Inc"],
            "UBER": ["Uber", "Uber Technologies"],
            "LYFT": ["Lyft", "Lyft Inc"]
        }
        
        return ticker_mappings.get(ticker.upper(), [ticker])

    def _get_sentiment(self, text: str) -> str:
        """Determine sentiment using TextBlob"""
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity

            if polarity > 0.1:
                return "positive"
            elif polarity < -0.1:
                return "negative"
            else:
                return "neutral"
        except:
            return "neutral"

    def _generate_summary(self, text: str) -> str:
        """Generate a brief summary (first 2-3 sentences)"""
        if not text:
            return "No summary available"

        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        summary_sentences = [s.strip() for s in sentences[:2] if s.strip()]

        summary = ". ".join(summary_sentences)
        if summary and not summary.endswith('.'):
            summary += "."

        return summary[:250] + "..." if len(summary) > 250 else summary

    def _generate_mock_news(self, ticker: str) -> List[Dict]:
        """Generate mock news data for demo purposes"""
        # Get company name for more realistic mock data
        company_name = self._get_company_variations(ticker)[0] if self._get_company_variations(ticker) else ticker
        
        return [
            {
                "ticker": ticker,
                "title": f"{company_name} Shows Strong Performance in Q4 Earnings",
                "sentiment": "positive",
                "summary": f"{company_name} reported better-than-expected earnings, driving investor confidence.",
                "url": "https://example.com",
                "published_at": (datetime.now() - timedelta(days=1)).isoformat()
            },
            {
                "ticker": ticker,
                "title": f"Market Volatility Affects {company_name} Trading",
                "sentiment": "neutral",
                "summary": f"{company_name} experienced increased volatility amid broader market concerns.",
                "url": "https://example.com",
                "published_at": (datetime.now() - timedelta(days=2)).isoformat()
            }
        ]
