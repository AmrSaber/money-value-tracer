import { currencyToSymbol, type Currency } from './constants';
import { cleanObject } from './helpers';
import { roundNumber } from './helpers/numbers';

type PriceOptions = {
	precision?: number;
};

export class Price {
	public readonly value: number;
	public readonly currency: Currency;
	public timestamp?: Date; // Indicates when this price was taken

	constructor(value: number, currency: Currency, { precision = 3 }: PriceOptions = {}) {
		this.value = precision >= 0 ? roundNumber(value, precision) : value; // For negative precision: don't round
		this.currency = currency;
	}

	toPrettyString(): string {
		return `${currencyToSymbol[this.currency]}${this.value.toFixed(3)}`;
	}

	toString(): string {
		return JSON.stringify(cleanObject({ value: this.value, currency: this.currency, timestamp: this.timestamp }));
	}
}
