# FinSight Deployment Guide

This guide covers deploying FinSight to Google Cloud Platform (GCP) using Docker and GitHub Actions.

## 🚀 Quick Start

### 1. Prerequisites
- Google Cloud Platform account
- Google Cloud CLI (`gcloud`) installed and authenticated
- GitHub repository with your code
- Domain name (optional, for custom URLs)

### 2. One-Click Deployment
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

## 🔧 Manual Setup

### 1. Enable GCP APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create Secrets in Secret Manager
```bash
# Create secrets
gcloud secrets create GOOGLE_CLIENT_ID --data-file=- <<< "your-client-id"
gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=- <<< "your-client-secret"
gcloud secrets create OPENAI_API_KEY --data-file=- <<< "your-openai-key"
gcloud secrets create DATABASE_URL --data-file=- <<< "postgresql://user:pass@host:5432/db"
gcloud secrets create JWT_SECRET --data-file=- <<< "your-jwt-secret"

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding GOOGLE_CLIENT_ID \
    --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy Backend
```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/finsight-backend:latest .
gcloud run deploy finsight-backend \
    --image gcr.io/YOUR_PROJECT_ID/finsight-backend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8000 \
    --memory 1Gi \
    --cpu 1
```

### 4. Deploy Frontend
```bash
cd frontend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/finsight-frontend:latest .
gcloud run deploy finsight-frontend \
    --image gcr.io/YOUR_PROJECT_ID/finsight-frontend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 80 \
    --memory 512Mi \
    --cpu 1
```

## 🔐 GitHub Actions Setup

### 1. Repository Secrets
Add these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

- `GCP_SA_KEY`: Your service account JSON key
- `GCP_PROJECT_ID`: Your GCP project ID
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `OPENAI_API_KEY`: OpenAI API key
- `DB_ROOT_PASSWORD`: Database root password
- `DB_PASSWORD`: Database user password

### 2. Service Account Setup
```bash
# Create service account
gcloud iam service-accounts create github-actions \
    --description="Service account for GitHub Actions" \
    --display-name="GitHub Actions"

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Create and download key
gcloud iam service-accounts keys create key.json \
    --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## 🌐 Custom Domain Setup

### 1. Map Domain to Cloud Run
```bash
# Map custom domain
gcloud run domain-mappings create \
    --service finsight-frontend \
    --domain yourdomain.com \
    --region us-central1
```

### 2. Update DNS
Add a CNAME record pointing to the Cloud Run URL provided.

### 3. Update Google OAuth
Add your custom domain to Google OAuth authorized origins:
- `https://yourdomain.com`
- `https://www.yourdomain.com`

## 🗄️ Database Setup

### 1. Create Cloud SQL Instance
```bash
gcloud sql instances create finsight-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=HDD \
    --storage-size=10GB
```

### 2. Create Database and User
```bash
gcloud sql databases create finsight --instance=finsight-db
gcloud sql users create finsight --instance=finsight-db --password=your-password
```

### 3. Get Connection String
```bash
gcloud sql instances describe finsight-db --region=us-central1
```

## 🔍 Monitoring and Logs

### 1. View Logs
```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=finsight-backend"

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=finsight-frontend"
```

### 2. Monitor Performance
- Go to GCP Console → Cloud Run
- Select your service
- View metrics and logs

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in `backend/main.py`
   - Verify origins include your domain

2. **Database Connection Issues**
   - Check `DATABASE_URL` format
   - Verify Cloud SQL instance is running
   - Check firewall rules

3. **Authentication Errors**
   - Verify Google OAuth credentials
   - Check authorized origins in Google Console
   - Verify JWT secret is set

4. **Build Failures**
   - Check Dockerfile syntax
   - Verify all dependencies in requirements.txt
   - Check build logs in Cloud Build

### Debug Commands
```bash
# Test backend health
curl https://your-backend-url/health

# Test database connection
gcloud sql connect finsight-db --user=finsight

# Check service status
gcloud run services describe finsight-backend --region=us-central1
```

## 📊 Cost Optimization

### 1. Resource Sizing
- Backend: 1Gi RAM, 1 CPU (adjust based on load)
- Frontend: 512Mi RAM, 1 CPU (sufficient for static content)
- Database: db-f1-micro (free tier)

### 2. Scaling
- Set appropriate `--max-instances` to control costs
- Use `--min-instances=0` for services that can scale to zero

### 3. Monitoring
- Set up billing alerts
- Monitor resource usage in GCP Console

## 🔄 Updates and Rollbacks

### 1. Deploy New Version
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/finsight-backend:v2 .
gcloud run deploy finsight-backend \
    --image gcr.io/YOUR_PROJECT_ID/finsight-backend:v2
```

### 2. Rollback
```bash
# Deploy previous version
gcloud run deploy finsight-backend \
    --image gcr.io/YOUR_PROJECT_ID/finsight-backend:v1
```

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🆘 Support

For issues specific to this deployment:
1. Check the troubleshooting section above
2. Review GCP Console logs
3. Check GitHub Actions workflow runs
4. Verify all environment variables are set correctly 