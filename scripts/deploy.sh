#!/bin/bash

# FinSight Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLIENT_PROJECT_ID:-"your-project-id"}
REGION=${GCP_REGION:-"us-central1"}
BACKEND_SERVICE="finsight-backend"
FRONTEND_SERVICE="finsight-frontend"

echo -e "${GREEN}🚀 Starting FinSight deployment to GCP...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated with gcloud. Please run 'gcloud auth login' first.${NC}"
    exit 1
fi

# Set project
echo -e "${YELLOW}📋 Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Build and deploy backend
echo -e "${YELLOW}🏗️  Building and deploying backend...${NC}"
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest .
gcloud run deploy $BACKEND_SERVICE \
    --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8000 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)')
echo -e "${GREEN}✅ Backend deployed to: $BACKEND_URL${NC}"

# Build and deploy frontend
echo -e "${YELLOW}🏗️  Building and deploying frontend...${NC}"
cd ../frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest .
gcloud run deploy $FRONTEND_SERVICE \
    --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 80 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 5 \
    --set-env-vars="REACT_APP_API_URL=$BACKEND_URL"

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format='value(status.url)')
echo -e "${GREEN}✅ Frontend deployed to: $FRONTEND_URL${NC}"

# Create database if it doesn't exist
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
if ! gcloud sql instances describe finsight-db --region=$REGION &> /dev/null; then
    echo -e "${YELLOW}📊 Creating Cloud SQL instance...${NC}"
    gcloud sql instances create finsight-db \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-type=HDD \
        --storage-size=10GB \
        --backup-start-time=02:00 \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=02
else
    echo -e "${GREEN}✅ Database instance already exists${NC}"
fi

# Create database and user
gcloud sql databases create finsight --instance=finsight-db --quiet || echo "Database already exists"
gcloud sql users create finsight --instance=finsight-db --password=temp-password --quiet || echo "User already exists"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Frontend: $FRONTEND_URL${NC}"
echo -e "${GREEN}🔧 Backend: $BACKEND_URL${NC}"
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo -e "${YELLOW}   1. Update your Google OAuth authorized origins${NC}"
echo -e "${YELLOW}   2. Set up secrets in Secret Manager${NC}"
echo -e "${YELLOW}   3. Configure your custom domain (if desired)${NC}" 