#!/bin/bash

# FinSight Deployment Script for GCP + Firebase
# This script deploys the backend to Cloud Run and frontend to Firebase Hosting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"your-gcp-project-id"}
REGION=${GCP_REGION:-"asia-south1"}
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-"your-firebase-project-id"}

echo -e "${GREEN}🚀 Starting FinSight deployment...${NC}"

# Check if required tools are installed
check_requirements() {
    echo -e "${YELLOW}📋 Checking requirements...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ Google Cloud CLI (gcloud) is not installed${NC}"
        echo "Install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        echo -e "${RED}❌ Firebase CLI is not installed${NC}"
        echo "Install with: npm install -g firebase-tools"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo "Install from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Authenticate with Google Cloud
authenticate_gcp() {
    echo -e "${YELLOW}🔐 Authenticating with Google Cloud...${NC}"
    
    # Check if already authenticated
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${GREEN}✅ Already authenticated with Google Cloud${NC}"
    else
        gcloud auth login
    fi
    
    # Set project
    gcloud config set project $PROJECT_ID
    echo -e "${GREEN}✅ Project set to: $PROJECT_ID${NC}"
}

# Enable required APIs
enable_apis() {
    echo -e "${YELLOW}🔌 Enabling required APIs...${NC}"
    
    APIs=(
        "run.googleapis.com"
        "sql-component.googleapis.com"
        "sqladmin.googleapis.com"
        "secretmanager.googleapis.com"
        "cloudbuild.googleapis.com"
        "artifactregistry.googleapis.com"
    )
    
    for api in "${APIs[@]}"; do
        echo "Enabling $api..."
        gcloud services enable $api --quiet
    done
    
    echo -e "${GREEN}✅ All APIs enabled${NC}"
}

# Setup Artifact Registry
setup_artifact_registry() {
    echo -e "${YELLOW}📦 Setting up Artifact Registry...${NC}"
    
    # Create repository if it doesn't exist
    echo "Creating Artifact Registry repository..."
    gcloud artifacts repositories create finsight-repo \
        --repository-format=docker \
        --location=$REGION \
        --description="FinSight Docker repository" \
        --quiet || echo "Repository already exists"
    
    # Configure Docker authentication
    echo "Configuring Docker authentication..."
    gcloud auth configure-docker $REGION-docker.pkg.dev --quiet
    
    echo -e "${GREEN}✅ Artifact Registry setup complete${NC}"
}

# Deploy backend to Cloud Run
deploy_backend() {
    echo -e "${YELLOW}🚀 Deploying backend to Cloud Run...${NC}"
    
    # Build and push Docker image
    echo "Building backend Docker image..."
    cd backend
    
    # Build for AMD64 platform (required for Cloud Run)
    docker buildx create --use --name finsight-builder || true
    docker buildx build --platform linux/amd64 \
        -t $REGION-docker.pkg.dev/$PROJECT_ID/finsight-repo/finsight-backend:latest \
        --push .
    
    echo "✅ AMD64 image built and pushed to Artifact Registry"
    
    # Deploy to Cloud Run
    echo "Deploying to Cloud Run..."
    gcloud run deploy finsight-backend \
        --image $REGION-docker.pkg.dev/$PROJECT_ID/finsight-repo/finsight-backend:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --set-env-vars="GOOGLE_CLIENT_PROJECT_ID=$PROJECT_ID"
    
    cd ..
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe finsight-backend --region=$REGION --format='value(status.url)')
    echo -e "${GREEN}✅ Backend deployed to: $BACKEND_URL${NC}"
}

# Deploy frontend to Firebase
deploy_frontend() {
    echo -e "${YELLOW}🌐 Deploying frontend to Firebase Hosting...${NC}"
    
    cd frontend
    
    # Build the React app
    echo "Building React app..."
    npm run build
    
    # Deploy to Firebase
    echo "Deploying to Firebase..."
    firebase deploy --project $FIREBASE_PROJECT_ID --only hosting
    
    cd ..
    
    echo -e "${GREEN}✅ Frontend deployed to Firebase Hosting${NC}"
}

# Setup Cloud SQL database
setup_database() {
    echo -e "${YELLOW}🗄️ Setting up Cloud SQL database...${NC}"
    
    # Create Cloud SQL instance
    echo "Creating Cloud SQL instance..."
    gcloud sql instances create finsight-db \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-type=SSD \
        --storage-size=10GB \
        --backup-start-time=02:00 \
        --enable-backup \
        --quiet || echo "Instance already exists"
    
    # Create database
    echo "Creating database..."
    gcloud sql databases create finsight \
        --instance=finsight-db \
        --quiet || echo "Database already exists"
    
    # Create user
    echo "Creating database user..."
    gcloud sql users create finsight \
        --instance=finsight-db \
        --password="your-secure-password" \
        --quiet || echo "User already exists"
    
    echo -e "${GREEN}✅ Database setup complete${NC}"
}

# Main deployment flow
main() {
    check_requirements
    authenticate_gcp
    enable_apis
    setup_artifact_registry
    deploy_backend
    deploy_frontend
    setup_database
    
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Update your .env file with the backend URL: $BACKEND_URL"
    echo "2. Configure Firebase project ID in frontend/.firebaserc"
    echo "3. Set up GitHub repository secrets for CI/CD"
    echo "4. Test your application"
}

# Run main function
main "$@" 