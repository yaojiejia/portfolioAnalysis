import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy.optimize import minimize

# -------------------------
# Step 1: Load Asset Data
# -------------------------
def load_data(tickers, start_date, end_date):
    """
    Fetches adjusted closing prices for given tickers from Yahoo Finance.
    """
    data = yf.download(tickers, start=start_date, end=end_date)['Close']
    data = data.dropna()
    return data

# --------------------------------------------------------
# Step 2: Calculate Expected Returns and Covariance Matrix
# --------------------------------------------------------
def calculate_returns(data):
    """
    Calculates daily returns, expected annual returns, and annual covariance matrix.
    """
    daily_returns = data.pct_change().dropna()
    mean_daily_returns = daily_returns.mean()
    cov_matrix = daily_returns.cov()
    # Annualize the returns and covariance
    annual_returns = mean_daily_returns * 252
    annual_cov_matrix = cov_matrix * 252
    return annual_returns, annual_cov_matrix

# -----------------------------------------
# Step 3: Portfolio Performance Metrics
# -----------------------------------------
def portfolio_performance(weights, returns, cov_matrix):
    """
    Calculates portfolio return and volatility.
    """
    portfolio_return = np.dot(weights, returns)
    portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    return portfolio_return, portfolio_volatility

# -----------------------------------------
# Step 4: Optimization Objective Functions
# -----------------------------------------
def negative_sharpe_ratio(weights, returns, cov_matrix, risk_free_rate=0.0):
    """
    Returns the negative Sharpe ratio of the portfolio.
    """
    p_return, p_volatility = portfolio_performance(weights, returns, cov_matrix)
    if p_volatility == 0:
        return np.inf  # Avoid division by zero
    return -(p_return - risk_free_rate) / p_volatility

def portfolio_variance(weights, cov_matrix):
    """
    Returns the portfolio variance.
    """
    return np.dot(weights.T, np.dot(cov_matrix, weights))

def portfolio_volatility(weights, cov_matrix):
    """
    Returns the portfolio volatility (std dev).
    """
    return np.sqrt(portfolio_variance(weights, cov_matrix))

# -----------------------------------------
# Step 5: Unified Optimization Function
# -----------------------------------------
def optimize_portfolio(returns, 
                       cov_matrix, 
                       risk_free_rate=0.0, 
                       target_return=None,
                       method='sharpe'):
    """
    Optimizes the portfolio based on the chosen `method`:
      - 'sharpe': Maximize Sharpe ratio subject to target_return >= ...
      - 'min_volatility': Minimize volatility subject to target_return >= ...
      
    If `target_return` is specified, adds a constraint that the portfolio 
    return must be at least `target_return`.
    """
    num_assets = len(returns)
    args_sharpe = (returns, cov_matrix, risk_free_rate)
    args_vol = (cov_matrix,)

    # Constraints: sum of weights = 1
    constraints = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]
    
    # If user specified a target return, then add "portfolio_return >= target_return"
    if target_return is not None:
        constraints.append({'type': 'ineq', 
                            'fun': lambda x: np.dot(x, returns) - target_return})

    bounds = tuple((0, 1) for _ in range(num_assets))  # Each weight between 0 and 1
    initial_guess = num_assets * [1. / num_assets,]

    if method == 'sharpe':
        # Maximize Sharpe ratio  => minimize negative Sharpe ratio
        result = minimize(negative_sharpe_ratio, 
                          initial_guess,
                          args=args_sharpe,
                          method='SLSQP', 
                          bounds=bounds, 
                          constraints=constraints)
    elif method == 'min_volatility':
        # Minimize portfolio volatility subject to constraints
        result = minimize(portfolio_volatility, 
                          initial_guess,
                          args=args_vol,
                          method='SLSQP', 
                          bounds=bounds, 
                          constraints=constraints)
    else:
        raise ValueError("Method must be either 'sharpe' or 'min_volatility'.")

    return result

# -----------------------------------------
# Step 6: Portfolio Optimization Function
# -----------------------------------------
def run_portfolio_optimization(tickers, start_date, end_date, target_return, method_choice):
    """
    Executes the portfolio optimization process and returns the results.
    
    Parameters:
    - tickers: List of asset tickers.
    - start_date: Start date for data fetching.
    - end_date: End date for data fetching.
    - target_return: Expected annual return (in decimal).
    - method_choice: Optimization method ('sharpe' or 'min_volatility').
    
    Returns:
    - A dictionary with stock symbols as keys and their weights as values,
      along with expected annual return, annual volatility, and Sharpe ratio.
    """
    # Load data
    data = load_data(tickers, start_date, end_date)

    # Check if data is sufficient
    if data.empty:
        return {"error": "No data fetched. Please check the tickers and date range."}

    # Calculate returns and covariance
    returns, cov_matrix = calculate_returns(data)

    # **Select Top 30 Stocks Based on Expected Annual Returns**
    selection_pool = 90  # Number of top stocks to consider for selection
    selected_pool_returns = returns.sort_values(ascending=False).head(selection_pool)
    selected_pool_tickers = selected_pool_returns.index.tolist()

    # **Attempt to Select 15 Stocks from the Pool**
    top15_returns = selected_pool_returns.head(90)
    top15_tickers = top15_returns.index.tolist()

    # Filter the returns and covariance matrix
    selected_returns = returns[top15_tickers]
    selected_cov_matrix = cov_matrix.loc[top15_tickers, top15_tickers]

    # Optimize portfolio with chosen method and target return
    optimal = optimize_portfolio(
        selected_returns, 
        selected_cov_matrix, 
        target_return=target_return,
        method=method_choice
    )

    # Prepare results
    result = {
        "weights": {ticker: float(weight) for ticker, weight in zip(top15_tickers, optimal.x) if weight > 0.00},
        # Sort the weights dictionary by value in descending order
        "weights": dict(sorted({ticker: float(weight) for ticker, weight in zip(top15_tickers, optimal.x) if weight > 0.00}.items(), key=lambda item: item[1], reverse=True)),
        "expected_annual_return": None,
        "annual_volatility": None,
        "sharpe_ratio": None
    }

    # Check optimization results
    if optimal.success:
        result["expected_annual_return"], result["annual_volatility"] = portfolio_performance(optimal.x, selected_returns, selected_cov_matrix)
        if result["annual_volatility"] != 0:
            result["sharpe_ratio"] = (result["expected_annual_return"]) / result["annual_volatility"]
    else:
        result["error"] = "Optimization failed."

    return result

# -----------------------------------------
# Step 7: Main Function to Execute the MPT
# -----------------------------------------
def main():
    # Define asset tickers and time period
    tickers = [
        "AAPL", "ABNB", "ADBE", "ADI", "ADP", "ADSK", "AEP", "AMAT", "AMD", "AMGN", 
        "AMZN", "ANSS", "APP", "ASML", "AVGO", "AXON", "AZN", "BKR", "CDNS", 
        "CEG", "CHTR", "CMCSA", "CSGP", "CSX", "CTAS", "CTSH", "DDOG", "DLTR", "DXCM", 
        "EA", "EBAY", "EXC", "FAST", "FANG", "FTNT", "GFS", "GILD", "HON", "IDXX", 
        "ILMN", "INTC", "INTU", "ISRG", "JD", "KDP", "KLAC", "LCID", "LRCX", "MAR", 
        "MCHP", "MDLZ", "MELI", "META", "MNST", "MRVL", "MSFT", "MU", "NFLX", "NTES", 
        "NVDA", "NXPI", "ORLY", "PANW", "PCAR", "PDD", "PEP", "PYPL", "QCOM", "REGN", 
        "ROST", "SBUX", "SNPS", "SWKS", "TEAM", "TMUS", "TSLA", "TTD", "TTWO", 
        "TXN", "VRSK", "VRTX", "WBD", "WDAY", "XEL", "ZS"
    ]
    start_date = '2020-01-01'
    end_date = '2024-12-30'

    

    # Call the new function
    results = run_portfolio_optimization(tickers, start_date, end_date, 0.04, 'sharpe')
    print(results)

if __name__ == "__main__":
    main()