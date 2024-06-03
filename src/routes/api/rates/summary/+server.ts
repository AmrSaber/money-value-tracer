import { prettify } from '$lib';
import { getRatesSummary } from '$lib/server/services.js';
import { json } from '@sveltejs/kit';
import YAML from 'yaml';

export async function GET({ url }) {
	let response = getRatesSummary();

	if (url.searchParams.get('style') === 'pretty') {
		response = prettify(response);
	}

	if (url.searchParams.get('output') === 'yaml') {
		return new Response(YAML.stringify(response), {
			headers: { 'content-type': 'text/yaml; charset=utf-8' },
		});
	}

	return json(response);
}
