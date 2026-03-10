import React from 'react'
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react'

export const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ', r)
    },
    onRegisterError(error: any) {
      console.error('SW registration error', error)
    },
  })

  return (
    <div className={`update-prompt ${needRefresh ? 'visible' : ''}`}>
      <div className="update-prompt-body">
        <div style={{ fontSize: '1.5rem' }}>🚀</div>
        <div>
          <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>New Version Available</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Update to get the latest features and bug fixes.</p>
        </div>
      </div>
      <div className="update-prompt-actions">
        <button className="btn btn-glass" onClick={() => setNeedRefresh(false)}>Dismiss</button>
        <button className="btn btn-primary" onClick={() => updateServiceWorker(true)}>Update App</button>
      </div>
    </div>
  )
}
