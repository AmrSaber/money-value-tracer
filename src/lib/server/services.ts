import { Currency } from '$lib/constants';
import { cleanObject } from '$lib/helpers';
import { Price } from '$lib/types';
import { TS_TABLE_NAME, TS_TRACKERS_TABLE_NAME, Trackers, getTimeSeriesDbClient } from './db';

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

	const findEntry = (tracker: Trackers) => {
		const entry = entries.find((e) => e.tracker_name === tracker);
		if (entry == null) return undefined;

		const { price, timestamp } = entry;
		if (price != null) price.timestamp = new Date(timestamp);

		return price;
	};

	const gbpToUsd = findEntry(Trackers.GBP_TO_USD);
	const usdToEgp = findEntry(Trackers.USD_TO_EGP);
	const gbpToEgp = findEntry(Trackers.GBP_TO_EGP);
	const goldEgp = findEntry(Trackers.GOLD_EGP);
	const goldGbp = findEntry(Trackers.GOLD_GBP);
	const goldUsd = findEntry(Trackers.GOLD_USD);

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
