"""
Centralized cache manager for stock data with TTL support.
Reduces API calls by caching price, chart, and historical data.
"""

from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional, Any
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """In-memory cache with TTL support for stock market data."""

    def __init__(self):
        # cache_store: {key: (data, timestamp)}
        self._cache: Dict[str, Tuple[Any, datetime]] = {}
        # TTL configurations in seconds
        self._ttl_config = {
            'price': 3600,      # 1 hour for price data
            'chart_1d': 3600,   # 1 hour for 1-day charts
            'chart_1w': 14400,  # 4 hours for 1-week charts
            'chart_1m': 86400,  # 24 hours for 1-month charts
            'historical': 86400 # 24 hours for historical data
        }
        self._cache_hits = 0
        self._cache_misses = 0

    def get(self, key: str) -> Optional[Any]:
        """Get cached data if it exists and hasn't expired."""
        if key not in self._cache:
            self._cache_misses += 1
            logger.debug(f"Cache miss: {key}")
            return None

        data, timestamp = self._cache[key]

        # Check if expired
        if self._is_expired(key, timestamp):
            logger.debug(f"Cache expired: {key}")
            del self._cache[key]
            self._cache_misses += 1
            return None

        self._cache_hits += 1
        logger.debug(f"Cache hit: {key} (age: {(datetime.now() - timestamp).seconds}s)")
        return data

    def set(self, key: str, data: Any, cache_type: str = 'price'):
        """Store data in cache with timestamp."""
        if cache_type not in self._ttl_config:
            logger.warning(f"Unknown cache type: {cache_type}, using default 'price'")
            cache_type = 'price'

        self._cache[key] = (data, datetime.now())
        logger.debug(f"Cache set: {key} (type: {cache_type}, TTL: {self._ttl_config[cache_type]}s)")

    def _is_expired(self, key: str, timestamp: datetime) -> bool:
        """Check if cached data has expired based on key type."""
        # Determine cache type from key prefix
        cache_type = 'price'  # default
        if key.startswith('chart_'):
            # Extract period from key (e.g., "chart_AAPL_1w" -> "1w")
            parts = key.split('_')
            if len(parts) >= 3:
                period = parts[2]
                cache_type = f'chart_{period}'
        elif key.startswith('historical_'):
            cache_type = 'historical'

        ttl_seconds = self._ttl_config.get(cache_type, 3600)
        age = (datetime.now() - timestamp).total_seconds()
        return age > ttl_seconds

    def clear(self, key: str = None):
        """Clear specific key or entire cache."""
        if key:
            if key in self._cache:
                del self._cache[key]
                logger.info(f"Cache cleared: {key}")
        else:
            self._cache.clear()
            logger.info("Entire cache cleared")

    def clear_ticker(self, ticker: str):
        """Clear all cached data for a specific ticker."""
        keys_to_delete = [k for k in self._cache.keys() if ticker.upper() in k]
        for key in keys_to_delete:
            del self._cache[key]
        logger.info(f"Cleared {len(keys_to_delete)} cache entries for {ticker}")

    def get_stats(self) -> dict:
        """Get cache statistics."""
        total_requests = self._cache_hits + self._cache_misses
        hit_rate = (self._cache_hits / total_requests * 100) if total_requests > 0 else 0

        return {
            'total_entries': len(self._cache),
            'cache_hits': self._cache_hits,
            'cache_misses': self._cache_misses,
            'hit_rate': f"{hit_rate:.1f}%",
            'entries': list(self._cache.keys())
        }

    def cleanup_expired(self):
        """Remove all expired entries from cache."""
        expired_keys = []
        for key, (data, timestamp) in self._cache.items():
            if self._is_expired(key, timestamp):
                expired_keys.append(key)

        for key in expired_keys:
            del self._cache[key]

        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")


# Global cache instance
cache = CacheManager()
