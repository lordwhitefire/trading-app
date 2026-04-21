import os
import requests
from datetime import datetime, timedelta
import pandas as pd

# Retrieve API key from environment variable
SOSOVALUE_API_KEY = os.getenv("SOSOVALUE_API_KEY")

def fetch_ohlcv(coin, timeframe, start_date, end_date):
    """
    Fetches historical OHLCV data from SoSoValue API.
    
    :param coin: str, the cryptocurrency symbol (e.g., 'BTC')
    :param timeframe: str, the timeframe for the candles (e.g., '1h', '4h')
    :param start_date: datetime, the start date of the data
    :param end_date: datetime, the end date of the data
    :return: pandas DataFrame with columns: timestamp, open, high, low, close, volume
    """
    url = "https://api.sosovalue.com/v1/ohlcv"
    params = {
        "symbol": coin,
        "interval": timeframe,
        "start_time": start_date.isoformat(),
        "end_time": end_date.isoformat()
    }
    
    try:
        response = requests.get(url, headers={"Authorization": f"Bearer {SOSOVALUE_API_KEY}"}, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Add extra 200 candles before start_date for indicator seeding
        extra_start_date = start_date - timedelta(days=1)
        extra_params = {
            "symbol": coin,
            "interval": timeframe,
            "start_time": extra_start_date.isoformat(),
            "end_time": start_date.isoformat()
        }
        extra_response = requests.get(url, headers={"Authorization": f"Bearer {SOSOVALUE_API_KEY}"}, params=extra_params)
        extra_response.raise_for_status()
        extra_data = extra_response.json()
        
        # Combine data
        all_data = extra_data + data
        
        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching OHLCV data: {e}")
        return None

def fetch_live_price(coin):
    """
    Fetches the current price of a coin from SoSoValue API.
    
    :param coin: str, the cryptocurrency symbol (e.g., 'BTC')
    :return: float or None
    """
    url = "https://api.sosovalue.com/v1/ticker"
    params = {
        "symbol": coin
    }
    
    try:
        response = requests.get(url, headers={"Authorization": f"Bearer {SOSOVALUE_API_KEY}"}, params=params)
        response.raise_for_status()
        data = response.json()
        return float(data['last_price'])
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching live price: {e}")
        return None

def fetch_news(coin):
    """
    Fetches latest news articles for a coin from SoSoValue API.
    
    :param coin: str, the cryptocurrency symbol (e.g., 'BTC')
    :return: list of dict or None
    """
    url = "https://api.sosovalue.com/v1/news"
    params = {
        "symbol": coin
    }
    
    try:
        response = requests.get(url, headers={"Authorization": f"Bearer {SOSOVALUE_API_KEY}"}, params=params)
        response.raise_for_status()
        data = response.json()
        return data['articles']
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching news: {e}")
        return None

def fetch_etf_data():
    """
    Fetches ETF inflow/outflow data from SoSoValue API.
    
    :return: pandas DataFrame or None
    """
    url = "https://api.sosovalue.com/v1/etf"
    
    try:
        response = requests.get(url, headers={"Authorization": f"Bearer {SOSOVALUE_API_KEY}"})
        response.raise_for_status()
        data = response.json()
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        return df
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching ETF data: {e}")
        return None
