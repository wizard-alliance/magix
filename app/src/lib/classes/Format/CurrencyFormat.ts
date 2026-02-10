const currencyLocales: Record<string, string> = {
	USD: `en-US`,
	EUR: `de-DE`,
	GBP: `en-GB`,
	NOK: `nb-NO`,
	SEK: `sv-SE`,
	DKK: `da-DK`,
	JPY: `ja-JP`,
	CHF: `de-CH`,
	CAD: `en-CA`,
	AUD: `en-AU`,
}

export class CurrencyFormat {
	format(amount: number, currency?: string): string {
		const code = currency?.toUpperCase() || app.Account.Preferences.get(`currency`)
		const locale = currencyLocales[code] ?? `en-US`
		try {
			return new Intl.NumberFormat(locale, { style: `currency`, currency: code }).format((amount ?? 0) / 100)
		} catch {
			return `${((amount ?? 0) / 100).toFixed(2)} ${code}`
		}
	}
}
