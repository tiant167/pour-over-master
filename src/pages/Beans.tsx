import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBeans, addBean, deleteBean } from '../utils/beanService';
import type { Bean } from '../utils/beanService';
import { recognizeCoffeeBean, generateRecipeFromText } from '../utils/ai';
import { Plus, Camera, Trash2, Loader2, ArrowLeft, Play } from 'lucide-react';
import toast from 'react-hot-toast';

const Beans: React.FC = () => {
  const navigate = useNavigate();
  const [beans, setBeans] = useState<Bean[]>([]);
  const [view, setView] = useState<'list' | 'add'>('list');
  const [loading, setLoading] = useState(false);
  const [generatingTextRecipe, setGeneratingTextRecipe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<Bean, 'id' | 'createdAt'>>({
    name: '', origin: '', roastLevel: 'Medium', process: '', tastingNotes: []
  });

  useEffect(() => {
    loadBeans();
  }, [view]);

  const loadBeans = async () => {
    const data = await getBeans();
    setBeans(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          console.log('[Gemini AI] Sending image to Gemini API for recognition and Recipe Formula Generation...');
          const aiResult = await recognizeCoffeeBean(base64String);
          console.log('[Gemini AI] Response received:', aiResult);
          
          setFormData((prev) => ({
            ...prev,
            name: aiResult.name || formData.name,
            origin: aiResult.origin || formData.origin,
            roastLevel: aiResult.roastLevel || formData.roastLevel,
            process: aiResult.process || formData.process,
            tastingNotes: aiResult.tastingNotes && aiResult.tastingNotes.length > 0 ? aiResult.tastingNotes : formData.tastingNotes,
            aiFormula: aiResult.aiFormula || prev.aiFormula
          }));
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || 'AI Recognition error');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let beanToSave = { ...formData };
    
    // Auto-generate AI formula if not present (e.g. added purely via text)
    if (!beanToSave.aiFormula) {
      setGeneratingTextRecipe(true);
      try {
        console.log('[Gemini AI] Auto-generating Recipe Formula before saving...');
        const formula = await generateRecipeFromText(formData);
        console.log('[Gemini AI] Auto Recipe Formula generated:', formula);
        beanToSave.aiFormula = formula;
      } catch (err: any) {
        console.error('Failed to auto-generate recipe:', err);
        // Continue saving even if AI fails, but let the user know
        toast.error('Could not generate AI recipe, saving with default fallback formula.');
      }
    }

    await addBean(beanToSave);
    setFormData({ name: '', origin: '', roastLevel: 'Medium', process: '', tastingNotes: [] });
    loadBeans();
    setGeneratingTextRecipe(false);
    setView('list');
    
    // Slight delay so the UI updates to list view before toasting
    setTimeout(() => toast.success('Bean saved successfully!'), 100);
  };

  const handleDelete = async (id: string, name: string) => {
    toast((t) => (
      <div>
        <p style={{ marginBottom: '10px' }}>Delete <strong>{name}</strong>?</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-glass" 
            style={{ padding: '4px 12px', minHeight: 'auto' }}
            onClick={() => toast.dismiss(t.id)}
          >Cancel</button>
          <button 
            className="btn btn-primary" 
            style={{ padding: '4px 12px', minHeight: 'auto', background: 'var(--color-danger, #ef4444)' }}
            onClick={async () => {
              toast.dismiss(t.id);
              await deleteBean(id);
              loadBeans();
              setTimeout(() => toast.success('Bean deleted', { duration: 3000 }), 100);
            }}
          >Delete</button>
        </div>
      </div>
    ), { 
      duration: Infinity,
      style: {
        marginTop: '35vh', // Visually pushes it to the center of the screen
        minWidth: '280px'
      }
    });
  };

  if (view === 'add') {
    return (
      <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
        <button className="btn btn-glass" style={{ marginBottom: '20px', padding: '8px 16px' }} onClick={() => setView('list')}>
          <ArrowLeft size={18} /> Back
        </button>
        
        <h2 style={{ color: 'var(--color-primary)' }}>Add New Bean</h2>
        
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Let AI extract details from the bag</p>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleCapture}
            style={{ display: 'none' }} 
          />
          <button 
            className="btn btn-primary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Camera />} Take Photo of Bag
          </button>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px' }}>
          <div className="input-group">
            <label className="input-label">Bean Name</label>
            <input className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ethiopia Yirgacheffe" />
          </div>
          <div className="input-group">
            <label className="input-label">Origin</label>
            <input className="input-field" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} placeholder="e.g. Ethiopia" />
          </div>
          <div className="input-group">
            <label className="input-label">Roast Level</label>
            <select className="input-field" value={formData.roastLevel} onChange={e => setFormData({...formData, roastLevel: e.target.value as any})}>
              <option value="Light">Light</option>
              <option value="Medium">Medium</option>
              <option value="Dark">Dark</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Processing Method</label>
            <input className="input-field" value={formData.process} onChange={e => setFormData({...formData, process: e.target.value})} placeholder="e.g. Washed, Natural" />
          </div>

          <div style={{ marginTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px' }}
              disabled={generatingTextRecipe || !formData.name}
            >
              {generatingTextRecipe ? (
                <><Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} /> Generating AI Recipe & Saving...</>
              ) : (
                <>Save Bean</>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>My Beans</h2>
        <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => setView('add')}>
          <Plus size={18} /> Add
        </button>
      </div>

      {beans.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p>No beans added yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {beans.map(bean => (
            <div key={bean.id} className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: 'var(--color-primary)' }}>{bean.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{bean.origin} • {bean.roastLevel} • {bean.process}</p>
                  {bean.tastingNotes && bean.tastingNotes.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {bean.tastingNotes.map((note, i) => (
                        <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{note}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-primary btn-icon" 
                    style={{ width: '32px', height: '32px', padding: 0 }} 
                    onClick={() => navigate('/brew', { state: { autoSelectBeanId: bean.id } })}
                    title="Brew this bean"
                  >
                    <Play size={16} />
                  </button>
                  <button 
                    className="btn btn-glass btn-icon" 
                    style={{ width: '32px', height: '32px', border: 'none' }} 
                    onClick={() => handleDelete(bean.id!, bean.name)}
                    title="Delete bean"
                  >
                    <Trash2 size={16} color="var(--color-error)" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Beans;
