export const DB_DIR = 'dbs';

export const TS_TRACKERS_TABLE_NAME = 'trackers';
export const TS_RECENT_TABLE_NAME = 'time_series_recent';
export const TS_HISTORICAL_TABLE_NAME = 'time_series_historical';

export enum Trackers {
	GBP_TO_USD = 'GBP_TO_USD',
	USD_TO_EGP = 'USD_TO_EGP',
	GBP_TO_EGP = 'GBP_TO_EGP',

	GOLD_EGP = 'GOLD_EGP',
	GOLD_GBP = 'GOLD_GBP',
	GOLD_USD = 'GOLD_USD',
}
