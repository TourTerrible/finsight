# Firebase Hosting Setup for FinSight

This guide helps you set up Firebase Hosting for your FinSight frontend.

## 🚀 Quick Setup

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase in Frontend Directory
```bash
cd frontend
firebase init hosting
```

### 4. Configuration Options
When prompted, choose:
- **Select a project**: Choose your Firebase project (or create new)
- **What do you want to use as your public directory?**: `build`
- **Configure as a single-page app (rewrite all urls to /index.html)?**: `Yes`
- **Set up automatic builds and deploys with GitHub?**: `No` (we'll handle this with GitHub Actions)
- **File build/index.html already exists. Overwrite?**: `No`

### 5. Update Project Configuration
Edit `frontend/.firebaserc`:
```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

## 🔧 Manual Configuration

### Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to **Hosting** section
4. Click **Get started**

### Project Structure
After initialization, your frontend directory should contain:
```
frontend/
├── .firebaserc          # Firebase project configuration
├── firebase.json        # Firebase hosting configuration
├── public/              # Static files (will be replaced by build/)
└── ...                  # Other React files
```

## 🚀 Deployment

### Local Build and Deploy
```bash
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Automated Deployment
The GitHub Actions workflow will automatically:
1. Build the React app
2. Deploy to Firebase Hosting
3. Update the live site

## 🌐 Custom Domain

### Add Custom Domain
1. Go to Firebase Console → Hosting
2. Click **Add custom domain**
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Follow DNS verification steps
5. Firebase automatically provides SSL certificates

### DNS Configuration
Add these records to your domain provider:
- **Type**: CNAME
- **Name**: `app` (or subdomain of your choice)
- **Value**: `your-project-id.web.app`

## 📊 Monitoring

### Firebase Analytics
- View in Firebase Console → Analytics
- Track user engagement and performance
- Monitor page views and user behavior

### Hosting Performance
- Check hosting dashboard for performance metrics
- Monitor CDN performance
- View deployment history

## 🔧 Troubleshooting

### Common Issues

#### Build Fails
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Deploy Fails
```bash
# Check Firebase login
firebase login --reauth

# Verify project configuration
firebase projects:list
firebase use your-project-id
```

#### Custom Domain Issues
- Verify DNS records are propagated
- Check Firebase Console for verification status
- Ensure domain is not used by another Firebase project

## 📚 Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Custom Domain Setup](https://firebase.google.com/docs/hosting/custom-domain)
- [Firebase Console](https://console.firebase.google.com/)

## 🆘 Support

For Firebase-specific issues:
1. Check Firebase Console for error messages
2. Review Firebase CLI output
3. Check [Firebase Support](https://firebase.google.com/support)
4. Open GitHub issues for code-related problems 