import { getLocksDbClient } from './db';

const LOCK_TIMEOUT = 60 * 1000; // 1 minute

type LockOptions = {
	timeout?: number;
};

export function acquireLock(
	lockKey: string,
	{ timeout = LOCK_TIMEOUT }: LockOptions = {},
): [boolean, () => void] {
	const now = Date.now();
	const expiresAt = now + timeout;

	const db = getLocksDbClient();

	// Start a transaction
	const tx = db.transaction((): boolean => {
		// Remove expired locks
		db.query('DELETE FROM locks WHERE expires_at < ? AND key = ?').run(now, lockKey);

		// Check if lock exists
		const existingLock = db.query('SELECT * FROM locks WHERE key = ?').get(lockKey);
		if (existingLock != null) return false;

		// Try to acquire the lock
		db.query('INSERT OR IGNORE INTO locks (key, expires_at) VALUES (?, ?)').run(lockKey, expiresAt);
		return true;
	});

	const gotLock = tx.exclusive() as unknown as boolean;

	const release = () => {
		db.query('DELETE FROM locks WHERE key = ?').run(lockKey);
	};

	return [gotLock, release];
}
