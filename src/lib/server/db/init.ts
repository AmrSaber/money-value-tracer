import { Database } from 'bun:sqlite';
import { mkdirSync } from 'fs';

import { DB_DIR, Tracker } from './constants';
import { locksDbMigrations, timeSeriesDbMigrations } from './migrations';

export function initLocksDb(db: Database) {
	db.exec('PRAGMA journal_mode = WAL;');
	locksDbMigrations.forEach((query) => db.run(query));
}

export function initTimeSeriesDb(db: Database) {
	db.exec('PRAGMA journal_mode = WAL;');

	// Run migrations
	try {
		timeSeriesDbMigrations.forEach((query) => db.run(query));
	} catch (err) {
		console.warn('Migration error:', err);
	}

	// Add trackers
	const trackers = Object.values(Tracker);

	const tx = db.transaction(() => {
		trackers.forEach((tracker) => {
			db.query(`INSERT OR IGNORE INTO trackers (name) VALUES (?)`).run(tracker);
		});
	});

	tx();
}

export function initDbDir() {
	mkdirSync(DB_DIR, { recursive: true });
}
