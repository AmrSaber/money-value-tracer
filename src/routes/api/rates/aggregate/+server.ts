import { getTimeWindowAggregation, Tracker } from '$lib/server/index.js';
import { json } from '@sveltejs/kit';
import { Duration } from 'luxon';

export async function GET() {
	const response = getTimeWindowAggregation(Tracker.GBP_TO_EGP, Duration.fromObject({ minutes: 30 }));

	return json(response);
}
