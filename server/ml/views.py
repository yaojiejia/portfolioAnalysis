from django.shortcuts import render
from rest_framework.views import APIView
from ml.utils.ml_utils import run_portfolio_optimization
from rest_framework.response import Response
class MlAPI(APIView):
    def get(self, request):
        expected_return = request.query_params.get("expected_return")
        method = request.query_params.get("method")
        results = run_portfolio_optimization(expected_return, method)
        return Response(results)