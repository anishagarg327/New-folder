import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Map, Plane, AlertTriangle, Hammer, Users, ShieldAlert, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TERMINALS = [
  { id: '1', name: 'Terminal 1', gates: ['B3', 'B4', 'B6', 'B7', 'B9'] },
  { id: '2', name: 'Terminal 2', gates: ['B10', 'B11', 'B12', 'B13', 'B15'] },
  { id: '3', name: 'Terminal 3', gates: ['B17', 'B18', 'B23', 'B29', 'B32'] }
];

export const AirportMap = () => {
  const { flights, gateEvents, simulationTime, setSelectedGate, selectedGate, getFlightAlerts, getFlightBaggage } = useStore();
  const [hoveredGate, setHoveredGate] = useState(null);

  // Derive gate states
  const getGateState = (gate) => {
    // Check gate events to see what flights are currently occupying the gate
    const activeEvents = gateEvents.filter(e => {
      if (!e.timestamp || e.gate !== gate) return false;
      const start = new Date(e.timestamp.replace(' ', 'T') + 'Z');
      const end = new Date(start.getTime() + (parseInt(e.duration_mins) || 60) * 60000);
      return simulationTime >= start && simulationTime <= end;
    });

    if (activeEvents.length === 0) {
      return { status: 'Available', color: 'var(--status-green)', flight: null, reason: 'Empty' };
    }

    if (activeEvents.length > 1) {
      return { status: 'Conflict', color: '#a855f7', flight: activeEvents[0].flight_id, reason: 'Double Booking' };
    }

    const event = activeEvents[0];
    const flight = flights.find(f => f.flight_id === event.flight_id);
    
    if (!flight) return { status: 'Available', color: 'var(--status-green)', flight: null, reason: 'Unknown Flight' };

    const alerts = getFlightAlerts(flight.flight_id);
    if (alerts.length > 0) {
      return { status: 'Maintenance', color: 'var(--status-red)', flight: flight.flight_id, reason: 'Active Alert' };
    }

    const depTime = new Date(flight.scheduled_departure.replace(' ', 'T') + 'Z');
    const timeDiffMins = (depTime - simulationTime) / (1000 * 60);

    if (Number(flight.delay_minutes) > 0) {
      return { status: 'Delayed', color: 'var(--status-yellow)', flight: flight.flight_id, reason: `+${flight.delay_minutes}m` };
    }

    if (timeDiffMins > 0 && timeDiffMins <= 45) {
      return { status: 'Boarding', color: 'var(--accent-blue)', flight: flight.flight_id, reason: 'In Progress' };
    }

    return { status: 'Busy', color: 'var(--text-muted)', flight: flight.flight_id, reason: 'Turnaround' };
  };

  const GateTooltip = ({ gateState }) => {
    if (!gateState.flight) return null;
    const flight = flights.find(f => f.flight_id === gateState.flight);
    if (!flight) return null;

    const bags = getFlightBaggage(flight.flight_id);
    const passCount = Number(flight.passengers) || 150;
    
    let hash = 0;
    for (let i = 0; i < flight.flight_id.length; i++) hash = flight.flight_id.charCodeAt(i) + ((hash << 5) - hash);
    const absHash = Math.abs(hash);
    const boarded = Math.min(passCount, passCount - (absHash % 40) - 10);
    const boardingPct = Math.round((boarded / passCount) * 100);

    const groundStaff = (absHash % 3) + 2;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'absolute', top: '-180px', left: '50%', transform: 'translateX(-50%)',
          width: '240px', background: 'var(--bg-panel)', border: '1px solid var(--border-light)',
          borderRadius: '8px', padding: '1rem', zIndex: 50, boxShadow: 'var(--glass-shadow)',
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 700, color: gateState.color }}>{gateState.flight}</div>
          <div style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--bg-surface)' }}>{flight.airline_code}</div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{flight.origin} → {flight.destination}</div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Passengers:</span> {passCount}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Boarding:</span> {boardingPct}%</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Bags Loaded:</span> {bags.loaded}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Delay:</span> {flight.delay_minutes}m</div>
          <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Assigned Staff:</span> {groundStaff} Ground Crew</div>
        </div>
        
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '12px', height: '12px', background: 'var(--bg-panel)', borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}></div>
      </motion.div>
    );
  };

  return (
    <div className="glass-panel" style={{ flex: '0 0 auto', height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem 1.5rem', overflow: 'hidden' }}>
      <div className="panel-header" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={16} color="var(--accent-blue)" />
          Interactive Digital Twin
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--status-green)' }}></div> Available</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent-blue)' }}></div> Boarding</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--status-yellow)' }}></div> Delayed</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--status-red)' }}></div> Maint.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
        {TERMINALS.map(terminal => (
          <div key={terminal.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '100px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {terminal.name}
            </div>
            <div style={{ display: 'flex', flex: 1, gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              {terminal.gates.map(gate => {
                const state = getGateState(gate);
                const isSelected = selectedGate === gate;
                
                return (
                  <div 
                    key={gate}
                    onMouseEnter={() => setHoveredGate(gate)}
                    onMouseLeave={() => setHoveredGate(null)}
                    onClick={() => setSelectedGate(isSelected ? null : gate)}
                    style={{ 
                      flex: 1, height: '44px', position: 'relative', cursor: 'pointer',
                      background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? state.color : 'var(--border-light)'}`, 
                      borderTop: `3px solid ${state.color}`,
                      borderRadius: '4px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 12px ${state.color}40` : 'none',
                      zIndex: isSelected ? 10 : 1
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{gate}</div>
                    {state.flight && <div style={{ fontSize: '0.6rem', color: state.color, marginTop: '2px', fontWeight: 600 }}>{state.flight.split('-')[1] || state.flight}</div>}
                    
                    <AnimatePresence>
                      {hoveredGate === gate && state.flight && (
                        <GateTooltip gateState={state} />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
