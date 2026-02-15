# Railway Setup Step-by-Step Guide

This guide will help you complete the Railway deployment for CRM1 once your plan is active.

## Prerequisites Checklist

- [ ] Railway account with active plan (https://railway.app/account/billing)
- [ ] GitHub repository pushed with `dev` and `main` branches
- [ ] Railway CLI installed (`railway --version` shows 4.30.2+)
- [ ] Supabase project ready with connection details
- [ ] Current directory: `C:\Users\User\Documents\python_ai\CRM1`

## Phase 1: Create Railway Project & Link Repository

### Step 1.1: Initialize Railway Project

```bash
cd C:\Users\User\Documents\python_ai\CRM1
railway init -n CRM1
```

Expected output:
```
Project CRM1 created at ...
```

### Step 1.2: Link GitHub Repository

```bash
railway connect
```

This connects your Railway project to the GitHub repository for automatic deployments.

Expected: Railway asks "Link to GitHub? (y/n)" → choose **y**

---

## Phase 2: Create Backend Service

### Step 2.1: Add Backend Service

```bash
railway add --service backend
```

During setup:
- Select **Backend** or leave blank (Railway will detect it's Python)
- When asked "Do you want to deploy now?" → Choose **n** (we'll configure first)

### Step 2.2: Verify Backend Configuration

The service should be created. Railway will auto-detect:
- Python from `requirements.txt`
- Build command: `pip install -r requirements.txt`
- Start command: Will use `railway.toml` we created

Verify with:
```bash
railway status
```

### Step 2.3: Set Backend Environment Variables

```bash
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_KEY=your-anon-key-here
railway variables set CORS_ORIGIN=*
```

(We'll set the actual frontend URL later once it's deployed)

### Step 2.4: Deploy Backend

```bash
railway up
```

Wait for deployment to complete. Once done, you'll see a public URL like:
```
https://crm1-backend-prod.up.railway.app
```

### Step 2.5: Verify Backend Health

```bash
curl https://crm1-backend-prod.up.railway.app/api/health
```

Expected response:
```json
{"status": "ok"}
```

---

## Phase 3: Create Frontend Service

### Step 3.1: Add Frontend Service

```bash
railway service new
```

Select:
- Service name: **frontend**
- Framework: Select **Vanilla (static)** or similar

### Step 3.2: Configure Frontend Settings

In the Railway dashboard:
1. Go to **Project** → **CRM1** → **frontend** service
2. Click **Settings** (or **Build** tab)
3. Configure:
   - **Build Command**: `echo 'No build step'`
   - **Start Command**: `sh /app/frontend/entrypoint.sh`

**Alternatively**, use the CLI:
```bash
railway service frontend
railway variables set BUILD_COMMAND="echo 'No build step'"
```

### Step 3.3: Set Frontend Environment Variable

```bash
railway variables set API_URL=https://crm1-backend-prod.up.railway.app
```

(Replace with your actual backend URL from Step 2.4)

### Step 3.4: Deploy Frontend

```bash
railway up
```

Wait for deployment. You'll see a frontend URL like:
```
https://crm1-frontend-prod.up.railway.app
```

### Step 3.5: Test Frontend

1. Open the frontend URL in your browser
2. You should see the Hebrew CRM interface
3. Check browser console (F12) for any errors
4. Try loading contacts - they should appear from the backend

---

## Phase 4: Configure Production CORS

Now that you have both services deployed, update the backend CORS to restrict to your frontend:

```bash
railway service backend
railway variables set CORS_ORIGIN=https://crm1-frontend-prod.up.railway.app
```

---

## Phase 5: Set Up Staging Environment

Railway allows multiple environments (staging, production). To set up staging from the `dev` branch:

### Step 5.1: Create Staging Environment

In Railway dashboard:
1. Go to **Project** → **CRM1**
2. Click **Environments** (top left)
3. Click **+ New Environment**
4. Name it: **staging**

### Step 5.2: Configure Auto-Deploy from Dev Branch

1. Select **staging** environment
2. Go to **Settings**
3. Under **GitHub Integration**:
   - Source: Select your repository
   - Branch: `dev`
   - Auto-deploy: Enable

### Step 5.3: Deploy to Staging

Push to the dev branch:
```bash
git push origin dev
```

Railway will automatically deploy to the staging environment.

### Step 5.4: Verify Staging

Staging services will have different URLs. Check the Railway dashboard for the staging backend and frontend URLs, and test similarly.

---

## Phase 6: Test End-to-End

### Staging (dev branch)

1. Open staging frontend URL
2. Verify contacts load from staging backend
3. Create a test contact
4. Check that it persists

### Production (main branch)

1. Merge dev → main:
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```

2. Railway automatically deploys to production
3. Open production frontend URL
4. Verify it connects to production backend
5. Test creating/editing contacts

---

## Environment Variables Reference

### Backend Service

Set these for **both** staging and production environments:

| Variable | Value | Notes |
|----------|-------|-------|
| `SUPABASE_URL` | Your Supabase URL | https://xxx.supabase.co |
| `SUPABASE_KEY` | Your Supabase anon key | From Supabase console |
| `CORS_ORIGIN` | Frontend URL | https://crm-frontend-xxx.up.railway.app |
| `FLASK_ENV` | `production` | Auto-set for prod |
| `PORT` | Auto-set by Railway | Default 5001 |

### Frontend Service

Set these for **both** environments:

| Variable | Value | Notes |
|----------|-------|-------|
| `API_URL` | Backend URL | https://crm-backend-xxx.up.railway.app |
| `PORT` | Auto-set by Railway | Default 3000 |

---

## Troubleshooting

### "No linked project found"

```bash
railway status
```

If error, link the project:
```bash
railway link -p CRM1
```

### Frontend shows blank page

1. Check browser console (F12) for errors
2. Verify `API_URL` is set correctly:
   ```bash
   railway service frontend
   railway variables
   ```
3. Check that backend is running:
   ```bash
   curl https://<backend-url>/api/health
   ```

### "CORS error" in browser console

1. Verify `CORS_ORIGIN` is set on backend:
   ```bash
   railway service backend
   railway variables
   ```
2. It should match your frontend URL exactly
3. Redeploy backend after changing:
   ```bash
   railway up
   ```

### Backend returns 502 Bad Gateway

1. Check logs:
   ```bash
   railway service backend
   railway logs --tail
   ```
2. Verify `requirements.txt` has all dependencies
3. Verify Supabase credentials are correct
4. Restart service:
   ```bash
   railway redeploy
   ```

### Build fails during deployment

1. View detailed logs in Railway dashboard
2. Check for common issues:
   - Missing `requirements.txt`
   - Missing `entrypoint.sh`
   - Syntax errors in Python code
3. Fix and push again (auto-redeploys)

---

## Useful Railway Commands

```bash
# Check project status
railway status

# View all services
railway service list

# View service logs (live)
railway service <service-name>
railway logs --tail

# View environment variables
railway variables

# Set variable
railway variables set KEY=value

# Delete variable
railway variables unset KEY

# Get service URL
railway service <service-name>
railway open
```

---

## Next Steps After Deployment

1. **Add Custom Domain** (Optional)
   - Go to Railway dashboard → Domains
   - Add your custom domain

2. **Set Up Monitoring** (Optional)
   - Enable uptime monitoring in Railway settings
   - Set up alerts

3. **Team Access** (Optional)
   - Invite team members to the Railway project

4. **Backup Database** (Already Automatic)
   - Supabase auto-backs up your data
   - No action needed

---

## Documentation Links

- **Railway Docs:** https://docs.railway.app
- **Full Deployment Guide:** `DEPLOYMENT.md` in project root
- **Supabase Console:** https://app.supabase.com
- **Railway Dashboard:** https://railway.app/dashboard
