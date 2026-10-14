import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Shield, Users, Mail, Compass, Camera, DollarSign, Send, Ban, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Message form
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        apiRequest('/admin/stats'),
        apiRequest('/admin/users')
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data.users || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      const res = await apiRequest(`/admin/users/${userId}/status`, { method: 'PUT' });
      addToast(res.message);
      fetchAdminData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgBody.trim()) return;

    setSendingMsg(true);
    try {
      const res = await apiRequest('/admin/messages', {
        method: 'POST',
        body: JSON.stringify({
          title: msgTitle,
          message: msgBody,
          recipientUserId: isBroadcast ? null : recipientId,
          isBroadcast
        })
      });
      addToast(res.message);
      setMsgTitle('');
      setMsgBody('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-inline">
        <div className="spinner" />
        Loading admin intelligence portal...
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div>
        <div className="chip chip-admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '4px 12px', borderRadius: 20 }}>
          <Shield size={14} /> ADMINISTRATOR PORTAL
        </div>
        <h1 className="page-title">Platform Administration</h1>
        <p className="page-subtitle">
          Real-time metrics, registered traveler moderation, and system broadcasts.
        </p>
      </div>

      {/* 32. System Statistics Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Registered Users', val: stats?.users?.total_users || 0, icon: Users, color: '#3B82F6' },
          { label: 'Active Users', val: stats?.users?.active_users || 0, icon: CheckCircle, color: '#10B981' },
          { label: 'Total Trips Created', val: stats?.trips?.total_trips || 0, icon: Compass, color: '#8B5CF6' },
          { label: 'Total Photos Uploaded', val: stats?.photos || 0, icon: Camera, color: '#EC4899' },
          { label: 'Destinations Explored', val: stats?.destinations || 0, icon: Shield, color: '#F59E0B' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-panel stat-card">
              <div className="stat-icon" style={{
                background: `${item.color}15`,
                border: `1px solid ${item.color}35`
              }}>
                <Icon size={22} color={item.color} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px' }}>
                  {item.val}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 33. Admin User Management */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Registered Travelers</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          Moderation list and account status toggles.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '12px 16px' }}>USER</th>
                <th style={{ padding: '12px 16px' }}>EMAIL</th>
                <th style={{ padding: '12px 16px' }}>ROLE</th>
                <th style={{ padding: '12px 16px' }}>TRIPS</th>
                <th style={{ padding: '12px 16px' }}>STATUS</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                    {u.name} <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>({u.username})</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`chip ${u.role === 'ADMIN' ? 'chip-admin' : 'chip-user'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>{u.trips_count || 0}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`chip ${u.is_active ? 'chip-active' : 'chip-inactive'}`}>
                      {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`chip ${u.is_active ? 'chip-inactive' : 'chip-active'}`}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 34. Admin Messages and Announcements */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Send Notification / Announcement</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          Deliver important announcements directly to user notification centers.
        </p>

        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={isBroadcast}
                onChange={() => setIsBroadcast(true)}
              />
              Broadcast to All Active Users
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={!isBroadcast}
                onChange={() => setIsBroadcast(false)}
              />
              Target Specific User
            </label>
          </div>

          {!isBroadcast && (
            <div>
              <label className="field-label">Select Recipient</label>
              <select
                value={recipientId}
                onChange={e => setRecipientId(e.target.value)}
                required={!isBroadcast}
                className="glass-input"
              >
                <option value="">-- Choose User --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="field-label">Message Title</label>
            <input
              type="text"
              placeholder="e.g. System Maintenance or New Holiday Feature"
              value={msgTitle}
              onChange={e => setMsgTitle(e.target.value)}
              required
              className="glass-input"
            />
          </div>

          <div>
            <label className="field-label">Message Content</label>
            <textarea
              placeholder="Write announcement body..."
              value={msgBody}
              onChange={e => setMsgBody(e.target.value)}
              required
              className="glass-input"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={sendingMsg}
            className="glass-btn-primary"
            style={{ alignSelf: 'flex-start', padding: '12px 24px' }}
          >
            <Send size={16} />
            <span>{sendingMsg ? 'Dispatching...' : 'Dispatch Notification'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
