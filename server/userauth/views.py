import json
import os
from datetime import datetime, timedelta

import jwt
import pymysql
from django.contrib.auth.hashers import check_password, make_password
from django.http import JsonResponse
from django.views import View
from dotenv import load_dotenv
from rest_framework.views import APIView
from rest_framework.response import Response
from api.utils.jwt_utils import validate_jwt

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

class SignupView(APIView):
    def post(self, request):
        data = json.loads(request.body)
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        try:
            connection = pymysql.connect(**DB_CONFIG)
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM users WHERE username = %s OR email = %s",
                    (username, email),
                )
                if cursor.fetchone():
                    return JsonResponse({"Error": "user already existed"}, status=400)

                hashed_password = make_password(password)
                cursor.execute(
                    "INSERT INTO users(username, email, password_hash) VALUES (%s, %s, %s)",
                    (username, email, hashed_password),
                )

                connection.commit()
            return JsonResponse({"message": "user registered!"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        finally:
            connection.close()

class LoginView(APIView):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            print(f"\n=== Login Attempt for {email} ===")

            connection = pymysql.connect(**DB_CONFIG)
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, username, email, password_hash FROM users WHERE email = %s",
                    (email,)
                )
                user = cursor.fetchone()

                if not user or not check_password(password, user[3]):
                    return JsonResponse({"error": "Invalid credentials"}, status=401)

                user_id, username, email, _ = user

                # Create token with minimal payload
                token_payload = {
                    "user_id": user_id,
                    "type": "access",
                    "exp": int((datetime.utcnow() + timedelta(days=1)).timestamp())
                }
                
                print(f"Creating token with payload: {token_payload}")
                
                access_token = jwt.encode(
                    token_payload,
                    SECRET_KEY,
                    algorithm="HS256"
                )

                print(f"Generated token: {access_token[:20]}...")

                response_data = {
                    "access_token": access_token,
                    "user": {
                        "id": user_id,
                        "username": username,
                        "email": email
                    }
                }

                return JsonResponse(response_data)

        except Exception as e:
            print(f"Login error: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)
        finally:
            if 'connection' in locals():
                connection.close()

class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.COOKIES.get("refresh_token")
            if refresh_token:
                # Optional: Add token to blacklist in database
                # with connection.cursor() as cursor:
                #     cursor.execute("INSERT INTO token_blacklist (token) VALUES (%s)", (refresh_token,))
                #     connection.commit()
                pass

            response = JsonResponse({"message": "Logged out successfully"})
            response.delete_cookie(
                "refresh_token",
                samesite="None",
                secure=True,
                httponly=True
            )
            return response
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class RefreshView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return JsonResponse({"error": "No refresh token provided."}, status=401)

        try:
            # Decode the refresh token
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=["HS256"])
            
            # Verify token type
            if payload.get("type") != "refresh":
                return JsonResponse({"error": "Invalid token type."}, status=401)
                
            user_id = payload.get("user_id")
            
            # Optional: Check if token is blacklisted
            # with connection.cursor() as cursor:
            #     cursor.execute("SELECT id FROM token_blacklist WHERE token = %s", (refresh_token,))
            #     if cursor.fetchone():
            #         return JsonResponse({"error": "Token has been revoked."}, status=401)
            
            # Verify user still exists
            connection = pymysql.connect(**DB_CONFIG)
            with connection.cursor() as cursor:
                cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                if not cursor.fetchone():
                    return JsonResponse({"error": "User not found."}, status=401)

            # Issue a new access token
            new_access_token = jwt.encode(
                {
                    "user_id": user_id,
                    "type": "access",
                    "exp": datetime.utcnow() + timedelta(minutes=30)
                },
                SECRET_KEY,
                algorithm="HS256",
            )
            return JsonResponse({"access_token": new_access_token})
            
        except jwt.ExpiredSignatureError:
            return JsonResponse({"error": "Refresh token expired."}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({"error": "Invalid refresh token."}, status=401)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        finally:
            if 'connection' in locals():
                connection.close()

class UserView(APIView):
    def get(self, request):
        user_id, error = validate_jwt(request)
        
        if error:
            return Response({"error": "Authentication failed"}, status=401)
            
        try:
            connection = pymysql.connect(**DB_CONFIG)
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, username, email FROM users WHERE id = %s",
                    (user_id,)
                )
                user = cursor.fetchone()
                
                if not user:
                    return Response({"error": "User not found"}, status=404)
                    
                return Response({
                    "id": user[0],
                    "username": user[1],
                    "email": user[2]
                })
                
        except Exception as e:
            print(f"Error fetching user: {str(e)}")
            return Response({"error": "Server error"}, status=500)
        finally:
            if 'connection' in locals():
                connection.close()

class TestAuthAPI(APIView):
    def get(self, request):
        print("\n=== Test Auth Request ===")
        print("Headers:", dict(request.headers))
        
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return Response({"error": "No Authorization header"}, status=401)
                
            token = auth_header.split(' ')[1]
            
            # Try to decode without verification first
            unverified = jwt.decode(token, options={"verify_signature": False})
            print("Unverified token payload:", unverified)
            
            # Now try with verification
            verified = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            print("Verified token payload:", verified)
            
            return Response({
                "message": "Token is valid",
                "payload": verified
            })
            
        except Exception as e:
            print(f"Token validation error: {str(e)}")
            return Response({
                "error": str(e),
                "token_received": auth_header
            }, status=401)