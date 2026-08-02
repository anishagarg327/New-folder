import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Activity, PlaneTakeoff, ShieldCheck, Flame, CheckCircle2, Truck } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const LiveOperationsFeed = () => {
  const { flights, simulationTime, selectedFlightId, selectedIncident } = useStore();
  const feedRef = useRef(null);

  // Generate diverse events based on flights and time
  const events = [];
  
  flights.forEach(f => {
    // If a specific incident/flight is selected, filter the feed to only show relevant events
    if (selectedFlightId && f.flight_id !== selectedFlightId) return;

    const depTime = parseISO(f.scheduled_departure.replace(' ', 'T') + 'Z');
    const timeDiffMins = (depTime - simulationTime) / (1000 * 60);

    // Only process flights roughly within the active operational window (-120 to +120 mins)
    if (timeDiffMins > 120 || timeDiffMins < -120) return;

    const times = {
      gate: new Date(depTime.getTime() - 60*60000),
      delay: new Date(depTime.getTime() - 55*60000),
      security: new Date(depTime.getTime() - 50*60000),
      boarding: new Date(depTime.getTime() - 45*60000),
      baggage: new Date(depTime.getTime() - 40*60000),
      fuel: new Date(depTime.getTime() - 30*60000),
      gate_release: new Date(depTime.getTime() - 15*60000),
      pushback: depTime,
      takeoff: new Date(depTime.getTime() + 15*60000)
    };

    if (simulationTime >= times.gate) events.push({ type: 'gate', time: times.gate, text: `Gate ${f.gate} Assigned for ${f.flight_id}`, icon: CheckCircle2, color: 'var(--status-green)' });
    if (simulationTime >= times.security) events.push({ type: 'security', time: times.security, text: `Security Cleared for ${f.flight_id}`, icon: ShieldCheck, color: 'var(--accent-blue)' });
    if (simulationTime >= times.boarding) events.push({ type: 'boarding', time: times.boarding, text: `Boarding Started for ${f.flight_id}`, icon: Activity, color: 'var(--status-yellow)' });
    if (simulationTime >= times.baggage) events.push({ type: 'baggage', time: times.baggage, text: `Baggage Loaded for ${f.flight_id}`, icon: CheckCircle2, color: 'var(--status-green)' });
    if (simulationTime >= times.fuel) events.push({ type: 'fuel', time: times.fuel, text: `Fuel Truck Dispatched to ${f.flight_id}`, icon: Flame, color: 'var(--status-red)' });
    if (simulationTime >= times.gate_release) events.push({ type: 'gate-release', time: times.gate_release, text: `Gate Released for ${f.flight_id}`, icon: CheckCircle2, color: 'var(--status-green)' });
    if (simulationTime >= times.pushback) events.push({ type: 'pushback', time: times.pushback, text: `Pushback Approved for ${f.flight_id}`, icon: Truck, color: 'var(--status-cyan)' });
    if (simulationTime >= times.takeoff) events.push({ type: 'takeoff', time: times.takeoff, text: `${f.flight_id} Takeoff`, icon: PlaneTakeoff, color: 'var(--text-main)' });

    if (Number(f.delay_minutes) > 0 && simulationTime >= times.delay) {
      events.push({ type: 'delay', time: times.delay, text: `Flight ${f.flight_id} Delayed (+${f.delay_minutes} min)`, icon: Flame, color: 'var(--status-red)' });
    }
  });

  // Filter out future events and sort descending (NEWEST ON TOP)
  const pastEvents = events
    .filter(e => e.time <= simulationTime)
    .sort((a, b) => b.time - a.time)
    .slice(0, 30); // keep last 30

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [pastEvents.length]);

  return (
    <div className="glass-panel" style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', padding: '1.25rem', minHeight: '200px', border: selectedIncident ? '1px solid var(--status-cyan)' : '' }}>
      <div className="panel-header">
        <Activity size={16} color="var(--status-cyan)" />
        Live Operations Feed
        {selectedFlightId && (
          <span className="pill" style={{ marginLeft: 'auto', background: 'var(--accent-blue-muted)', color: 'var(--status-cyan)', fontSize: '0.65rem' }}>
            {selectedFlightId}
          </span>
        )}
      </div>

      <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', scrollBehavior: 'smooth' }} className="hide-scrollbar">
        {pastEvents.map((event, idx) => {
          const Icon = event.icon;
          return (
            <div key={`${event.flight}-${event.type}-${idx}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', paddingTop: '2px', fontSize: '0.75rem' }}>{format(event.time, 'HH:mm')}</div>
              <div style={{ color: event.color, marginTop: '2px' }}>
                <Icon size={14} />
              </div>
              <div style={{ color: 'var(--text-main)', flex: 1, lineHeight: 1.4 }}>{event.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
