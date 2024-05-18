import { Database } from 'bun:sqlite';
import path from 'path';
import { DB_DIR } from './constants';
import { initDbDir, initLocksDb, initTimeSeriesDb } from './init';

// Cached clients
let locksDb: Database;
let timeSeriesDb: Database;

export function getLocksDbClient() {
	if (locksDb == null) {
		initDbDir();
		locksDb = new Database(path.join(DB_DIR, 'locks.db'));
		initLocksDb(locksDb);
	}

	return locksDb;
}

export function getTimeSeriesDbClient() {
	if (timeSeriesDb == null) {
		initDbDir();
		timeSeriesDb = new Database(path.join(DB_DIR, 'time-series.db'));
		initTimeSeriesDb(timeSeriesDb);
	}

	return timeSeriesDb;
}
