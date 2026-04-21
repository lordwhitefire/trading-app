import os
import requests
import pandas as pd
from datetime import datetime, timedelta

SOSOVALUE_API_KEY = os.getenv('SOSOVALUE_API_KEY')
BASE_URL = "https://api.sosovalue.com"

def fetch_ohlcv(coin: str, timeframe: str, start_date: datetime, end_date: datetime) -> pd.DataFrame:
    seed_start = start_date - timedelta(days=200)
    url = f"{BASE_URL}/ohlcv/{coin}/{timeframe}"
    params = {
        'start_date': seed_start.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d')
    }
    headers = {'Authorization': f'Bearer {SOSOVALUE_API_KEY}'}
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        df = pd.DataFrame(data['data'])
        df.columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch OHLCV data: {e}")

def fetch_live_price(coin: str) -> float:
    url = f"{BASE_URL}/live_price/{coin}"
    headers = {'Authorization': f'Bearer {SOSOVALUE_API_KEY}'}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()['price']
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch live price: {e}")

def fetch_news(coin: str) -> list:
    url = f"{BASE_URL}/news/{coin}"
    headers = {'Authorization': f'Bearer {SOSOVALUE_API_KEY}'}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()['articles']
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch news: {e}")

def fetch_etf_data() -> dict:
    url = f"{BASE_URL}/etf_data"
    headers = {'Authorization': f'Bearer {SOSOVALUE_API_KEY}'}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch ETF data: {e}")
