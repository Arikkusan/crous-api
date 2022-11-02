import moment from "moment";
import { keys } from "ts-transformer-keys";
import { CrousData } from "./DonneesCrous";

export class Menu extends CrousData {
	date = "";
	horaire = "";
	plats: Map<String, string[]> = new Map<String, string[]>();

	constructor(restaurantId: string, date: string, menu: RepasJson) {
		super(restaurantId);
		this.date = date;
		this.horaire = menu.name;
		for(const foodCategory of menu.foodcategory) {
			this.plats.set(foodCategory.name, foodCategory.dishes.map((dish) => dish.name));
		}
	}

	keys(): (keyof this)[] {
		return keys<typeof this>().filter((k) => typeof this[k as keyof typeof this] !== "function" && k !== "id");
	}

	toJSON() {
		const jsonifiedThis = super.toJSON();
		for (const key of Object.keys(jsonifiedThis)) {
			if (jsonifiedThis[key] instanceof Map) {
				jsonifiedThis[key] = Object.fromEntries(jsonifiedThis[key]);
			}
		}
		return jsonifiedThis;
	}

	isToday(): boolean {
		return moment(Date.now()).format("YYYY-MM-DD") === this.date;
	}
}

export interface MenuJson {
	date: string;
	meal: RepasJson[];
}

export interface RepasJson {
	name: string;
	foodcategory: PlatsJson[];
}

export interface PlatsJson {
	name: string;
	dishes: { name: string }[];
}
