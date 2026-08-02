import React from 'react';
import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';
import { AlertCircle } from 'lucide-react';

export const GateMap = () => {
  const { gateEvents, simulationTime, flights } = useStore();

  // Find active gates based on current simulation time
  // An event is "active" if simulationTime is within timestamp and timestamp + duration_mins
  const activeEvents = gateEvents.filter(event => {
    if (!event.timestamp || !event.duration_mins) return false;
    const start = parseISO(event.timestamp);
    const end = new Date(start.getTime() + parseInt(event.duration_mins) * 60000);
    return simulationTime >= start && simulationTime <= end;
  });

  // Group by gate
  const gateStatus = {};
  activeEvents.forEach(event => {
    if (!gateStatus[event.gate]) {
      gateStatus[event.gate] = [];
    }
    gateStatus[event.gate].push(event);
  });

  // Get unique gates from all events to draw the map
  const allGates = Array.from(new Set(gateEvents.map(e => e.gate).filter(Boolean))).sort();

  return (
    <div className="glass-panel" style={{ flex: '0 0 auto' }}>
      <h2>Gate Operations</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        {allGates.slice(0, 36).map(gate => {
          const events = gateStatus[gate] || [];
          const isOccupied = events.length > 0;
          const hasConflict = events.length > 1; // Basic conflict logic
          const needsMaintenance = events.some(e => e.requires_maintenance === 'True');

          let bg = 'rgba(255,255,255,0.05)';
          let borderColor = 'rgba(255,255,255,0.1)';

          if (hasConflict) {
            bg = 'rgba(239, 68, 68, 0.2)';
            borderColor = 'var(--status-red)';
          } else if (needsMaintenance) {
            bg = 'rgba(245, 158, 11, 0.2)';
            borderColor = 'var(--status-yellow)';
          } else if (isOccupied) {
            bg = 'rgba(59, 130, 246, 0.2)';
            borderColor = 'var(--accent-blue)';
          }

          return (
            <div 
              key={gate} 
              style={{
                background: bg,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                position: 'relative'
              }}
            >
              {(hasConflict || needsMaintenance) && (
                <AlertCircle size={16} color={hasConflict ? 'var(--status-red)' : 'var(--status-yellow)'} style={{ position: 'absolute', top: 8, right: 8 }} />
              )}
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{gate}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isOccupied ? events[0].flight_id : 'Available'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
