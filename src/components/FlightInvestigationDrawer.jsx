import React, { useEffect } from 'react';
import { X, Plane, Clock, Shield, Users, Luggage, Wrench, Briefcase } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

export const FlightInvestigationDrawer = ({ flight, onClose }) => {
  const { getFlightBaggage, getFlightAlerts, getFlightGateEvents, simulationTime } = useStore();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!flight) return null;

  const bags = getFlightBaggage(flight.flight_id);
  const alerts = getFlightAlerts(flight.flight_id);
  const gateEvents = getFlightGateEvents(flight.flight_id);

  const depTime = flight.scheduled_departure ? parseISO(flight.scheduled_departure.replace(' ', 'T') + 'Z') : null;
  const estTime = depTime ? addMinutes(depTime, Number(flight.delay_minutes) || 0) : null;

  // Derive timeline from real gate events up to simulationTime
  const sortedEvents = [...gateEvents].sort((a, b) => new Date(a.timestamp.replace(' ', 'T') + 'Z') - new Date(b.timestamp.replace(' ', 'T') + 'Z'));

  const groundStaffEvents = gateEvents.filter(e => e.event_type && e.event_type.toLowerCase().includes('ground'));
  const cleaningEvents = gateEvents.filter(e => e.event_type && e.event_type.toLowerCase().includes('clean'));
  const fuelEvents = gateEvents.filter(e => e.event_type && e.event_type.toLowerCase().includes('fuel'));
  const pushbackEvents = gateEvents.filter(e => e.event_type && e.event_type.toLowerCase().includes('pushback'));

  const groundStaff = groundStaffEvents.length > 0 ? groundStaffEvents[groundStaffEvents.length - 1].staff_id : 'N/A';
  const cleaningCrew = cleaningEvents.length > 0 ? cleaningEvents[cleaningEvents.length - 1].staff_id : 'N/A';
  const fuelTruck = fuelEvents.length > 0 ? fuelEvents[fuelEvents.length - 1].staff_id : 'N/A';
  const pushbackTug = pushbackEvents.length > 0 ? pushbackEvents[pushbackEvents.length - 1].staff_id : 'N/A';

  const activeAlerts = alerts.filter(a => a.is_resolved !== 'True');
  const assignedTeam = activeAlerts.length > 0 ? activeAlerts[0].technician_id : 'N/A';
  const lastInspection = alerts.length > 0 ? alerts[0].report_time : 'N/A';
  const maintenanceStatus = activeAlerts.length > 0 ? 'Active Issues' : 'Cleared';

  const loadedBags = bags.loaded;
  const remainingBags = bags.pending;
  const assignedBelt = bags.total > 0 && gateEvents.length > 0 ? `T${flight.terminal}-${flight.gate}` : 'N/A'; 

  const totalPassengers = flight.passengers || 'N/A';
  const checkedIn = bags.total > 0 ? bags.total : 'N/A'; 
  const securityCleared = 'N/A';
  const boarded = 'N/A'; 

  const getPercentage = (value, total) => {
    if (value === 'N/A' || total === 'N/A' || Number(total) === 0) return 0;
    return Math.min(100, Math.round((Number(value) / Number(total)) * 100));
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
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
            display: 'flex', flexDirection: 'column', zIndex: 1001
          }}
        >
          {/* FLIGHT INFORMATION */}
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {flight.flight_id}
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontWeight: 600 }}>{flight.airline}</span>
                </h2>
              </div>
              <button className="btn" onClick={onClose} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Aircraft</span> <div style={{ fontWeight: 600 }}>{flight.aircraft_type || 'N/A'}</div></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Terminal / Gate</span> <div style={{ fontWeight: 600 }}>T{flight.terminal} / {flight.gate}</div></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Origin</span> <div style={{ fontWeight: 600 }}>{flight.origin}</div></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Destination</span> <div style={{ fontWeight: 600 }}>{flight.destination}</div></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Scheduled Time</span> <div style={{ fontWeight: 600 }}>{depTime ? format(depTime, 'HH:mm') : 'N/A'}</div></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Estimated Time</span> <div style={{ fontWeight: 600 }}>{estTime ? format(estTime, 'HH:mm') : 'N/A'}</div></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status</span> <div style={{ fontWeight: 600, color: flight.status === 'Delayed' ? 'var(--status-red)' : 'var(--accent-blue)' }}>{flight.status || 'N/A'}</div></div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="hide-scrollbar">
            
            {/* PASSENGERS */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passengers</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Total Passengers</span> <strong>{totalPassengers}</strong>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>Checked In</span> <strong>{checkedIn}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${getPercentage(checkedIn, totalPassengers)}%`, background: 'var(--accent-cyan)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>Security Cleared</span> <strong>{securityCleared}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${getPercentage(securityCleared, totalPassengers)}%`, background: 'var(--accent-blue)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>Boarded</span> <strong>{boarded}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${getPercentage(boarded, totalPassengers)}%`, background: 'var(--status-green)' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* BAGGAGE */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Baggage</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total</span> <strong>{bags.total || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Loaded</span> <strong>{loadedBags || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Remaining</span> <strong>{remainingBags || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Belt</span> <strong>{assignedBelt}</strong>
                </div>
              </div>
            </div>

            {/* GROUND OPERATIONS */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ground Operations</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Ground Staff</span> <strong>{groundStaff}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Cleaning Crew</span> <strong>{cleaningCrew}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Fuel Truck</span> <strong>{fuelTruck}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Pushback Tug</span> <strong>{pushbackTug}</strong></div>
              </div>
            </div>

            {/* MAINTENANCE */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Maintenance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Status</span> 
                  <strong style={{ color: activeAlerts.length > 0 ? 'var(--status-red)' : 'var(--status-green)' }}>{maintenanceStatus}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Inspection</span> 
                  <strong>{lastInspection}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Team</span> 
                  <strong>{assignedTeam}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Open Issues</span> 
                  <strong style={{ color: activeAlerts.length > 0 ? 'var(--status-red)' : 'var(--text-main)' }}>{activeAlerts.length}</strong>
                </div>
              </div>
            </div>

            {/* TIMELINE */}
            <div>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timeline</h3>
              <div style={{ position: 'relative', paddingLeft: '1rem' }}>
                <div style={{ position: 'absolute', left: '16px', top: '4px', bottom: '4px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {sortedEvents.length > 0 ? sortedEvents.map((event, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                      <div style={{ 
                        width: '12px', height: '12px', borderRadius: '50%', marginTop: '3px',
                        background: 'var(--status-green)', border: '2px solid var(--status-green)', marginLeft: '-5px'
                      }}></div>
                      <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: '45px' }}>
                          {format(parseISO(event.timestamp.replace(' ', 'T') + 'Z'), 'HH:mm')}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{event.event_type}</span>
                      </div>
                    </div>
                  )) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No operational events recorded.</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ height: '2rem' }}></div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
