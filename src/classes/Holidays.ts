import { HolidayZone } from "crous-api-types/types/HolidayZones";
import { keys } from "ts-transformer-keys";

export class Holiday {
	end_date!: Date;
	start_date!: Date;
	annee_scolaire!: string;
	description!: string;
	zones!: HolidayZone;

	constructor() {}

	keys() {
		return keys<typeof this>().filter((key) => typeof this[key] !== "function");
	}

	compareTo(otherVac: Holiday) {
		return (
			this.start_date == otherVac.start_date &&
			this.end_date == otherVac.end_date &&
			this.annee_scolaire == otherVac.annee_scolaire &&
			this.zones == otherVac.zones
		);
	}

	static from(vac: Object): Holiday {
		const instance = new Holiday();
		Object.assign(instance, vac);
		return instance;
	}
}

export class SpecialHoliday extends Holiday {
	start_delay?: number;
	end_delay?: number;
}

export interface HolidayDataSheet {
	datasetid: string;
	recordid: string;
	fields: Holiday;
	record_timestamp: Date;
}

export function dateFormatter(date: Date) {
	return date.toLocaleString("fr-FR", { dateStyle: "short", timeZone: "Europe/Paris" });
}
