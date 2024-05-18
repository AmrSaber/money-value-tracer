export const locksDbMigrations = [
	// Create locks table
	`CREATE TABLE IF NOT EXISTS locks (
    key TEXT PRIMARY KEY,
    expires_at INTEGER
  )`,
];

export const timeSeriesDbMigrations = [
	// Trackers table
	`CREATE TABLE IF NOT EXISTS trackers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  )`,

	// Tracker name index
	`CREATE UNIQUE INDEX IF NOT EXISTS idx_trackers_name ON trackers (name)`,

	// Recent data table
	`
	CREATE TABLE IF NOT EXISTS time_series_recent (
		id INTEGER PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    tracker_id INTEGER NOT NULL,
    value REAL NOT NULL,
    currency TEXT NOT NULL,

    FOREIGN KEY (tracker_id) REFERENCES trackers(id)
	)`,

	// Recent data index
	`CREATE UNIQUE INDEX IF NOT EXISTS idx_time_series_recent_tracker_id_timestamp ON time_series_recent (tracker_id, timestamp)`,
	`CREATE INDEX IF NOT EXISTS idx_time_series_recent_tracker_id ON time_series_recent (tracker_id)`,

	// Historical data table
	`CREATE TABLE IF NOT EXISTS time_series_historical (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    tracker_id INTEGER NOT NULL,
    value REAL NOT NULL,
    currency TEXT NOT NULL,

    FOREIGN KEY (tracker_id) REFERENCES trackers(id)
	)`,

	// Historical data index
	`CREATE UNIQUE INDEX IF NOT EXISTS idx_time_series_historical_tracker_id_timestamp ON time_series_historical (tracker_id, timestamp)`,
];
