import React, { useEffect, useRef } from 'react';

export const DesktopLanding: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated particles background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.4 + 0.1,
      });
    }

    let animFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 158, 107, ${p.a})`;
        ctx.fill();
      });
      animFrame = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const url = window.location.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}&bgcolor=1a1a1a&color=c49e6b&format=png`;

  const featureItems = [
    { icon: '📷', title: 'AI Bean Recognition', desc: 'Point your camera at any bean bag. Gemini Vision instantly reads roast, origin, and tasting notes.' },
    { icon: '🧠', title: 'Generative Brewing Recipes', desc: 'Forget generic guides. AI acts as your personal World Barista Champion—crafting a unique formula for each bean.' },
    { icon: '⏱️', title: 'Smart Brew HUD', desc: 'A distraction-free, second-by-second visual timer guiding every pour with real-time water targets.' },
    { icon: '🖼️', title: 'Cinematic Share Cards', desc: 'End each brew with a gorgeous AI-generated landscape from the bean\'s origin, ready to share.' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1208 50%, #0a0a0a 100%)',
      color: '#e8ddd0',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Hero section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 60px 60px',
        }}>
          {/* Left: Text */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <img src="/pwa-192x192.png" alt="Pour-Over Master icon" style={{ width: '60px', height: '60px', borderRadius: '14px' }} />
              <div>
                <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', color: '#c49e6b', textTransform: 'uppercase', marginBottom: '4px' }}>Progressive Web App</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>Pour-Over Master</div>
              </div>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
              fontWeight: '800',
              lineHeight: 1.15,
              margin: '0 0 24px 0',
              background: 'linear-gradient(135deg, #e8ddd0 30%, #c49e6b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Your AI-Native<br />Pour-Over Companion
            </h1>

            <p style={{ fontSize: '1.15rem', lineHeight: 1.7, color: '#a89880', margin: '0 0 36px 0', maxWidth: '460px' }}>
              Not just a timer. An intelligent brewing partner that <strong style={{ color: '#c49e6b' }}>sees your coffee, thinks like a barista</strong>, and crafts a custom recipe formula—all before you boil the water.
            </p>

            {/* CTA - QR Code */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              padding: '24px 28px',
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(196,158,107,0.2)',
              borderRadius: '20px',
              maxWidth: '420px',
            }}>
              <img
                src={qrUrl}
                alt="QR code to open on phone"
                style={{ width: '100px', height: '100px', borderRadius: '10px', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '8px', color: '#e8ddd0' }}>
                  📱 Open on your phone
                </div>
                <div style={{ fontSize: '0.88rem', color: '#a89880', lineHeight: 1.5 }}>
                  Scan this QR code or share the link to your phone. Pour-Over Master is designed for the mobile brewing experience.
                </div>
              </div>
            </div>
          </div>

          {/* Right: Screenshot */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              position: 'relative',
              filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.7)) drop-shadow(0 0 40px rgba(196,158,107,0.15))',
            }}>
              <img
                src="/introduce.png"
                alt="Pour-Over Master app screenshots"
                style={{
                  maxHeight: '540px',
                  maxWidth: '100%',
                  borderRadius: '24px',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 60px' }}>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(196,158,107,0.3), transparent)' }} />
        </div>

        {/* Features grid */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 60px 40px' }}>
          <p style={{ textAlign: 'center', color: '#c49e6b', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>Core Features</p>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '700', margin: '0 0 48px 0' }}>
            Everything, Powered by Gemini AI
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {featureItems.map((f) => (
              <div key={f.title} style={{
                padding: '28px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '18px',
                transition: 'background 0.2s',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '14px' }}>{f.icon}</div>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '8px', color: '#e8ddd0' }}>{f.title}</div>
                <div style={{ fontSize: '0.9rem', color: '#a89880', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '40px 60px 60px', color: '#5a5040', fontSize: '0.85rem' }}>
          Built with ☕ + Google Gemini AI
        </div>
      </div>
    </div>
  );
};
