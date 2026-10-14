import React, { useState, useEffect } from 'react';
import { apiRequest, BASE_URL, formatCurrency } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Compass, Plus, Calendar, MapPin, Wallet,
  Camera, ArrowRight, TrendingUp, CheckCircle, Clock
} from 'lucide-react';

export default function Dashboard({ onOpenCreateTrip, onSelectTrip }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/trips')
      .then(res => {
        if (res.success) setTrips(res.data.trips || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ongoingTrips = trips.filter(t => t.status === 'ONGOING');
  const upcomingTrips = trips.filter(t => t.status === 'UPCOMING');
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');
  const currentTrip = ongoingTrips[0] || upcomingTrips[0] || null;

  // Compute travel statistics
  const totalDestinations = trips.reduce((acc, t) => acc + (parseInt(t.destinations_count, 10) || 0), 0);
  const totalPhotos = trips.reduce((acc, t) => acc + (parseInt(t.photos_count, 10) || 0), 0);

  return (
    <div className="page-wrap">
      {/* 24. Welcome Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name || 'Traveler'} 👋
          </h1>
          <p className="page-subtitle" style={{ fontSize: '15px' }}>
            Where does your next journey take you? Plan, explore, and record memories.
          </p>
        </div>
        <button onClick={onOpenCreateTrip} className="glass-btn-primary">
          <Plus size={18} />
          <span>Plan a New Journey</span>
        </button>
      </div>

      {/* 24. Statistics Overview Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Trips', val: trips.length, icon: Compass, color: '#3B82F6' },
          { label: 'Ongoing Journeys', val: ongoingTrips.length, icon: Clock, color: '#10B981' },
          { label: 'Completed Trips', val: completedTrips.length, icon: CheckCircle, color: '#8B5CF6' },
          { label: 'Upcoming Trips', val: upcomingTrips.length, icon: Calendar, color: '#06B6D4' },
          { label: 'Destinations Visited', val: totalDestinations, icon: MapPin, color: '#F59E0B' },
          { label: 'Captured Photos', val: totalPhotos, icon: Camera, color: '#EC4899' }
        ].map((stat, i) => {
          const Icon = stat.icon;

          return (
            <div key={i} className="glass-panel stat-card">
              <div className="stat-icon" style={{
                background: `${stat.color}1A`,
                border: `1px solid ${stat.color}40`
              }}>
                <Icon size={22} color={stat.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px' }}>
                  {stat.val}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 24. Current Active Trip Feature Card */}
      {currentTrip && (
        <div className="glass-panel featured-trip">
          {/* Cover Image banner */}
          <div style={{
            position: 'relative',
            
background: currentTrip.cover_photo
  ? `url("${currentTrip.cover_photo.startsWith('http') ? currentTrip.cover_photo : `${BASE_URL}${currentTrip.cover_photo}`}") center/cover no-repeat`
  : 'var(--hero-fallback)',

            minHeight: '220px'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 80%)'
            }} />
            <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
              <span className={`badge badge-${currentTrip.status.toLowerCase()}`}>
                {currentTrip.status}
              </span>
            </div>
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
              <div style={{ fontSize: '13px', color: '#93C5FD', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> {currentTrip.country}
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                {currentTrip.title}
              </h2>
            </div>
          </div>

          {/* Details & Continue Journey action */}
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} />
                  <span>{currentTrip.start_date} → {currentTrip.end_date}</span>
                </div>
                <div style={{ padding: '2px 8px', background: 'var(--surface-muted)', borderRadius: '6px' }}>
                  {currentTrip.duration_days} Days Total
                </div>
              </div>

              {/* Financial Progress */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wallet size={15} color="#60A5FA" />
                    <span>Budget Progress</span>
                  </span>
                  <span>
                    <strong>{formatCurrency(currentTrip.total_spent, currentTrip.currency)}</strong> of {formatCurrency(currentTrip.budget, currentTrip.currency)}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (parseFloat(currentTrip.total_spent) / (parseFloat(currentTrip.budget) || 1)) * 100)}%`,
                      background: parseFloat(currentTrip.total_spent) > parseFloat(currentTrip.budget) ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectTrip(currentTrip.id)}
              className="glass-btn-primary"
              style={{ alignSelf: 'flex-start', padding: '12px 28px' }}
            >
              <span>Continue Journey</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-inline" style={{ margin: 0 }}>
          <div className="spinner" />
          Loading your journeys...
        </div>
      )}

      {/* Ongoing Trips Section */}
      {ongoingTrips.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#10B981" />
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Ongoing Journeys</h2>
            </div>
            <span style={{ fontSize: '13px', color: '#10B981', fontWeight: 600 }}>
              {ongoingTrips.length} in progress
            </span>
          </div>

          <div className="cards-grid">
            {ongoingTrips.map(trip => (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)}
                className="glass-panel hover-lift"
                style={{ overflow: 'hidden', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              >
                <div style={{
                  height: '160px',
                  position: 'relative',
                  background: trip.cover_photo
                    ? `url(${BASE_URL}${trip.cover_photo}) center/cover no-repeat`
                    : 'var(--hero-fallback)'
                }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span className="badge badge-ongoing">
                      ONGOING
                    </span>
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  <div className="accent-text" style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} /> {trip.country}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', marginBottom: '12px' }}>
                    {trip.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                    <Calendar size={14} />
                    <span>{trip.start_date} → {trip.end_date} ({trip.duration_days} days)</span>
                  </div>

                  <div style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Spent: </span>
                      <strong>{formatCurrency(trip.total_spent, trip.currency)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', color: 'var(--text-dim)' }}>
                      <span>{trip.destinations_count || 0} stops</span>
                      <span>•</span>
                      <span>{trip.photos_count || 0} photos</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Trips Section */}
      {upcomingTrips.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="#3B82F6" />
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Upcoming Journeys</h2>
            </div>
            <span style={{ fontSize: '13px', color: '#60A5FA', fontWeight: 600 }}>
              {upcomingTrips.length} upcoming
            </span>
          </div>

          <div className="cards-grid">
            {upcomingTrips.map(trip => (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)}
                className="glass-panel hover-lift"
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  height: '160px',
                  position: 'relative',
                  background: currentTrip.cover_photo
  ? `url("${currentTrip.cover_photo.startsWith('http') ? currentTrip.cover_photo : `${BASE_URL}${currentTrip.cover_photo}`}") center/cover no-repeat`
  : 'var(--hero-fallback)',
                }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span className="badge badge-upcoming">
                      UPCOMING
                    </span>
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  <div className="accent-text" style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} /> {trip.country}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', marginBottom: '12px' }}>
                    {trip.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                    <Calendar size={14} />
                    <span>{trip.start_date} → {trip.end_date} ({trip.duration_days} days)</span>
                  </div>

                  <div style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Budget: </span>
                      <strong>{formatCurrency(trip.budget, trip.currency)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', color: 'var(--text-dim)' }}>
                      <span>{trip.destinations_count || 0} stops</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Trips Section */}
      {completedTrips.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#8B5CF6" />
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Completed Trips</h2>
            </div>
            <span style={{ fontSize: '13px', color: '#A78BFA', fontWeight: 600 }}>
              {completedTrips.length} completed
            </span>
          </div>

          <div className="cards-grid">
            {completedTrips.map(trip => (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)}
                className="glass-panel hover-lift"
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  height: '160px',
                  position: 'relative',
                  background: trip.cover_photo
                    ? `url(${BASE_URL}${trip.cover_photo}) center/cover no-repeat`
                    : 'var(--hero-fallback)'
                }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span className="badge badge-completed">
                      COMPLETED
                    </span>
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  <div className="accent-text" style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} /> {trip.country}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', marginBottom: '12px' }}>
                    {trip.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                    <Calendar size={14} />
                    <span>{trip.start_date} → {trip.end_date} ({trip.duration_days} days)</span>
                  </div>

                  <div style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Spent: </span>
                      <strong>{formatCurrency(trip.total_spent, trip.currency)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', color: 'var(--text-dim)' }}>
                      <span>{trip.destinations_count || 0} stops</span>
                      <span>•</span>
                      <span>{trip.photos_count || 0} photos</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State when no trips exist */}
      {trips.length === 0 && !loading && (
        <div className="glass-panel empty-state">
          <Compass size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
          <h3>No trips planned yet</h3>
          <p>
            Begin your adventure! Create your first trip itinerary and track every unforgettable stop.
          </p>
          <button onClick={onOpenCreateTrip} className="glass-btn-primary">
            <Plus size={18} /> Plan Your First Journey
          </button>
        </div>
      )}
    </div>
  );
}
