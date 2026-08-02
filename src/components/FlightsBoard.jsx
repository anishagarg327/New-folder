import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';
import { Search } from 'lucide-react';

export const FlightsBoard = () => {
  const { getActiveFlights, simulationTime, setSelectedFlight, selectedFlightId } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const activeFlights = getActiveFlights();

  const filteredFlights = activeFlights.filter(f => 
    f.flight_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine dynamic status based on simulation time
  const getDynamicStatus = (flight) => {
    const depTime = parseISO(flight.scheduled_departure);
    const timeDiffMins = (depTime - simulationTime) / (1000 * 60);

    if (flight.status === 'Departed' && timeDiffMins > 0) return 'Scheduled';
    if (timeDiffMins <= 45 && timeDiffMins > 0) return 'Boarding';
    if (timeDiffMins <= 0) {
       return flight.delay_minutes > 0 ? 'Delayed' : 'Departed';
    }
    return flight.status;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'On-Time':
      case 'Scheduled':
        return <span className="badge status-on-time">{status}</span>;
      case 'Delayed':
        return <span className="badge status-delayed">{status}</span>;
      case 'Departed':
        return <span className="badge status-departed">{status}</span>;
      case 'Boarding':
        return <span className="badge status-on-time" style={{background: 'rgba(16, 185, 129, 0.3)'}}>{status}</span>;
      default:
        return <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>{status}</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Active Flights
          <span className="badge" style={{ background: 'var(--accent-blue)', color: 'white' }}>
            {activeFlights.length}
          </span>
        </h2>
        
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input 
            type="text" 
            placeholder="Search flights, airlines..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px', padding: '0.5rem 0.5rem 0.5rem 2rem', color: 'white',
              width: '100%', maxWidth: '250px', outline: 'none'
            }}
          />
        </div>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Flight</th>
              <th>Airline</th>
              <th>Dest</th>
              <th>Gate</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlights.slice(0, 50).map(f => {
              const status = getDynamicStatus(f);
              const isSelected = selectedFlightId === f.flight_id;
              
              return (
                <tr 
                  key={f.flight_id} 
                  onClick={() => setSelectedFlight(f.flight_id)}
                  style={{ 
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : undefined
                  }}
                >
                  <td style={{ fontWeight: 600 }}>{f.flight_id}</td>
                  <td>{f.airline}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{f.destination}</td>
                  <td>{f.gate}</td>
                  <td style={{ fontFamily: 'monospace' }}>
                    {format(parseISO(f.scheduled_departure), 'HH:mm')}
                  </td>
                  <td>{getStatusBadge(status)}</td>
                </tr>
              );
            })}
            {filteredFlights.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No active flights matching search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
