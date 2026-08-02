import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { X, MapPin, Users, Briefcase, Wrench, Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const GateDetailsPanel = () => {
  const { 
    selectedGate, setSelectedGate, flights, gateEvents,
    simulationTime, getFlightBaggage, getFlightAlerts 
  } = useStore();

  // Find all events for this gate
  const eventsForGate = useMemo(() => {
    return gateEvents
      .filter(e => e.gate === selectedGate && e.timestamp)
      .map(e => ({
        ...e,
        start: new Date(e.timestamp.replace(' ', 'T') + 'Z'),
        end: new Date(new Date(e.timestamp.replace(' ', 'T') + 'Z').getTime() + (parseInt(e.duration_mins) || 60) * 60000)
      }))
      .sort((a, b) => a.start - b.start);
  }, [gateEvents, selectedGate]);

  if (!selectedGate) return null;

  const activeEvent = eventsForGate.find(e => simulationTime >= e.start && simulationTime <= e.end);
  const nextEvent = eventsForGate.find(e => e.start > simulationTime);

  const activeFlight = activeEvent ? flights.find(f => f.flight_id === activeEvent.flight_id) : null;
  const nextFlight = nextEvent ? flights.find(f => f.flight_id === nextEvent.flight_id) : null;

  const getDeterministicData = (flightId) => {
    if (!flightId) return null;
    let hash = 0;
    for (let i = 0; i < flightId.length; i++) hash = flightId.charCodeAt(i) + ((hash << 5) - hash);
    const absHash = Math.abs(hash);
    const passCount = 150;
    return {
      groundStaff: (absHash % 3) + 2,
      securityTeam: (absHash % 2) + 1,
      maintenance: (absHash % 4) === 0 ? 1 : 0,
      boarded: Math.min(passCount, passCount - (absHash % 40) - 10),
      checkedIn: Math.min(passCount, passCount - (absHash % 20)),
      securityStatus: (absHash % 4) === 0 ? 'Pending' : 'Cleared'
    };
  };

  const activeData = getDeterministicData(activeFlight?.flight_id);
  const bags = activeFlight ? getFlightBaggage(activeFlight.flight_id) : null;
  const alerts = activeFlight ? getFlightAlerts(activeFlight.flight_id) : [];
  
  const boardingPercent = activeData ? Math.round((activeData.boarded / activeData.checkedIn) * 100) : 0;

  let expectedRelease = 'Available';
  if (activeEvent) {
    if (alerts.length > 0) expectedRelease = 'Delayed (Maintenance)';
    else if (activeFlight && Number(activeFlight.delay_minutes) > 0) expectedRelease = `Delayed (+${activeFlight.delay_minutes}m)`;
    else expectedRelease = format(activeEvent.end, 'HH:mm');
  }

  return (
    <AnimatePresence>
      {selectedGate && (
        <motion.div 
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '420px', height: '100vh',
            background: 'var(--bg-panel)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderLeft: '1px solid var(--glass-border)', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', zIndex: 110
          }}
        >
          {/* Header */}
          <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <MapPin size={24} color="var(--accent-blue)" />
                  <h2 style={{ fontSize: '2rem', margin: 0 }}>Gate {selectedGate}</h2>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Status: <span style={{ color: activeFlight ? (alerts.length > 0 ? 'var(--status-red)' : 'var(--accent-blue)') : 'var(--status-green)', fontWeight: 600 }}>
                    {activeFlight ? (alerts.length > 0 ? 'Maintenance Hold' : 'Occupied') : 'Available'}
                  </span>
                </div>
              </div>
              <button className="btn" onClick={() => setSelectedGate(null)} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="hide-scrollbar">
            
            {/* Occupancy Timeline */}
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> Occupancy Schedule
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid var(--accent-blue)', padding: '1rem', borderRadius: '0 8px 8px 0' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CURRENT</div>
                  {activeFlight ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{activeFlight.flight_id} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({activeFlight.aircraft_type})</span></div>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{format(activeEvent.start, 'HH:mm')} - {format(activeEvent.end, 'HH:mm')}</div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--status-green)', fontWeight: 600 }}>Available</div>
                  )}
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderLeft: '3px solid rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '0 8px 8px 0' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>NEXT INBOUND</div>
                  {nextFlight ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{nextFlight.flight_id}</div>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{format(nextEvent.start, 'HH:mm')}</div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>No scheduled arrivals</div>
                  )}
                </div>
              </div>
            </div>

            {/* Turnaround Logistics (Only if active flight) */}
            {activeFlight && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={14} /> Passengers</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      {activeFlight.passengers}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>Count</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '0.25rem' }}>Boarding {boardingPercent}%</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={14} /> Baggage</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{bags?.loaded} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {bags?.total}</span></div>
                    <div style={{ fontSize: '0.75rem', color: bags?.delayed > 0 ? 'var(--status-yellow)' : 'var(--status-green)', marginTop: '0.25rem' }}>{bags?.delayed} Delayed Bags</div>
                  </div>
                </div>

                {/* Assigned Staff */}
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} /> Assigned Resources & Flags
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>Ground Staff: <strong>{activeData?.groundStaff}</strong></div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>Security Status: <strong style={{ color: activeData?.securityStatus === 'Cleared' ? 'var(--status-green)' : 'var(--status-yellow)' }}>{activeData?.securityStatus}</strong></div>
                    {alerts.length > 0 ? (
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-red)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--status-red)' }}>
                        Maintenance Flag: <strong>Active Issue</strong>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>Maintenance: <strong style={{ color: 'var(--status-green)' }}>Cleared</strong></div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Intelligence / Suggestions */}
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> Expected Release & Actions
              </h3>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Expected Release</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: expectedRelease.includes('Delay') ? 'var(--status-red)' : 'var(--text-main)' }}>
                    {expectedRelease}
                  </div>
                </div>

                {alerts.length > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--status-red)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} /> Maintenance required before release.
                  </div>
                )}

                {activeFlight && Number(activeFlight.delay_minutes) > 30 && nextFlight && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--status-yellow)', fontWeight: 600, marginBottom: '0.5rem' }}>Gate Conflict Warning</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Current delay will cause a conflict with inbound {nextFlight.flight_id}.</div>
                    <button className="btn primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>Reassign Next Flight</button>
                  </div>
                )}
                
                {(!activeFlight || (alerts.length === 0 && (!activeFlight || Number(activeFlight.delay_minutes) <= 30))) && (
                  <div style={{ color: 'var(--status-green)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} /> Gate operations normal.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> Full Day Schedule
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {eventsForGate.map((e, idx) => {
                  const isPast = simulationTime > e.end;
                  const isCurrent = simulationTime >= e.start && simulationTime <= e.end;
                  const flight = flights.find(f => f.flight_id === e.flight_id);
                  
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', 
                      background: isCurrent ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)', 
                      borderRadius: '8px',
                      border: isCurrent ? '1px solid var(--accent-blue)' : '1px solid var(--border-light)',
                      opacity: isPast ? 0.5 : 1
                    }}>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)', width: '90px' }}>
                        {format(e.start, 'HH:mm')} - {format(e.end, 'HH:mm')}
                      </div>
                      <div style={{ fontWeight: 600, flex: 1, color: isCurrent ? 'var(--accent-blue)' : 'var(--text-main)' }}>
                        {e.flight_id}
                      </div>
                      <div style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--bg-panel)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                        {flight ? `${flight.origin} → ${flight.destination}` : 'Unknown'}
                      </div>
                    </div>
                  );
                })}
                {eventsForGate.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                    No events scheduled for this gate today
                  </div>
                )}
              </div>
            </div>

            <div style={{ height: '2rem' }}></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
