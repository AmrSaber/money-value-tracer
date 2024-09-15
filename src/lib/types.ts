import { Currency, currencyToSymbol } from './constants';
import { cleanObject } from './helpers';
import { roundNumber } from './helpers/numbers';

type PriceOptions = {
	precision?: number;
	timestamp?: Date;
};

export type PojoPrice = {
	value: number;
	currency: Currency;
	timestamp?: Date;
};

export class Price {
	public readonly value: number;
	public readonly currency: Currency;
	public timestamp?: Date; // Indicates when this price was taken

	constructor(value: number, currency: Currency, { precision = 3, timestamp }: PriceOptions = {}) {
		this.value = precision >= 0 ? roundNumber(value, precision) : value; // For negative precision: don't round
		this.currency = currency;
		this.timestamp = timestamp;
	}

	static fromPojo(pojo: PojoPrice): Price {
		const price = new Price(pojo.value, pojo.currency);
		if (pojo.timestamp != null) price.timestamp = pojo.timestamp;
		return price;
	}

	static isPricePojo(obj: any): obj is PojoPrice {
		if (typeof obj != 'object') return false;
		const { value, currency, timestamp } = obj;

		if (value == null || !Number.isFinite(value)) return false;
		if (currency == null || !Object.values(Currency).includes(currency)) return false;
		if (timestamp != null && !(timestamp instanceof Date || typeof timestamp == 'string')) return false;

		return true;
	}

	toPojo() {
		return cleanObject({ value: this.value, currency: this.currency, timestamp: this.timestamp });
	}

	toString(): string {
		return this.toJson();
	}

	toJson(): string {
		return JSON.stringify(this.toPojo());
	}

	toPrettyString(): string {
		return `${currencyToSymbol[this.currency]}${this.value.toFixed(3)}`;
	}
}
