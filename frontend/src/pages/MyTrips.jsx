import ModalPortal from '../components/ModalPortal';
import React, { useState, useEffect } from 'react';
import { apiRequest, BASE_URL, formatCurrency } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Compass, Plus, Calendar, MapPin, Search, Trash2, XCircle, AlertTriangle } from 'lucide-react';

export default function MyTrips({ onOpenCreateTrip, onSelectTrip }) {
  const { addToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Cancel confirm modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tripToCancel, setTripToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadTrips = () => {
    setLoading(true);
    apiRequest('/trips')
      .then(res => {
        if (res.success) setTrips(res.data.trips || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTrips(); }, []);

  const filteredTrips = trips.filter(trip => {
    const matchesFilter = filter === 'ALL' || trip.status === filter;
    const matchesSearch = trip.title.toLowerCase().includes(search.toLowerCase()) ||
                          trip.country.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;
    setDeleting(true);
    try {
      const res = await apiRequest(`/trips/${tripToDelete.id}`, { method: 'DELETE' });
      addToast(res.message || 'Trip deleted successfully.', 'success');
      setShowDeleteModal(false);
      setTripToDelete(null);
      loadTrips();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!tripToCancel) return;
    setCancelling(true);
    try {
      const res = await apiRequest(`/trips/${tripToCancel.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      addToast(res.message || 'Trip cancelled.', 'info');
      setShowCancelModal(false);
      setTripToCancel(null);
      loadTrips();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">My Journeys 🧳</h1>
          <p className="page-subtitle">Browse and manage all your ongoing, upcoming, and completed journeys.</p>
        </div>
        <button onClick={onOpenCreateTrip} className="glass-btn-primary">
          <Plus size={18} />
          <span>Plan a Trip</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div className="segmented">
          {['ALL', 'ONGOING', 'UPCOMING', 'COMPLETED'].map(statusKey => (
            <button
              key={statusKey}
              onClick={() => setFilter(statusKey)}
              className={filter === statusKey ? 'active' : ''}
            >
              {statusKey === 'ALL' ? 'All Journeys' : statusKey.charAt(0) + statusKey.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search by trip or country..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input"
            style={{ paddingLeft: '38px', padding: '10px 14px 10px 38px', fontSize: '13px' }}
          />
        </div>
      </div>

      {loading && (
        <div className="loading-inline">
          <div className="spinner" /> Loading journeys...
        </div>
      )}

      {filteredTrips.length === 0 && !loading && (
        <div className="glass-panel empty-state">
          <Compass size={44} color="var(--primary)" style={{ margin: '0 auto 14px' }} />
          <h3>No journeys found</h3>
          <p>{search ? 'Try adjusting your search criteria.' : 'Create a new trip to start planning your days!'}</p>
          <button onClick={onOpenCreateTrip} className="glass-btn-primary">
            <Plus size={18} /> Plan a Trip
          </button>
        </div>
      )}

      {/* Trip Cards Grid */}
      <div className="cards-grid">
        {filteredTrips.map(trip => (
          <div
            key={trip.id}
            className="glass-panel hover-lift"
            style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
          >
            {/* Cover Image — click to open trip */}
            <div
              onClick={() => onSelectTrip(trip.id)}
              style={{
                height: '170px',
                position: 'relative',
               background: trip.cover_photo
  ? `url("${trip.cover_photo.startsWith('http') ? trip.cover_photo : `${BASE_URL}${trip.cover_photo}`}") center/cover no-repeat`
  : 'var(--hero-fallback)'
              }}
            >
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <span className={`badge badge-${trip.status.toLowerCase()}`}>{trip.status}</span>
              </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '20px' }} onClick={() => onSelectTrip(trip.id)}>
              <div className="accent-text" style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> {trip.country}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', marginBottom: '10px' }}>{trip.title}</h3>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <Calendar size={14} />
                <span>{trip.start_date} → {trip.end_date}</span>
                <span style={{ color: 'var(--text-dim)' }}>({trip.duration_days} days)</span>
              </div>

              <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Spent: </span>
                  <strong>{formatCurrency(trip.total_spent, trip.currency)}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px', color: 'var(--text-dim)' }}>
                  <span>{trip.destinations_count || 0} stops</span>
                  <span>•</span>
                  <span>{trip.photos_count || 0} photos</span>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            {trip.status !== 'COMPLETED' && (
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border-glass)',
                display: 'flex',
                gap: '8px'
              }} onClick={e => e.stopPropagation()}>
                {/* Cancel Trip (only if ONGOING or UPCOMING) */}
                {(trip.status === 'ONGOING' || trip.status === 'UPCOMING') && (
                  <button
                    onClick={() => { setTripToCancel(trip); setShowCancelModal(true); }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      color: '#F59E0B',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <XCircle size={14} /> Cancel Trip
                  </button>
                )}
                {/* Delete Trip */}
                <button
                  onClick={() => { setTripToDelete(trip); setShowDeleteModal(true); }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(244, 63, 94, 0.10)',
                    border: '1px solid rgba(244, 63, 94, 0.22)',
                    color: '#F43F5E',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}

            {/* Delete option for completed trips */}
            {trip.status === 'COMPLETED' && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-glass)' }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => { setTripToDelete(trip); setShowDeleteModal(true); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(244, 63, 94, 0.10)',
                    border: '1px solid rgba(244, 63, 94, 0.22)',
                    color: '#F43F5E',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} /> Delete Trip
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Delete Confirm Modal ─── */}
      {showDeleteModal && tripToDelete && (
        <ModalPortal>
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowDeleteModal(false); setTripToDelete(null); } }}>
          <div className="glass-panel modal-fit" style={{
            width: '100%', maxWidth: '440px', padding: '32px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#F43F5E', boxShadow: '0 0 24px rgba(244, 63, 94, 0.3)'
            }}>
              <Trash2 size={30} />
            </div>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 800 }}>Delete This Trip?</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
                Are you sure you want to permanently delete <strong>"{tripToDelete.title}"</strong>?
                This will remove all destinations, expenses, photos, and journal entries.
                <br /><strong style={{ color: '#F43F5E' }}>This action cannot be undone.</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                onClick={() => { setShowDeleteModal(false); setTripToDelete(null); }}
                disabled={deleting}
                className="glass-btn-secondary"
                style={{ flex: 1, padding: '12px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrip}
                disabled={deleting}
                className="glass-btn-primary"
                style={{
                  flex: 1, padding: '12px', fontWeight: 700,
                  background: 'linear-gradient(135deg, #F43F5E, #E11D48)',
                  boxShadow: '0 4px 16px rgba(244, 63, 94, 0.4)'
                }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─── Cancel Confirm Modal ─── */}
      {showCancelModal && tripToCancel && (
        <ModalPortal>
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowCancelModal(false); setTripToCancel(null); } }}>
          <div className="glass-panel modal-fit" style={{
            width: '100%', maxWidth: '440px', padding: '32px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#F59E0B', boxShadow: '0 0 24px rgba(245, 158, 11, 0.3)'
            }}>
              <AlertTriangle size={30} />
            </div>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 800 }}>Cancel This Trip?</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
                Are you sure you want to cancel <strong>"{tripToCancel.title}"</strong>?
                The trip data will be preserved but marked as cancelled.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                onClick={() => { setShowCancelModal(false); setTripToCancel(null); }}
                disabled={cancelling}
                className="glass-btn-secondary"
                style={{ flex: 1, padding: '12px', fontWeight: 600 }}
              >
                Keep Trip
              </button>
              <button
                onClick={handleCancelTrip}
                disabled={cancelling}
                className="glass-btn-primary"
                style={{
                  flex: 1, padding: '12px', fontWeight: 700,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)'
                }}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
