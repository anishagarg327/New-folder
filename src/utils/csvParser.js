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
          const mappedData = results.data.map(row => {
            const newRow = {};
            const schema = SCHEMAS[type];
            if (schema) {
              schema.forEach((key, index) => {
                newRow[key] = row[index.toString()];
              });
            } else {
              Object.keys(row).forEach(k => newRow[`col_${k}`] = row[k]);
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
