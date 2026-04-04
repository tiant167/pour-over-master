import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getBeans } from '../utils/beanService';
import type { Bean } from '../utils/beanService';
import { suggestRecipe } from '../utils/suggestions';
import type { BrewRecipe } from '../utils/suggestions';
import { Play, Pause, Square, ChevronRight, Droplet, Thermometer, Info, Share2 } from 'lucide-react';
import { setItem, StorageKeys, getItem } from '../utils/storage';
import { BrewChart } from '../components/BrewChart';
import { toJpeg } from 'html-to-image';
import { generateAIImage } from '../utils/ai';
import { QRCodeSVG } from 'qrcode.react';

type BrewState = 'setup' | 'countdown' | 'active' | 'finished';

// Quick test recipe for development (10 seconds total)
const TEST_RECIPE: BrewRecipe = {
  title: 'Quick Test Brew',
  profile: 'Fast 10-second test recipe for development.',
  ratio: 15,
  temperature: 93,
  grindSize: 'Medium',
  coffeeWeight: 15,
  steps: [
    { name: 'Bloom', targetWeight: 30, duration: 3, pouringDuration: 1, description: 'Quick bloom pour' },
    { name: 'Pour', targetWeight: 150, duration: 4, pouringDuration: 2, description: 'Fast main pour' },
    { name: 'Wait', targetWeight: 225, duration: 3, pouringDuration: 0, description: 'Short draw down' },
  ]
};

// Check if running in development mode
const isDevelopment = import.meta.env.DEV;
const SHARE_ASSET_TIMEOUT_MS = 5000;

const Brew: React.FC = () => {
  const location = useLocation();
  const [beans, setBeans] = useState<Bean[]>([]);
  const [selectedBeanId, setSelectedBeanId] = useState<string>(location.state?.autoSelectBeanId || '');
  const [recipe, setRecipe] = useState<BrewRecipe | null>(null);
  const [coffeeWeight, setCoffeeWeight] = useState<number>(15);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  
  const [brewState, setBrewState] = useState<BrewState>('setup');
  const [countdown, setCountdown] = useState(3);
  
  // Timer state
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // AIGC Sharing state
  const [aigcImageUrl, setAigcImageUrl] = useState<string>('');

  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBeans();
    // Initialize Web Audio
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContext();
  }, []);

  // Automatically generate background image once finished
  useEffect(() => {
    const currentBean = beans.find(b => b.id === selectedBeanId);
    if (brewState === 'finished' && currentBean && recipe && !aigcImageUrl) {
      generateAIImage(currentBean.origin || 'Unknown Origin', currentBean.tastingNotes || []).then(url => {
        if (url) setAigcImageUrl(url);
      }).catch(err => console.error("Failed to generate AI image:", err));
    }
  }, [brewState, selectedBeanId, beans, recipe, aigcImageUrl]);

  const loadBeans = async () => {
    const b = await getBeans();
    setBeans(b);
    if (isTestMode) {
      // Use quick test recipe in test mode
      setRecipe(TEST_RECIPE);
    } else if (b.length > 0) {
      const autoId = location.state?.autoSelectBeanId;
      const targetBean = autoId ? b.find(bean => bean.id === autoId) || b[0] : b[0];

      setSelectedBeanId(targetBean.id!);
      setRecipe(suggestRecipe(targetBean, coffeeWeight));
    }
  };

  const handleBeanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedBeanId(id);
    const b = beans.find(b => b.id === id);
    if (b) {
      setRecipe(suggestRecipe(b, coffeeWeight));
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const weight = parseInt(e.target.value) || 15;
    setCoffeeWeight(weight);
    const b = beans.find(b => b.id === selectedBeanId);
    if (b) {
      setRecipe(suggestRecipe(b, weight));
    }
  };

  const playBeep = (freq = 440, type: OscillatorType = 'sine', duration = 0.2) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(t => {
          const newTime = t + 1;
          checkStepTriggers(newTime);
          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, recipe]);

  // Timer check loop
  const checkStepTriggers = (currentTime: number) => {
    if (!recipe) return;
    let accumulatedTime = 0;
    
    for (let i = 0; i < recipe.steps.length; i++) {
      const step = recipe.steps[i];
      // Beep at the start of next step (3 beeps countdown)
      if (currentTime === accumulatedTime + step.duration - 3 || 
          currentTime === accumulatedTime + step.duration - 2 || 
          currentTime === accumulatedTime + step.duration - 1) {
        playBeep(600, 'sine', 0.1);
      }
      
      // Stop Pouring Beep (Transition from Pouring -> Waiting)
      if (currentTime === accumulatedTime + step.pouringDuration && step.pouringDuration < step.duration) {
        playBeep(300, 'triangle', 0.4); // Lower pitch to signal "stop"
      }
      
      if (currentTime === accumulatedTime + step.duration) {
        // Step change!
        playBeep(880, 'square', 0.3);
      }
      accumulatedTime += step.duration;
    }

    if (currentTime >= accumulatedTime) {
      handleFinish();
    }
  };

  const getCurrentStepIndex = () => {
    if (!recipe) return 0;
    let accumulatedTime = 0;
    for (let i = 0; i < recipe.steps.length; i++) {
      accumulatedTime += recipe.steps[i].duration;
      if (time < accumulatedTime) return i;
    }
    return recipe.steps.length - 1;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const waitForImageReady = async (img: HTMLImageElement, label: string) => {
    const isLoaded = () => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;

    if (!isLoaded()) {
      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          window.clearTimeout(timeoutId);
          resolve();
        };
        const onLoad = () => finish();
        const onError = () => {
          console.warn(`[share] ${label} failed to load`, {
            currentSrc: img.currentSrc || img.src,
          });
          finish();
        };
        const timeoutId = window.setTimeout(() => {
          console.warn(`[share] ${label} timed out waiting for load`, {
            currentSrc: img.currentSrc || img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          });
          finish();
        }, SHARE_ASSET_TIMEOUT_MS);

        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onError, { once: true });
      });
    }

    if (typeof img.decode === 'function') {
      try {
        await img.decode();
      } catch (error) {
        console.warn(`[share] ${label} decode failed`, error);
      }
    }
  };

  const waitForImagesToDecode = async (root: HTMLElement, label: string) => {
    const images = Array.from(root.querySelectorAll('img'));
    await Promise.all(images.map((img, index) => waitForImageReady(img, `${label}[${index}]`)));
  };

  const waitForNextPaint = async (frames = 2) => {
    for (let i = 0; i < frames; i += 1) {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    }
  };

  const replaceCanvasesWithImages = async (root: HTMLElement) => {
    const canvasReplacements: { parent: HTMLElement; canvas: HTMLCanvasElement; img: HTMLImageElement }[] = [];
    const generatedChartImages: HTMLImageElement[] = [];
    const canvases = Array.from(root.querySelectorAll('canvas'));

    canvases.forEach((canvas, index) => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.alt = `Share chart ${index + 1}`;
      img.decoding = 'sync';
      const computedStyle = window.getComputedStyle(canvas);
      img.style.cssText = computedStyle.cssText;
      img.style.width = computedStyle.width;
      img.style.height = computedStyle.height;
      img.style.display = computedStyle.display === 'inline' ? 'block' : computedStyle.display;

      parent.replaceChild(img, canvas);
      canvasReplacements.push({ parent, canvas, img });
      generatedChartImages.push(img);
    });

    await Promise.all(
      generatedChartImages.map((img, index) => waitForImageReady(img, `chartImage[${index}]`))
    );

    return canvasReplacements;
  };

  const restoreCanvasReplacements = (
    canvasReplacements: { parent: HTMLElement; canvas: HTMLCanvasElement; img: HTMLImageElement }[]
  ) => {
    canvasReplacements.forEach(({ parent, canvas, img }) => {
      if (parent.contains(img)) {
        parent.replaceChild(canvas, img);
      }
    });
  };

  const handleStart = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume(); // Must be resumed on user interaction
    }
    
    // Async pre-generate AIGC Image using Gemini Imagen API
    if (recipe) {
      const bean = beans.find(b => b.id === selectedBeanId);
      console.log('[Gemini Imagen] Starting background image generation...');
      
      // Fire-and-forget: generate image in background while user brews
      generateAIImage(bean?.origin || '', bean?.tastingNotes || [])
        .then(dataUrl => {
          console.log('[Gemini Imagen] Image generated. Size (chars):', dataUrl.length);
          setAigcImageUrl(dataUrl);
        })
        .catch(err => {
          console.error('[Gemini Imagen] Image generation failed:', err);
          // On error, aigcImageUrl stays empty and the share card will render without a background image
        });
    }
      
    setBrewState('countdown');
    setCountdown(3);
    playBeep(440, 'sine', 0.2); // First countdown beep
  };

  // Countdown logic
  useEffect(() => {
    if (brewState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(c => c - 1);
          playBeep(440, 'sine', 0.2);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Start active brew
        setBrewState('active');
        setIsRunning(true);
        playBeep(880, 'square', 0.5); // "GO!" beep
      }
    }
  }, [brewState, countdown]);

  const handlePause = () => {
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
    setBrewState('setup');
  };

  const handleFinish = async () => {
    setIsRunning(false);
    playBeep(1000, 'sine', 0.5);
    setTimeout(() => playBeep(1200, 'sine', 0.5), 600);
    setBrewState('finished');
    
    // Save to history
    if (recipe) {
      const histories = (await getItem<any[]>(StorageKeys.HISTORY)) || [];
      histories.push({
        id: crypto.randomUUID(),
        date: Date.now(),
        recipe,
        beanId: selectedBeanId,
      });
      await setItem(StorageKeys.HISTORY, histories);
    }
  };

  if (brewState === 'setup') {
    return (
      <div className="animate-fade-in" style={{ paddingBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: 'var(--color-primary)', margin: 0 }}>Setup Brew</h2>
          {isDevelopment && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: isTestMode ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '6px 12px',
              background: isTestMode ? 'rgba(212, 163, 115, 0.1)' : 'transparent',
              borderRadius: '20px',
              border: `1px solid ${isTestMode ? 'var(--color-primary)' : 'var(--color-border)'}`,
              transition: 'all 0.2s ease'
            }}>
              <input
                type="checkbox"
                checked={isTestMode}
                onChange={(e) => {
                  setIsTestMode(e.target.checked);
                  // Reload recipe when toggling test mode
                  if (e.target.checked) {
                    setRecipe(TEST_RECIPE);
                  } else if (beans.length > 0) {
                    const b = beans.find(bean => bean.id === selectedBeanId) || beans[0];
                    setRecipe(suggestRecipe(b, coffeeWeight));
                  }
                }}
                style={{ display: 'none' }}
              />
              <span style={{ fontWeight: isTestMode ? '600' : '400' }}>⚡ Test Mode</span>
            </label>
          )}
        </div>

        {beans.length === 0 && !isTestMode ? (
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <p>Please add a coffee bean first{isDevelopment && ', or enable Test Mode for quick testing'}.</p>
          </div>
        ) : (
          <>
            {!isTestMode && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Select Bean</label>
                  <select className="input-field" value={selectedBeanId} onChange={handleBeanChange}>
                    {beans.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.roastLevel})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ width: '100px' }}>
                  <label className="input-label">Weight (g)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={coffeeWeight}
                    onChange={handleWeightChange}
                    min="5"
                    max="50"
                  />
                </div>
              </div>
            )}

            {recipe && (
              <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>{recipe.title}</h3>
                  {isTestMode && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      background: 'var(--color-primary)',
                      color: '#1a1a1a',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>TEST MODE</span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>{recipe.profile}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Droplet size={18} color="var(--color-primary)" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ratio</div>
                      <div style={{ fontWeight: '600' }}>1:{recipe.ratio} ({recipe.coffeeWeight * recipe.ratio}g)</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Thermometer size={18} color="var(--color-primary)" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Temp</div>
                      <div style={{ fontWeight: '600' }}>{recipe.temperature}°C</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={18} color="var(--color-primary)" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Grind</div>
                      <div style={{ fontWeight: '600' }}>{recipe.grindSize}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Steps</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recipe.steps.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{step.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{step.description}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{step.targetWeight}g</div>
                          <div style={{ fontSize: '0.75rem' }}>{formatTime(step.duration)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', marginTop: '30px' }} onClick={handleStart}>
                  Start Brewing
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  const handleShareClick = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingShare(true);

    let canvasReplacements: { parent: HTMLElement; canvas: HTMLCanvasElement; img: HTMLImageElement }[] = [];

    try {
      const root = shareCardRef.current;
      console.log('[share] Preparing share capture');

      await waitForImagesToDecode(root, 'shareCardImage');
      await waitForNextPaint(2);

      canvasReplacements = await replaceCanvasesWithImages(root);
      await waitForNextPaint(2);

      const dataUrl = await toJpeg(shareCardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        style: { background: '#121212' },
        cacheBust: true,
      });

      restoreCanvasReplacements(canvasReplacements);

      if (navigator.share) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'my-brew.jpg', { type: 'image/jpeg' });
        await navigator.share({
          title: 'My Pour-Over Brew',
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.download = `brew-${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Share failed', err);
      console.error('[share] Share diagnostics', {
        imageStates: shareCardRef.current
          ? Array.from(shareCardRef.current.querySelectorAll('img')).map((img, index) => ({
              index,
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              currentSrc: img.currentSrc || img.src,
            }))
          : [],
        hasRunningAnimations: shareCardRef.current
          ? shareCardRef.current.getAnimations({ subtree: true }).length > 0
          : false,
      });
      restoreCanvasReplacements(canvasReplacements);
    } finally {
      setIsGeneratingShare(false);
    }
  };

  if (brewState === 'finished') {
    const currentBean = beans.find(b => b.id === selectedBeanId);
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '20px 10px 40px 10px',
        minHeight: '100%' 
      }}>
        
        {/* The Actual Share Card that will be snapshotted */}
        <div ref={shareCardRef} style={{
          width: '100%', maxWidth: '380px',
          borderRadius: '24px',
          background: 'var(--color-surface)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
           {/* 1. Header Image Section (AIGC Output) */}
           {aigcImageUrl ? (
             <div style={{
               width: '100%',
               height: '240px',
               position: 'relative',
               overflow: 'hidden',
               flexShrink: 0
             }}>
                {/* Explicit IMG tag is dramatically more reliable for html-to-image serialization than unquoted CSS backgroundImage */}
                <img 
                  src={aigcImageUrl} 
                  alt="Cosmic Coffee" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                />
                {/* Soft gradient overlay so text doesn't completely disappear on bright images */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, transparent, var(--color-surface))' }}></div>
             </div>
           ) : (
             <div style={{ width: '100%', height: '180px', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <div className="spinner"></div>
             </div>
           )}
           
           {/* 2. Content Section */}
           <div style={{ padding: '20px 24px 24px 24px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                 <h2 style={{ margin: 0, color: 'var(--color-text)', fontSize: '1.5rem', lineHeight: 1.2 }}>{recipe?.title.split(' - ')[0]}</h2>
                 <div style={{ color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 'bold', padding: '4px 8px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '12px' }}>
                    Complete
                 </div>
              </div>
              
              <h3 style={{ margin: '0 0 24px 0', color: 'var(--color-primary)', fontWeight: '500', fontSize: '1rem' }}>{currentBean?.name} • {currentBean?.origin}</h3>
              
              {/* Brew Data Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Ratio</div>
                  <div style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>1:{recipe?.ratio}</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Temp</div>
                  <div style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>{recipe?.temperature}°C</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Time</div>
                  <div style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>{formatTime(time)}</div>
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: '120px', margin: '0 -10px', marginBottom: '16px' }}>
                <BrewChart recipe={recipe!} height="100%" disableAnimation />
              </div>
              
              {/* 3. Footer with QR Code */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: 'auto' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>Pour-Over Master</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Scan to brew with me</div>
                 </div>
                 <div style={{ background: '#fff', padding: '6px', borderRadius: '8px', flexShrink: 0, display: 'flex' }}>
                    <QRCodeSVG 
                      value={window.location.origin} 
                      size={46} 
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', width: '100%', maxWidth: '380px' }}>
           <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => { setBrewState('setup'); setTime(0); }}>
             Brew Another
           </button>
           <button 
             className="btn btn-primary" 
             style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
             onClick={handleShareClick}
             disabled={isGeneratingShare}
           >
             {isGeneratingShare ? 'Preparing share...' : <><Share2 size={18} /> Share Profile</>}
           </button>
        </div>
        
      </div>
    );
  }

  if (brewState === 'countdown') {
    return (
      <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '40px' }}>Get Ready</h2>
        <div className="glass-panel" style={{ 
          width: '200px', height: '200px', borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 50px rgba(212, 163, 115, 0.4)',
          border: '2px solid var(--color-primary)'
        }}>
          <h1 style={{ fontSize: '6rem', margin: 0, color: 'var(--color-primary)' }}>{countdown}</h1>
        </div>
      </div>
    );
  }

  // Active Timer View
  const currentStepIdx = getCurrentStepIndex();
  const currentStep = recipe?.steps[currentStepIdx];
  const totalTime = recipe?.steps.reduce((acc, s) => acc + s.duration, 0) || 0;
  const progressPercent = (time / totalTime) * 100;

  // Calculate dynamic target weight and pour rate
  let currentTargetWeight = 0;
  let previousStepTotalWeight = 0;
  let stepTimeElapsed = 0;
  let isPouringPhase = false;
  let pourRateDisplay = '';

  if (recipe && currentStep) {
    let accTime = 0;
    for (let i = 0; i < currentStepIdx; i++) {
        accTime += recipe.steps[i].duration;
        previousStepTotalWeight = recipe.steps[i].targetWeight;
    }
    
    stepTimeElapsed = time - accTime;
    
    if (stepTimeElapsed <= currentStep.pouringDuration) {
        // We are in the pouring phase of the current step
        isPouringPhase = true;
        const weightToPourThisStep = currentStep.targetWeight - previousStepTotalWeight;
        const ratePerSecond = weightToPourThisStep / currentStep.pouringDuration;
        
        // Linear interpolation of weight
        currentTargetWeight = previousStepTotalWeight + (ratePerSecond * stepTimeElapsed);
        pourRateDisplay = `Pour at ${ratePerSecond.toFixed(1)} g/s`;
    } else {
        // We are in the waiting/blooming phase
        isPouringPhase = false;
        currentTargetWeight = currentStep.targetWeight;
        pourRateDisplay = `Wait / Draw down`;
    }
  }

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        <h3 style={{ color: 'var(--color-primary)', margin: '0 0 5px 0' }}>{currentStep?.name || 'Done'}</h3>
        <div style={{ margin: '0 0 5px 0' }}>
          <span style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>{currentTargetWeight.toFixed(1)}g</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}> / {currentStep?.targetWeight}g</span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '40px' }}>{pourRateDisplay}</p>
        
        {/* Timer Circle */}
        <div style={{ 
          position: 'relative', 
          width: '240px', 
          height: '240px', 
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `conic-gradient(var(--color-primary) ${progressPercent}%, rgba(255,255,255,0.05) 0)`,
          borderRadius: '50%',
          boxShadow: isPouringPhase ? '0 0 40px rgba(212, 163, 115, 0.4)' : '0 0 20px rgba(212, 163, 115, 0.1)',
          transition: 'box-shadow 0.3s ease'
        }}>
          <div className="glass-panel" style={{ 
            width: '220px', 
            height: '220px', 
            borderRadius: '50%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            border: isPouringPhase ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
          }}>
            <h1 style={{ fontSize: '4rem', margin: '0 0 -10px 0', fontFamily: 'monospace', color: isPouringPhase ? 'var(--color-primary)' : 'var(--color-text)' }}>{formatTime(time)}</h1>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--color-text-muted)', 
              marginTop: '16px', 
              textAlign: 'center', 
              padding: '0 16px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.4',
              maxHeight: '2.8em'
            }}>{currentStep?.description}</div>
            <div style={{ fontSize: '0.75rem', color: isPouringPhase ? 'var(--color-primary)' : 'var(--color-text-muted)', marginTop: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {isPouringPhase ? 'Pouring' : 'Waiting'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingBottom: '30px' }}>
        <button className="btn btn-glass btn-icon" onClick={handleStop}>
          <Square size={20} />
        </button>
        <button className="btn btn-primary btn-icon" style={{ width: '64px', height: '64px' }} onClick={handlePause}>
          {isRunning ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <button className="btn btn-glass btn-icon" onClick={() => {/* Skip logic could go here */}}>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Brew;
