import React, { useState, useEffect } from 'react';
import { apiRequest, BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Camera, Heart, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MemoriesGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(null);
  const { addToast } = useToast();

  const fetchMemories = async () => {
    try {
      const res = await apiRequest('/photos/memories');
      if (res.success) setPhotos(res.data.photos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleToggleFavorite = async (photoId, e) => {
    e.stopPropagation();
    try {
      const res = await apiRequest(`/photos/${photoId}/favorite`, { method: 'PUT' });
      addToast(res.message);
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, is_favorite: res.data.isFavorite } : p));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="page-wrap">
      <div>
        <h1 className="page-title">Global Travel Memories 📷</h1>
        <p className="page-subtitle">
          Every unforgettable landscape and candid snapshot from all your adventures.
        </p>
      </div>

      {loading && (
        <div className="loading-inline">
          <div className="spinner" />
          Loading memories...
        </div>
      )}

      {photos.length === 0 && !loading && (
        <div className="glass-panel empty-state">
          <Camera size={44} color="var(--primary)" style={{ margin: '0 auto 14px' }} />
          <h3>No travel memories yet</h3>
          <p>
            Upload photos inside your trips to curate your permanent memory wall!
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => setActivePhotoIdx(index)}
            className="glass-panel hover-lift"
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              height: '300px'
            }}
          >
            
<img
  src={
    photo.image_url?.startsWith('http')
      ? photo.image_url
      : `${BASE_URL}${photo.image_url}`
  }
  alt={photo.caption || 'Memory'}
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>

            {/* Gradient Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    {photo.trip_title}
                  </div>
                  {photo.destination_name && (
                    <div style={{ fontSize: '11px', color: '#93C5FD' }}>
                      📍 {photo.destination_name}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => handleToggleFavorite(photo.id, e)}
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    padding: '8px',
                    borderRadius: '50%',
                    color: photo.is_favorite ? '#F43F5E' : '#fff'
                  }}
                >
                  <Heart size={16} fill={photo.is_favorite ? '#F43F5E' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {activePhotoIdx !== null && (
        <div className="lightbox">
          <button
            onClick={() => setActivePhotoIdx(null)}
            className="lightbox-btn"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              width: '40px',
              height: '40px'
            }}
          >
            <X size={22} />
          </button>

          {/* Previous Button */}
          {activePhotoIdx > 0 && (
            <button
              onClick={() => setActivePhotoIdx(activePhotoIdx - 1)}
              className="lightbox-btn"
              style={{
                position: 'absolute',
                left: '24px',
                width: '44px',
                height: '44px'
              }}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Active Image */}
          <div style={{ textAlign: 'center', maxWidth: '85vw', maxHeight: '85vh' }}>
            <img
              src={`${BASE_URL}${photos[activePhotoIdx].image_url}`}
              alt="Memory detail"
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px', objectFit: 'contain' }}
            />
            {photos[activePhotoIdx].caption && (
              <p style={{ marginTop: '16px', color: '#fff', fontSize: '16px', fontWeight: 500 }}>
                {photos[activePhotoIdx].caption}
              </p>
            )}
            <div style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '4px' }}>
              {photos[activePhotoIdx].trip_title} • {photos[activePhotoIdx].created_at ? new Date(photos[activePhotoIdx].created_at).toLocaleDateString() : ''}
            </div>
          </div>

          {/* Next Button */}
          {activePhotoIdx < photos.length - 1 && (
            <button
              onClick={() => setActivePhotoIdx(activePhotoIdx + 1)}
              className="lightbox-btn"
              style={{
                position: 'absolute',
                right: '24px',
                width: '44px',
                height: '44px'
              }}
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
