import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Coffee, Timer, History } from 'lucide-react'
import { UpdatePrompt } from './components/UpdatePrompt'
import { Toaster } from 'react-hot-toast'
import { StorageKeys, getItem, setItem } from './utils/storage'
import { OnboardingModal } from './components/OnboardingModal'

// Lazy load pages for performance
const BeansPage = React.lazy(() => import('./pages/Beans'))
const BrewPage = React.lazy(() => import('./pages/Brew'))
const HistoryPage = React.lazy(() => import('./pages/History'))

const BottomNav = () => (
  <nav className="bottom-nav glass-nav">
    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <Coffee className="nav-item-icon" />
      <span className="nav-item-label">Beans</span>
    </NavLink>
    <NavLink to="/brew" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <Timer className="nav-item-icon" />
      <span className="nav-item-label">Brew</span>
    </NavLink>
    <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <History className="nav-item-icon" />
      <span className="nav-item-label">History</span>
    </NavLink>
  </nav>
)

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasSeen = await getItem<boolean>(StorageKeys.HAS_SEEN_ONBOARDING);
      if (!hasSeen) {
        setShowOnboarding(true);
      }
    };
    checkOnboarding();
  }, []);

  const handleCloseOnboarding = async () => {
    await setItem(StorageKeys.HAS_SEEN_ONBOARDING, true);
    setShowOnboarding(false);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <React.Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
          <Routes>
            <Route path="/*" element={<BeansPage />} />
            <Route path="/brew" element={<BrewPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </React.Suspense>
      </div>
      <BottomNav />
      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
      <UpdatePrompt />
      <Toaster position="top-center" toastOptions={{
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px'
        }
      }} />
    </BrowserRouter>
  )
}

export default App
