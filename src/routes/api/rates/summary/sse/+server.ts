import { getRatesSummary } from '$lib/server';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
	const headers = new Headers({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive',
	});

	return new Response(
		new ReadableStream({
			start(controller) {
				const send = (data: string) => {
					console.log('sending', data);
					controller.enqueue(data + '\n\n');
				};

				console.log('started SSE on server');

				let summary = getRatesSummary();
				send(JSON.stringify(summary));

				// Check for summary update every 30 seconds
				const interval = setInterval(() => {
					console.log('getting latest summary');
					const latestSummary = getRatesSummary();
					if (JSON.stringify(summary) !== JSON.stringify(latestSummary)) {
						summary = latestSummary;
						send(JSON.stringify(summary));
						console.log('sent new summary');
					}
				}, 30_000);

				request.signal.addEventListener('abort', () => {
					clearInterval(interval);
					controller.close();
				});
			},
		}),
		{ headers },
	);
};
