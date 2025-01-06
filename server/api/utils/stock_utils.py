from datetime import datetime, timedelta, timezone

import yfinance as yf


def fetch_stock_data(symbol, period):
    try:
        stock = yf.Ticker(symbol)
        stock_info = stock.info
        sector = stock_info["sector"]
        if period == "today":
            # Use UTC timezone to avoid date mismatch
            now_utc = datetime.now(timezone.utc)
            start_date = now_utc - timedelta(days=2)  # Fetch last 2 days
            end_date = now_utc + timedelta(days=1)  # Include today's data

            # Fetch historical data
            data = stock.history(start=start_date, end=end_date)

            if data.empty:
                return {"error": "No data available for the recent trading days"}, 404

            # Extract the most recent available entry
            most_recent_data = data.iloc[-1].to_dict()
            return {"symbol": symbol, "period": period, "data": most_recent_data}, 200

        elif period == "now":
            latest_price = stock.history(period="1d")["Close"].iloc[-1]
            return {
                "symbol": symbol,
                "period": period,
                "data": latest_price,
                "sector": sector,
            }, 200

        else:
            # Fetch data for the specified period
            data = stock.history(period=period)

            if not data.empty:
                result = data.reset_index().to_dict(orient="records")
                return {"symbol": symbol, "period": period, "data": result}, 200
            else:
                return {"error": "No data available for the given period"}, 404

    except Exception as e:
        return {"error": str(e)}, 500

