import { Menu, Restaurant } from "crous-api-types";

export class RestaurantBuilder extends Restaurant {
	constructor(id: string) {
		super(id);
	}

	getTodayMenu(): Menu | undefined {
		return this.menus?.find((menu) => menu.isToday());
	}

	toJSON() {
		const jsonifiedThis = super.toJSON();
		jsonifiedThis.menus = this.menus?.map((menu) => menu.toJSON()) ?? [];
		return jsonifiedThis;
	}
}
