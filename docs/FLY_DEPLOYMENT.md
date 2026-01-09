# Fly.io Deployment Guide for EMI Pro

## Prerequisites

1. Install Fly.io CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login to Fly.io:
   ```bash
   flyctl auth login
   ```

## Initial Setup

1. **Create the app** (first time only):
   ```bash
   flyctl apps create emi-pro-app
   ```

2. **Set secrets** (environment variables):
   ```bash
   flyctl secrets set MONGODB_URI="your_mongodb_connection_string"
   flyctl secrets set JWT_SECRET="your_jwt_secret"
   ```

## Deploy

Deploy your application:
```bash
flyctl deploy
```

## Monitor

View logs:
```bash
flyctl logs
```

Check status:
```bash
flyctl status
```

Open in browser:
```bash
flyctl open
```

## Configuration

- **App Name**: emi-pro-app
- **Region**: Singapore (sin) - closest to India
- **Memory**: 512MB
- **Port**: 8080
- **Auto-scaling**: Enabled

## Custom Domain (Optional)

Add your custom domain:
```bash
flyctl certs add yourdomain.com
```

## Database

Your MongoDB connection should be set via secrets:
```bash
flyctl secrets set MONGODB_URI="mongodb+srv://..."
```

## APK Files

APK files in `backend/public/downloads/` and `backend/public/staff/SecurePro/` will be included in the deployment.

## Troubleshooting

If deployment fails:
1. Check logs: `flyctl logs`
2. Verify secrets: `flyctl secrets list`
3. Check app status: `flyctl status`

## Rollback

If you need to rollback:
```bash
flyctl releases list
flyctl releases rollback <version>
```
