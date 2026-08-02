import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { AoccHeader } from './AoccHeader';
import { IncidentCommandCenter } from './IncidentCommandCenter';
import { LiveOperationsFeed } from './LiveOperationsFeed';
import { FlightsBoard } from './FlightsBoard';
import { AirportMap } from './AirportMap';
import { DecisionSupport } from './DecisionSupport';
import { ResourceStatus } from './ResourceStatus';
import { GateDetailsPanel } from './GateDetailsPanel';
import { Loader2, AlertTriangle } from 'lucide-react';

export const Dashboard = () => {
  const { loading, error, loadData, tick } = useStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [tick]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', background: 'var(--bg-dark)' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-blue)" />
        <h2 style={{ color: 'var(--text-muted)' }}>Initializing AOCC...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--status-red)', background: 'var(--bg-dark)' }}>
        <AlertTriangle size={48} />
        <h2>Data Integration Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AoccHeader />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <IncidentCommandCenter />

        <div className="main-grid">

          {/* LEFT COLUMN: Operations & Map */}
          <div className="left-column">
            <div style={{ flex: '1 1 0%', display: 'flex', minHeight: 0, overflow: 'hidden' }}>
              <FlightsBoard />
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <AirportMap />
            </div>
          </div>

          {/* RIGHT COLUMN: Intelligence & Resources */}
          <div className="right-column hide-scrollbar">
            <LiveOperationsFeed />
            <ResourceStatus />
            <DecisionSupport />
          </div>

        </div>
      </div>

      {/* Slide-in Panels */}
      <GateDetailsPanel />
    </div>
  );
};
