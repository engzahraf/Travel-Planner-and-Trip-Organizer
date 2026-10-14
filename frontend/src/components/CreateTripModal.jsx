import React, { useState } from 'react';
import { apiRequest, SUPPORTED_CURRENCIES } from '../services/api';
import { useToast } from '../context/ToastContext';
import { X, Calendar, Globe, DollarSign, Users, Image as ImageIcon, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

// ── Mini Calendar Preview Component ──────────────────────────────────────────
function MiniCalendarPreview({ startDate, endDate, onClose }) {
  const start = startDate ? new Date(startDate + 'T00:00:00') : null;
  const end = endDate ? new Date(endDate + 'T00:00:00') : null;

  // Determine initial month to show
  const initMonth = start || new Date();
  const [viewYear, setViewYear] = useState(initMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initMonth.getMonth());

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Build calendar days grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDayStatus = (day) => {
    if (!day) return 'empty';
    const cellDate = new Date(viewYear, viewMonth, day);
    if (start && end) {
      if (cellDate.getTime() === start.getTime() && cellDate.getTime() === end.getTime()) return 'single';
      if (cellDate.getTime() === start.getTime()) return 'start';
      if (cellDate.getTime() === end.getTime()) return 'end';
      if (cellDate > start && cellDate < end) return 'between';
    } else if (start && cellDate.getTime() === start.getTime()) return 'start';
    else if (end && cellDate.getTime() === end.getTime()) return 'end';
    return 'normal';
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayCount = start && end ? Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1 : null;

  return (
    <div style={{
      marginTop: '12px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '16px',
      animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '8px',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '8px',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day of week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {daysOfWeek.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((day, i) => {
          const status = getDayStatus(day);
          const isToday = day && new Date(viewYear, viewMonth, day).getTime() === today.getTime();

          let bg = 'transparent';
          let color = 'var(--text-muted)';
          let borderRadius = '8px';
          let fontWeight = 400;

          if (status === 'start' || status === 'single') {
            bg = 'linear-gradient(135deg, #6366F1, #8B5CF6)';
            color = '#fff';
            fontWeight = 700;
            borderRadius = status === 'single' ? '8px' : '8px 0 0 8px';
          } else if (status === 'end') {
            bg = 'linear-gradient(135deg, #8B5CF6, #EC4899)';
            color = '#fff';
            fontWeight = 700;
            borderRadius = '0 8px 8px 0';
          } else if (status === 'between') {
            bg = 'rgba(99,102,241,0.18)';
            color = '#A5B4FC';
            borderRadius = '0';
            fontWeight = 500;
          } else if (isToday) {
            color = '#60A5FA';
            fontWeight = 700;
          }

          return (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: '5px 2px',
                fontSize: '12px',
                background: bg,
                color,
                borderRadius,
                fontWeight,
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: (status === 'start' || status === 'end' || status === 'single') ? '0 2px 8px rgba(99,102,241,0.35)' : 'none'
              }}
            >
              {day || ''}
              {isToday && status === 'normal' && (
                <span style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#60A5FA'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
        {start && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'inline-block' }} />
            Start: {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        {end && end.getTime() !== start?.getTime() && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', display: 'inline-block' }} />
            End: {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        {dayCount && (
          <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#A5B4FC', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '20px' }}>
            {dayCount} day{dayCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function CreateTripModal({ isOpen, onClose, onTripCreated }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    country: '',
    startDate: '',
    endDate: '',
    travelersCount: 1,
    budget: '',
    currency: 'USD',
    cover: null
  });

  if (!isOpen) return null;

  // Calculate duration automatically
  let calculatedDuration = null;
  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end >= start) {
      calculatedDuration = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, cover: file });
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.country || !formData.startDate || !formData.endDate) {
      addToast('Please fill all required trip fields.', 'error');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      addToast('Start date must be before or equal to End date.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('country', formData.country);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('travelersCount', formData.travelersCount);
      data.append('budget', formData.budget || '0');
      data.append('currency', formData.currency);
      if (formData.cover) {
        data.append('cover', formData.cover);
      }

      const res = await apiRequest('/trips', {
        method: 'POST',
        body: data
      });

      addToast(res.message || 'Trip planned successfully! 🎉');
      onTripCreated(res.data?.tripId);
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-panel modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="icon-btn modal-close"
          aria-label="Close"
          style={{ width: 32, height: 32, borderRadius: '50%' }}
        >
          <X size={18} />
        </button>

        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
          Plan a New Journey 🗺️
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
          Days will be automatically generated and linked to your itinerary.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Trip Cover Image Upload */}
          <div>
            <label className="field-label">Trip Cover Photo</label>
            <div
              className="cover-upload"
              style={coverPreview ? { background: `url(${coverPreview}) center/cover no-repeat` } : undefined}
            >
              {!coverPreview && (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', pointerEvents: 'none' }}>
                  <ImageIcon size={28} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '12px' }}>Upload Cover Photo (JPG, PNG, WebP)</div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Trip Name & Country */}
          <div className="grid-2">
            <div>
              <label className="field-label">Trip Name *</label>
              <input
                type="text"
                placeholder="e.g. Summer in Tokyo"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                className="glass-input"
              />
            </div>
            <div>
              <label className="field-label">Country *</label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="e.g. Japan"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  required
                  className="glass-input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>
          </div>

          {/* Dates & Calendar Preview */}
          <div>
            <div className="grid-2">
              <div>
                <label className="field-label">Start Date *</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-dim)' }} />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="glass-input"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
              <div>
                <label className="field-label">End Date *</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-dim)' }} />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="glass-input"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
            </div>

            {/* Calendar Preview Toggle */}
            {(formData.startDate || formData.endDate) && (
              <button
                type="button"
                onClick={() => setShowCalendar(v => !v)}
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: showCalendar ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${showCalendar ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: showCalendar ? '#A5B4FC' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                {showCalendar ? <EyeOff size={13} /> : <Eye size={13} />}
                {showCalendar ? 'Hide Calendar Preview' : 'Preview Calendar 📅'}
              </button>
            )}

            {/* Calendar Preview Panel */}
            {showCalendar && (
              <MiniCalendarPreview
                startDate={formData.startDate}
                endDate={formData.endDate}
              />
            )}
          </div>

          {/* Duration Badge Banner */}
          {calculatedDuration !== null && (
            <div className="duration-banner">
              <span>Calculated Journey Duration:</span>
              <strong style={{ fontSize: '15px' }}>{calculatedDuration} Days (Auto-Generated)</strong>
            </div>
          )}

          {/* Currency, Budget & Travelers */}
          <div className="grid-3">
            <div>
              <label className="field-label">Currency</label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="glass-input"
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            
            <div>
              <label className="field-label">Budget</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--link)',
                  fontWeight: 700,
                  fontSize: '13px',
                  pointerEvents: 'none'
                }}>
                  {SUPPORTED_CURRENCIES.find(c => c.code === formData.currency)?.symbol || '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="3000"
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  className="glass-input"
                  style={{ paddingLeft: (SUPPORTED_CURRENCIES.find(c => c.code === formData.currency)?.symbol?.length > 2 ? '42px' : '32px') }}
                />
              </div>
            </div>
            <div>
              <label className="field-label">Travelers</label>
              <div style={{ position: 'relative' }}>
                <Users size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-dim)' }} />
                <input
                  type="number"
                  min="1"
                  value={formData.travelersCount}
                  onChange={e => setFormData({ ...formData, travelersCount: e.target.value })}
                  className="glass-input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="glass-btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="glass-btn-primary"
              style={{ flex: 2 }}
            >
              {loading ? 'Generating Days...' : 'Create Trip & Generate Days'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


