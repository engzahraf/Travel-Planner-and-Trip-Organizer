import React, { useState, useEffect } from 'react';
import { apiRequest, BASE_URL, formatCurrency, getCurrencySymbol } from '../services/api';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import ModalPortal from '../components/ModalPortal';
import {
  Calendar, MapPin, Plus, CheckCircle2, Circle, ArrowLeft,
  DollarSign, Wallet, Camera, BookOpen, Share2, Eye, Trash2, Edit3,
  Clock, ShieldAlert, Sparkles, Image as ImageIcon, Send,
  XCircle, AlertTriangle, PenLine, Coins
} from 'lucide-react';

export default function TripDetailPage({ tripId, onBack }) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('journey'); // journey, overview, expenses, memories, journal, share
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddDestModal, setShowAddDestModal] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [destForm, setDestForm] = useState({ name: '', description: '', location: '', plannedTime: '', estimatedCost: 0 });

  // Add Item to Exploration state
  const [activeDestForExplore, setActiveDestForExplore] = useState(null);
  const [newItemText, setNewItemText] = useState('');

  // Expense form state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Food', expenseDate: '', notes: '' });
  const [expensesData, setExpensesData] = useState(null);
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(false);

  // Journal form state
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalForm, setJournalForm] = useState({ title: '', content: '', entryDate: '' });
  const [journalEntries, setJournalEntries] = useState([]);

  // Photos state
  const [photosList, setPhotosList] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Complete Trip modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(false);

  // Delete Trip modal state
  const [showDeleteTripModal, setShowDeleteTripModal] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(false);

  // Cancel Trip modal state
  const [showCancelTripModal, setShowCancelTripModal] = useState(false);
  const [cancellingTrip, setCancellingTrip] = useState(false);

  // Edit Destination modal state
  const [showEditDestModal, setShowEditDestModal] = useState(false);
  const [editingDest, setEditingDest] = useState(null);
  const [editDestForm, setEditDestForm] = useState({ name: '', description: '', location: '', plannedTime: '', estimatedCost: 0 });

  // Delete Destination modal state
  const [showDeleteDestModal, setShowDeleteDestModal] = useState(false);
  const [destToDelete, setDestToDelete] = useState(null);
  const [deletingDest, setDeletingDest] = useState(false);

  // Add Cost to Destination modal state
  const [showAddCostModal, setShowAddCostModal] = useState(false);
  const [costDest, setCostDest] = useState(null);
  const [costForm, setCostForm] = useState({ amount: '', category: 'Entrance Fees', notes: '' });
  const [addingCost, setAddingCost] = useState(false);

  // Upload Destination Image state
  const [uploadingDestImageId, setUploadingDestImageId] = useState(null);

  // Cover photo update state
  const [updatingCover, setUpdatingCover] = useState(false);
  const [coverHover, setCoverHover] = useState(false);

  // Sharing state
  const [collaborators, setCollaborators] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);

  const fetchTrip = async () => {
    try {
      const res = await apiRequest(`/trips/${tripId}`);
      if (res.success) {
        setTripData(res.data);
      }
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await apiRequest(`/expenses/trip/${tripId}`);
      if (res.success) setExpensesData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await apiRequest(`/photos/trip/${tripId}`);
      if (res.success) setPhotosList(res.data.photos || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJournal = async () => {
    try {
      const res = await apiRequest(`/journal/trip/${tripId}`);
      if (res.success) setJournalEntries(res.data.entries || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const res = await apiRequest(`/sharing/trip/${tripId}/collaborators`);
      if (res.success) setCollaborators(res.data.collaborators || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  useEffect(() => {
    if (activeTab === 'expenses') fetchExpenses();
    if (activeTab === 'memories') fetchPhotos();
    if (activeTab === 'journal') fetchJournal();
    if (activeTab === 'share') fetchCollaborators();
  }, [activeTab]);

  if (loading || !tripData) {
    return (
      <div className="loading-inline">
        <div className="spinner" />
        Loading journey details...
      </div>
    );
  }

  const { trip, isReadOnly, days } = tripData;

  // 16. Done Exploring Workflow Handler
  const handleDoneExploring = async (destId) => {
    try {
      const res = await apiRequest(`/destinations/${destId}/complete`, { method: 'POST' });
      addToast(res.message, 'success');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // 17. Toggle Checklist Item
  const handleToggleChecklist = async (itemId) => {
    try {
      const res = await apiRequest(`/exploration/${itemId}/toggle`, { method: 'PUT' });
      addToast(res.message, 'info');
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // Add Exploration item
  const handleAddExplorationItem = async (e, destId) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    try {
      await apiRequest(`/destinations/${destId}/exploration`, {
        method: 'POST',
        body: JSON.stringify({ itemText: newItemText })
      });
      setNewItemText('');
      setActiveDestForExplore(null);
      addToast('Exploration item added!');
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // Add Destination
  const handleAddDestination = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/days/${selectedDayId}/destinations`, {
        method: 'POST',
        body: JSON.stringify(destForm)
      });
      setShowAddDestModal(false);
      setDestForm({ name: '', description: '', location: '', plannedTime: '', estimatedCost: 0 });
      addToast('Destination added to itinerary!');
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // Add Expense
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/expenses/trip/${tripId}`, {
        method: 'POST',
        body: JSON.stringify(expenseForm)
      });
      setShowExpenseModal(false);
      setExpenseForm({ title: '', amount: '', category: 'Food', expenseDate: '', notes: '' });
      addToast('Expense recorded successfully!');
      fetchExpenses();
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // Delete Expense
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setDeletingExpense(true);
    try {
      const res = await apiRequest(`/expenses/${expenseToDelete.id}`, { method: 'DELETE' });
      addToast(res.message || 'Expense deleted successfully.', 'success');
      setShowDeleteExpenseModal(false);
      setExpenseToDelete(null);
      fetchExpenses();
      fetchTrip();
    } catch (e) {
      addToast(e.message || 'Failed to delete expense', 'error');
    } finally {
      setDeletingExpense(false);
    }
  };

  // Add Journal Entry
  const handleAddJournalSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/journal/trip/${tripId}`, {
        method: 'POST',
        body: JSON.stringify(journalForm)
      });
      setShowJournalModal(false);
      setJournalForm({ title: '', content: '', entryDate: '' });
      addToast('Story saved in journal! ✍️');
      fetchJournal();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // Upload Photos
  const handlePhotosUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const data = new FormData();
      for (let i = 0; i < files.length; i++) {
        data.append('photos', files[i]);
      }
      await apiRequest(`/photos/trip/${tripId}`, {
        method: 'POST',
        body: data
      });
      addToast('Photos uploaded successfully! 📸');
      fetchPhotos();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Share user search
  const handleSearchUsers = async (query) => {
    setSearchUserQuery(query);
    if (query.trim().length < 2) {
      setSearchedUsers([]);
      return;
    }
    try {
      const res = await apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
      if (res.success) setSearchedUsers(res.data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareWithUser = async (targetUserId) => {
    try {
      const res = await apiRequest(`/sharing/trip/${tripId}/share`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      });
      addToast(res.message);
      setSearchUserQuery('');
      setSearchedUsers([]);
      fetchCollaborators();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleRemoveShare = async (targetUserId) => {
    try {
      const res = await apiRequest(`/sharing/trip/${tripId}/share/${targetUserId}`, {
        method: 'DELETE'
      });
      addToast(res.message);
      fetchCollaborators();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // Complete entire trip handler
  const handleCompleteTrip = async () => {
    setCompletingTrip(true);
    try {
      const res = await apiRequest(`/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      setShowCompleteModal(false);
      addToast(res.message || 'Trip successfully marked as COMPLETED! 🎉', 'success');
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setCompletingTrip(false);
    }
  };

  // Delete entire trip handler
  const handleDeleteTrip = async () => {
    setDeletingTrip(true);
    try {
      const res = await apiRequest(`/trips/${tripId}`, { method: 'DELETE' });
      addToast(res.message || 'Trip deleted.', 'success');
      setShowDeleteTripModal(false);
      onBack();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setDeletingTrip(false);
    }
  };

  // Cancel trip handler
  const handleCancelTrip = async () => {
    setCancellingTrip(true);
    try {
      const res = await apiRequest(`/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      addToast(res.message || 'Trip cancelled.', 'info');
      setShowCancelTripModal(false);
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setCancellingTrip(false);
    }
  };

  // Edit destination handler — open modal with prefilled values
  const openEditDestModal = (dest) => {
    setEditingDest(dest);
    setEditDestForm({
      name: dest.name || '',
      description: dest.description || '',
      location: dest.location || '',
      plannedTime: dest.planned_time || '',
      estimatedCost: dest.estimated_cost || 0
    });
    setShowEditDestModal(true);
  };

  const handleEditDestSubmit = async (e) => {
    e.preventDefault();
    if (!editingDest) return;
    try {
      await apiRequest(`/destinations/${editingDest.id}`, {
        method: 'PUT',
        body: JSON.stringify(editDestForm)
      });
      addToast('Destination updated!', 'success');
      setShowEditDestModal(false);
      setEditingDest(null);
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  // Delete destination handler
  const handleDeleteDest = async () => {
    if (!destToDelete) return;
    setDeletingDest(true);
    try {
      const res = await apiRequest(`/destinations/${destToDelete.id}`, { method: 'DELETE' });
      addToast(res.message || 'Destination deleted.', 'success');
      setShowDeleteDestModal(false);
      setDestToDelete(null);
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setDeletingDest(false);
    }
  };

  // Add cost to destination (creates expense linked to destination)
  const handleAddCostSubmit = async (e) => {
    e.preventDefault();
    if (!costDest || !costForm.amount) return;
    setAddingCost(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await apiRequest(`/expenses/trip/${tripId}`, {
        method: 'POST',
        body: JSON.stringify({
          title: `${costDest.name} cost`,
          amount: costForm.amount,
          category: costForm.category,
          expenseDate: today,
          destinationId: costDest.id,
          notes: costForm.notes || `Expense for destination: ${costDest.name}`
        })
      });
      addToast(`Cost of ${getCurrencySymbol(trip?.currency)}${costForm.amount} added for "${costDest.name}" and recorded as expense! 💰`, 'success');
      setShowAddCostModal(false);
      setCostDest(null);
      setCostForm({ amount: '', category: 'Entrance Fees', notes: '' });
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setAddingCost(false);
    }
  };

  // Upload Destination Image
  const handleUploadDestImage = async (destId, file) => {
    if (!file) return;
    setUploadingDestImageId(destId);
    try {
      const data = new FormData();
      data.append('image', file);
      const res = await apiRequest(`/destinations/${destId}/image`, {
        method: 'POST',
        body: data
      });
      addToast(res.message || 'Destination photo uploaded successfully! 📷', 'success');
      fetchTrip();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setUploadingDestImageId(null);
    }
  };

  // Update Cover Photo
  const handleCoverPhotoUpdate = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpdatingCover(true);
    try {
      const data = new FormData();
      data.append('cover', file);
      const res = await apiRequest(`/trips/${tripId}`, {
        method: 'PUT',
        body: data
      });
      addToast(res.message || 'Cover photo updated! 🖼️', 'success');
      fetchTrip();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdatingCover(false);
      e.target.value = '';
    }
  };

  return (
    <div className="page-wrap" style={{ gap: '24px' }}>
      {/* Top Bar with Back Button & View Only Badge & Trip Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onBack} className="glass-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <ArrowLeft size={16} /> Back to Trips
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isReadOnly && (
            <div className="badge-viewonly" style={{ padding: '6px 14px', fontSize: '13px', borderRadius: 20 }}>
              <Eye size={16} /> 👁 View Only (Shared Trip)
            </div>
          )}

          {/* Cancel / Delete trip — only for owner on non-completed trips */}
          {!isReadOnly && trip.status !== 'COMPLETED' && (
            <button
              onClick={() => setShowCancelTripModal(true)}
              style={{
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)',
                color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
              }}
            >
              <XCircle size={15} /> Cancel Trip
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={() => setShowDeleteTripModal(true)}
              style={{
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.22)',
                color: '#F43F5E', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
              }}
            >
              <Trash2 size={15} /> Delete Trip
            </button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div
        className="glass-panel"
        onMouseEnter={() => !isReadOnly && setCoverHover(true)}
        onMouseLeave={() => setCoverHover(false)}
        style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          minHeight: '220px',
          background: trip.cover_photo
  ? `linear-gradient(rgba(11,15,25,0.7), rgba(11,15,25,0.85)), url("${trip.cover_photo.startsWith('http') ? trip.cover_photo : `${BASE_URL}${trip.cover_photo}`}") center/cover no-repeat`
  : 'var(--hero-fallback)',
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}
      >
        {/* Cover Photo Change Overlay — owners only */}
        {!isReadOnly && (
          <label
            htmlFor="cover-photo-input"
            style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0, left: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: coverHover ? 'rgba(0,0,0,0.45)' : 'transparent',
              transition: 'background 0.3s ease',
              zIndex: 1,
              borderRadius: '24px'
            }}
          >
            {updatingCover ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                background: 'rgba(0,0,0,0.65)', borderRadius: '16px', padding: '20px 28px'
              }}>
                <div className="spinner" style={{ width: 28, height: 28 }} />
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Uploading...</span>
              </div>
            ) : coverHover ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                background: 'rgba(0,0,0,0.65)', borderRadius: '16px', padding: '18px 28px',
                backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)',
                animation: 'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)'
              }}>
                <Camera size={28} color="#fff" />
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>
                  {trip.cover_photo ? 'Change Cover Photo' : 'Add Cover Photo'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>JPG, PNG or WebP</span>
              </div>
            ) : null}
            <input
              id="cover-photo-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCoverPhotoUpdate}
              disabled={updatingCover}
            />
          </label>
        )}

        {/* Camera icon badge (always visible for owner when no cover) */}
        {!isReadOnly && !trip.cover_photo && !coverHover && (
          <label
            htmlFor="cover-photo-input"
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(99,102,241,0.85)', borderRadius: '10px',
              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', zIndex: 2, fontSize: '12px', fontWeight: 700, color: '#fff',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              border: '1px solid rgba(255,255,255,0.15)',
              transition: 'transform 0.2s'
            }}
          >
            <Camera size={14} /> Add Cover
          </label>
        )}

        {/* Change icon (visible when cover exists, owner not hovering) */}
        {!isReadOnly && trip.cover_photo && !coverHover && (
          <label
            htmlFor="cover-photo-input"
            title="Change cover photo"
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(0,0,0,0.55)', borderRadius: '50%',
              width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 2, color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s, transform 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.8)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Camera size={16} />
          </label>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', fontSize: '14px', fontWeight: 600 }}>
          <MapPin size={16} /> {trip.country}
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '6px', color: '#fff' }}>
          {trip.title}
        </h1>
        <div style={{ display: 'flex', gap: '20px', marginTop: '14px', color: 'var(--text-muted)', fontSize: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} /> {trip.start_date} → {trip.end_date} ({trip.duration_days} Days)
          </div>
          <div>
            <strong>Budget:</strong> {formatCurrency(trip.budget, trip.currency)}
          </div>
          <div>
            <strong>Spent:</strong> {formatCurrency(trip.total_spent, trip.currency)}
          </div>
          <div className={`badge badge-${trip.status.toLowerCase()}`}>
            {trip.status}
          </div>
        </div>
      </div>

      {/* 26. Main Trip Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border-glass)',
        padding: '6px',
        borderRadius: '16px',
        gap: '6px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'journey', label: 'Journey Timeline', icon: Sparkles },
          { id: 'expenses', label: 'Expenses & Budget', icon: Wallet },
          { id: 'memories', label: 'Photos & Memories', icon: Camera },
          { id: 'journal', label: 'Travel Journal', icon: BookOpen },
          { id: 'share', label: 'Share Trip', icon: Share2 },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                background: active ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : 'transparent',
                color: active ? '#fff' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minWidth: '150px'
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 27. Journey Timeline */}
      {activeTab === 'journey' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {days.length === 0 && (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No days found for this trip.
            </div>
          )}

          {days.map(day => (
            <div key={day.id} className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#60A5FA', fontWeight: 700, textTransform: 'uppercase' }}>
                    Day {day.day_number}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800 }}>
                    {day.date} — {day.title || `Day ${day.day_number}`}
                  </h3>
                </div>

                {!isReadOnly && trip.status !== 'COMPLETED' && (
                  <button
                    onClick={() => {
                      setSelectedDayId(day.id);
                      setShowAddDestModal(true);
                    }}
                    className="glass-btn-secondary"
                    style={{ fontSize: '13px', padding: '8px 14px' }}
                  >
                    <Plus size={16} /> Add Destination
                  </button>
                )}
              </div>

              {/* Destinations List within this Day */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {day.destinations.length === 0 ? (
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    fontSize: '13px'
                  }}>
                    {trip.status === 'COMPLETED'
                      ? 'No destinations were recorded for this day.'
                      : 'No destinations added yet for this day. Click "+ Add Destination" to map out your stops.'}
                  </div>
                ) : (
                  day.destinations.map((dest, idx) => {
                    const isCompleted = dest.status === 'COMPLETED';
                    const isOngoing = dest.status === 'ONGOING';
                    const isUpcoming = dest.status === 'UPCOMING';

                    return (
                      <div
                        key={dest.id}
                        style={{
                          padding: '20px',
                          borderRadius: '16px',
                          background: isOngoing
                            ? 'rgba(16, 185, 129, 0.06)'
                            : isCompleted
                              ? 'rgba(255, 255, 255, 0.02)'
                              : 'rgba(255, 255, 255, 0.04)',
                          border: isOngoing
                            ? '1px solid rgba(16, 185, 129, 0.35)'
                            : '1px solid var(--border-glass)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Destination Cover Image if exists */}
                        {dest.image_url && (
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '180px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '2px'
                          }}>
                            <img
                              src={`${BASE_URL}${dest.image_url}`}
                              alt={dest.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            {!isReadOnly && trip.status !== 'COMPLETED' && (
                              <label
                                style={{
                                  position: 'absolute',
                                  bottom: '10px',
                                  right: '10px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: 'rgba(15, 23, 42, 0.85)',
                                  backdropFilter: 'blur(8px)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Camera size={13} />
                                <span>{uploadingDestImageId === dest.id ? 'Uploading...' : 'Change Photo'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  disabled={uploadingDestImageId === dest.id}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleUploadDestImage(dest.id, e.target.files[0]);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                        {/* Destination Header & Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isCompleted ? '#10B98120' : (isOngoing ? '#3B82F620' : 'rgba(255,255,255,0.05)'),
                              color: isCompleted ? '#10B981' : (isOngoing ? '#60A5FA' : 'var(--text-dim)'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px'
                            }}>
                              {idx + 1}
                            </div>
                            <div>
                              <h4 style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                color: isCompleted ? 'var(--text-muted)' : '#fff'
                              }}>
                                {dest.name}
                              </h4>
                              {dest.location && (
                                <div style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={12} /> {dest.location}
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className={`badge badge-${dest.status.toLowerCase()}`}>
                              {dest.status}
                            </span>

                            {/* Done Exploring Button */}
                            {!isReadOnly && !isCompleted && trip.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleDoneExploring(dest.id)}
                                className="glass-btn-primary"
                                style={{ padding: '7px 14px', fontSize: '12px', background: 'linear-gradient(135deg, #10B981, #059669)' }}
                              >
                                <CheckCircle2 size={15} /> Done
                              </button>
                            )}

                            {/* Upload Photo Button (if not already uploaded) */}
                            {!isReadOnly && trip.status !== 'COMPLETED' && !dest.image_url && (
                              <label
                                style={{
                                  padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                                  background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.28)',
                                  color: '#C084FC', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'
                                }}
                              >
                                <Camera size={14} />
                                <span>{uploadingDestImageId === dest.id ? 'Uploading...' : 'Add Photo'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  disabled={uploadingDestImageId === dest.id}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleUploadDestImage(dest.id, e.target.files[0]);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                            )}

                            {/* Add Cost Button */}
                            {!isReadOnly && trip.status !== 'COMPLETED' && (
                              <button
                                onClick={() => { setCostDest(dest); setCostForm({ amount: '', category: 'Entrance Fees', notes: '' }); setShowAddCostModal(true); }}
                                style={{
                                  padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                                  background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)',
                                  color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'
                                }}
                              >
                                <Coins size={14} /> Add Cost
                              </button>
                            )}

                            {/* Edit Destination Button */}
                            {!isReadOnly && trip.status !== 'COMPLETED' && (
                              <button
                                onClick={() => openEditDestModal(dest)}
                                style={{
                                  padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                                  background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.22)',
                                  color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'
                                }}
                              >
                                <PenLine size={14} /> Edit
                              </button>
                            )}

                            {/* Delete Destination Button */}
                            {!isReadOnly && trip.status !== 'COMPLETED' && (
                              <button
                                onClick={() => { setDestToDelete(dest); setShowDeleteDestModal(true); }}
                                style={{
                                  padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                                  background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.22)',
                                  color: '#F43F5E', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </div>
                        </div>

                        {dest.description && (
                          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            {dest.description}
                          </p>
                        )}

                        {/* 17. Exploration Checklist */}
                        <div style={{
                          marginTop: '6px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(255,255,255,0.06)'
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#93C5FD', marginBottom: '8px' }}>
                            What I want to explore:
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {dest.exploration_items && dest.exploration_items.map(item => (
                              <div
                                key={item.id}
                                onClick={() => !isReadOnly && handleToggleChecklist(item.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  fontSize: '13px',
                                  color: item.is_completed ? 'var(--text-dim)' : 'var(--text-main)',
                                  textDecoration: item.is_completed ? 'line-through' : 'none',
                                  cursor: isReadOnly ? 'default' : 'pointer'
                                }}
                              >
                                {item.is_completed ? (
                                  <CheckCircle2 size={16} color="#10B981" />
                                ) : (
                                  <Circle size={16} color="var(--text-dim)" />
                                )}
                                <span>{item.item_text}</span>
                              </div>
                            ))}

                            {!isReadOnly && (
                              <div style={{ marginTop: '8px' }}>
                                {activeDestForExplore === dest.id ? (
                                  <form onSubmit={(e) => handleAddExplorationItem(e, dest.id)} style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                      type="text"
                                      placeholder="e.g. Try local street food..."
                                      value={newItemText}
                                      onChange={e => setNewItemText(e.target.value)}
                                      className="glass-input"
                                      style={{ padding: '6px 12px', fontSize: '13px' }}
                                      autoFocus
                                    />
                                    <button type="submit" className="glass-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveDestForExplore(null)}
                                      className="glass-btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '12px' }}
                                    >
                                      Cancel
                                    </button>
                                  </form>
                                ) : (
                                  <button
                                    onClick={() => setActiveDestForExplore(dest.id)}
                                    style={{
                                      background: 'transparent',
                                      color: '#60A5FA',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Plus size={14} /> Add checklist item
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}

          {/* End of Journey Days: Complete Trip CTA Banner */}
          <div className="glass-panel" style={{
            padding: '28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            background: trip.status === 'COMPLETED'
              ? 'rgba(16, 185, 129, 0.08)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08))',
            borderColor: trip.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.3)' : 'var(--primary-border)'
          }}>
            {trip.status === 'COMPLETED' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <CheckCircle2 size={28} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#10B981' }}>
                  Journey Completed! 🎉
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px' }}>
                  This entire journey is marked as completed. Check out your memories and journal stories!
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B98120, #05966930)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800 }}>
                    Finished all your travel days?
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '440px' }}>
                    Marking this trip as completed will update your journey status and record your full travel history.
                  </p>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="glass-btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                      padding: '12px 28px',
                      fontSize: '14px',
                      fontWeight: 700
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>Complete Trip</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 18. Expenses & Budget */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Budget</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
                  <Wallet size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>
                {formatCurrency(expensesData?.budget, trip.currency)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Spent</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F43F5E' }}>
                  <Coins size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: '#F43F5E' }}>
                {formatCurrency(expensesData?.totalSpent, trip.currency)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Remaining Balance</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: '#10B981' }}>
                {formatCurrency(expensesData?.remaining, trip.currency)}
              </div>
            </div>
          </div>

          {/* Budget Bar */}
          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={16} color="#60A5FA" />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Budget Progress Bar</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                <strong>{formatCurrency(expensesData?.totalSpent, trip.currency)}</strong> of {formatCurrency(expensesData?.budget, trip.currency)} ({expensesData?.budget ? Math.round(((Number(expensesData.totalSpent || 0)) / Number(expensesData.budget)) * 100) : 0}%)
              </div>
            </div>
            <div className="progress-track" style={{ height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                className="progress-fill"
                style={{
                  height: '100%',
                  borderRadius: '6px',
                  transition: 'width 0.4s ease',
                  width: `${Math.min(100, expensesData?.budget ? ((Number(expensesData.totalSpent || 0)) / Number(expensesData.budget)) * 100 : 0)}%`,
                  background: Number(expensesData?.totalSpent || 0) > Number(expensesData?.budget || 0)
                    ? 'linear-gradient(90deg, #F43F5E, #E11D48)'
                    : 'linear-gradient(90deg, #10B981, #059669)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Recorded Expenses</h3>
            {!isReadOnly && (
              <button onClick={() => setShowExpenseModal(true)} className="glass-btn-primary">
                <Plus size={18} /> Record Expense
              </button>
            )}
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-glass)', display: 'grid', gridTemplateColumns: isReadOnly ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 60px', fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', alignItems: 'center' }}>
              <span>Expense / Title</span>
              <span>Category</span>
              <span>Date</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
              {!isReadOnly && <span style={{ textAlign: 'center' }}>Action</span>}
            </div>

            {expensesData?.expenses?.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                No expenses logged for this trip yet.
              </div>
            ) : (
              expensesData?.expenses?.map(exp => (
                <div key={exp.id} style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  display: 'grid',
                  gridTemplateColumns: isReadOnly ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 60px',
                  fontSize: '14px',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{exp.title}</strong>
                    {exp.notes && <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{exp.notes}</div>}
                  </div>
                  <div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      fontSize: '12px'
                    }}>
                      {exp.category}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{exp.expense_date}</span>
                  <span style={{ textAlign: 'right', fontWeight: 700, color: '#F43F5E' }}>
                    {formatCurrency(exp.amount, trip.currency)}
                  </span>
                  {!isReadOnly && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => { setExpenseToDelete(exp); setShowDeleteExpenseModal(true); }}
                        title="Delete expense"
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.25)',
                          color: '#F43F5E',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(244, 63, 94, 0.22)';
                          e.currentTarget.style.transform = 'scale(1.06)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 20. Photos and Memories */}
      {activeTab === 'memories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Trip Photo Gallery</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Capture and preserve memories organized by journey days.
              </p>
            </div>
            {!isReadOnly && (
              <label className="glass-btn-primary" style={{ cursor: 'pointer' }}>
                <Camera size={18} />
                <span>{uploadingPhotos ? 'Uploading...' : 'Upload Photos'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotosUpload}
                  disabled={uploadingPhotos}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {photosList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
              <ImageIcon size={44} color="#3B82F6" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: '16px' }}>No photos uploaded yet</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '4px' }}>
                Upload snapshots taken during this adventure!
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
              {photosList.map(photo => (
                <div key={photo.id} className="glass-panel" style={{ overflow: 'hidden', position: 'relative' }}>
                  
<img
  src={
    photo.image_url?.startsWith('http')
      ? photo.image_url
      : `${BASE_URL}${photo.image_url}`
  }
  alt={photo.caption || 'Trip Photo'}
  onClick={() => window.open(
    photo.image_url?.startsWith('http')
      ? photo.image_url
      : `${BASE_URL}${photo.image_url}`,
    '_blank'
  )}
  style={{
    width: '100%',
    height: '220px',
    objectFit: 'cover',
    cursor: 'pointer'
  }}
/>

                  {photo.caption && (
                    <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 21. Journal */}
      {activeTab === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Travel Stories & Journal</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Record your daily thoughts, reflections, and experiences.
              </p>
            </div>
            {!isReadOnly && (
              <button onClick={() => setShowJournalModal(true)} className="glass-btn-primary">
                <BookOpen size={18} /> New Entry
              </button>
            )}
          </div>

          {journalEntries.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
              <BookOpen size={44} color="#8B5CF6" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: '16px' }}>Your journal is blank</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '4px' }}>
                Write your first story about this incredible journey.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {journalEntries.map(entry => (
                <div key={entry.id} className="glass-panel" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 800 }}>{entry.title}</h4>
                    <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{entry.entry_date}</span>
                  </div>
                  <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 22 & 23. Share Trip */}
      {activeTab === 'share' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Share with Travelers</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Shared travelers can view your timeline, expenses, and photos in <strong>Read Only</strong> mode.
            </p>

            {!isReadOnly ? (
              <div>
                <input
                  type="text"
                  placeholder="Search registered user by name, email, or username..."
                  value={searchUserQuery}
                  onChange={e => handleSearchUsers(e.target.value)}
                  className="glass-input"
                  style={{ marginBottom: '12px' }}
                />

                {searchedUsers.length > 0 && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '16px'
                  }}>
                    {searchedUsers.map(u => (
                      <div key={u.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)'
                      }}>
                        <div>
                          <strong>{u.name}</strong> ({u.email})
                        </div>
                        <button
                          onClick={() => handleShareWithUser(u.id)}
                          className="glass-btn-primary"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                          Share View Access
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                Only the trip owner can share access with other users.
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>People With Access</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {collaborators.map(c => (
                <div key={c.share_id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)'
                }}>
                  <div>
                    <strong>{c.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>({c.email})</span>
                    <div style={{ fontSize: '11px', color: '#60A5FA', marginTop: '2px' }}>Role: View Only</div>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleRemoveShare(c.user_id)}
                      style={{ background: 'transparent', color: '#F43F5E', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Revoke Access
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Destination */}
      {showAddDestModal && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Add Destination / Stop</h3>
              <form onSubmit={handleAddDestination} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input
                  type="text"
                  placeholder="Destination Name (e.g. Tokyo Tower)"
                  value={destForm.name}
                  onChange={e => setDestForm({ ...destForm, name: e.target.value })}
                  required
                  className="glass-input"
                />
                <input
                  type="text"
                  placeholder="Location / Address"
                  value={destForm.location}
                  onChange={e => setDestForm({ ...destForm, location: e.target.value })}
                  className="glass-input"
                />
                <textarea
                  placeholder="Description or notes..."
                  value={destForm.description}
                  onChange={e => setDestForm({ ...destForm, description: e.target.value })}
                  className="glass-input"
                  rows={3}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowAddDestModal(false)} className="glass-btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn-primary" style={{ flex: 1 }}>
                    Add Stop
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal: Record Expense */}
      {showExpenseModal && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Record Expense</h3>
            <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="Expense Title (e.g. Dinner in Shibuya)"
                value={expenseForm.title}
                onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                required
                className="glass-input"
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                    {getCurrencySymbol(trip?.currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                    className="glass-input"
                    style={{ paddingLeft: (getCurrencySymbol(trip?.currency).length > 2 ? '42px' : '30px') }}
                  />
                </div>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="glass-input"
                  style={{ background: '#121826' }}
                >
                  {['Food', 'Transport', 'Entrance Fees', 'Shopping', 'Accommodation', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <input
                type="date"
                value={expenseForm.expenseDate}
                onChange={e => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                required
                className="glass-input"
                style={{ colorScheme: 'dark' }}
              />
              <textarea
                placeholder="Optional notes..."
                value={expenseForm.notes}
                onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                className="glass-input"
                rows={2}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="glass-btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn-primary" style={{ flex: 1 }}>
                    Save Expense
                  </button>
              </div>
            </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal: Add Journal Entry */}
      {showJournalModal && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>New Journal Entry ✍️</h3>
              <form onSubmit={handleAddJournalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input
                  type="text"
                  placeholder="Title (e.g. Walking through ancient bamboo groves)"
                  value={journalForm.title}
                  onChange={e => setJournalForm({ ...journalForm, title: e.target.value })}
                  required
                  className="glass-input"
                />
                <input
                  type="date"
                  value={journalForm.entryDate}
                  onChange={e => setJournalForm({ ...journalForm, entryDate: e.target.value })}
                  required
                  className="glass-input"
                  style={{ colorScheme: 'dark' }}
                />
                <textarea
                  placeholder="Pour your thoughts and memories here..."
                  value={journalForm.content}
                  onChange={e => setJournalForm({ ...journalForm, content: e.target.value })}
                  required
                  className="glass-input"
                  rows={6}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowJournalModal(false)} className="glass-btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn-primary" style={{ flex: 1 }}>
                    Publish Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ═══ Modal: Edit Destination ═══ */}
      {showEditDestModal && editingDest && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s ease' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
                <PenLine size={18} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Edit Destination</h3>
            </div>
            <form onSubmit={handleEditDestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="Destination Name"
                value={editDestForm.name}
                onChange={e => setEditDestForm({ ...editDestForm, name: e.target.value })}
                required
                className="glass-input"
              />
              <input
                type="text"
                placeholder="Location / Address"
                value={editDestForm.location}
                onChange={e => setEditDestForm({ ...editDestForm, location: e.target.value })}
                className="glass-input"
              />
              <textarea
                placeholder="Description or notes..."
                value={editDestForm.description}
                onChange={e => setEditDestForm({ ...editDestForm, description: e.target.value })}
                className="glass-input"
                rows={3}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="time"
                  value={editDestForm.plannedTime}
                  onChange={e => setEditDestForm({ ...editDestForm, plannedTime: e.target.value })}
                  className="glass-input"
                  style={{ colorScheme: 'dark' }}
                />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--link)', fontWeight: 700, fontSize: '13px', pointerEvents: 'none' }}>
                    {getCurrencySymbol(trip?.currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Estimated Cost"
                    value={editDestForm.estimatedCost}
                    onChange={e => setEditDestForm({ ...editDestForm, estimatedCost: e.target.value })}
                    className="glass-input"
                    style={{ paddingLeft: (getCurrencySymbol(trip?.currency).length > 2 ? '42px' : '30px') }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => { setShowEditDestModal(false); setEditingDest(null); }} className="glass-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="glass-btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ═══ Modal: Delete Destination Confirm ═══ */}
      {showDeleteDestModal && destToDelete && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s ease' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F43F5E', boxShadow: '0 0 20px rgba(244,63,94,0.25)' }}>
                <Trash2 size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Delete Destination?</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
                  Remove <strong>"{destToDelete.name}"</strong> from the itinerary? Its exploration checklist items will also be deleted.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button onClick={() => { setShowDeleteDestModal(false); setDestToDelete(null); }} disabled={deletingDest} className="glass-btn-secondary" style={{ flex: 1, padding: '11px' }}>Cancel</button>
                <button
                  onClick={handleDeleteDest}
                  disabled={deletingDest}
                  className="glass-btn-primary"
                  style={{ flex: 1, padding: '11px', fontWeight: 700, background: 'linear-gradient(135deg, #F43F5E, #E11D48)', boxShadow: '0 4px 14px rgba(244,63,94,0.35)' }}
                >
                  {deletingDest ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ═══ Modal: Delete Expense Confirm ═══ */}
      {showDeleteExpenseModal && expenseToDelete && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s ease' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F43F5E', boxShadow: '0 0 20px rgba(244,63,94,0.25)' }}>
                <Trash2 size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Delete Expense?</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
                  Are you sure you want to remove <strong>"{expenseToDelete.title}"</strong> ({formatCurrency(expenseToDelete.amount, trip.currency)})? Your budget and spent totals will update automatically.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button
                  onClick={() => { setShowDeleteExpenseModal(false); setExpenseToDelete(null); }}
                  disabled={deletingExpense}
                  className="glass-btn-secondary"
                  style={{ flex: 1, padding: '11px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExpense}
                  disabled={deletingExpense}
                  className="glass-btn-primary"
                  style={{ flex: 1, padding: '11px', fontWeight: 700, background: 'linear-gradient(135deg, #F43F5E, #E11D48)', boxShadow: '0 4px 14px rgba(244,63,94,0.35)' }}
                >
                  {deletingExpense ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ═══ Modal: Add Cost to Destination ═══ */}
      {showAddCostModal && costDest && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s ease' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px', animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                <Coins size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: 800 }}>Add Cost</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>For: <strong>{costDest.name}</strong> — will be added to expenses</p>
              </div>
            </div>
            <form onSubmit={handleAddCostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#F59E0B', fontWeight: 700, fontSize: '15px', pointerEvents: 'none' }}>
                  {getCurrencySymbol(trip?.currency)}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Amount spent"
                  value={costForm.amount}
                  onChange={e => setCostForm({ ...costForm, amount: e.target.value })}
                  required
                  className="glass-input"
                  style={{ paddingLeft: (getCurrencySymbol(trip?.currency).length > 2 ? '48px' : '36px'), fontSize: '16px', fontWeight: 700 }}
                  autoFocus
                />
              </div>
              <select
                value={costForm.category}
                onChange={e => setCostForm({ ...costForm, category: e.target.value })}
                className="glass-input"
                style={{ background: '#121826' }}
              >
                {['Entrance Fees', 'Food', 'Transport', 'Shopping', 'Accommodation', 'Other'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <textarea
                placeholder="Optional notes (e.g. ticket price, guide fee)..."
                value={costForm.notes}
                onChange={e => setCostForm({ ...costForm, notes: e.target.value })}
                className="glass-input"
                rows={2}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => { setShowAddCostModal(false); setCostDest(null); }} className="glass-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button
                  type="submit"
                  disabled={addingCost}
                  className="glass-btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.35)', fontWeight: 700 }}
                >
                  {addingCost ? 'Adding...' : 'Add to Expenses'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ═══ Modal: Cancel Trip Confirm ═══ */}
      {showCancelTripModal && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s ease' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '21px', fontWeight: 800 }}>Cancel This Trip?</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
                  Are you sure you want to cancel <strong>"{trip.title}"</strong>? The trip data will be preserved but marked as cancelled.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button onClick={() => setShowCancelTripModal(false)} disabled={cancellingTrip} className="glass-btn-secondary" style={{ flex: 1, padding: '11px' }}>Keep Trip</button>
                <button
                  onClick={handleCancelTrip}
                  disabled={cancellingTrip}
                  className="glass-btn-primary"
                  style={{ flex: 1, padding: '11px', fontWeight: 700, background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}
                >
                  {cancellingTrip ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ═══ Modal: Delete Trip Confirm ═══ */}
      {showDeleteTripModal && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s ease' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F43F5E', boxShadow: '0 0 20px rgba(244,63,94,0.25)' }}>
                <Trash2 size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '21px', fontWeight: 800 }}>Delete This Trip?</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
                  Permanently delete <strong>"{trip.title}"</strong>? All destinations, expenses, photos, and journal entries will be lost.
                  <br /><strong style={{ color: '#F43F5E' }}>This cannot be undone.</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button onClick={() => setShowDeleteTripModal(false)} disabled={deletingTrip} className="glass-btn-secondary" style={{ flex: 1, padding: '11px' }}>Cancel</button>
                <button
                  onClick={handleDeleteTrip}
                  disabled={deletingTrip}
                  className="glass-btn-primary"
                  style={{ flex: 1, padding: '11px', fontWeight: 700, background: 'linear-gradient(135deg, #F43F5E, #E11D48)', boxShadow: '0 4px 14px rgba(244,63,94,0.35)' }}
                >
                  {deletingTrip ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal: Confirm Complete Trip */}
      {showCompleteModal && (
        <ModalPortal>
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div className="glass-panel" style={{
              width: '100%',
              maxWidth: '460px',
              padding: '32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)'
              }}>
                <CheckCircle2 size={34} />
              </div>

              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800 }}>Complete This Journey?</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
                  Are you sure you want to mark <strong>"{trip.title}"</strong> as completed? Your travel statistics will update and all memories will be archived as finished.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  disabled={completingTrip}
                  className="glass-btn-secondary"
                  style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteTrip}
                  disabled={completingTrip}
                  className="glass-btn-primary"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {completingTrip ? 'Completing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
