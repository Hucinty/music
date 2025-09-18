
import React from 'react';
import { UserRole } from '../types';
import { GoogleIcon } from './icons/GoogleIcon';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-text font-sans">
      <div className="w-full max-w-md p-8 space-y-8 bg-brand-surface rounded-xl shadow-lg">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-brand-primary">MeloVibe</h1>
            <p className="mt-2 text-brand-secondary">Your personal music space.</p>
        </div>
        <div className="space-y-4">
          <p className="text-center text-sm text-brand-secondary">
            Sign in to continue. This is a simulated login for demonstration purposes.
          </p>
          <button
            onClick={() => onLogin('user')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 font-semibold text-brand-text bg-brand-elevated rounded-lg hover:bg-opacity-80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-primary"
          >
            <GoogleIcon className="w-5 h-5" />
            Sign in as User
          </button>
          <button
            onClick={() => onLogin('admin')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 font-semibold text-brand-text bg-brand-elevated rounded-lg hover:bg-opacity-80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-primary"
          >
             <GoogleIcon className="w-5 h-5" />
            Sign in as Admin
          </button>
        </div>
      </div>
    </div>
  );
};
