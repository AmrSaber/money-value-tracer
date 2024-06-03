import { serialize } from '$lib';
import { getRatesSummary } from '$lib/server';
import type { PageServerLoad } from './$types';

export const ssr = true;

export const load: PageServerLoad = async () => {
	return { summary: serialize(getRatesSummary()) };
};
