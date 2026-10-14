import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest, BASE_URL } from '../services/api';
import RealTimeWidget from './RealTimeWidget';
import {
  Compass, Map, Heart, Users, Shield, Bell, LogOut,
  User, CheckCheck, Menu, X, PlusCircle, Sun, Moon,
  Plane, CalendarDays
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, onOpenCreateTrip }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const calendarRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest('/notifications');
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'my-trips', label: 'My Trips', icon: Map },
    { id: 'shared-with-me', label: 'Shared With Me', icon: Users },
    { id: 'memories', label: 'Memories', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ id: 'admin', label: 'Admin Portal', icon: Shield, badge: 'ADMIN' });
  }

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`)
    : null;

  const goTo = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const renderNavLinks = (extraClass = '') =>
    navItems.map(item => {
      const Icon = item.icon;
      const active = currentView === item.id;
      return (
        <button
          key={item.id}
          onClick={() => goTo(item.id)}
          className={`nav-link ${active ? 'active' : ''} ${extraClass}`.trim()}
        >
          <Icon size={18} />
          <span>{item.label}</span>
          {item.badge && (
            <span className="chip chip-admin">{item.badge}</span>
          )}
        </button>
      );
    });

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <div className="brand" onClick={() => goTo('dashboard')}>
          <div className="brand-mark">
            <Plane color="#fff" size={22} style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <div>
            <div className="brand-title">TRAVAL</div>
            <div className="brand-sub">Travel & Journal</div>
          </div>
        </div>

        <div className="desktop-nav">
          {renderNavLinks()}
        </div>

        <div className="nav-actions">
          <button
            onClick={onOpenCreateTrip}
            className="glass-btn-primary"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            <PlusCircle size={18} />
            <span className="nav-plan-label">Plan Trip</span>
          </button>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Calendar toggle */}
          <div style={{ position: 'relative' }} ref={calendarRef}>
            <button
              type="button"
              className={`theme-toggle${showCalendar ? ' active' : ''}`}
              onClick={() => setShowCalendar(prev => !prev)}
              title="Open calendar"
              aria-label="Open calendar"
            >
              <CalendarDays size={18} />
            </button>

            {showCalendar && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                zIndex: 9999,
                minWidth: '340px',
                animation: 'fadeSlideDown 0.22s ease'
              }}>
                <RealTimeWidget />
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              className="icon-btn"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#F43F5E',
                  boxShadow: '0 0 8px #F43F5E'
                }} />
              )}
            </button>

            {showNotifMenu && (
              <div className="glass-panel notif-menu">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>Notifications ({unreadCount})</div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="link-btn">
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <p className="empty-copy" style={{ margin: 0 }}>No notifications yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{n.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{n.message}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                          {new Date(n.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="avatar-btn"
            onClick={() => goTo('profile')}
            title="Profile"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{user?.name ? user.name[0].toUpperCase() : 'U'}</span>
            )}
          </div>

          <button onClick={logout} title="Logout" className="icon-btn">
            <LogOut size={18} />
          </button>

          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-drawer">
          {renderNavLinks()}
        </div>
      )}
    </nav>
  );
}
