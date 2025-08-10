import React from 'react';
import GoogleLoginButton from './GoogleLoginButton.tsx';

interface RunAnalysisModalProps {
  onClose: () => void;
  onProceed: (params: { method: 'google' | 'guest', email?: string }) => void;
  mode: 'signin' | 'run';
}

const RunAnalysisModal: React.FC<RunAnalysisModalProps> = ({ onClose, onProceed, mode }) => {
  const [guestEmail, setGuestEmail] = React.useState('');
  const [loading] = React.useState(false);
  const [error] = React.useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-4 text-center">How would you like to continue?</h2>
        {/* Google Login only */}
        <>
          <GoogleLoginButton
            onSuccess={() => onProceed({ method: 'google' })}
            className="w-full mb-4"
          />
        </>
        {mode === 'run' && <>
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-2 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          {/* Guest Option */}
          <button
            className="w-full bg-gray-200 text-gray-700 rounded py-2 mb-2 hover:bg-gray-300"
            onClick={() => onProceed({ method: 'guest', email: guestEmail || undefined })}
            disabled={loading}
          >
            Run as Guest
          </button>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            placeholder="(Optional) Enter your email"
            value={guestEmail}
            onChange={e => setGuestEmail(e.target.value)}
            disabled={loading}
          />
        </>}
      </div>
    </div>
  );
};

export default RunAnalysisModal; 