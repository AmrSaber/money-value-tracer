import type { TimeWindowAggregate } from '$lib/server';
import zip from 'lodash.zip';

export function mergeAggregates<T>(
	merger: (...aggregates: TimeWindowAggregate[]) => T,
	...aggregates: TimeWindowAggregate[][]
): T[] {
	if (aggregates.length == 0) return [];

	// Get the intersecting time windows (some could be missing)
	let commonTimeWindows = new Set(aggregates[0].map((a) => a.timeWindow));
	aggregates.forEach((aggregate) => {
		const timeWindows = new Set(aggregate.map((a) => a.timeWindow));
		commonTimeWindows = commonTimeWindows.intersection(timeWindows);
	});

	// Remove values with uncommon time windows
	aggregates = aggregates.map((aggregate) =>
		aggregate.flatMap((value) => {
			if (commonTimeWindows.has(value.timeWindow)) return value;
			return [];
		}),
	);

	// Zip and merge aggregates into 1 aggregate
	const result = zip(...aggregates).map((slice) => merger(...(slice as TimeWindowAggregate[])));
	return result;
}
