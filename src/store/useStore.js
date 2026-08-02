import { create } from 'zustand';
import { parseCSV } from '../utils/csvParser';
import { addMinutes, parseISO } from 'date-fns';

export const useStore = create((set, get) => ({
  // Data
  flights: [],
  gateEvents: [],
  maintenanceLogs: [],
  baggage: [],
  passengers: [],
  staffShifts: [],
  
  // App State
  loading: true,
  error: null,
  
  // Simulation State
  simulationTime: new Date(), // Use current real date/time
  simulationSpeed: 1, // 1 real sec = 1 sim min
  isRunning: false,
  
  // Search State
  globalSearchTerm: '',
  setGlobalSearchTerm: (term) => set({ globalSearchTerm: term }),
  
  // Actions
  loadData: async () => {
    set({ loading: true });
    try {
      const [flightsData, gateEventsData, maintenanceData, baggageData, passengersData, staffShiftsData] = await Promise.all([
        parseCSV('flights.csv', 'flights'),
        parseCSV('gate_events.csv', 'gate_events'),
        parseCSV('maintenance_logs.csv', 'maintenance_logs'),
        parseCSV('baggage.csv', 'baggage'),
        parseCSV('passengers.csv', 'passengers'),
        parseCSV('staff_shifts.csv', 'staff_shifts')
      ]);
      
      // Use current real date/time so dashboard always shows today's date
      let baseTime = new Date();

      set({ 
        flights: flightsData, 
        gateEvents: gateEventsData,
        maintenanceLogs: maintenanceData,
        baggage: baggageData,
        passengers: passengersData,
        staffShifts: staffShiftsData,
        simulationTime: baseTime,
        loading: false 
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  tick: () => {
    const { isRunning, simulationTime, simulationSpeed } = get();
    if (isRunning) {
      // Advance by simulationSpeed minutes
      set({ simulationTime: addMinutes(simulationTime, simulationSpeed) });
    }
  },

  toggleSimulation: () => set((state) => ({ isRunning: !state.isRunning })),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed, isRunning: true }),
  
  // Selectors/Computed Data
  // Returns upcoming and currently active flights
  getActiveFlights: () => {
    const { flights, simulationTime } = get();
    // Get flights that haven't landed more than 2 hours ago
    const cutoffDate = addMinutes(simulationTime, -120);
    // Convert to string format roughly matching CSV "YYYY-MM-DD HH:mm:ss"
    const cutoffStr = cutoffDate.toISOString().replace('T', ' ').substring(0, 19);
    
    const active = flights.filter(f => f.scheduled_arrival > cutoffStr);
    active.sort((a, b) => a.scheduled_departure.localeCompare(b.scheduled_departure));
    return active;
  },

  getHealthScore: () => {
    const { maintenanceLogs, flights, simulationTime } = get();
    let score = 98;
    
    // Deduct for active maintenance issues
    const activeIssues = maintenanceLogs.filter(m => {
        const report = parseISO(m.report_time);
        const completion = m.completion_time ? parseISO(m.completion_time) : null;
        return simulationTime >= report && (!completion || simulationTime < completion);
    });
    
    activeIssues.forEach(m => {
      score -= m.priority === 'Critical' ? 4 : 2;
    });

    // Deduct for delayed active flights
    const cutoffDate = addMinutes(simulationTime, -120);
    const cutoffStr = cutoffDate.toISOString().replace('T', ' ').substring(0, 19);
    const activeFlights = flights.filter(f => f.scheduled_arrival > cutoffStr && f.status !== 'Departed');
    
    const delayedFlights = activeFlights.filter(f => Number(f.delay_minutes) > 0);
    
    delayedFlights.forEach(f => {
      score -= Number(f.delay_minutes) > 30 ? 3 : 1;
    });

    // Ensure realistic bounds
    return Math.max(45, Math.min(100, Math.round(score)));
  },

  getCriticalIncidents: () => {
    const { maintenanceLogs, flights, simulationTime } = get();
    const incidents = [];

    // Active maintenance issues
    const activeIssues = maintenanceLogs.filter(m => {
        const report = parseISO(m.report_time);
        const completion = m.completion_time ? parseISO(m.completion_time) : null;
        return simulationTime >= report && (!completion || simulationTime < completion);
    });

    activeIssues.forEach(issue => {
      incidents.push({
        id: issue.work_order_id,
        type: 'Maintenance',
        severity: issue.severity || 'High',
        flight_id: issue.flight_id,
        description: issue.description,
        time: issue.report_time,
        status: 'Active'
      });
    });

    // Severely delayed flights
    const cutoffDate = addMinutes(simulationTime, -120);
    const cutoffStr = cutoffDate.toISOString().replace('T', ' ').substring(0, 19);
    const activeFlights = flights.filter(f => f.scheduled_arrival > cutoffStr && f.status !== 'Departed');
    
    activeFlights.filter(f => Number(f.delay_minutes) >= 30).forEach(flight => {
      incidents.push({
        id: `delay-${flight.flight_id}`,
        type: 'Delay',
        severity: Number(flight.delay_minutes) > 60 ? 'Critical' : 'Medium',
        flight_id: flight.flight_id,
        description: `Delayed by ${flight.delay_minutes} min`,
        time: flight.scheduled_departure,
        status: 'Pending'
      });
    });

    return incidents.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);
  },

  getFlightBaggage: (flightId) => {
    const flightBags = get().baggage.filter(b => b.flight_id === flightId);
    return {
      total: flightBags.length,
      loaded: flightBags.filter(b => b.current_status === 'Loaded').length,
      delayed: flightBags.filter(b => b.current_status === 'Delayed').length
    };
  },

  getFlightAlerts: (flightId) => {
    const { maintenanceLogs, simulationTime } = get();
    return maintenanceLogs.filter(m => {
      const report = parseISO(m.report_time);
      const completion = m.completion_time ? parseISO(m.completion_time) : null;
      return m.flight_id === flightId && simulationTime >= report && (!completion || simulationTime < completion);
    });
  },

  getLiveFeed: () => {
    const { flights, simulationTime } = get();
    const feed = [];
    
    // Just find some recent active flights and simulate milestones based on time diff
    const active = get().getActiveFlights().slice(0, 20);
    active.forEach(f => {
      const depTime = new Date(f.scheduled_departure.replace(' ', 'T') + 'Z');
      const diffMins = (simulationTime - depTime) / (1000 * 60);
      
      if (diffMins > -60 && diffMins <= -45) {
        feed.push({ id: `${f.flight_id}-gate`, time: addMinutes(depTime, -60), message: `Gate ${f.gate} assigned`, flight: f.flight_id });
      } else if (diffMins > -45 && diffMins <= -15) {
        feed.push({ id: `${f.flight_id}-board`, time: addMinutes(depTime, -45), message: `Boarding started`, flight: f.flight_id });
      } else if (diffMins > -15 && diffMins <= 0) {
        feed.push({ id: `${f.flight_id}-close`, time: addMinutes(depTime, -15), message: `Gate closed, pushback initiated`, flight: f.flight_id });
      } else if (diffMins > 0 && diffMins <= 15) {
        feed.push({ id: `${f.flight_id}-dep`, time: depTime, message: `Departed`, flight: f.flight_id });
      }
    });

    return feed.sort((a, b) => b.time - a.time).slice(0, 10);
  },

  // Operational Controls
  selectedFlightId: null,
  setSelectedFlight: (id) => set({ selectedFlightId: id, selectedGate: null, selectedIncident: null }),
  
  selectedGate: null,
  setSelectedGate: (id) => set({ selectedGate: id, selectedFlightId: null, selectedIncident: null }),
  
  selectedIncident: null,
  setSelectedIncident: (id, flightId, gate) => set({ 
    selectedIncident: id,
    selectedFlightId: flightId || null,
    selectedGate: gate || null
  }),

  isHealthModalOpen: false,
  setHealthModalOpen: (isOpen) => set({ isHealthModalOpen: isOpen }),
  
  getOperationalRecommendations: () => {
    const { flights, gateEvents, maintenanceLogs, baggage, simulationTime } = get();
    const recommendations = [];

    // Rule 1: Gate Conflict / Severe Delay
    const delayedFlights = flights.filter(f => Number(f.delay_minutes) > 45 && f.status !== 'Departed');
    delayedFlights.forEach(f => {
      recommendations.push({
        id: `rec-gate-${f.flight_id}`,
        priority: 'High',
        reason: `Move Flight ${f.flight_id} from Gate ${f.gate} to alternate gate to avoid gate conflict.`,
        impact: 'Cascading gate delays',
        action: `Reassign Gate`,
        affected: ['Flight', 'Gate', 'Passengers'],
        relatedFlight: f.flight_id
      });
    });

    // Rule 2: Maintenance holding up boarding
    const activeMaintenance = maintenanceLogs.filter(m => {
      const report = parseISO(m.report_time);
      const completion = m.completion_time ? parseISO(m.completion_time) : null;
      return simulationTime >= report && (!completion || simulationTime < completion);
    });
    
    activeMaintenance.forEach(m => {
      const flight = flights.find(f => f.flight_id === m.flight_id);
      if (flight && flight.status !== 'Departed') {
        const teamAssigned = (Math.abs(m.work_order_id.charCodeAt(0)) % 5) + 1;
        recommendations.push({
          id: `rec-maint-${m.work_order_id}`,
          priority: m.priority === 'Critical' ? 'Critical' : 'Medium',
          reason: `Assign Maintenance Team ${teamAssigned} to Flight ${flight.flight_id}.`,
          impact: 'Aircraft grounded',
          action: m.priority === 'Critical' ? 'Dispatch Team' : 'Delay boarding',
          affected: ['Flight', 'Maintenance', 'Staff'],
          relatedFlight: flight.flight_id
        });
      }
    });

    // Rule 3: Baggage loading incomplete near departure
    const approachingDeparture = flights.filter(f => {
      if (f.status === 'Departed') return false;
      const depTime = parseISO(f.scheduled_departure.replace(' ', 'T') + 'Z');
      const timeDiffMins = (depTime - simulationTime) / (1000 * 60);
      return timeDiffMins > 0 && timeDiffMins <= 30;
    });

    approachingDeparture.forEach(f => {
      const bags = baggage.filter(b => b.flight_id === f.flight_id);
      const loaded = bags.filter(b => b.current_status === 'Loaded').length;
      if (bags.length > 0 && loaded / bags.length < 0.8) {
        recommendations.push({
          id: `rec-bag-${f.flight_id}`,
          priority: 'Medium',
          reason: `Delay boarding by 10 minutes because baggage loading is incomplete on ${f.flight_id}.`,
          impact: 'Takeoff delay',
          action: 'Hold pushback',
          affected: ['Baggage', 'Staff', 'Flight'],
          relatedFlight: f.flight_id
        });
      }
    });
    
    // Security Rule
    if (simulationTime.getMinutes() % 15 === 0) {
      recommendations.push({
        id: `rec-sec-${simulationTime.getTime()}`,
        priority: 'High',
        reason: `Open Security Lane 5 due to high passenger queue at Terminal B.`,
        impact: 'Passenger delay',
        action: 'Deploy Staff',
        affected: ['Security', 'Passengers', 'Terminal B'],
        relatedFlight: null
      });
    }

    // Deduplicate and return top 3
    const sortedRecs = recommendations.sort((a,b) => {
      const p = { 'Critical': 3, 'High': 2, 'Medium': 1 };
      return p[b.priority] - p[a.priority];
    });
    
    const uniqueIds = new Set();
    const result = [];
    for (const rec of sortedRecs) {
      if (!uniqueIds.has(rec.id)) {
        uniqueIds.add(rec.id);
        result.push(rec);
        if (result.length === 3) break;
      }
    }
    return result;
  },
  
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    return { theme: newTheme };
  }),
  
  getFlightBaggage: (flightId) => {
    const { baggage } = get();
    const flightBags = baggage.filter(b => b.flight_id === flightId);
    return {
      total: flightBags.length,
      loaded: flightBags.filter(b => b.current_status === 'Loaded').length,
      pending: flightBags.filter(b => b.current_status === 'Checked In' || b.current_status === 'Screening').length,
      delayed: flightBags.filter(b => b.current_status === 'Delayed').length,
      lost: flightBags.filter(b => b.is_lost === 'True').length,
      oversized: flightBags.filter(b => b.bag_type === 'Oversized' || b.bag_type === 'Heavy').length
    };
  },

  getFlightAlerts: (flightId) => {
    const { maintenanceLogs, simulationTime } = get();
    return maintenanceLogs.filter(m => {
      const report = parseISO(m.report_time);
      const completion = m.completion_time ? parseISO(m.completion_time) : null;
      return m.flight_id === flightId && simulationTime >= report && (!completion || simulationTime < completion);
    });
  },

  getFlightGateEvents: (flightId) => {
    const { gateEvents, simulationTime } = get();
    // Return events that happened up to simulation time
    return gateEvents.filter(g => g.flight_id === flightId && parseISO(g.timestamp) <= simulationTime);
  },
  
  resolveMaintenance: (workOrderId) => {
    const { maintenanceLogs, simulationTime } = get();
    // Simulate resolving the issue right now in simulation time
    const updatedLogs = maintenanceLogs.map(log => 
      log.work_order_id === workOrderId 
        ? { ...log, is_resolved: 'True', completion_time: simulationTime.toISOString() }
        : log
    );
    set({ maintenanceLogs: updatedLogs });
  }
}));
