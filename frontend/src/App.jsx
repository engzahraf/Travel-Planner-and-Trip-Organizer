import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AnimatedPage from './components/AnimatedPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import MyTrips from './pages/MyTrips';
import TripDetailPage from './pages/TripDetailPage';
import SharedWithMe from './pages/SharedWithMe';
import MemoriesGallery from './pages/MemoriesGallery';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import CreateTripModal from './components/CreateTripModal';
import VerifyEmail from './pages/VerifyEmail';

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [createTripOpen, setCreateTripOpen] = useState(false);


if (window.location.pathname === '/verify-email') {
  return <VerifyEmail />;
}

if (loading) {
  return (
    <div className="app-boot">
      <div className="spinner" />
      Initializing Travel Planner...
    </div>
  );
}

if (!isAuthenticated) {
  return <AuthPage />;
}


  const handleSelectTrip = (tripId) => {
    setSelectedTripId(tripId);
    setCurrentView('trip-detail');
  };

  const handleTripCreated = (newTripId) => {
    if (newTripId) {
      setSelectedTripId(newTripId);
      setCurrentView('trip-detail');
    } else {
      setCurrentView('my-trips');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setSelectedTripId(null);
          setCurrentView(view);
        }}
        onOpenCreateTrip={() => setCreateTripOpen(true)}
      />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        <AnimatedPage pageKey={currentView}>
          {currentView === 'dashboard' && (
            <Dashboard
              onOpenCreateTrip={() => setCreateTripOpen(true)}
              onSelectTrip={handleSelectTrip}
            />
          )}

          {currentView === 'my-trips' && (
            <MyTrips
              onOpenCreateTrip={() => setCreateTripOpen(true)}
              onSelectTrip={handleSelectTrip}
            />
          )}

          {currentView === 'trip-detail' && selectedTripId && (
            <TripDetailPage
              tripId={selectedTripId}
              onBack={() => setCurrentView('my-trips')}
            />
          )}

          {currentView === 'shared-with-me' && (
            <SharedWithMe onSelectTrip={handleSelectTrip} />
          )}

          {currentView === 'memories' && (
            <MemoriesGallery />
          )}

          {currentView === 'profile' && (
            <ProfilePage />
          )}

          {currentView === 'admin' && user?.role === 'ADMIN' && (
            <AdminDashboard />
          )}
        </AnimatedPage>
      </main>

      <CreateTripModal
        isOpen={createTripOpen}
        onClose={() => setCreateTripOpen(false)}
        onTripCreated={handleTripCreated}
      />
    </div>
  );
}
