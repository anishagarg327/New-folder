import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Users, Wrench, Shield, Flame, Trash2, Truck } from 'lucide-react';

export const ResourceStatus = () => {
  const { gateEvents, simulationTime } = useStore();

  const resources = useMemo(() => {
    // Find active events
    const activeEvents = gateEvents.filter(e => {
      if (!e.timestamp || !e.duration_mins) return false;
      const start = new Date(e.timestamp.replace(' ', 'T') + 'Z');
      const end = new Date(start.getTime() + parseInt(e.duration_mins) * 60000);
      return simulationTime >= start && simulationTime <= end;
    });

    // Derive deterministic assignment from active events
    let groundAssigned = 0;
    let maintAssigned = 0;
    let securityAssigned = 0;
    let fuelAssigned = 0;
    let cleaningAssigned = 0;
    let pushbackAssigned = 0;

    activeEvents.forEach(e => {
      let hash = 0;
      for (let i = 0; i < e.flight_id.length; i++) hash = e.flight_id.charCodeAt(i) + ((hash << 5) - hash);
      const absHash = Math.abs(hash);
      
      groundAssigned += (absHash % 3) + 2;
      securityAssigned += (absHash % 2) + 1;
      cleaningAssigned += (absHash % 4) + 2;
      if (absHash % 4 === 0) maintAssigned += 1;
      if (absHash % 2 === 0) fuelAssigned += 1;
      if (absHash % 5 === 0) pushbackAssigned += 1;
    });

    const config = [
      { id: 'ground', name: 'Ground Staff', icon: Users, total: 120, assigned: groundAssigned },
      { id: 'maint', name: 'Maintenance Teams', icon: Wrench, total: 25, assigned: maintAssigned },
      { id: 'security', name: 'Security Teams', icon: Shield, total: 60, assigned: securityAssigned },
      { id: 'fuel', name: 'Fuel Trucks', icon: Flame, total: 18, assigned: fuelAssigned },
      { id: 'cleaning', name: 'Cleaning Crews', icon: Trash2, total: 40, assigned: cleaningAssigned },
      { id: 'pushback', name: 'Pushback Tugs', icon: Truck, total: 22, assigned: pushbackAssigned }
    ];

    return config;
  }, [gateEvents, simulationTime]);

  return (
    <div className="glass-panel" style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <Users size={16} color="var(--accent-blue)" />
        Staff & Resource Status
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {resources.map(res => {
          const Icon = res.icon;
          const available = Math.max(0, res.total - res.assigned);
          const utilization = (res.assigned / res.total) * 100;
          let color = 'var(--status-green)';
          if (utilization > 85) color = 'var(--status-red)';
          else if (utilization > 65) color = 'var(--status-yellow)';

          return (
            <div key={res.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Icon size={12} /> {res.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: color, fontWeight: 700 }}>{res.assigned}/{res.total}</div>
              </div>
              
              {/* Utilization Bar */}
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, utilization)}%`, height: '100%', background: color, transition: 'width 0.5s ease', boxShadow: `0 0 8px ${color}60` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
