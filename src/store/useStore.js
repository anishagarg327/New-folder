import { create } from 'zustand';
import { parseCSV } from '../utils/csvParser';
import { addMinutes, parseISO } from 'date-fns';

export const useStore = create((set, get) => ({
  // Data
  flights: [],
  gateEvents: [],
  maintenanceLogs: [],
  baggage: [],
  
  // App State
  loading: true,
  error: null,
  
  // Simulation State
  simulationTime: new Date('2024-11-11T12:00:00Z'), // Base starting time
  simulationSpeed: 1, // 1 real sec = 1 sim min
  isRunning: false,
  
  // Actions
  loadData: async () => {
    set({ loading: true });
    try {
      const [flightsData, gateEventsData, maintenanceData, baggageData] = await Promise.all([
        parseCSV('flights.csv', 'flights'),
        parseCSV('gate_events.csv', 'gate_events'),
        parseCSV('maintenance_logs.csv', 'maintenance_logs'),
        parseCSV('baggage.csv', 'baggage')
      ]);
      
      // Determine earliest flight to set base simulation time
      let baseTime = new Date('2024-11-11T12:00:00Z');
      if (flightsData.length > 0) {
        const firstFlightTime = parseISO(flightsData[0].scheduled_departure);
        if (!isNaN(firstFlightTime)) {
          // start 2 hours before the first flight
          baseTime = addMinutes(firstFlightTime, -120); 
        }
      }

      set({ 
        flights: flightsData, 
        gateEvents: gateEventsData,
        maintenanceLogs: maintenanceData,
        baggage: baggageData,
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
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  
  // Selectors/Computed Data
  // Returns upcoming and currently active flights
  getActiveFlights: () => {
    const { flights, simulationTime } = get();
    // Get flights that haven't landed more than 2 hours ago
    const cutoffDate = addMinutes(simulationTime, -120);
    // Convert to string format roughly matching CSV "YYYY-MM-DD HH:mm:ss"
    const cutoffStr = cutoffDate.toISOString().replace('T', ' ').substring(0, 19);
    
    const active = flights.filter(f => f.scheduled_arrival > cutoffStr);
    
    // Sort by scheduled departure (closest first) using string comparison
    active.sort((a, b) => a.scheduled_departure.localeCompare(b.scheduled_departure));
    
    return active;
  },

  // Operational Controls
  selectedFlightId: null,
  setSelectedFlight: (id) => set({ selectedFlightId: id }),
  
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
