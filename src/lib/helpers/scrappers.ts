import { Currency } from '$lib/constants';
import { NumberRegex } from '$lib/regex';
import * as cheerio from 'cheerio';

export async function scrapCurrencyRate(from: Currency, to: Currency): Promise<number> {
	const rate = await scrapPage(
		`https://www.xe.com/currencyconverter/convert/?Amount=1&From=${from}&To=${to}`,
		'section main p:nth-of-type(2)',
		numberMapper
	);

	return Number(rate);
}

export async function scrapGoldPrice(currency: Currency): Promise<number> {
	// Record type acts as exhaustive switch-case
	const scrappers: Record<Currency, (c: Currency) => Promise<number>> = {
		[Currency.GBP]: scrapGlobalGoldPrice,
		[Currency.USD]: scrapGlobalGoldPrice,
		[Currency.EGP]: scrapEgGoldPrice
	};

	return await scrappers[currency](currency);
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
		numberMapper
	);

	return Number(((price / 21) * 24).toFixed(3));
}

async function scrapPage<T = string>(
	url: string,
	selector: string,
	mapper?: (value: string) => T
): Promise<T> {
	const body = await fetch(url).then((res) => res.text());

	const $ = cheerio.load(body);
	const match = $(selector).text();

	if (mapper != null) return mapper(match);
	return match as T;
}

function numberMapper(value: string): number {
	return Number(value.match(NumberRegex)?.at(0) ?? -1);
}
