import React, { useState, useEffect } from 'react';
import { apiRequest, BASE_URL } from '../services/api';
import { Users, Eye, Calendar, MapPin, Compass } from 'lucide-react';

export default function SharedWithMe({ onSelectTrip }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/sharing/shared-with-me')
      .then(res => {
        if (res.success) setTrips(res.data.trips || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Shared With Me 🤝</h1>
        <p className="page-subtitle">
          Explore itineraries shared by friends and travel companions in <strong>View Only</strong> mode.
        </p>
      </div>

      {loading && (
        <div className="loading-inline">
          <div className="spinner" />
          Loading shared trips...
        </div>
      )}

      {trips.length === 0 && !loading && (
        <div className="glass-panel empty-state">
          <Users size={44} color="var(--primary)" style={{ margin: '0 auto 14px' }} />
          <h3>No shared trips yet</h3>
          <p>
            When another traveler shares their journey with your email, it will appear here.
          </p>
        </div>
      )}

      <div className="cards-grid">
        {trips.map(trip => (
          <div
            key={trip.id}
            onClick={() => onSelectTrip(trip.id)}
            className="glass-panel hover-lift"
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              height: '170px',
              position: 'relative',
              background: trip.cover_photo
                ? `url(${BASE_URL}${trip.cover_photo}) center/cover no-repeat`
                : 'var(--hero-fallback)'
            }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <span className="badge-viewonly">
                  <Eye size={12} /> VIEW ONLY
                </span>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div className="accent-text" style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> {trip.country}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', marginBottom: '8px' }}>
                {trip.title}
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '14px' }}>
                Shared by: <strong style={{ color: 'var(--text-main)' }}>{trip.owner_name}</strong>
              </div>

              <div style={{
                paddingTop: '12px',
                borderTop: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}>
                <span>{trip.start_date} → {trip.end_date}</span>
                <span className="accent-text" style={{ fontWeight: 600 }}>Explore →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
