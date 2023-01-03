import axios from "axios";
import { ActualEvent } from "./ActualEvent";
import { PublicHoliday } from "./publicHoliday";

export default class PublicHolydaysManager {
	private static getDatasetLink = () => `https://calendrier.api.gouv.fr/jours-feries/metropole/${new Date().getFullYear()}.json`;
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
		await axios
			.get(PublicHolydaysManager.getDatasetLink())
			.then(({ data }) => {
				for (const [date, reason] of Object.entries(data)) {
					this.cache.push(new PublicHoliday(new Date(date), reason as string));
				}
			})
			.catch((error) => {
				console.error(error);
			});
	}

	public getPublicHolydays() : (PublicHoliday & ActualEvent)[] {
		const standardVacances = this.cache;
		standardVacances.length == 0 && this.updateCache();
		const today = process.env.MOCKED_DATE ? new Date(process.env.MOCKED_DATE) : new Date();
		for (const vac of standardVacances) {
			if (vac.date.toDateString() == today.toDateString()) {
				(vac as ActualEvent & typeof vac).actual = true;
			}
		}
		return [...standardVacances];
	}
}
