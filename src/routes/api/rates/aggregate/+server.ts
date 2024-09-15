import { Currency, Price } from '$lib';
import {
	getLatestPrice,
	getRatesSummary,
	getTimeWindowAggregation,
	Tracker,
	validationError,
	type TimeWindowAggregate,
} from '$lib/server/index.js';
import { getQueryParams } from '$lib/server/utils.js';
import { json } from '@sveltejs/kit';
import { DateTime, Duration } from 'luxon';
import { object, string, ValidationError } from 'yup';
import { mergeAggregates } from './utils.js';

const TRACKERS = [...Object.values(Tracker), 'GOLD_GBP_BASED', 'GOLD_USD_BASED'];
const DURATIONS = ['week', 'month', '6-months', 'year', 'all'];

export async function GET({ url }) {
	try {
		await QueryParamsSchema.validate(getQueryParams(url));
	} catch (err) {
		return validationError((err as ValidationError).message);
	}

	const queryParams = QueryParamsSchema.cast(getQueryParams(url));

	const tracker = queryParams.tracker;
	const now = DateTime.now();
	const end = now;
	let start: DateTime;
	let timeWindow: Duration;

	switch (queryParams.duration) {
		case 'week': {
			start = end.minus(Duration.fromObject({ weeks: 1 }));
			timeWindow = Duration.fromObject({ hours: 1 });
			break;
		}

		case 'month': {
			start = end.minus(Duration.fromObject({ months: 1 }));
			timeWindow = Duration.fromObject({ hours: 8 });
			break;
		}

		case '6-months': {
			start = end.minus(Duration.fromObject({ months: 6 }));
			timeWindow = Duration.fromObject({ days: 2 });
			break;
		}

		case 'year': {
			start = end.minus(Duration.fromObject({ years: 1 }));
			timeWindow = Duration.fromObject({ days: 5 });
			break;
		}

		case 'all': {
			start = DateTime.fromMillis(0);
			timeWindow = Duration.fromObject({ days: 5 });
			break;
		}

		default: {
			return new Response(`unhandled duration "${queryParams.duration}"`, {
				status: 501,
			});
		}
	}

	if (Object.values(Tracker).includes(tracker as Tracker)) {
		const response = getTimeWindowAggregation(tracker as Tracker, timeWindow, { start, end });

		const latestPrice = getLatestPrice(tracker as Tracker);
		response.push({
			tracker,
			timeWindow: latestPrice.timestamp!.toISOString(),
			price: latestPrice,
		});

		return json(response);
	}

	// Needed values for gold aggregates
	const currentSummary = getRatesSummary();
	const goldAggregatesMerger = (goldPrice: TimeWindowAggregate, toEgp: TimeWindowAggregate) => ({
		tracker: tracker,
		timeWindow: goldPrice.timeWindow,
		price: new Price(goldPrice.price.value * toEgp.price.value, Currency.EGP, {
			timestamp: new Date(goldPrice.timeWindow),
		}),
	});

	if (tracker == 'GOLD_USD_BASED') {
		const goldUsdAggregation = getTimeWindowAggregation(Tracker.GOLD_USD, timeWindow, { start, end });
		const usdToEgpAggregation = getTimeWindowAggregation(Tracker.USD_TO_EGP, timeWindow, { start, end });
		const response = mergeAggregates(goldAggregatesMerger, goldUsdAggregation, usdToEgpAggregation);

		// Push latest value
		response.push({
			tracker: tracker,
			timeWindow: now.toISO(),
			price: currentSummary.gold.currencyBased!.usdBased!,
		});

		return json(response);
	}

	if (tracker == 'GOLD_GBP_BASED') {
		const goldUsdAggregation = getTimeWindowAggregation(Tracker.GOLD_GBP, timeWindow, { start, end });
		const usdToEgpAggregation = getTimeWindowAggregation(Tracker.GBP_TO_EGP, timeWindow, { start, end });
		const response = mergeAggregates(goldAggregatesMerger, goldUsdAggregation, usdToEgpAggregation);

		// Push latest value
		response.push({
			tracker: tracker,
			timeWindow: now.toISO(),
			price: currentSummary.gold.currencyBased!.gbpBased!,
		});

		return json(response);
	}

	return new Response(`unhandled tracker "${tracker}"`, {
		status: 501,
	});
}

const QueryParamsSchema = object({
	tracker: string().required().oneOf(TRACKERS),
	duration: string().oneOf(DURATIONS).default('month'),
});
