import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
// Allow referencing process.env in CRA TypeScript without Node types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onSuccess, 
  onError,
  className = "" 
}) => {
  const { login } = useAuth();
  const buttonRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Identity Services script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  const initializeGoogleSignIn = () => {
    if (!buttonRef.current || !window.google) return;

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    console.log(clientId);

    const bootstrap = (cid: string) => {
      window.google?.accounts.id.initialize({
        client_id: cid,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
      });

      if (buttonRef.current) {
        window.google?.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
        });
      }
    };

    if (clientId) {
      bootstrap(clientId);
    } else {
      fetch('/api/v1/auth/google-client-id')
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to load GOOGLE_CLIENT_ID');
          const data = await res.json();
          if (!data.client_id) throw new Error('Missing client_id in backend response');
          bootstrap(data.client_id);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Google Client ID not available:', err);
          if (buttonRef.current) {
            buttonRef.current.innerHTML = '<div style="color:#b91c1c;font-size:14px;text-align:center;width:100%">Google Sign-In unavailable</div>';
          }
        });
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      await login(response.credential);
      onSuccess?.();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      onError?.(error);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div ref={buttonRef} className="w-full flex justify-center"></div>
    </div>
  );
};

export default GoogleLoginButton; 