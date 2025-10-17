# aarvasa-systemd BACKEND
aarvasa-systemd is the backend core of AARVASA, modeled after Linux's systemd service manager.
Like systemd manages essential background services, this repo handles the server-side logic and APIs.

```bash
docker-compose up --build
docker-compose down

docker-compose up
docker-compose down
```


### ENV file
EMAIL_PASS
EMAIL_USER
FRONTEND_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
JWT_SECRET
MONGO_URI
GROQ_API_KEY