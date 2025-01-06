from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            header = self.get_header(request)
            if header is None:
                return None

            # Check if the header starts with 'Bearer'
            if not header.startswith(b'Bearer'):
                return None

            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None

            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return (user, validated_token)

        except (InvalidToken, AuthenticationFailed):
            return None

    def get_header(self, request):
        """
        Extracts the header containing the JWT from the given request.
        """
        header = request.META.get('HTTP_AUTHORIZATION')
        if isinstance(header, str):
            header = header.encode('utf-8')
        return header

    def get_raw_token(self, header):
        """
        Extracts an unvalidated JWT from the given "Authorization" header value.
        """
        parts = header.split()

        if len(parts) == 0:
            return None

        if parts[0] != b'Bearer':
            return None

        if len(parts) != 2:
            return None

        return parts[1]