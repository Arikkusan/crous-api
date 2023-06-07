import { CustomHolidays } from "crous-api-types";
import { HolidayZone } from "crous-api-types/types/HolidayZones";
import { ActualEvent } from "./ActualEvent.js";

interface CustomHoliday {
	zones: HolidayZone;
	start_delay?: number;
	end_delay?: number;
	description: string;
}

export type CustomHolidaysType = { [key in CustomHolidays]?: (CustomHoliday & ActualEvent)[] };

export const CustomHolidaysList: CustomHolidaysType = {
	"Le Mans Université": [
		{
			description: "Vacances de la Toussaint",
			start_delay: 7,
			zones: "Zone A",
		},
	],
};
