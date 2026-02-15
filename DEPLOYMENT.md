# Railway Deployment Guide

This document covers deploying the CRM1 Hebrew contact management app to Railway with staging and production environments.

## Architecture Overview

```
Railway Project
├── staging (auto-deploy from 'dev' branch)
│   ├── frontend-staging service
│   └── backend-staging service
└── production (auto-deploy from 'main' branch)
    ├── frontend service
    └── backend service
```

**Tech Stack:**
- **Frontend:** Vanilla HTML/CSS/JS (no build step)
- **Backend:** Flask + Gunicorn on Python
- **Database:** Supabase (external Postgres)

## Prerequisites

1. **Railway Account:** https://railway.app
2. **Railway CLI:** https://railway.app/docs/cli
3. **Git & GitHub:** Repository must be on GitHub
4. **Supabase Project:** Already set up with `contacts` and `interactions` tables
5. **OpenAI API Key:** For chat feature (optional, users provide their own)

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/CRM1.git
cd CRM1
```

## Step 2: Create the Dev Branch for Staging

Railway will auto-deploy from the `dev` branch to staging and `main` to production. Create the staging branch:

```bash
git checkout -b dev
git push -u origin dev
```

## Step 3: Set Up Railway Project

### 3.1 Create a New Railway Project

```bash
railway init
```

Select "Create a new project" and name it (e.g., "CRM1").

### 3.2 Connect GitHub Repository

```bash
railway connect
```

This links your Railway project to the GitHub repository for automatic deployments.

## Step 4: Create Backend Service

### 4.1 Create the Service

```bash
railway service new
```

- Select "Create a new service"
- Name it: `backend`
- The service will auto-detect the Flask app from `backend/app.py`

### 4.2 Configure Environment Variables

Set the Supabase credentials:

```bash
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_KEY=your-anon-key-here
```

### 4.3 Configure for Staging

For the staging environment (dev branch), Railway will create a separate "environment" (you'll configure this in the next section). You'll need to:

1. Go to Railway dashboard
2. Select your backend service
3. Under "Environments," create or switch to your staging environment
4. Set the same Supabase variables for staging

### 4.4 Verify Deployment

Once deployed, test the health check:

```bash
curl https://<your-backend-staging-url>.up.railway.app/api/health
# Expected response: {"status": "ok"}
```

## Step 5: Create Frontend Service

### 5.1 Create the Service

```bash
railway service new
```

- Select "Create a new service"
- Name it: `frontend`

### 5.2 Configure Build & Deploy

The frontend service needs special configuration:

1. Go to Railway dashboard
2. Select the `frontend` service
3. Go to **Build** tab:
   - Build command: `echo 'No build step'`
4. Go to **Deploy** tab:
   - Start command: `sh /app/frontend/entrypoint.sh`

### 5.3 Set API_URL

The frontend needs to know the backend URL:

```bash
railway variables set API_URL=https://<your-backend-staging-url>.up.railway.app
```

### 5.4 Verify Frontend

Once deployed, open the frontend URL in your browser. You should see the Hebrew CRM interface loading contacts from the backend.

## Step 6: Configure Production

### 6.1 Switch to Production Environment

In Railway, each service can have multiple environments (staging, production, etc.). To set up production:

1. In the Railway dashboard, create a new environment called "production"
2. Switch backend and frontend services to this environment
3. Set the same environment variables, but with production-safe CORS settings

### 6.2 Backend CORS for Production

For production, restrict CORS to your frontend URL:

```bash
# Switch to production environment
railway environment production

# Update CORS to only allow your frontend
railway variables set CORS_ORIGIN=https://<your-frontend-url>.up.railway.app
```

### 6.3 Frontend API_URL for Production

```bash
# Update the backend URL for production
railway variables set API_URL=https://<your-backend-production-url>.up.railway.app
```

## Step 7: Enable Auto-Deploy from Git

Railway automatically deploys when you push to your repository branches. To verify/configure:

1. Go to Railway dashboard → Project settings
2. Under "Deploy" section, ensure:
   - Staging environment: Auto-deploy from `dev` branch
   - Production environment: Auto-deploy from `main` branch

## Step 8: Test End-to-End

### Staging (dev branch)

```bash
# Make a change and push to dev
git checkout dev
echo "# Testing staging" >> README.md
git add .
git commit -m "test: staging deployment"
git push origin dev
```

Wait for Railway to deploy (check dashboard), then:
- Visit your staging frontend URL
- Verify contacts load
- Check browser console for any API errors

### Production (main branch)

```bash
# Merge dev to main for production
git checkout main
git merge dev
git push origin main
```

Wait for Railway to deploy, then verify the production frontend and backend.

## Environment Variables Reference

### Backend Service

| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `SUPABASE_URL` | `https://abc.supabase.co` | ✓ | Database URL |
| `SUPABASE_KEY` | `eyJhbGc...` | ✓ | Database anon key |
| `CORS_ORIGIN` | `https://frontend-staging.up.railway.app` | ✓ | Frontend URL (prevents CORS errors) |
| `FLASK_ENV` | `production` | - | Set to "development" for debug mode |
| `PORT` | `5001` | - | Auto-set by Railway (default 5001) |

### Frontend Service

| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `API_URL` | `https://backend-staging.up.railway.app` | ✓ | Backend API URL (injected at startup) |
| `PORT` | `3000` | - | Auto-set by Railway (default 3000) |

## Troubleshooting

### Frontend can't reach backend

**Error:** "Network error" in console, or contacts won't load

**Solution:**
1. Check that `API_URL` environment variable is set correctly on the frontend service
2. Verify the backend service is running: `curl https://<backend-url>.up.railway.app/api/health`
3. Check browser console for CORS errors
4. Update `CORS_ORIGIN` on backend to match your frontend URL

### Contacts not loading

**Error:** Empty table or "Error loading contacts"

**Solution:**
1. Verify Supabase credentials are correct: `SUPABASE_URL` and `SUPABASE_KEY`
2. Check that your Supabase project has the `contacts` table with proper schema
3. View backend logs: `railway logs`

### 502 Bad Gateway

**Error:** Railway returns 502 error

**Solution:**
1. Check backend service logs: `railway logs`
2. Ensure the service is running: `railway status`
3. Verify environment variables are set: `railway variables`
4. Restart the service: `railway redeploy`

### Building fails

**Error:** Build fails with "command not found" or similar

**Solution:**
1. Check build logs: Railway dashboard → Deployments tab
2. Ensure requirements.txt has all dependencies
3. Verify Python/Node versions are compatible
4. For frontend, ensure `entrypoint.sh` is executable

## Local Development

To test locally before deploying:

```bash
# Backend
cd backend
python -m pip install -r requirements.txt
export SUPABASE_URL=your-supabase-url
export SUPABASE_KEY=your-supabase-key
python app.py

# Frontend (in another terminal)
cd frontend
python -m http.server 3000
```

Then open `http://localhost:3000` and ensure it connects to `http://localhost:5001`.

## Rollback & Disaster Recovery

### Rollback a Deployment

If a deployment causes issues:

1. Go to Railway dashboard → Deployments tab
2. Find the previous successful deployment
3. Click the deployment and select "Redeploy"

### Database Backup

Supabase automatically backs up your data. To restore:

1. Go to Supabase console
2. Database → Backups
3. Restore to a previous point (if needed)

## Monitoring & Logs

### View Service Logs

```bash
# Switch to service
railway service frontend

# View live logs
railway logs --tail

# View backend logs
railway service backend
railway logs --tail
```

### Check Service Status

```bash
railway status
```

### View Metrics

In Railway dashboard:
- Deployments tab: See all past deployments
- Metrics tab: CPU, memory, disk, network usage
- Environment variables: View/edit all config

## Advanced Configurations

### Custom Domain

To use a custom domain (e.g., crm.example.com):

1. Railway dashboard → Project → Domains
2. Add your domain and follow DNS setup instructions
3. Update `CORS_ORIGIN` and `API_URL` to use your domain

### Adding a Database

If you want to move from Supabase to Railway's Postgres:

1. `railway database new` → Select Postgres
2. Update `SUPABASE_URL` and `SUPABASE_KEY` to point to Railway DB
3. Migrate your data using Supabase export/import tools

### CI/CD Pipeline

Railway integrates with GitHub automatically. To add additional checks:

1. Create GitHub Actions workflows in `.github/workflows/`
2. Add tests, linting, or deployment validation
3. Railway will run these before deploying

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **GitHub Issues:** Report bugs or request features
- **Discord Community:** https://discord.gg/railway (for Railway support)

## Deployment Checklist

- [ ] GitHub repository created and pushed
- [ ] Railway CLI installed locally
- [ ] Railway project created
- [ ] Dev and main branches exist
- [ ] Backend service created and deployed
- [ ] Frontend service created and deployed
- [ ] Supabase credentials configured
- [ ] API_URL and CORS_ORIGIN set correctly
- [ ] Health check passes: `/api/health` → 200 OK
- [ ] Frontend loads contacts from backend
- [ ] Staging deployment tested (dev → staging)
- [ ] Production deployment tested (main → production)
- [ ] Custom domain configured (optional)
- [ ] Monitoring & alerts set up (optional)
