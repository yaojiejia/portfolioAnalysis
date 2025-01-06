import os
import jwt
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET")

def validate_jwt(request):
    print("\n=== JWT Validation Start ===")
    
    try:
        auth_header = request.headers.get('Authorization')
        print(f"Auth header: {auth_header}")
        
        if not auth_header or 'Bearer' not in auth_header:
            print("Invalid or missing Authorization header")
            return None, 401
            
        token = auth_header.split(' ')[1]
        print(f"Token to validate: {token[:20]}...")
        
        try:
            # First try to decode without verification to see the payload
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            print(f"Unverified payload: {unverified_payload}")
            
            # Now decode with verification
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=['HS256'],
                options={"verify_exp": False}  # Temporarily disable expiration check
            )
            print(f"Verified payload: {payload}")
            
            user_id = payload.get('user_id')
            if not user_id:
                print("No user_id in payload")
                return None, 401
                
            print(f"Successfully validated token for user_id: {user_id}")
            return user_id, None
            
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            return None, 401
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {str(e)}")
            return None, 401
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return None, 500