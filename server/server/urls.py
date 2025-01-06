from django.contrib import admin
from django.urls import path
from api.views import StockAPI, ModifyDBAPI, SearchDBAPI
from userauth.views import SignupView, LoginView, LogoutView, RefreshView, UserView, TestAuthAPI  # Add UserView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('yahoo/stock/', StockAPI.as_view(), name='stock-api'),
    path('db/', ModifyDBAPI.as_view(), name='db-api'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', RefreshView.as_view(), name='refresh'),
    path('transactions/', SearchDBAPI.as_view(), name='search'),
    path('user/', UserView.as_view(), name='user'),  # Add this line
    path('test-auth/', TestAuthAPI.as_view(), name='test-auth'),
]