import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest, BASE_URL } from '../services/api';
import { User, Mail, Lock, Camera, Shield, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [updatingName, setUpdatingName] = useState(false);

  // Password state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updatingPwd, setUpdatingPwd] = useState(false);

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);

    try {
      const res = await apiRequest('/users/avatar', {
        method: 'POST',
        body: data
      });
      updateUser({ avatar: res.data.avatar });
      addToast(res.message);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Handle name update
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setUpdatingName(true);
    try {
      const res = await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
      updateUser({ name: res.data.user.name });
      addToast('Profile updated successfully!');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdatingName(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    setUpdatingPwd(true);
    try {
      const res = await apiRequest('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify(pwdForm)
      });
      addToast(res.message);
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdatingPwd(false);
    }
  };

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`)
    : null;

  return (
    <div className="page-wrap" style={{ maxWidth: '800px' }}>
      <div>
        <h1 className="page-title">Account & Profile 👤</h1>
        <p className="page-subtitle">
          Manage your personal identity, avatar, and security credentials.
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Avatar with Upload button */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: '3px solid var(--primary-border)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800
            }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{user?.name ? user.name[0].toUpperCase() : 'U'}</span>
              )}
            </div>

            <label style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--primary)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
            }}>
              <Camera size={16} color="#fff" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>

          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{user?.name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> {user?.email}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <span className={`chip ${user?.role === 'ADMIN' ? 'chip-admin' : 'chip-user'}`}>
                ROLE: {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Update Name Form */}
        <form onSubmit={handleNameUpdate} style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="field-label">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="glass-input"
            />
          </div>
          <button
            type="submit"
            disabled={updatingName}
            className="glass-btn-primary"
            style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '13px' }}
          >
            {updatingName ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={18} /> Change Password
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          Ensure your account stays secure with a strong password.
        </p>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="field-label">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={pwdForm.currentPassword}
              onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              required
              className="glass-input"
            />
          </div>

          <div className="grid-2">
            <div>
              <label className="field-label">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={pwdForm.newPassword}
                onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                required
                className="glass-input"
              />
            </div>
            <div>
              <label className="field-label">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={pwdForm.confirmPassword}
                onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                required
                className="glass-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingPwd}
            className="glass-btn-primary"
            style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '13px' }}
          >
            {updatingPwd ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
