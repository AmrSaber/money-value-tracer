import { Currency, Price, prettify, scrapCurrencyRate, scrapGoldPrice } from '$lib';
import { json } from '@sveltejs/kit';
import YAML from 'yaml';

export async function GET({ url }) {
	const [gbpToUsd, usdToEgp, gbpToEgp, goldEgp, goldGbp, goldUsd] = await Promise.all([
		scrapCurrencyRate(Currency.GBP, Currency.USD),
		scrapCurrencyRate(Currency.USD, Currency.EGP),
		scrapCurrencyRate(Currency.GBP, Currency.EGP),
		scrapGoldPrice(Currency.EGP),
		scrapGoldPrice(Currency.GBP),
		scrapGoldPrice(Currency.USD),
	]);

	let response = {
		currency: {
			gbpToUsd,

			usd: usdToEgp,
			gbp: gbpToEgp,

			goldBased: {
				gbpToUsd: new Price(goldUsd.value / goldGbp.value, Currency.USD),
				usd: new Price(goldEgp.value / goldUsd.value, Currency.EGP),
				gbp: new Price(goldEgp.value / goldGbp.value, Currency.EGP),
			},
		},

		gold: {
			egp: goldEgp,
			gbp: goldGbp,
			usd: goldUsd,

			currencyBased: {
				usdBased: new Price(goldUsd.value * usdToEgp.value, Currency.EGP),
				gbpBased: new Price(goldGbp.value * gbpToEgp.value, Currency.EGP),
			},
		},

		timestamp: new Date().toISOString(),
	};

	if (url.searchParams.get('style') === 'pretty') response = prettify(response);

	if (url.searchParams.get('output') === 'yaml') {
		console.log({ response, yaml: YAML.stringify(response) });
		return new Response(YAML.stringify(response), {
			headers: { 'content-type': 'text/yaml; charset=utf-8' },
		});
	}

	return json(response);
}
