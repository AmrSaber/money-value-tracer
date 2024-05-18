import { currencyToSymbol, type Currency } from './constants';
import { cleanObject } from './helpers';

export class Price {
	public readonly value: number;
	public readonly currency: Currency;
	public timestamp?: Date; // Indicates when this price was taken

	constructor(value: number, currency: Currency) {
		this.value = value;
		this.currency = currency;
	}

	toPrettyString(): string {
		return `${currencyToSymbol[this.currency]}${this.value.toFixed(3)}`;
	}

	toString(): string {
		return JSON.stringify(cleanObject({ value: this.value, currency: this.currency, timestamp: this.timestamp }));
	}
}
