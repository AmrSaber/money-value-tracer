import { currencyToSymbol, type Currency } from './constants';

export class Price {
	public readonly value: number;
	public readonly currency: Currency;

	constructor(value: number, currency: Currency) {
		this.value = value;
		this.currency = currency;
	}

	toPrettyString(): string {
		return `${currencyToSymbol[this.currency]}${this.value.toFixed(3)}`;
	}

	toString(): string {
		return JSON.stringify({ value: this.value, currency: this.currency });
	}
}
