export enum Currency {
	EGP = 'EGP',
	USD = 'USD',
	GBP = 'GBP',
}

export const currencyToSymbol: Record<Currency, string> = {
	[Currency.EGP]: '£E',
	[Currency.GBP]: '£',
	[Currency.USD]: '$',
};
