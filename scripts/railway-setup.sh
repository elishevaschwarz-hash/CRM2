#!/bin/bash
# Railway Deployment Setup Helper Script
# This script assists with initial Railway project setup and configuration

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Railway Deployment Setup${NC}"
echo "================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI is not installed${NC}"
    echo "Install from: https://railway.app/docs/cli"
    exit 1
fi

echo -e "${GREEN}✓ Railway CLI found${NC}"
echo ""

# Get current Railway project status
echo "Checking current Railway status..."
railway status || true
echo ""

# Show next steps
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Create a new Railway project:"
echo "   railway init"
echo ""
echo "2. Connect your GitHub repository:"
echo "   railway connect"
echo ""
echo "3. Create backend service from this repo:"
echo "   railway service new"
echo "   Select 'backend' as the service name"
echo ""
echo "4. Create frontend service:"
echo "   railway service new"
echo "   Select 'frontend' as the service name"
echo ""
echo "5. Set environment variables:"
echo "   railway variables set SUPABASE_URL=<your-url>"
echo "   railway variables set SUPABASE_KEY=<your-key>"
echo ""
echo "6. Create staging environment (dev branch):"
echo "   git checkout -b dev"
echo "   git push -u origin dev"
echo "   Set Railway to auto-deploy from 'dev' branch to staging"
echo ""
echo "7. Deploy to production (main branch):"
echo "   git push origin main"
echo ""
echo -e "${GREEN}For detailed docs, see DEPLOYMENT.md${NC}"
