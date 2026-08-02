import React from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, Wrench, Clock, ShieldAlert, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export const IncidentCommandCenter = () => {
  const { maintenanceLogs, simulationTime, flights, gateEvents } = useStore();

  const incidents = [];

  // 1. Maintenance Incidents
  const activeMaint = maintenanceLogs.filter(m => {
    if (!m.report_time) return false;
    const report = new Date(m.report_time.replace(' ', 'T') + 'Z');
    const completion = m.completion_time ? new Date(m.completion_time.replace(' ', 'T') + 'Z') : null;
    return simulationTime >= report && (!completion || simulationTime < completion);
  });

  activeMaint.forEach(m => {
    incidents.push({
      id: `maint-${m.work_order_id}`,
      type: 'Maintenance',
      title: m.issue_description.includes('Hydraulic') ? 'Hydraulic Leak' : m.issue_description,
      flight: m.flight_id,
      priority: m.priority === 'Critical' ? 'Critical' : 'High',
      icon: Wrench,
      time: new Date(m.report_time.replace(' ', 'T') + 'Z')
    });
  });

  // 2. Late Boarding
  flights.forEach(f => {
    if (f.status === 'Departed') return;
    const depTime = parseISO(f.scheduled_departure.replace(' ', 'T') + 'Z');
    const timeDiffMins = (depTime - simulationTime) / (1000 * 60);
    if (timeDiffMins > 0 && timeDiffMins < 30 && Number(f.delay_minutes) > 0) {
      incidents.push({
        id: `late-${f.flight_id}`,
        type: 'Operations',
        title: 'Late Boarding',
        flight: f.flight_id,
        priority: 'Medium',
        icon: Clock,
        time: simulationTime
      });
    }
  });

  // 3. Security Queue (Simulated)
  if (flights.length > 0 && simulationTime.getMinutes() % 15 === 0) {
    incidents.push({
      id: `sec-${simulationTime.getTime()}`,
      type: 'Security',
      title: 'Security Queue',
      flight: 'Terminal B',
      priority: 'High',
      icon: ShieldAlert,
      time: simulationTime
    });
  }

  // 4. Gate Conflict
  const activeGateEvents = gateEvents.filter(e => {
    const start = new Date(e.timestamp.replace(' ', 'T') + 'Z');
    const end = new Date(start.getTime() + parseInt(e.duration_mins) * 60000);
    return simulationTime >= start && simulationTime <= end;
  });
  
  const gateCounts = {};
  activeGateEvents.forEach(e => {
    if (!gateCounts[e.gate]) gateCounts[e.gate] = [];
    gateCounts[e.gate].push(e.flight_id);
  });
  Object.keys(gateCounts).forEach(gate => {
    if (gateCounts[gate].length > 1) {
      incidents.push({
        id: `conflict-${gate}`,
        type: 'Operations',
        title: 'Gate Conflict',
        flight: `Gate ${gate}`,
        priority: 'Critical',
        icon: Zap,
        time: simulationTime
      });
    }
  });

  // Sort and limit to 4
  const displayIncidents = incidents.sort((a, b) => b.time - a.time).slice(0, 4);

  return (
    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }} className="hide-scrollbar">
      <AnimatePresence>
        {displayIncidents.map(incident => {
          const Icon = incident.icon;
          const isCritical = incident.priority === 'Critical';
          const isSelected = useStore.getState().selectedIncident === incident.id; // Or pull from hook
          
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={incident.id}
              onClick={() => useStore.getState().setSelectedIncident(incident.id, incident.flight, incident.flight?.startsWith('Gate') ? incident.flight.split(' ')[1] : null)}
              style={{
                background: isSelected ? (isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)') : (isCritical ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                border: `1px solid ${isCritical ? 'var(--status-red)' : 'var(--status-yellow)'}`,
                boxShadow: isSelected ? `0 0 0 2px ${isCritical ? 'var(--status-red)' : 'var(--status-yellow)'}` : 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                minWidth: '220px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ padding: '0.5rem', background: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
                <Icon size={16} color={isCritical ? 'var(--status-red)' : 'var(--status-yellow)'} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.15rem' }}>{incident.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{incident.flight}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {displayIncidents.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          No active critical incidents detected.
        </div>
      )}
    </div>
  );
};
