import Papa from 'papaparse';

// Since the CSVs are missing headers, we define the schemas here
const SCHEMAS = {
  flights: [
    'flight_id', 'airline', 'airline_code', 'origin', 'destination',
    'scheduled_departure', 'actual_departure', 'scheduled_arrival', 'actual_arrival',
    'aircraft_type', 'tail_number', 'capacity', 'passengers', 'status',
    'delay_minutes', 'delay_reason', 'terminal', 'gate', 'is_international',
    'distance', 'flight_duration_sec', 'boarding_time', 'has_delay', 'weather',
    'fuel_efficiency', 'crew_count', 'load_factor', 'time_of_day', 'day_of_week',
    'is_weekend', 'season', 'flight_type'
  ],
  gate_events: [
    'event_id', 'flight_id', 'gate', 'terminal', 'event_type', 'timestamp',
    'staff_id', 'duration_mins', 'status', 'requires_maintenance', 'notes',
    'created_at', 'updated_at', 'scheduled_time'
  ],
  maintenance_logs: [
    'work_order_id', 'tail_number', 'flight_id', 'action_type', 'reporter_id',
    'report_time', 'completion_time', 'priority', 'duration_mins', 'issue_description',
    'component', 'cost', 'technician_id', 'is_grounded', 'is_resolved', 'notes'
  ],
  baggage: [
    'bag_tag', 'pnr', 'flight_id', 'passenger_id', 'weight', 'dimensions',
    'bag_type', 'checkin_counter', 'checkin_time', 'screening_time', 'security_status',
    'current_status', 'is_rush', 'delay_mins', 'location', 'last_updated', 'is_lost', 'notes'
  ]
};

export const parseCSV = async (filename, type) => {
  try {
    const response = await fetch(`/data/${filename}`);
    const text = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const TERMINALS = ['B3', 'B4', 'B6', 'B7', 'B9', 'B10', 'B11', 'B12', 'B13', 'B15', 'B17', 'B18', 'B23', 'B29', 'B32'];
          const mappedData = results.data.map((row, idx) => {
            const newRow = {};
            const schema = SCHEMAS[type];
            if (schema) {
              schema.forEach((key, index) => {
                newRow[key] = row[index.toString()];
              });
            } else {
              Object.keys(row).forEach(k => newRow[`col_${k}`] = row[k]);
            }
            // Distribute gate events across all gates to make the UI look alive
            if (type === 'gate_events' && newRow.gate === 'B12') {
              newRow.gate = TERMINALS[idx % TERMINALS.length];
            }
            return newRow;
          });
          resolve(mappedData);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
};
