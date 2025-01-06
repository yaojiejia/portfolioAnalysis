import os
from datetime import datetime, timedelta, timezone

import pymysql
import yfinance as yf
from dotenv import load_dotenv
from rest_framework.response import Response
from rest_framework.views import APIView

from api.utils.jwt_utils import validate_jwt
from api.utils.stock_utils import fetch_stock_data
from api.utils.db_utils import get_transaction_history
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}


class StockAPI(APIView):
    def get(self, request, format=None):
        symbol = request.query_params.get("symbol", None)
        period = request.query_params.get("period", "now")  # Default to "today"

        if not symbol:
            return Response({"error": "Stock symbol is required"}, status=400)

        result, status = fetch_stock_data(symbol, period)
        return Response(result, status=status)


class ModifyDBAPI(APIView):
    def post(self, request):
        # Get data from request.data instead of query_params for POST requests
        data = request.data
        action = data.get("action")
        symbol = data.get("symbol")
        shares = data.get("shares")

        user_id, status = validate_jwt(request)
        
        if not user_id:  # Check for user_id instead of status
            return Response({"error": "error verifying the user"}, status=401)
        
        stock_data, status = fetch_stock_data(symbol, "now")
        if status != 200:
            return Response({"error": "error fetching the stock info"}, status=status)
        
        current_price = stock_data["data"]
        sector = stock_data["sector"]
        
        if action not in ["buy", "sell"]:  
            return Response({"error": "invalid actions"}, status=422)

        if action == "buy":
            try:
                connection = pymysql.connect(**DB_CONFIG)
                with connection.cursor() as cursor:
                    # Fixed query to properly handle existing shares check
                    cursor.execute(
                        "SELECT shares FROM portfolios WHERE user_id = %s AND symbol = %s",
                        (user_id, symbol),
                    )
                    result = cursor.fetchone()
                    
                    if result:  # Stock exists in portfolio
                        cursor.execute(
                            "UPDATE portfolios SET shares = shares + %s, bought_price = %s, total_value = total_value + %s WHERE user_id = %s AND symbol = %s",
                            (shares, current_price, float(current_price)*float(shares), user_id, symbol)
                        )
                    else:  # New stock entry
                        cursor.execute(
                            "INSERT INTO portfolios (user_id, symbol, sector, bought_price, shares, created_at, total_value) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                            (user_id, symbol, sector, current_price, shares, datetime.now(), float(current_price)*float(shares))
                        )

                    connection.commit()
                    return Response({"message": "Transaction successful"}, status=200)
            except Exception as e:
                return Response({"error": str(e)}, status=500)
            finally:
                connection.close()
        else:  # sell action
            try:
                connection = pymysql.connect(**DB_CONFIG)
                with connection.cursor() as cursor:
                    # First check if user has enough shares
                    cursor.execute(
                        "SELECT shares FROM portfolios WHERE user_id = %s AND symbol = %s",
                        (user_id, symbol)
                    )
                    result = cursor.fetchone()
                    
                    if not result:
                        return Response({"error": "No shares found for this stock"}, status=400)
                        
                    current_shares = result[0]
                    if current_shares < int(shares):
                        return Response({"error": "Not enough shares to sell"}, status=400)
                    
                    # Update the portfolio
                    cursor.execute(
                        "UPDATE portfolios SET shares = shares - %s, total_value = total_value - %s WHERE user_id = %s AND symbol = %s",
                        (shares, float(current_price)*float(shares), user_id, symbol)
                    )
                    
                    connection.commit()
                    return Response({"message": "Transaction successful"}, status=200)
            except Exception as e:
                return Response({"error": str(e)}, status=500)
            finally:
                connection.close()
        
    def get(self, request):
        # Validate the JWT and retrieve the user ID
        symbol = request.query_params.get("symbol")
        user_id, error = validate_jwt(request)
        if error:
            return Response({"error": error}, status=401)
        stock_data, _ = fetch_stock_data(symbol, "now")
        data = stock_data["data"]
        return Response({"data": data}, status=200)


class SearchDBAPI(APIView):
    def get(self, request):
        # Debug logging
        print("\n=== Transaction Request Debug ===")
        print("Headers:", dict(request.headers))
        print("Authorization:", request.headers.get('Authorization'))
        
        # Validate JWT and get user_id
        user_id, error = validate_jwt(request)
        
        print("JWT Validation Result:")
        print(f"User ID: {user_id}")
        print(f"Error: {error}")
        
        if error:
            return Response(
                {"error": "Authentication failed", "details": "Invalid or expired token"}, 
                status=401
            )
        
        if not user_id:
            return Response(
                {"error": "Authentication failed", "details": "User ID not found in token"}, 
                status=401
            )

        try:
            transactions = get_transaction_history(user_id)
            print(f"Retrieved {len(transactions)} transactions")
            return Response({"transactions": transactions}, status=200)
        except Exception as e:
            print(f"Error fetching transactions: {str(e)}")
            return Response(
                {"error": "Failed to fetch transactions", "details": str(e)}, 
                status=500
            )
        
