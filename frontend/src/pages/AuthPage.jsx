import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Compass, Mail, Lock, User, UserCheck, ArrowRight, Sun, Moon } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        login(res.data.token, res.data.user);
        addToast(res.message || 'Welcome back!');
      } else {
        const payload = {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        };
        const res = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        login(res.data.token, res.data.user);
        addToast(res.message || 'Account created successfully!');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <button
        type="button"
        className="theme-toggle auth-theme"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px',
        position: 'relative',
        animation: 'modalIn 0.35s ease'
      }}>
        {/* Logo and Brand Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
            marginBottom: '16px'
          }}>
            <Compass size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {isLogin ? 'Welcome Back' : 'Begin Your Journey'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            {isLogin
              ? 'Plan, track, and remember every travel moment.'
              : 'Create your personal live travel journal today.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="segmented" style={{ marginBottom: '28px' }}>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={isLogin ? 'active' : ''}
            style={{ flex: 1, padding: '10px' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={!isLogin ? 'active' : ''}
            style={{ flex: 1, padding: '10px' }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {!isLogin && (
            <div>
              <label className="field-label">Username</label>
              <div style={{ position: 'relative' }}>
                <UserCheck size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  name="username"
                  placeholder="e.g. alex_traveler"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="glass-input"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="field-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Alex Traveler"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="glass-input"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="field-label">
              {isLogin ? 'Username or Email' : 'Email Address'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-dim)' }} />
              <input
                type={isLogin ? 'text' : 'email'}
                name="email"
                placeholder={isLogin ? 'zahraf or you@travel.com' : 'you@travel.com'}
                value={formData.email}
                onChange={handleChange}
                required
                className="glass-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-dim)' }} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="glass-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="field-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="glass-input"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '14px' }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Join Travel Journal')}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-glass)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            v1.0 Live Travel Journal
          </span>
        </div>
      </div>
    </div>
  );
}
