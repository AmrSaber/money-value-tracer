import type { Currency } from '$lib/constants';

export type DbTracker = {
	id?: number;
	name?: string;
};

export type DbTimeSeries = {
	id: number;
	timestamp: string;
	tracker_id: number;
	value: number;
	currency: Currency;
};
