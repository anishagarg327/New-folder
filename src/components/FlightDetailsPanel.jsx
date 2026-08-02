import React from 'react';
import { useStore } from '../store/useStore';
import { X, Wrench, Luggage, MapPin, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const FlightDetailsPanel = () => {
  const { 
    selectedFlightId, setSelectedFlight, flights, gateEvents, 
    maintenanceLogs, baggage, simulationTime, resolveMaintenance 
  } = useStore();

  if (!selectedFlightId) return null;

  const flight = flights.find(f => f.flight_id === selectedFlightId);
  if (!flight) return null;

  // Cross-reference data
  const flightGates = gateEvents.filter(g => g.flight_id === selectedFlightId);
  
  // Find active maintenance for this flight
  const flightMaintenance = maintenanceLogs.filter(m => m.flight_id === selectedFlightId);
  const activeIssues = flightMaintenance.filter(m => {
      const report = parseISO(m.report_time);
      const completion = m.completion_time ? parseISO(m.completion_time) : null;
      return simulationTime >= report && (!completion || simulationTime < completion);
  });

  // Baggage statistics
  const flightBags = baggage.filter(b => b.flight_id === selectedFlightId);
  const loadedBags = flightBags.filter(b => b.current_status === 'Loaded').length;
  const screenedBags = flightBags.filter(b => b.current_status === 'Screened').length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '100%',
      maxWidth: '450px',
      height: '100vh',
      background: 'var(--bg-panel)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderLeft: 'var(--glass-border)',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      transform: selectedFlightId ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{flight.flight_id}</h2>
          <div style={{ color: 'var(--text-muted)' }}>{flight.airline} • {flight.aircraft_type} ({flight.tail_number})</div>
        </div>
        <button onClick={() => setSelectedFlight(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Route Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-blue)' }}>{flight.origin}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(parseISO(flight.scheduled_departure), 'HH:mm')}</div>
          </div>
          <div style={{ flex: 1, borderTop: '2px dashed rgba(255,255,255,0.2)', margin: '0 1rem', position: 'relative' }}>
             <MapPin size={16} color="var(--accent-blue)" style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{flight.destination}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(parseISO(flight.scheduled_arrival), 'HH:mm')}</div>
          </div>
        </div>

        {/* Status & Operational Actions */}
        <div>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Operational Status
          </h3>
          {activeIssues.length > 0 ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-red)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-red)', fontWeight: 600, marginBottom: '0.5rem' }}>
                <Wrench size={18} />
                Maintenance Required
              </div>
              {activeIssues.map(issue => (
                <div key={issue.work_order_id} style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.9rem' }}>{issue.issue_description} (Component: {issue.component})</div>
                  <button 
                    className="btn primary" 
                    style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                    onClick={() => resolveMaintenance(issue.work_order_id)}
                  >
                    <CheckCircle2 size={16} /> Dispatch Fix & Resolve
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--status-green)', padding: '1rem', borderRadius: '8px', color: 'var(--status-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> Aircraft Cleared for Operations
            </div>
          )}
        </div>

        {/* Baggage Operations */}
        <div>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Luggage size={18} color="var(--text-muted)" /> Baggage Logistics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Checked</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{flightBags.length}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loaded to Ramp</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: loadedBags === flightBags.length && flightBags.length > 0 ? 'var(--status-green)' : 'var(--text-main)' }}>
                {loadedBags}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          {flightBags.length > 0 && (
            <div style={{ marginTop: '1rem', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(loadedBags / flightBags.length) * 100}%`, background: 'var(--accent-blue)', transition: 'width 0.5s' }} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
