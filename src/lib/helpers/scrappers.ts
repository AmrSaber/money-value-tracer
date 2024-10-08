import { Currency } from '$lib/constants';
import { NumberRegex } from '$lib/regex';
import { Price } from '$lib/types';
import * as cheerio from 'cheerio';
import { roundNumber } from './numbers';

export async function scrapCurrencyRate(from: Currency, to: Currency): Promise<Price> {
	const rate = await scrapPage(
		`https://www.xe.com/currencyconverter/convert/?Amount=1&From=${from}&To=${to}`,
		'section main p:nth-of-type(2)',
		numberMapper,
	);

	return new Price(rate, to);
}

export async function scrapGoldPrice(currency: Currency): Promise<Price> {
	// Record type acts as exhaustive switch-case
	const scrappers: Record<Currency, (c: Currency) => Promise<number>> = {
		[Currency.GBP]: scrapGlobalGoldPrice,
		[Currency.USD]: scrapGlobalGoldPrice,
		[Currency.EGP]: scrapEgGoldPrice,
	};

	const rate = await scrappers[currency](currency);
	return new Price(rate, currency);
}

async function scrapGlobalGoldPrice(currency: Currency): Promise<number> {
	let url = 'https://www.chards.co.uk/gold-price/live-gold-price-in-grams';
	if (currency === Currency.USD) {
		url = 'https://www.chards.co.uk/gold-price/daily-gold-price-per-gram-us-dollars';
	}

	const price = await scrapPage(url, '#summary-table td.current span.text', numberMapper);
	return price;
}

async function scrapEgGoldPrice(): Promise<number> {
	const price = await scrapPage(
		'https://market.isagha.com',
		'#header-prices tr:nth-of-type(1) td.header-price-item',
		numberMapper,
	);

	return Number(((price / 21) * 24).toFixed(3));
}

async function scrapPage<T = string>(url: string, selector: string, mapper?: (value: string) => T): Promise<T> {
	const body = await fetch(url).then((res) => res.text());

	const $ = cheerio.load(body);
	const match = $(selector).text();

	if (mapper != null) return mapper(match);
	return match as T;
}

function numberMapper(value: string): number {
	const match = Number(value.match(NumberRegex)?.at(0) ?? -1);
	return roundNumber(match);
}
