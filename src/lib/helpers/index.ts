import { Price } from '$lib/types';

export * from './scrappers';

export type PlainObject = { [key: string]: unknown };

export type Prettified<T extends PlainObject> = {
	[K in keyof T]: T[K] extends Price ? string : T[K];
};

export function prettify<T extends PlainObject>(value: T): Prettified<T> {
	const entries = Object.entries(value);

	const mappedEntries = entries.map(([key, value]) => {
		if (value instanceof Price) return [key, value.toPrettyString()];
		if (value instanceof Object) return [key, prettify(value as PlainObject)];
		return [key, value];
	});

	return Object.fromEntries(mappedEntries);
}

export function cleanObject<T extends PlainObject | PlainObject[]>(value: T): T {
	if (typeof value != 'object') return value;

	// @ts-ignore
	if (Array.isArray(value)) return value.map((item) => cleanObject(item));

	const entries = Object.entries(value);
	return Object.fromEntries(entries.filter(([, val]) => val != null && JSON.stringify(val) != '{}')) as T;
}
