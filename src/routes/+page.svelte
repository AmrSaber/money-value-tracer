<script lang="ts">
	import { browser } from '$app/environment';
	import { deserializePrices } from '$lib';
	import type { RatesSummary } from '$lib/server';
	import type { PageData } from './$types';

	export let data: PageData;
	let summary: RatesSummary = deserializePrices(data.summary);

	// TODO: enable (fix?) SSE instead
	if (browser) {
		setInterval(async () => {
			const newSummary = await fetch('/api/rates/summary').then((res) => res.json());
			console.log(newSummary);
			summary = deserializePrices(newSummary) as RatesSummary;
		}, 60_000);
	}

	// let sseConnection: EventSource;
	// const reconnectTimeout = 5_000; // Try to reconnect after 5 seconds if connection failed

	// function connectSSE() {
	// 	sseConnection = new EventSource('/api/rates/summary/sse');
	// 	console.log('connected to SSE:', sseConnection);

	// 	sseConnection.onmessage = (event) => {
	// 		console.log('got:', event);
	// 		summary = deserialize(JSON.parse(event.data)) as RatesSummary;
	// 	};

	// 	sseConnection.onerror = (error) => {
	// 		console.error('SSE error:', error);
	// 		sseConnection.close();
	// 		setTimeout(connectSSE, reconnectTimeout);
	// 	};
	// }

	// onMount(() => {
	// 	connectSSE();

	// 	return () => {
	// 		sseConnection.close();
	// 	};
	// });
</script>

<main>
	<h1>Currency Tracker</h1>
	<div id="rates-container">
		<div class="rates" id="currency">
			<h2>Currency</h2>
			<div class="table currency">
				<span>USD</span> <span class="value">{summary.currency.usd.toPrettyString()}</span>
				<span>GBP</span> <span class="value">{summary.currency.gbp.toPrettyString()}</span>
			</div>
		</div>

		<div class="spacer" />

		<div class="rates" id="gold">
			<h2>Gold</h2>
			<div class="table gold">
				<span>EGP</span>
				<span class="value">{summary.gold.egp.toPrettyString()}</span>
				<span></span>

				<span>USD</span>
				<span class="value">{summary.gold.currencyBased?.usdBased?.toPrettyString()}</span>
				<span class="value">({summary.gold.usd.toPrettyString()})</span>

				<span>GBP</span>
				<span class="value">{summary.gold.currencyBased?.gbpBased?.toPrettyString()}</span>
				<span class="value">({summary.gold.gbp.toPrettyString()})</span>
			</div>
		</div>
	</div>
</main>

<style>
	h1 {
		text-align: center;
	}

	main {
		margin-inline: auto;
		width: fit-content;
		min-height: 100vh;

		display: flex;
		flex-direction: column;

		align-items: center;
	}

	div.table {
		display: grid;
		width: fit-content;

		grid-auto-flow: row;
		row-gap: 0.25rem;
	}

	div.table.currency {
		grid-template-columns: 4rem 1fr;
	}

	div.table.gold {
		grid-template-columns: 4rem 1fr 1fr;
	}

	.value {
		text-align: center;
	}

	#rates-container {
		display: flex;
	}

	.spacer {
		width: 5rem;
	}

	@media screen and (max-width: 400px) {
		#rates-container {
			flex-direction: column;
		}

		.spacer {
			width: 0;
			height: 2rem;
		}
	}
</style>
