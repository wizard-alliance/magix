import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

export class DateFormat {
	private parse(value: string | Date | number) {
		return dayjs.utc(value).tz(app.Account.Preferences.get(`timezone`))
	}

	format(value: string | Date | number): string {
		const d = this.parse(value)
		return d.isValid() ? d.format(app.Account.Preferences.get(`datetime_format`)) : `—`
	}

	time(value: string | Date | number): string {
		const d = this.parse(value)
		return d.isValid() ? d.format(`h:mm A`) : `—`
	}

	full(value: string | Date | number): string {
		const d = this.parse(value)
		if (!d.isValid()) return `—`
		return `${d.format(app.Account.Preferences.get(`datetime_format`))} ${d.format(`h:mm A`)}`
	}

	relative(value: string | Date | number): string {
		const d = this.parse(value)
		return d.isValid() ? d.fromNow() : `—`
	}

	iso(value: string | Date | number): string {
		const d = this.parse(value)
		return d.isValid() ? d.toISOString() : `—`
	}
}
