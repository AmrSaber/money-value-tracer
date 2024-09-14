import { Currency, scrapCurrencyRate, scrapGoldPrice } from '$lib';
import { TS_TABLE_NAME, Tracker, acquireLock, getTimeSeriesDbClient } from '$lib/server';
import type { DbTracker } from '$lib/server/db/types';
import cron from 'node-cron';

cron.schedule(
	'*/10 * * * *',
	async () => {
		console.log(`Scrapping CRON job started at ${new Date().toISOString()}`);

		const [gotLock, release] = acquireLock('cron:scrapper');
		if (!gotLock) return;

		try {
			const db = getTimeSeriesDbClient();

			const events = await Promise.all([
				scrapCurrencyRate(Currency.GBP, Currency.USD).then((price) => ({ price, tracker: Tracker.GBP_TO_USD })),
				scrapCurrencyRate(Currency.USD, Currency.EGP).then((price) => ({ price, tracker: Tracker.USD_TO_EGP })),
				scrapCurrencyRate(Currency.GBP, Currency.EGP).then((price) => ({ price, tracker: Tracker.GBP_TO_EGP })),
				scrapGoldPrice(Currency.EGP).then((price) => ({ price, tracker: Tracker.GOLD_EGP })),
				scrapGoldPrice(Currency.GBP).then((price) => ({ price, tracker: Tracker.GOLD_GBP })),
				scrapGoldPrice(Currency.USD).then((price) => ({ price, tracker: Tracker.GOLD_USD })),
			]);

			const now = new Date().toISOString();

			events.forEach((event) => {
				// Ignore failed scrapping
				if (event.price.value < 0) return;

				const tracker = db.query(`SELECT * FROM trackers WHERE name = ?`).get(event.tracker) as unknown as DbTracker;

				db.query(`INSERT INTO ${TS_TABLE_NAME} (timestamp, tracker_id, value, currency) VALUES (?, ?, ?, ?)`).run(
					now,
					tracker.id as number,
					event.price.value,
					event.price.currency,
				);
			});
		} catch (err) {
			console.error('error scrapping data:', err);
		} finally {
			release();
		}
	},
	{ runOnInit: true },
);
