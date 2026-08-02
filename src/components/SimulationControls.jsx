import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Play, Pause, FastForward, Clock, Moon, Sun } from 'lucide-react';
import { format } from 'date-fns';

export const SimulationControls = () => {
  const { isRunning, simulationTime, simulationSpeed, toggleSimulation, setSimulationSpeed, tick, theme, toggleTheme } = useStore();

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000); // 1 real sec = tick (which is 1 sim min by default)
    }
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  return (
    <div className="glass-panel SimulationControls-container" style={{ 
      marginBottom: '1.5rem', 
      display: 'flex', 
      justifyContent: 'space-between', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>AOCC Dashboard</h1>
        <div className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', marginLeft: '1rem' }}>
          LIVE SIMULATION
        </div>
      </div>

      <div className="controls-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.05em' }}>
          <Clock size={20} />
          {format(simulationTime, 'yyyy-MM-dd HH:mm')}
        </div>
        
        <button className="btn" onClick={toggleTheme} title="Toggle Theme" style={{ padding: '0.5rem', borderRadius: '50%' }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className={`btn ${isRunning ? '' : 'primary'}`} onClick={toggleSimulation}>
          {isRunning ? <><Pause size={16}/> Pause</> : <><Play size={16}/> Start</>}
        </button>

        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
          {[1, 5, 15, 60].map(speed => (
            <button 
              key={speed}
              className="btn" 
              style={{ 
                borderRadius: 0, 
                border: 'none',
                background: simulationSpeed === speed ? 'var(--accent-blue)' : 'transparent'
              }}
              onClick={() => setSimulationSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
