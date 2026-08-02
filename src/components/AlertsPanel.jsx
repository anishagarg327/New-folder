import React from 'react';
import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';
import { AlertOctagon, Wrench, Clock } from 'lucide-react';

export const AlertsPanel = () => {
  const { maintenanceLogs, simulationTime, flights } = useStore();

  // Find maintenance issues that were reported recently (within the last 4 hours of sim time)
  // and are not yet resolved or resolved after sim time
  // Find all unresolved maintenance issues (or ones that were resolved after simulation time)
  const activeAlerts = maintenanceLogs.filter(log => {
    if (!log.report_time) return false;
    const report = parseISO(log.report_time);
    const completion = log.completion_time ? parseISO(log.completion_time) : null;
    
    // Show issues reported up to 48 hours in the future (for simulation testing)
    // and those that haven't been resolved yet relative to sim time.
    const isNotResolvedYet = !completion || simulationTime < completion;
    
    return isNotResolvedYet;
  }).sort((a, b) => parseISO(b.report_time) - parseISO(a.report_time));

  return (
    <div className="glass-panel" style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertOctagon size={24} color="var(--status-red)" />
          Alerts
        </div>
        {activeAlerts.length > 0 && (
          <span className="badge" style={{ background: 'var(--status-red)', color: 'white' }}>
            {activeAlerts.length}
          </span>
        )}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {activeAlerts.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
            No active maintenance alerts.
          </div>
        ) : (
          activeAlerts.slice(0, 20).map(alert => (
            <div key={alert.work_order_id} style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              borderLeft: '3px solid var(--status-red)',
              padding: '1rem',
              borderRadius: '0 8px 8px 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wrench size={16} color="var(--status-red)" />
                  {alert.tail_number} - {alert.action_type}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} />
                  {format(parseISO(alert.report_time), 'HH:mm')}
                </div>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {alert.issue_description} (Priority: {alert.priority})
              </div>
              {alert.flight_id && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    Flight: {alert.flight_id}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
