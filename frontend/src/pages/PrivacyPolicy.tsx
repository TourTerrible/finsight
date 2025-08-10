import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <Link 
              to="/" 
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              ← Back to FinSight
            </Link>
          </div>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Privacy Policy Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to FinSight ("we," "our," or "us"). This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our AI-powered personal financial 
              planning service. Please read this privacy policy carefully. If you do not agree with the 
              terms of this privacy policy, please do not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Email address (for account identification and communication)</li>
                  <li>Financial data you provide (income, expenses, investments, goals)</li>
                  <li>Age and family information (marital status, dependents)</li>
                  <li>Currency and location preferences</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Automatically Collected Information</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Usage data and analytics</li>
                  <li>Device information and IP address</li>
                  <li>Browser type and version</li>
                  <li>Session information and timestamps</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>To provide personalized financial planning and AI-powered advice</li>
              <li>To generate financial projections and simulate scenarios</li>
              <li>To save and track your financial journey history</li>
              <li>To improve our service and develop new features</li>
              <li>To send important updates and notifications about your account</li>
              <li>To ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication using Google OAuth 2.0</li>
              <li>Regular security audits and monitoring</li>
              <li>Limited access to personal data on a need-to-know basis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Services</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Services</h3>
                <p className="text-gray-700">
                  We use OpenAI and Google Gemini to provide AI-powered financial advice. Your financial 
                  data may be processed by these services to generate personalized recommendations.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication</h3>
                <p className="text-gray-700">
                  We use Google OAuth for secure authentication. Google's privacy policy applies to 
                  their authentication services.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed 
              to provide you services. You may request deletion of your account and associated data 
              at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Right to access your personal data</li>
              <li>Right to correct inaccurate data</li>
              <li>Right to delete your data</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use essential cookies and local storage to maintain your login session and preferences. 
              We do not use tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for individuals under the age of 18. We do not knowingly 
              collect personal information from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes 
              by posting the new privacy policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@finsight.ai<br/>
                <strong>Address:</strong> [Your Company Address]<br/>
                <strong>Phone:</strong> [Your Phone Number]
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Return to FinSight
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 