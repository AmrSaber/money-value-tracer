export function getQueryParams(url: URL) {
	return Object.fromEntries(url.searchParams.entries());
}
