import { Price, type PojoPrice } from '$lib/types';

export type Prettified<T extends object> = {
	[K in keyof T]: T[K] extends Price ? string : T[K];
};

export type Serialized<T extends object> = {
	[K in keyof T]: T[K] extends Price ? PojoPrice : T[K] extends object ? Serialized<T[K]> : T[K];
};

export type Deserialized<T extends object> = {
	[K in keyof T]: T[K] extends PojoPrice ? Price : T[K] extends object ? Deserialized<T[K]> : T[K];
};

export function prettify<T extends object>(value: T): Prettified<T> {
	const entries = Object.entries(value);

	const mappedEntries = entries.map(([key, value]) => {
		if (value instanceof Price) return [key, value.toPrettyString()];
		if (Array.isArray(value)) return [key, value.map(prettify)];
		if (typeof value === 'object') return [key, prettify(value)];
		return [key, value];
	});

	return Object.fromEntries(mappedEntries);
}

export function serializePrices<T extends object>(value: T): Serialized<T> {
	return JSON.parse(JSON.stringify(value));
}

export function deserializePrices<T extends object>(value: T): Deserialized<T> {
	const entries = Object.entries(value);

	const mappedEntries = entries.map(([key, value]) => {
		if (Price.isPricePojo(value)) return [key, Price.fromPojo(value)];
		if (Array.isArray(value)) return [key, value.map(deserializePrices)];
		if (typeof value === 'object') return [key, deserializePrices(value)];
		return [key, value];
	});

	return Object.fromEntries(mappedEntries);
}

export function cleanObject<T extends object>(value: T): T {
	if (typeof value != 'object') return value;

	const entries = Object.entries(value);
	const mappedEntries = entries
		.map(([key, value]) => {
			if (Array.isArray(value) && value.length == 0) return []; // remove empty arrays
			if (typeof value === 'object' && isEmptyObject(value)) return []; // remove empty objects
			return [key, value];
		})
		.filter(([, value]) => value != null);

	return Object.fromEntries(mappedEntries) as T;
}

export function isEmptyObject(obj: object): boolean {
	return Object.keys(obj).length == 0;
}
