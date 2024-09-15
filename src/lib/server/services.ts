import { Currency } from '$lib/constants';
import { cleanObject } from '$lib/helpers';
import { Price } from '$lib/types';
import { DateTime, type Duration } from 'luxon';
import { TS_TABLE_NAME, TS_TRACKERS_TABLE_NAME, Tracker, getTimeSeriesDbClient } from './db';

export type RatesSummary = {
	currency: {
		gbpToUsd: Price;
		usd: Price;
		gbp: Price;

		goldBased?: {
			usd?: Price;
			gbp?: Price;
		};
	};

	gold: {
		egp: Price;
		usd: Price;
		gbp: Price;

		currencyBased?: {
			usdBased?: Price;
			gbpBased?: Price;
		};
	};
};

export function getRatesSummary(): RatesSummary {
	const db = getTimeSeriesDbClient();

	const query = `
	WITH recents AS (
		SELECT tracker_id, MAX(timestamp) AS latest_time
		FROM ${TS_TABLE_NAME}
		WHERE value >= 0
		GROUP BY tracker_id
	)
	SELECT ts.id AS id, ts.timestamp AS timestamp, t.name AS tracker_name, ts.value AS value, ts.currency AS currency
	FROM ${TS_TABLE_NAME} ts
	JOIN recents r on r.tracker_id = ts.tracker_id AND r.latest_time = ts.timestamp
	JOIN ${TS_TRACKERS_TABLE_NAME} t on t.id = ts.tracker_id
	`;

	type Entry = {
		id: number;
		timestamp: string;
		tracker_name: string;
		price: Price;
	};

	const entries: Entry[] = db
		.query(query)
		.all()
		.map(({ value, currency, ...rest }: any) => ({
			...rest,
			price: new Price(value, currency as Currency),
		}));

	const findEntry = (tracker: Tracker) => {
		const entry = entries.find((e) => e.tracker_name === tracker);
		if (entry == null) return undefined;

		const { price, timestamp } = entry;
		if (price != null) price.timestamp = new Date(timestamp);

		return price;
	};

	const gbpToUsd = findEntry(Tracker.GBP_TO_USD);
	const usdToEgp = findEntry(Tracker.USD_TO_EGP);
	const gbpToEgp = findEntry(Tracker.GBP_TO_EGP);
	const goldEgp = findEntry(Tracker.GOLD_EGP);
	const goldGbp = findEntry(Tracker.GOLD_GBP);
	const goldUsd = findEntry(Tracker.GOLD_USD);

	const summary: any = {
		currency: {
			gbpToUsd,

			usd: usdToEgp,
			gbp: gbpToEgp,

			goldBased: {},
		},

		gold: {
			egp: goldEgp,
			gbp: goldGbp,
			usd: goldUsd,

			currencyBased: {},
		},
	};

	if (goldUsd != null && goldGbp != null)
		summary.currency.goldBased.gbbToUsd = new Price(goldUsd.value / goldGbp.value, Currency.USD);

	if (goldEgp != null) {
		if (goldUsd != null) summary.currency.goldBased.usd = new Price(goldEgp.value / goldUsd.value, Currency.EGP);
		if (goldGbp != null) summary.currency.goldBased.gbp = new Price(goldEgp.value / goldGbp.value, Currency.EGP);
	}

	if (goldUsd != null && usdToEgp != null)
		summary.gold.currencyBased.usdBased = new Price(goldUsd.value * usdToEgp.value, Currency.EGP);

	if (goldGbp != null && gbpToEgp != null)
		summary.gold.currencyBased.gbpBased = new Price(goldGbp.value * gbpToEgp.value, Currency.EGP);

	return cleanObject(summary);
}

export type TimeWindowAggregate = {
	tracker: string;
	timeWindow: string;
	price: Price;
};

export function getTimeWindowAggregation(
	tracker: Tracker,
	windowSize: Duration,
	{ start = DateTime.fromMillis(0), end = DateTime.now() }: { start?: DateTime; end?: DateTime } = {},
): TimeWindowAggregate[] {
	const db = getTimeSeriesDbClient();

	type QueryRow = {
		tracker: string;
		time_window: string;
		value: number;
		currency: string;
	};

	return db
		.query(
			`
			SELECT
				tr.name as tracker,
				STRFTIME('%FT%T', (STRFTIME('%s', ts.timestamp) / $windowSize) * $windowSize, 'unixepoch') AS time_window,
				ROUND(AVG(value), 3) as value,
				ts.currency as currency
			FROM ${TS_TABLE_NAME} ts
			JOIN ${TS_TRACKERS_TABLE_NAME} tr ON tr.id = ts.tracker_id AND tr.name = $tracker
			WHERE ts.timestamp >= $start AND ts.timestamp <= $end
			GROUP BY time_window, tracker, currency
			ORDER BY time_window ASC
			`,
		)
		.all({
			$windowSize: windowSize.as('seconds'),
			$tracker: tracker,
			$start: start.toISO(),
			$end: end.toISO(),
		})
		.map<TimeWindowAggregate>((item) => {
			const { tracker, time_window, value, currency } = item as QueryRow;

			return {
				tracker,
				timeWindow: time_window,
				price: new Price(value, currency as Currency),
			};
		});
}

export function getLatestPrice(tracker: Tracker): Price {
	const db = getTimeSeriesDbClient();

	type Row = {
		tracker_name: string;
		value: number;
		currency: string;
		timestamp: string;
	};

	const latest = db
		.query(
			`
			WITH recents AS (
				SELECT tracker_id, MAX(timestamp) AS latest_time
				FROM ${TS_TABLE_NAME}
				WHERE value >= 0
				GROUP BY tracker_id
			)
			SELECT 
				tr.name AS tracker_name,
				ts.value AS value,
				ts.currency AS currency,
				ts.timestamp AS timestamp
			FROM ${TS_TABLE_NAME} ts
			JOIN ${TS_TRACKERS_TABLE_NAME} tr on tr.id = ts.tracker_id AND tr.name = $tracker
			JOIN recents r on r.tracker_id = ts.tracker_id AND r.latest_time = ts.timestamp
			`,
		)
		.get({ $tracker: tracker }) as Row;

	return new Price(latest.value, latest.currency as Currency, { timestamp: new Date(latest.timestamp) });
}
