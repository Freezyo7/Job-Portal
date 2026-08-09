from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Reads the JWT from an httpOnly cookie instead of the Authorization
    header.

    Placeholder for now — the cookie-reading override lands in Step 5.
    """

    pass
