# FinSight Deployment Guide

This guide covers deploying FinSight to **Google Cloud Platform (GCP)** with **Firebase Hosting** for the frontend.

## 🏗️ Architecture Overview

- **Frontend**: React app deployed to **Firebase Hosting**
- **Backend**: FastAPI app deployed to **Google Cloud Run**
- **Database**: PostgreSQL on **Cloud SQL**
- **Secrets**: Managed by **Google Secret Manager**
- **CI/CD**: Automated deployment via **GitHub Actions**

## 📋 Prerequisites

### Required Tools
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- [Firebase CLI](https://firebase.google.com/docs/cli#install-cli)
- [Docker](https://docs.docker.com/get-docker/)
- [Node.js 18+](https://nodejs.org/)
- [Python 3.11+](https://www.python.org/)

### Required Accounts
- Google Cloud Platform account
- Firebase project
- GitHub account

## 🚀 Quick Deployment

### Option 1: Automated Script
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Set environment variables
export GCP_PROJECT_ID="your-gcp-project-id"
export FIREBASE_PROJECT_ID="your-firebase-project-id"
export GCP_REGION="us-central1"

# Run deployment
./scripts/deploy.sh
```

### Option 2: Manual Step-by-Step
Follow the detailed steps below.

## 🔧 Manual Setup

### 1. Google Cloud Platform Setup

#### Create Project
```bash
# Create new project
gcloud projects create finsight-app --name="FinSight Financial App"

# Set as default
gcloud config set project finsight-app

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
echo "Project ID: $PROJECT_ID"
```

#### Enable Required APIs
```bash
# Enable necessary APIs
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Create Service Account
```bash
# Create service account
gcloud iam service-accounts create finsight-deployer \
    --display-name="FinSight Deployment Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:finsight-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:finsight-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/sql.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:finsight-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.admin"

# Create and download key
gcloud iam service-accounts keys create key.json \
    --iam-account=finsight-deployer@$PROJECT_ID.iam.gserviceaccount.com
```

### 2. Firebase Setup

#### Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### Login and Initialize
```bash
# Login to Firebase
firebase login

# Initialize Firebase in frontend directory
cd frontend
firebase init hosting

# Select your Firebase project
# Set public directory to: build
# Configure as single-page app: Yes
# Don't overwrite index.html: No
```

#### Update Firebase Configuration
Edit `frontend/.firebaserc`:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 3. Database Setup

#### Create Cloud SQL Instance
```bash
gcloud sql instances create finsight-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=02:00 \
    --enable-backup
```

#### Create Database and User
```bash
# Create database
gcloud sql databases create finsight --instance=finsight-db

# Create user
gcloud sql users create finsight \
    --instance=finsight-db \
    --password="your-secure-password"
```

#### Get Connection String
```bash
# Get instance connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe finsight-db \
    --format='value(connectionName)')

echo "Instance connection: $INSTANCE_CONNECTION_NAME"
echo "Database URL: postgresql://finsight:your-password@/finsight?host=/cloudsql/$INSTANCE_CONNECTION_NAME"
```

### 4. Secrets Setup

#### Store Secrets in Secret Manager
```bash
# JWT Secret
echo "your-super-secure-jwt-secret" | \
gcloud secrets create JWT_SECRET --data-file=-

# Google OAuth
echo "your-google-client-id" | \
gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

echo "your-google-client-secret" | \
gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

# API Keys
echo "your-openai-api-key" | \
gcloud secrets create OPENAI_API_KEY --data-file=-

echo "your-gemini-api-key" | \
gcloud secrets create GEMINI_API_KEY --data-file=-
```

## 🚀 Deployment

### Deploy Backend to Cloud Run

#### Build and Push Docker Image
```bash
cd backend

# Build image
docker build -t gcr.io/$PROJECT_ID/finsight-backend:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/finsight-backend:latest

cd ..
```

#### Deploy to Cloud Run
```bash
gcloud run deploy finsight-backend \
    --image gcr.io/$PROJECT_ID/finsight-backend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars="GOOGLE_CLIENT_PROJECT_ID=$PROJECT_ID" \
    --set-env-vars="DATABASE_URL=postgresql://finsight:password@/finsight?host=/cloudsql/$INSTANCE_CONNECTION_NAME" \
    --set-env-vars="JWT_SECRET=your-jwt-secret" \
    --set-env-vars="GOOGLE_CLIENT_ID=your-google-client-id" \
    --set-env-vars="GOOGLE_CLIENT_SECRET=your-google-client-secret" \
    --set-env-vars="OPENAI_API_KEY=your-openai-key" \
    --set-env-vars="GEMINI_API_KEY=your-gemini-key"
```

#### Get Backend URL
```bash
BACKEND_URL=$(gcloud run services describe finsight-backend \
    --region=us-central1 \
    --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

### Deploy Frontend to Firebase

#### Build React App
```bash
cd frontend

# Install dependencies
npm ci

# Build for production
REACT_APP_API_URL=$BACKEND_URL npm run build

cd ..
```

#### Deploy to Firebase
```bash
cd frontend
firebase deploy --project your-firebase-project-id --only hosting
cd ..
```

## 🔄 CI/CD with GitHub Actions

### 1. Repository Secrets

Add these secrets to your GitHub repository:

- `GCP_SA_KEY`: Content of your service account key file
- `GCP_PROJECT_ID`: Your GCP project ID
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `DATABASE_URL`: Your database connection string
- `JWT_SECRET`: Your JWT secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `OPENAI_API_KEY`: OpenAI API key
- `GEMINI_API_KEY`: Gemini API key
- `DB_ROOT_PASSWORD`: Database root password
- `DB_PASSWORD`: Database user password

### 2. Firebase Service Account

Create a Firebase service account:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file content as `FIREBASE_SERVICE_ACCOUNT` secret

### 3. Push to Main Branch

The GitHub Actions workflow will automatically:
1. Run tests
2. Deploy backend to Cloud Run
3. Deploy frontend to Firebase Hosting
4. Set up database infrastructure

## 🌐 Custom Domain Setup

### Firebase Hosting Domain
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain
4. Follow DNS verification steps

### SSL Certificate
Firebase automatically provides SSL certificates for custom domains.

## 📊 Monitoring and Logging

### Cloud Run Logs
```bash
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=finsight-backend" --limit=50
```

### Firebase Analytics
- View in Firebase Console → Analytics
- Track user engagement and performance

### Cloud SQL Monitoring
- Monitor in Cloud Console → SQL
- Set up alerts for disk usage and connections

## 🔧 Troubleshooting

### Common Issues

#### Backend Deployment Fails
```bash
# Check logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=finsight-backend" --limit=20

# Verify environment variables
gcloud run services describe finsight-backend --region=us-central1
```

#### Frontend Build Fails
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues
```bash
# Test connection
gcloud sql connect finsight-db --user=finsight

# Check instance status
gcloud sql instances describe finsight-db
```

## 💰 Cost Optimization

### Free Tier Benefits
- **Cloud Run**: 2 million requests/month free
- **Cloud SQL**: db-f1-micro instance (shared core)
- **Firebase Hosting**: 10GB storage, 360MB/day transfer

### Cost Monitoring
```bash
# Set up billing alerts
gcloud billing budgets create --billing-account=YOUR_BILLING_ACCOUNT_ID \
    --budget-amount=50USD \
    --budget-filter-projects=$PROJECT_ID
```

## 🔄 Updates and Rollbacks

### Update Application
```bash
# Push to main branch - automatic deployment
git push origin main
```

### Rollback Backend
```bash
# List revisions
gcloud run revisions list --service=finsight-backend --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic finsight-backend \
    --to-revisions=REVISION_NAME=100 \
    --region=us-central1
```

### Rollback Frontend
```bash
# Firebase automatically handles rollbacks
# Previous versions are available in Firebase Console
```

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

## 🆘 Support

For issues:
1. Check the troubleshooting section above
2. Review Cloud Console logs
3. Check Firebase Console for frontend issues
4. Open GitHub issues for code-related problems 