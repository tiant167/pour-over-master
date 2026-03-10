import React, { useEffect, useState, useRef } from 'react';
import { getItem, StorageKeys } from '../utils/storage';
import type { BrewRecipe } from '../utils/suggestions';
import { getBeanById } from '../utils/beanService';
import type { Bean } from '../utils/beanService';
import { Share2, ChevronRight } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { BrewChart } from '../components/BrewChart';

interface HistoryRecord {
  id: string;
  date: number;
  recipe: BrewRecipe;
  beanId: string;
}

interface EnrichedHistory extends HistoryRecord {
  bean?: Bean;
}

const History: React.FC = () => {
  const [histories, setHistories] = useState<EnrichedHistory[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EnrichedHistory | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getItem<HistoryRecord[]>(StorageKeys.HISTORY) || [];
    const enriched = await Promise.all(
      data.map(async record => ({
        ...record,
        bean: await getBeanById(record.beanId)
      }))
    );
    setHistories(enriched.sort((a, b) => b.date - a.date));
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toJpeg(shareCardRef.current, { quality: 0.95, style: { background: '#121212' } });
      
      // If Web Share API is available (Mobile devices mostly)
      if (navigator.share) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'my-brew.jpg', { type: 'image/jpeg' });
        await navigator.share({
          title: 'My Pour-Over Brew',
          text: `Check out my recent pour-over coffee brew!`,
          files: [file]
        });
      } else {
        // Fallback to download
        const link = document.createElement('a');
        link.download = `brew-${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Share failed', err);
    } finally {
      setSharing(false);
    }
  };

  if (selectedRecord) {
    return (
      <div className="animate-fade-in" style={{ paddingBottom: '30px' }}>
        <button className="btn btn-glass" style={{ marginBottom: '20px', padding: '8px 16px' }} onClick={() => setSelectedRecord(null)}>
          Back
        </button>
        
        {/* Share Card Area */}
        <div ref={shareCardRef} className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--color-primary)', opacity: 0.1, borderRadius: '50%', filter: 'blur(30px)' }}></div>
          
          <h2 style={{ margin: '0 0 10px 0', color: 'var(--color-primary)' }}>{selectedRecord.recipe.title.split(' - ')[0]}</h2>
          <h3 style={{ margin: '0 0 20px 0', fontWeight: '400', fontSize: '1rem' }}>{selectedRecord.bean?.name || 'Unknown Bean'} • {selectedRecord.bean?.origin}</h3>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '0.85rem' }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Ratio</div>
              <div style={{ fontWeight: 'bold' }}>1:{selectedRecord.recipe.ratio}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Temp</div>
              <div style={{ fontWeight: 'bold' }}>{selectedRecord.recipe.temperature}°C</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Grind</div>
              <div style={{ fontWeight: 'bold' }}>{selectedRecord.recipe.grindSize}</div>
            </div>
          </div>

          <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            "{selectedRecord.recipe.profile}"
          </p>

          <BrewChart recipe={selectedRecord.recipe} height="200px" />
          
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>
            Brewed on {new Date(selectedRecord.date).toLocaleDateString()} with Pour-Over App
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={handleShare} disabled={sharing}>
          {sharing ? 'Generating Image...' : <><Share2 size={18} /> Share Brew Profile</>}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '20px' }}>History</h2>
      
      {histories.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p>No brews recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
          {histories.map(record => (
            <div key={record.id} className="glass-panel" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => setSelectedRecord(record)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--color-primary)' }}>{record.bean?.name || 'Quick Brew'}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {new Date(record.date).toLocaleDateString()} • {record.recipe.title.split(' - ')[0]}
                  </div>
                </div>
                <ChevronRight size={20} color="var(--color-text-muted)" style={{ alignSelf: 'center' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
