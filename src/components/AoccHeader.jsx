import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Play, Pause, Search, Bell, Sun, Moon, X, Activity, AlertTriangle, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export const AoccHeader = () => {
  const { isRunning, simulationTime, simulationSpeed, toggleSimulation, setSimulationSpeed, getHealthScore, theme, toggleTheme, globalSearchTerm, setGlobalSearchTerm } = useStore();
  const healthScore = getHealthScore();
  const [isHealthModalOpen, setHealthModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  let healthColor = 'var(--status-green)';
  let healthText = 'Stable';
  if (healthScore < 70) {
    healthColor = 'var(--status-red)';
    healthText = 'Critical';
  } else if (healthScore < 90) {
    healthColor = 'var(--status-yellow)';
    healthText = 'Degraded';
  }

  return (
    <>
      <div className="top-header">
        
        {/* Left Side: Branding & Health */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="logo-text" style={{ margin: 0 }}>Airport Operations Control Center</h1>
            <div className="live-badge">LIVE</div>
          </div>
          
          {/* Divider */}
          <div style={{ height: '28px', width: '1px', background: 'var(--border-light)' }}></div>
          
          {/* Health Score */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => setHealthModalOpen(true)}
          >
            <Activity color={healthColor} size={22} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600 }}>Health Score</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: healthColor, lineHeight: 1 }}>{healthScore}%</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{healthText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '280px', margin: '0 1rem', minWidth: '120px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Global Search..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Right Side: Clock, Controls, Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          
          {/* Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-cyan)', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            {format(simulationTime, 'yyyy-MM-dd HH:mm')}
          </div>
          
          {/* Simulation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={toggleSimulation}
              style={{ 
                background: isRunning ? 'rgba(59, 130, 246, 0.2)' : 'var(--accent-blue)', 
                color: isRunning ? 'var(--accent-blue)' : 'white',
                border: isRunning ? '1px solid var(--accent-blue)' : 'none',
                width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {isRunning ? <Pause size={16}/> : <Play size={16} fill="currentColor" />}
            </button>
            <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
              {[1, 5, 15, 60].map(speed => (
                <button
                  key={speed}
                  onClick={() => setSimulationSpeed(speed)}
                  style={{
                    padding: '0.35rem 0.6rem',
                    background: simulationSpeed === speed ? 'var(--accent-blue)' : 'transparent',
                    color: simulationSpeed === speed ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    borderRight: speed !== 60 ? '1px solid var(--border-light)' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
            <button 
              className="icon-btn" 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ position: 'relative' }}
            >
              <Bell size={16} />
              {/* Notification Badge */}
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', background: 'var(--status-red)', borderRadius: '50%' }}></span>
            </button>
            <button className="icon-btn" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{
                  position: 'absolute', top: '100%', right: '40px', marginTop: '10px',
                  width: '320px', maxHeight: '400px', overflowY: 'auto',
                  background: 'var(--bg-panel)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid var(--glass-border)', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 1000,
                  display: 'flex', flexDirection: 'column'
                }}
                className="hide-scrollbar"
              >
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Recent Alerts</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Simulate 3 recent notifications based on simulation time */}
                  <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.02)', display: 'flex', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ color: 'var(--status-red)', marginTop: '2px' }}><AlertTriangle size={16} /></div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>Critical Maintenance Alert</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hydraulic leak reported on SG-8853. Grounding immediately.</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--status-red)', marginTop: '0.4rem', fontWeight: 600 }}>Just now</div>
                    </div>
                  </div>
                  
                  <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.02)', display: 'flex', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ color: 'var(--status-yellow)', marginTop: '2px' }}><Activity size={16} /></div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>Baggage Loading Delay</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gate B4 is experiencing a 15-minute delay in baggage loading.</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--status-yellow)', marginTop: '0.4rem', fontWeight: 600 }}>2 mins ago</div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', display: 'flex', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ color: 'var(--status-cyan)', marginTop: '2px' }}><Shield size={16} /></div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>Security Sweep Complete</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Terminal 3 Sector A cleared by security teams.</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--status-cyan)', marginTop: '0.4rem', fontWeight: 600 }}>15 mins ago</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </div>
      
      {/* Health Modal */}
      {isHealthModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setHealthModalOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="glass-panel"
            style={{ width: '400px', maxWidth: '90%', padding: '2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity color={healthColor} size={24} /> Health Score Breakdown
              </h2>
              <button className="icon-btn" onClick={() => setHealthModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 800, color: healthColor, lineHeight: 1 }}>{healthScore}%</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span>Base Score</span><span style={{ color: 'var(--status-green)', fontWeight: 600 }}>100%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span>Active Deductions</span><span style={{ color: 'var(--status-red)', fontWeight: 600 }}>-{100 - healthScore}%</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
