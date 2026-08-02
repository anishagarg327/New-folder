import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SimulationControls } from './SimulationControls';
import { FlightsBoard } from './FlightsBoard';
import { GateMap } from './GateMap';
import { AlertsPanel } from './AlertsPanel';
import { FlightDetailsPanel } from './FlightDetailsPanel';
import { Loader2, AlertTriangle } from 'lucide-react';

export const Dashboard = () => {
  const { loading, error, loadData, flights, getActiveFlights, maintenanceLogs, baggage } = useStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-blue)" />
        <h2 style={{ color: 'var(--text-muted)' }}>Initializing AOCC...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--status-red)' }}>
        <AlertTriangle size={48} />
        <h2>Data Integration Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <SimulationControls />
      
      <div className="main-grid">
        <div className="left-column">
          <FlightsBoard />
        </div>
        
        {/* Right column for Gates / Alerts */}
        <div className="right-column">
          
          <div className="glass-panel" style={{ flex: '0 0 auto' }}>
            <h2>System Overview</h2>
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Flights</div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{flights.length}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Active Board</div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-blue)' }}>{getActiveFlights().length}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '2px solid var(--status-red)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Pending Alerts</div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--status-red)' }}>
                  {maintenanceLogs.filter(log => !log.completion_time).length}
                </div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '2px solid var(--status-green)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Bags Processed</div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--status-green)' }}>
                  {baggage.filter(b => b.current_status === 'Loaded').length}
                </div>
              </div>
            </div>
          </div>
          
          <GateMap />
          <AlertsPanel />
          
        </div>
      </div>
      <FlightDetailsPanel />
    </div>
  );
};
