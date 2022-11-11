import { Menu } from "crous-api-types";

export class MenuBuilder extends Menu {
	constructor(restaurantId: string, date: string, menu: RepasJson) {
		super(restaurantId);
		this.date = date;
		this.horaire = menu.name;
		this.plats = new Map();
		for (const foodCategory of menu.foodcategory) {
			this.plats.set(
				foodCategory.name,
				foodCategory.dishes.map((dish) => dish.name)
			);
		}
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
