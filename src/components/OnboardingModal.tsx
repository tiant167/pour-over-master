import React from 'react';
import { Camera, Wand2, Image, ChevronRight } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const OnboardingModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="animate-fade-in" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(10px)',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '400px',
        padding: '30px 24px',
        borderRadius: '24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'inline-block', padding: '12px', background: 'var(--color-surface)', borderRadius: '20px', marginBottom: '16px' }}>
            <span style={{ fontSize: '2rem' }}>☕️✨</span>
          </div>
          <h2 style={{ color: 'var(--color-primary)', fontSize: '1.6rem', margin: '0 0 8px 0' }}>Pour-Over Master</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>
            The AI-native coffee brewing experience.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', background: 'rgba(217, 119, 6, 0.1)', borderRadius: '12px', color: 'var(--color-primary)', flexShrink: 0 }}>
              <Camera size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--color-text)' }}>Vision Storage</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                Stop typing. Just take a photo of your coffee bag and Google Gemini extracts the origin, process, and tasting notes instantly.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', background: 'rgba(217, 119, 6, 0.1)', borderRadius: '12px', color: 'var(--color-primary)', flexShrink: 0 }}>
              <Wand2 size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--color-text)' }}>Dynamic Generation</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                No static recipes. The AI calculates optimized water ratios and pouring intervals entirely based on the roast and origin.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', background: 'rgba(217, 119, 6, 0.1)', borderRadius: '12px', color: 'var(--color-primary)', flexShrink: 0 }}>
              <Image size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--color-text)' }}>Aesthetic Sharing</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                Finishing a brew triggers an AI art generation, creating a stunning coffee card visualization for you to share.
              </p>
            </div>
          </div>

        </div>

        <button 
          className="btn btn-primary animate-pulse" 
          style={{ width: '100%', marginTop: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem' }} 
          onClick={onClose}
        >
          Get Started <ChevronRight size={20} />
        </button>

      </div>
    </div>
  );
};
