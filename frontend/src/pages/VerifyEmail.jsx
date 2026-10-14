
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';

export default function VerifyEmail() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification link is missing its token. Please request a new verification email.');
      return;
    }

    apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    })
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully! You can now log in.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.message || 'Email verification failed. Please request a new link.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <div className="mb-4 text-4xl">
          {status === 'verifying' ? '⏳' : status === 'success' ? '✅' : '❌'}
        </div>

        <h1 className="mb-3 text-2xl font-bold text-white">
          {status === 'verifying'
            ? 'Verifying your email'
            : status === 'success'
            ? 'Email verified!'
            : 'Verification failed'}
        </h1>

        <p className="text-slate-300">{message}</p>

        {status !== 'verifying' && (
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}
