import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { getItem, setItem, StorageKeys } from '../utils/storage';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface Props {
  isBlockedByOnboarding: boolean;
}

export const InstallPrompt: React.FC<Props> = ({ isBlockedByOnboarding }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(true); // Default true until checked

  useEffect(() => {
    // Check if user previously dismissed
    const checkDismissed = async () => {
      const dismissed = await getItem<boolean>(StorageKeys.HAS_DISMISSED_INSTALL_PROMPT);
      setHasDismissed(!!dismissed);
    };
    checkDismissed();

    // Check if currently running in Standalone (installed) mode
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             (window.navigator as any).standalone === true;
    };
    setIsStandalone(checkStandalone());

    // Basic iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture the Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent Chrome 67 and earlier from automatically showing the prompt
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome} the A2HS prompt`);
    
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
  };

  const handleDismiss = async () => {
    await setItem(StorageKeys.HAS_DISMISSED_INSTALL_PROMPT, true);
    setHasDismissed(true);
    setDeferredPrompt(null);
  };

  // If already installed, or user dismissed it, don't show anything
  if (isStandalone || hasDismissed || isBlockedByOnboarding) {
    return null;
  }

  // WE HAVE A NATIVE PROMPT TO SHOW (Android / Chrome Desktop)
  if (deferredPrompt) {
    return (
      <div className="animate-fade-in" style={{
        position: 'fixed',
        bottom: '80px', // Just above bottom nav
        left: '20px',
        right: '20px',
        margin: '0 auto',
        maxWidth: '380px',
        boxSizing: 'border-box',
        padding: '16px',
        background: 'rgba(30, 30, 30, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '4px' }}>Install Pour-Over Master</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Add to your home screen for offline access and full-screen experience.</div>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '8px 16px', fontSize: '0.9rem', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }} 
          onClick={handleInstallClick}
        >
          <Download size={16} /> Install
        </button>
        <button 
          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }} 
          onClick={handleDismiss}
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  // IOS FALLBACK GUIDANCE (Since iOS doesn't support beforeinstallprompt)
  if (isIOS) {
    return (
      <div className="animate-fade-in" style={{
        position: 'fixed',
        bottom: '80px', // Just above bottom nav
        left: '20px',
        right: '20px',
        margin: '0 auto',
        maxWidth: '380px',
        boxSizing: 'border-box',
        padding: '16px',
        background: 'rgba(30, 30, 30, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px' // Add the arrow pointing down conceptually
      }}>
        <div style={{ flex: 1, paddingRight: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '4px' }}>Install App</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Tap <strong style={{color: 'var(--color-primary)'}}>Share</strong> and select <strong>Add to Home Screen</strong> for the best experience.
          </div>
        </div>
        <button 
          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }} 
          onClick={handleDismiss}
        >
          <X size={20} />
        </button>
        {/* iOS Share Arrow Indicator pointing down towards the bottom safari nav */}
        <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid rgba(30, 30, 30, 0.85)' }}></div>
      </div>
    );
  }

  // Neither Android nor iOS (e.g. desktop non-chrome), return nothing unless the prompt fired
  return null;
};
