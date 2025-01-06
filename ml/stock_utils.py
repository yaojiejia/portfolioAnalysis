import yfinance as yf
import pandas as pd
import numpy as np


def get_stock_data(ticker, start_date, end_date):
    data = yf.download(ticker, start=start_date, end=end_date)
    data = data.dropna()
    return data



def calculate_variance(ticker, start_date, end_date):
    stock_data = get_stock_data(ticker, start_date, end_date)
    stock_data['Close'].pct_change()
    stock_data = stock_data.dropna()
    return stock_data['Close'].var()


def calculate_covariance(tickers, start_date, end_date):
    data = {}  

    for ticker in tickers:
        
        stock_data = get_stock_data(ticker, start_date, end_date)['Close'][ticker].pct_change().dropna()
        
        if ticker not in data:
            data[ticker] = []
        
        
        for ret in stock_data:
            data[ticker].append(ret)
            
        
    df = pd.DataFrame(data)

    return df.cov()


print(calculate_covariance(["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META"], "2024-01-01", "2024-03-01"))
