# FinSight Authentication Setup Guide

This guide will help you set up Google OAuth authentication for FinSight.

## Prerequisites

1. Google Cloud Console account
2. Node.js and Python environment set up
3. FinSight backend and frontend running

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

### 1.2 Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Configure the OAuth consent screen:
   - Choose **External** (unless you have Google Workspace)
   - Fill in app name: "FinSight"
   - Add your email as developer contact
   - Add scopes: `email`, `profile`, `openid`
4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "FinSight Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)

### 1.3 Get Your Client ID
1. Copy the **Client ID** (not the secret)
2. Save it for the next steps

## Step 2: Backend Configuration

### 2.1 Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2.2 Environment Variables
Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///./finsight.db

# API Keys (get these from your providers)
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here

# JWT Configuration (generate a strong secret key)
JWT_SECRET_KEY=your_super_secret_jwt_key_change_in_production

# Optional: For production PostgreSQL
# DATABASE_URL=postgresql://username:password@localhost/finsight
```

### 2.3 Generate JWT Secret
Generate a secure JWT secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Step 3: Frontend Configuration

### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

### 3.2 Environment Variables
Create a `.env` file in the frontend directory:

```env
# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here

# API Base URL (for development, leave empty to use relative URLs)
# REACT_APP_API_BASE_URL=http://localhost:8000
```

## Step 4: Testing the Setup

### 4.1 Start the Backend
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 4.2 Start the Frontend
```bash
cd frontend
npm start
```

### 4.3 Test Authentication
1. Open `http://localhost:3000`
2. Try logging in with Google (should see the Google login button)
3. After login, you should see your email in the header
4. The "Journey History" tab should be visible
5. Try running a financial analysis - it should save automatically

## Step 5: Security Considerations

### 5.1 Production Setup
- Use HTTPS in production
- Set strong JWT secret keys
- Configure proper CORS origins
- Use environment-specific Google OAuth credentials
- Consider using PostgreSQL instead of SQLite

### 5.2 OAuth Security
- Regularly rotate OAuth secrets
- Monitor OAuth usage in Google Cloud Console
- Implement proper logout functionality
- Use secure cookie settings in production

## Step 6: Troubleshooting

### Common Issues

#### 1. "Google is not defined" Error
- Ensure the Google Identity Services script is loaded
- Check browser console for network errors
- Verify the client ID is correct

#### 2. OAuth Authentication Failed
- Verify the Google client ID matches exactly
- Check that the domain is in authorized origins
- Ensure the Google+ API is enabled

#### 3. Backend Authentication Errors
- Verify JWT secret is set
- Check that Google client ID matches frontend
- Ensure dependencies are installed correctly

#### 4. CORS Issues
- Verify CORS origins in backend configuration
- Check that frontend URL matches CORS settings

### Debug Steps
1. Check browser developer console for errors
2. Verify API responses in Network tab
3. Check backend logs for authentication errors
4. Test API endpoints with curl/Postman

## Features Enabled

✅ **Google OAuth Login/Logout**
- Secure authentication with Google accounts
- JWT token-based session management

✅ **Protected Journey History**
- Only authenticated users can view journey history
- User-specific journey data protection

✅ **Flexible Journey Creation**
- Anonymous users can run financial analysis
- Email collection for non-authenticated users
- Automatic saving for authenticated users

✅ **Privacy Policy Integration**
- Comprehensive privacy policy page
- User consent for data processing
- GDPR-compliant data handling

✅ **Responsive Authentication UI**
- Desktop and mobile login options
- Contextual authentication prompts
- Clean logout functionality

## Support

If you encounter issues:
1. Check this documentation
2. Review Google Cloud Console settings
3. Verify environment variables
4. Check application logs
5. Test with a fresh browser session 