Backend Docker notes

The backend image reads TLS cert paths from environment variables `SSL_CERT_PATH` and `SSL_KEY_PATH`.
In development via docker-compose the repository root `localhost.pem` and `localhost-key.pem` are mounted into the container at `/etc/ssl/certs/localhost.pem` and `/etc/ssl/private/localhost-key.pem`.

The app will try to start HTTPS if both paths are present; otherwise it will fall back to HTTP.
