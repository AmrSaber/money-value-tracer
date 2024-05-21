export function roundNumber(num: number, decimalPlaces = 3): number {
	const power = Math.pow(10, decimalPlaces);
	return Math.round(num * power) / power;
}
