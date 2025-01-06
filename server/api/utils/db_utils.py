import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

def get_transaction_history(user_id):
    if not user_id:
        raise ValueError("User ID is required")
        
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM portfolios WHERE user_id = %s", 
                (user_id,)
            )
            transactions = cursor.fetchall()
            return transactions
            
    except pymysql.Error as e:
        print(f"Database error: {str(e)}")
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise
    finally:
        if connection:
            connection.close()