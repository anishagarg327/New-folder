import React, { useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Plane, Clock, MapPin, Users, Luggage, Wrench, Shield, CheckCircle2, AlertTriangle, UserPlus, Flame, Briefcase, Truck, Coffee } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const FlightDetailsPanel = () => {
  const { 
    selectedFlightId, setSelectedFlight, flights, 
    simulationTime, resolveMaintenance, getFlightBaggage, getFlightAlerts 
  } = useStore();

  const flight = useMemo(() => flights.find(f => f.flight_id === selectedFlightId), [flights, selectedFlightId]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setSelectedFlight(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setSelectedFlight]);

  if (!selectedFlightId || !flight) return null;

  const bags = getFlightBaggage(flight.flight_id);
  const alerts = getFlightAlerts(flight.flight_id);
  
  // Deterministic random data based on flight_id for passenger/resource details
  const simData = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < flight.flight_id.length; i++) {
      hash = flight.flight_id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    const passCount = Number(flight.passengers) || 150;
    
    return {
      checkedIn: Math.min(passCount, passCount - (absHash % 20)),
      securityCleared: Math.min(passCount, passCount - (absHash % 30)),
      boarded: Math.min(passCount, passCount - (absHash % 40) - 10),
      groundStaff: `Team ${(absHash % 5) + 1}`,
      cleaningCrew: `Crew ${(absHash % 4) + 1}`,
      fuelTruck: (absHash % 2) === 0 ? 'Assigned' : 'En Route',
      pushbackTug: (absHash % 3) === 0 ? 'Assigned' : 'Requested',
      catering: (absHash % 2) === 0 ? 'Complete' : 'In Progress',
      baggageBelt: `Belt ${(absHash % 8) + 1}`,
      lastInspection: `${(absHash % 5) + 1} hours ago`,
      maintenanceTeam: alerts.length > 0 ? `Tech Team ${(absHash % 3) + 1}` : 'N/A'
    };
  }, [flight.flight_id, flight.passengers, alerts.length]);

  const depTime = parseISO(flight.scheduled_departure.replace(' ', 'T') + 'Z');
  const estTime = addMinutes(depTime, Number(flight.delay_minutes) || 0);
  const timeDiffMins = (depTime - simulationTime) / (1000 * 60);

  // Timeline calculation matching user requested examples
  const timeline = [
    { label: 'Check-in Started', time: addMinutes(depTime, -180), active: timeDiffMins <= 180 && timeDiffMins > 120, past: timeDiffMins <= 180 },
    { label: 'Security Cleared', time: addMinutes(depTime, -90), active: timeDiffMins <= 90 && timeDiffMins > 60, past: timeDiffMins <= 90 },
    { label: 'Boarding Started', time: addMinutes(depTime, -45), active: timeDiffMins <= 45 && timeDiffMins > 30, past: timeDiffMins <= 45 },
    { label: 'Fuel Complete', time: addMinutes(depTime, -15), active: timeDiffMins <= 15 && timeDiffMins > 0, past: timeDiffMins <= 15 },
    { label: 'Pushback Approved', time: depTime, active: timeDiffMins <= 0 && timeDiffMins > -10, past: timeDiffMins <= 0 },
    { label: 'Departed', time: addMinutes(depTime, 10), active: timeDiffMins <= -10, past: timeDiffMins <= -10 }
  ];

  const getDynamicStatus = () => {
    if (flight.status === 'Security Hold') return 'Security Hold';
    if (flight.status === 'Departed' && timeDiffMins > 0) return 'Scheduled';
    if (timeDiffMins <= 45 && timeDiffMins > 0) return 'Boarding';
    if (timeDiffMins <= 0) return Number(flight.delay_minutes) > 0 ? 'Delayed' : 'Departed';
    return flight.status;
  };

  const status = getDynamicStatus();

  return (
    <AnimatePresence>
      {selectedFlightId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedFlight(null)}
          />
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'relative', width: '100%', maxWidth: '480px', height: '100vh',
              background: 'var(--bg-panel)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              borderLeft: 'var(--glass-border)', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', zIndex: 101
            }}
          >
            {/* Header / FLIGHT Section */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {flight.flight_id}
                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontWeight: 600 }}>{flight.airline}</span>
                  </h2>
                </div>
                <button className="btn" onClick={() => setSelectedFlight(null)} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Aircraft</div>
                  <div style={{ fontWeight: 600 }}>{flight.aircraft_type}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Terminal / Gate</div>
                  <div style={{ fontWeight: 600 }}>T{flight.terminal} / {flight.gate}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Route</div>
                  <div style={{ fontWeight: 600 }}>{flight.origin} → {flight.destination}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Current Status</div>
                  <div style={{ fontWeight: 600, color: status === 'Delayed' ? 'var(--status-red)' : status === 'Boarding' ? 'var(--status-yellow)' : 'var(--accent-blue)' }}>{status}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Scheduled Time</div>
                  <div style={{ fontWeight: 600 }}>{format(depTime, 'HH:mm')}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Estimated Time</div>
                  <div style={{ fontWeight: 600, color: Number(flight.delay_minutes) > 0 ? 'var(--status-red)' : 'var(--status-green)' }}>{format(estTime, 'HH:mm')}</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="hide-scrollbar">
              
              {/* PASSENGERS */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passengers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>Checked In</span>
                      <strong>{simData.checkedIn} / {flight.passengers}</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(simData.checkedIn / flight.passengers) * 100}%`, background: 'var(--accent-cyan)' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>Security Cleared</span>
                      <strong>{simData.securityCleared} / {flight.passengers}</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(simData.securityCleared / flight.passengers) * 100}%`, background: 'var(--accent-blue)' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>Boarded</span>
                      <strong>{simData.boarded} / {flight.passengers}</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(simData.boarded / flight.passengers) * 100}%`, background: 'var(--status-green)' }}></div>
                    </div>
                  </div>

                </div>
              </div>

              {/* BAGGAGE */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Baggage</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Bags</span> <strong>{bags.total}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Loaded</span> <strong style={{ color: 'var(--status-green)' }}>{bags.loaded}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Remaining</span> <strong>{bags.pending}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Belt</span> <strong>{simData.baggageBelt}</strong>
                  </div>
                </div>
              </div>

              {/* GROUND OPERATIONS */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ground Operations</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ground Crew</span> <strong>{simData.groundStaff}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Fuel Truck</span> <strong>{simData.fuelTruck}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cleaning Crew</span> <strong>{simData.cleaningCrew}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pushback Tug</span> <strong>{simData.pushbackTug}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Catering</span> <strong>{simData.catering}</strong>
                  </div>
                </div>
              </div>

              {/* MAINTENANCE */}
              <div style={{ background: alerts.length > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${alerts.length > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)'}`, borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: alerts.length > 0 ? 'var(--status-red)' : 'var(--text-muted)', textTransform: 'uppercase' }}>Maintenance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Current Status</span> <strong style={{ color: alerts.length > 0 ? 'var(--status-red)' : 'var(--status-green)' }}>{alerts.length > 0 ? 'Active Issues' : 'Cleared'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Last Inspection</span> <strong>{simData.lastInspection}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Open Issues</span> <strong style={{ color: alerts.length > 0 ? 'var(--status-red)' : 'var(--text-main)' }}>{alerts.length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Team</span> <strong>{simData.maintenanceTeam}</strong>
                  </div>
                </div>
                {alerts.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {alerts.map(alert => (
                      <div key={alert.work_order_id} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--status-red)' }}>{alert.component} Issue</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>{alert.issue_description}</div>
                        </div>
                        <button className="btn primary" onClick={() => resolveMaintenance(alert.work_order_id)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Resolve</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TIMELINE */}
              <div>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timeline</h3>
                <div style={{ position: 'relative', paddingLeft: '1rem' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '4px', bottom: '4px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {timeline.map((step, idx) => (
                      <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', position: 'relative', zIndex: 1, opacity: step.past ? 1 : 0.4 }}>
                        <div style={{ 
                          width: '12px', height: '12px', borderRadius: '50%', marginTop: '3px',
                          background: step.active ? 'var(--accent-blue)' : (step.past ? 'var(--status-green)' : 'var(--bg-panel)'),
                          border: `2px solid ${step.active ? 'var(--accent-blue)' : (step.past ? 'var(--status-green)' : 'rgba(255,255,255,0.2)')}`,
                          marginLeft: '-5px'
                        }}></div>
                        <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: '45px' }}>{format(step.time, 'HH:mm')}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: step.active ? 600 : 400, color: step.active ? 'var(--accent-cyan)' : 'var(--text-main)' }}>{step.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ height: '2rem' }}></div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
