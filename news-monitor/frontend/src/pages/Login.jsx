import React, { useState } from 'react';
import { useGoogleLogin, GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import api from '../api/client';
import { setCredentials } from '../redux/slices/authSlice';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/google', { idToken: credentialResponse.credential });
      console.log(data.accessToken);
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center mb-4">
          <Newspaper className="text-white" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Intelligent News Monitoring</h1>
        <p className="text-sm text-gray-500 mt-2 mb-8">
          Centralized industry news aggregation, search, and reporting — for Steel, Mining, Coal,
          and allied sectors.
        </p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('Google sign-in was cancelled or failed.')}
            useOneTap
          />
        </div>

        {loading && <p className="text-sm text-gray-500 mt-4 animate-pulse">Signing you in…</p>}
        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <p className="text-xs text-gray-400 mt-8">
          Sign-in is restricted to Google accounts. No passwords are stored or required.
        </p>
      </div>
    </div>
  );
}
