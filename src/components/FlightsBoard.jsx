import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';
import { Search, ChevronUp, ChevronDown, Plane, PlaneTakeoff, PlaneLanding, AlertTriangle, Hammer, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlightInvestigationDrawer } from './FlightInvestigationDrawer';

const FILTERS = ['All Flights', 'Delayed', 'Boarding', 'Departed', 'Arrived', 'Maintenance', 'Security Hold', 'International', 'Domestic'];

export const FlightsBoard = () => {
  const { getActiveFlights, simulationTime, setSelectedFlight, selectedFlightId, getFlightAlerts, globalSearchTerm } = useStore();
  const [activeFilter, setActiveFilter] = useState('All Flights');
  const [sortConfig, setSortConfig] = useState({ key: 'scheduled_departure', direction: 'asc' });

  const activeFlights = getActiveFlights();

  // Get the full selected flight object
  const selectedFlightObj = useMemo(() => {
    return activeFlights.find(f => f.flight_id === selectedFlightId) || null;
  }, [activeFlights, selectedFlightId]);

  // Determine dynamic status based on simulation time
  const getDynamicStatus = (flight) => {
    const depTime = new Date(flight.scheduled_departure.replace(' ', 'T') + 'Z');
    const timeDiffMins = (depTime - simulationTime) / (1000 * 60);

    if (flight.status === 'Security Hold') return 'Security Hold';
    if (flight.status === 'Departed' && timeDiffMins > 0) return 'Scheduled';
    if (timeDiffMins <= 45 && timeDiffMins > 0) return 'Boarding';
    if (timeDiffMins <= 0) {
      return Number(flight.delay_minutes) > 0 ? 'Delayed' : 'Departed';
    }
    return flight.status;
  };

  const filteredAndSortedFlights = useMemo(() => {
    let result = activeFlights;

    // Apply Search
    if (globalSearchTerm && globalSearchTerm.trim() !== '') {
      const term = globalSearchTerm.toLowerCase();
      result = result.filter(f =>
        (f.flight_id && f.flight_id.toLowerCase().includes(term)) ||
        (f.airline && f.airline.toLowerCase().includes(term)) ||
        (f.destination && f.destination.toLowerCase().includes(term)) ||
        (f.origin && f.origin.toLowerCase().includes(term))
      );
    }

    // Apply Quick Filters
    if (activeFilter !== 'All Flights') {
      result = result.filter(f => {
        const status = getDynamicStatus(f);
        // We only need to check alerts if the activeFilter is 'Maintenance'
        // Otherwise, avoid calling it inside the loop for massive performance gain.
        const hasMaintenanceAlert = activeFilter === 'Maintenance'
          ? getFlightAlerts(f.flight_id).length > 0
          : false;

        switch (activeFilter) {
          case 'Delayed': return Number(f.delay_minutes) > 0;
          case 'Boarding': return status === 'Boarding';
          case 'Departed': return f.status === 'Departed';
          case 'Arrived': return f.status === 'Arrived';
          case 'Maintenance': return hasMaintenanceAlert;
          case 'Security Hold': return getDynamicStatus(f) === 'Security Hold';
          case 'International': return f.is_international === 'true' || f.is_international === '1';
          case 'Domestic': return f.is_international === 'false' || f.is_international === '0';
          default: return true;
        }
      });
    }

    // Apply Sorting
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle numeric and specific sorts
      if (sortConfig.key === 'delay_minutes') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [activeFlights, globalSearchTerm, activeFilter, sortConfig, simulationTime, getFlightAlerts]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Departed': return <PlaneTakeoff size={14} />;
      case 'Arrived': return <PlaneLanding size={14} />;
      case 'Delayed': return <AlertTriangle size={14} />;
      case 'Security Hold': return <ShieldAlert size={14} />;
      default: return <Plane size={14} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'On-Time':
      case 'Scheduled': return 'var(--status-green)';
      case 'Delayed': return 'var(--status-red)';
      case 'Departed': return 'var(--accent-blue)';
      case 'Boarding': return 'var(--status-yellow)';
      case 'Security Hold': return 'var(--status-yellow)';
      default: return 'var(--text-main)';
    }
  };

  return (
    <>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '0.75rem 1rem', overflow: 'hidden' }}>

        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
            Flight Operations
            <span className="pill-count">
              {filteredAndSortedFlights.length}
            </span>
          </h2>

          <div style={{ position: 'relative', width: '200px', minWidth: '140px' }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search flights, airlines..."
              value={globalSearchTerm || ''}
              onChange={(e) => useStore.getState().setGlobalSearchTerm(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '1.75rem' }}
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem', flexShrink: 0 }} className="hide-scrollbar">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`control-btn ${activeFilter === filter ? 'active' : ''}`}
              style={{ borderRadius: '999px', padding: '0.25rem 0.75rem' }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('airline')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>AIRLINE {getSortIcon('airline')}</div>
                </th>
                <th onClick={() => requestSort('flight_id')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>FLIGHT {getSortIcon('flight_id')}</div>
                </th>
                <th onClick={() => requestSort('aircraft_type')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>AIRCRAFT {getSortIcon('aircraft_type')}</div>
                </th>
                <th onClick={() => requestSort('origin')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>ROUTE {getSortIcon('origin')}</div>
                </th>
                <th onClick={() => requestSort('terminal')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>GATE {getSortIcon('terminal')}</div>
                </th>
                <th onClick={() => requestSort('scheduled_departure')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>TIME {getSortIcon('scheduled_departure')}</div>
                </th>
                <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>STATUS {getSortIcon('status')}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAndSortedFlights.slice(0, 50).map(f => {
                  const status = getDynamicStatus(f);
                  const isSelected = selectedFlightId === f.flight_id;
                  const alerts = getFlightAlerts(f.flight_id);
                  const isPriority = Number(f.delay_minutes) > 45 || alerts.length > 0;

                  return (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={f.flight_id}
                      onClick={() => setSelectedFlight(f.flight_id)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      }}
                      className="compact-row"
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isPriority && <div style={{ width: '3px', height: '16px', background: 'var(--status-red)', borderRadius: '2px' }} />}
                          <div style={{ width: '22px', height: '22px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>
                            {f.airline_code}
                          </div>
                          <span style={{ fontSize: '0.85rem' }}>{f.airline}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{f.flight_id}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{f.aircraft_type}</td>
                      <td>
                        <span style={{ color: 'var(--text-muted)' }}>{f.origin}</span>
                        <span style={{ margin: '0 0.35rem', color: 'var(--accent-cyan)' }}>→</span>
                        <span style={{ fontWeight: 600 }}>{f.destination}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        T{f.terminal} <span style={{ color: 'var(--text-muted)', margin: '0 0.2rem' }}>•</span> {f.gate}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {format(parseISO(f.scheduled_departure), 'HH:mm')}
                        {Number(f.delay_minutes) > 0 && <span style={{ color: 'var(--status-red)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>+{f.delay_minutes}m</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: getStatusColor(status), fontSize: '0.8rem', fontWeight: 600 }}>
                          {getStatusIcon(status)}
                          {status}
                          {alerts.length > 0 && <Hammer size={12} color="var(--status-red)" style={{ marginLeft: '0.25rem' }} />}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filteredAndSortedFlights.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No active flights matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <FlightInvestigationDrawer flight={selectedFlightObj} onClose={() => setSelectedFlight(null)} />
    </>
  );
};
