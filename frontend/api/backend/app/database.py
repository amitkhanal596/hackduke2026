from sqlalchemy import create_engine, Column, Integer, String, Float, TIMESTAMP, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(TIMESTAMP, default=datetime.now)

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True)
    company_name = Column(String)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    type = Column(String)
    date = Column(TIMESTAMP)
    meta = Column(JSON)
    car_0_1 = Column(Float)
    volatility_ratio = Column(Float)
    sentiment = Column(String)

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    title = Column(String)
    url = Column(String)
    published_at = Column(TIMESTAMP)
    sentiment = Column(String)
    summary = Column(String)

class Database:
    def __init__(self, database_url: str = None):
        """
        Initialize database connection
        For hackathon MVP, we can use SQLite if PostgreSQL is not set up
        """
        if database_url and "postgresql" in database_url:
            self.engine = create_engine(database_url)
        else:
            # Fallback to SQLite for easy hackathon setup
            self.engine = create_engine("sqlite:///./stocklens.db")

        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def get_session(self):
        """Get database session"""
        return self.SessionLocal()

    def add_stock(self, ticker: str, company_name: str):
        """Add a stock to the database"""
        session = self.get_session()
        try:
            stock = Stock(ticker=ticker, company_name=company_name)
            session.add(stock)
            session.commit()
            return stock
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def add_event(self, ticker: str, event_type: str, date: datetime, car: float, vol_ratio: float, sentiment: str):
        """Add an event to the database"""
        session = self.get_session()
        try:
            event = Event(
                ticker=ticker,
                type=event_type,
                date=date,
                car_0_1=car,
                volatility_ratio=vol_ratio,
                sentiment=sentiment
            )
            session.add(event)
            session.commit()
            return event
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
