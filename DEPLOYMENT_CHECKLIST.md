# Railway Deployment Checklist

## ✅ Infrastructure Setup (COMPLETE)

- [x] Railway project created (`CRM1`)
- [x] GitHub repository connected (elishevaschwarz-hash/CRM2)
- [x] Backend service created and configured
- [x] Frontend service created and configured
- [x] Production environment set up (main branch)
- [x] Staging environment set up (dev branch)
- [x] Public URLs generated for all services
- [x] Auto-deploy from GitHub configured
- [x] Environment variables configured
- [x] Root directories set correctly

## ⏳ Deployment In Progress

- [ ] Backend build completing (check dashboard)
- [ ] Frontend build completing (check dashboard)
- [ ] Services starting up
- [ ] Health checks passing

**Monitor here:** https://railway.app/project/6dabad56-59ab-49b5-a22b-63656c9ab108

## 🔧 Required Actions (Do After Builds Complete)

### 1. Update Supabase Credentials (CRITICAL)

Get your Supabase credentials from: https://app.supabase.com

Then run:
```bash
cd C:\Users\User\Documents\python_ai\CRM1

# Production
railway environment production
railway service backend
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_KEY=your-anon-key-here
railway up --detach

# Wait for deployment to complete, then:

# Staging
railway environment staging
railway service backend
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_KEY=your-anon-key-here
railway up --detach
```

- [ ] Production Supabase credentials updated
- [ ] Production backend redeployed
- [ ] Staging Supabase credentials updated
- [ ] Staging backend redeployed

### 2. Verify Health Check

```bash
curl https://backend-production-07dc.up.railway.app/api/health
```

Expected response: `{"status":"ok"}`

- [ ] Production backend health check passes
- [ ] Staging backend health check passes

### 3. Test Frontend

Open in browser:
- [ ] https://frontend-production-e7aa.up.railway.app loads
- [ ] Hebrew CRM interface displays
- [ ] Contacts load from backend
- [ ] No CORS errors in console (F12)
- [ ] Can create/edit contacts

### 4. Test Staging

Open in browser:
- [ ] https://frontend-staging-73af.up.railway.app loads
- [ ] Staging frontend connects to staging backend

## 🚀 Ongoing Operations

### Testing Auto-Deploy
- [ ] Make a code change
- [ ] Push to `main` branch
- [ ] Watch Railway dashboard for auto-deploy
- [ ] Verify changes live on production

### Pushing to Staging
- [ ] Make a code change
- [ ] Push to `dev` branch
- [ ] Watch for auto-deploy to staging
- [ ] Test on staging before merging to main

### Monitoring

```bash
# View production logs
railway environment production
railway service backend
railway logs --tail 100

# View staging logs
railway environment staging
railway service backend
railway logs --tail 100

# Check service status
railway status
```

- [ ] Set up monitoring alerts (optional)
- [ ] Configure custom domain (optional)
- [ ] Set up backups (Supabase auto-backs up)

## 📋 Reference Information

### Service URLs

**Production:**
- Backend API: https://backend-production-07dc.up.railway.app
- Frontend UI: https://frontend-production-e7aa.up.railway.app

**Staging:**
- Backend API: https://backend-staging-4f57.up.railway.app
- Frontend UI: https://frontend-staging-73af.up.railway.app

### Service IDs
- Backend: `8dd0987a-02be-4e37-b669-9598faae1bd0`
- Frontend: `a9d59a79-23b3-47a0-8993-03218dadffea`

### Environment IDs
- Production: `2c3cc21b-c683-48a3-9e89-94f288fcfd6c`
- Staging: `0fc07da4-cf47-4e7d-98f1-d26959f62fb4`

### Project ID
- Railway Project: `6dabad56-59ab-49b5-a22b-63656c9ab108`

### Important Links
- Dashboard: https://railway.app/project/6dabad56-59ab-49b5-a22b-63656c9ab108
- GitHub: https://github.com/elishevaschwarz-hash/CRM2
- Supabase: https://app.supabase.com

## 📚 Documentation Files

- **RAILWAY_DEPLOYMENT_STATUS.md** - Current deployment status (read first!)
- **DEPLOYMENT.md** - Complete deployment reference
- **RAILWAY_SETUP_STEPS.md** - Step-by-step setup instructions
- **RAILWAY_DEPLOYMENT_SUMMARY.md** - Infrastructure summary
- **DEPLOYMENT_CHECKLIST.md** - This file

## 🆘 Troubleshooting

### Builds Taking Too Long
- Check Railway status: https://status.railway.app
- Builds typically take 5-15 minutes first time
- Subsequent deployments usually take 2-3 minutes

### Health Check Returns 404
- Build still in progress
- Wait a few more minutes
- Check logs: `railway logs --tail 100`

### Frontend Can't Reach Backend
- Verify API_URL env var is set correctly
- Check CORS_ORIGIN matches frontend URL
- Review browser console for errors (F12)

### No Contacts Loading
- Supabase credentials still placeholders
- Update credentials (see Step 1 above)
- Verify Supabase database has correct schema

### Auto-Deploy Not Working
- Check GitHub Settings → Webhooks
- Ensure Railway integration is installed
- Try manual redeploy: `railway up --detach`

## ✨ Summary

**What's Done:**
- ✅ Full Railway infrastructure created
- ✅ GitHub auto-deploy configured
- ✅ All services built and ready to deploy
- ✅ Environment variables configured
- ✅ Staging and production separated

**What You Do:**
1. Update Supabase credentials (when ready)
2. Test that everything works
3. Push code to GitHub - it auto-deploys!

**Result:**
- Production: Push to `main` → Live in ~5-10 minutes
- Staging: Push to `dev` → Test environment in ~5-10 minutes
- Zero manual deployment steps after credentials are set

---

**Start here:** https://railway.app/project/6dabad56-59ab-49b5-a22b-63656c9ab108
