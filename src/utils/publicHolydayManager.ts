import { publicHolidaysAxios } from "./AxiosCustom.js";
import { ActualEvent } from "./ActualEvent.js";
import { PublicHoliday } from "./publicHoliday.js";

export default class PublicHolydaysManager {
	private static instance: PublicHolydaysManager;

	private cache: Array<PublicHoliday> = [];

	public constructor() {
		if (PublicHolydaysManager.instance) {
			return PublicHolydaysManager.instance;
		} else {
			PublicHolydaysManager.instance = this;
		}
	}

	public async updateCache() {
		await publicHolidaysAxios
			.get(`${new Date().getFullYear()}.json`)
			.then(({ data }) => {
				for (const [date, reason] of Object.entries(data)) {
					//only add if not already in cache
					if (this.cache.findIndex((p) => p.date === new Date(date)) === -1) {
						this.cache.push(new PublicHoliday(new Date(date), reason as string));
					}
				}
			})
			.catch((error) => {
				console.error(error);
			});
	}

	public getPublicHolydays(): (PublicHoliday & ActualEvent)[] {
		const standardVacances = this.cache;
		const today = process.env.MOCKED_DATE ? new Date(process.env.MOCKED_DATE) : new Date();
		for (const vac of standardVacances) {
			if (vac.date.toDateString() == today.toDateString()) {
				(vac as ActualEvent & typeof vac).actual = true;
			}
		}
		return [...standardVacances];
	}
}
