import moment from "moment";
import { keys } from "ts-transformer-keys";
import { DonneesCrous } from "./DonneesCrous";
import { CrousXmlResponse, XmlMenuResponse } from "./XmlResponses";

export class Menu extends DonneesCrous {
	date = "";
	horaire = "";
	plats: Map<String, string[]> = new Map<String, string[]>();

	constructor(restaurantId: string, menu: XmlMenu) {
		super(restaurantId);
		this.date = menu._attributes.date;
		this.parse_cdata(menu._cdata);
	}

	keys(): (keyof this)[] {
		return keys<typeof this>().filter((k) => typeof this[k as keyof typeof this] !== "function" && k !== "id");
	}

	toJson() {
		const jsonifiedThis = super.toJson();
		for(const key of Object.keys(jsonifiedThis)) {
			if(jsonifiedThis[key] instanceof Map) {
				jsonifiedThis[key] = Object.fromEntries(jsonifiedThis[key]);
			}
		}
		return jsonifiedThis;
	}

	parse_cdata(_cdata: string): void {
		for (const serviceData of _cdata.match(/<h2>.*?<\/h2><h4>.*?<\/h4>.*?(?=<h4>|<h2>|$)(?=<h2>|$)/g) || []) {
			let [, service] = serviceData?.match(/(?:<h2>)(.*?)(?:<\/h2>)/) ?? [];
			this.horaire = service;
			this.plats = new Map<String, string[]>();

			let differentFoodTypesArray = serviceData?.match(/<h4>(?<typePlat>.*?)<\/h4>(?<data>.*?)(?=<h4>|$)/g) ?? [];

			for (const foodList of differentFoodTypesArray) {
				let [, foodCategory] = foodList?.match(/(?:<h4>)(.*?)(?:<\/h4>)/) ?? [];
				let food = foodList
					.replace(/<\/?ul.*?>|<h4>.*?<\/h4>/g, "")
					.split(/<\/li>|<li>/g)
					.filter(String);
				this.plats.set(foodCategory, food);
			}
			return;
		}
	}

	isToday(): boolean {
		return moment(Date.now()).format("YYYY-MM-DD") === this.date;
	}
}

export interface XmlMenu {
	_attributes: {
		date: string;
	};
	_cdata: string;
}

export interface XmlMenuList {
	_attributes: {
		id: string;
	};
	menu?: XmlMenu[] | XmlMenu;
}

export function isXmlMenu(object: CrousXmlResponse): object is XmlMenuResponse {
	const castedObject = object as XmlMenuResponse;
	return "resto" in object.root && Array.isArray(castedObject.root?.resto) && !!castedObject.root.resto.some(x => !!x.menu);
}

export function parseMenusFromXml(object: XmlMenuResponse): Menu[] {
	return object.root.resto!.reduce((menus: Menu[], resto: XmlMenuList) => {
		resto?.menu && menus.push(...[resto.menu].flat().map((menu) => new Menu(resto._attributes.id, menu as XmlMenu)));

		return menus;
	}, [] as Menu[]);
}

export function replacer(key: string | number, value: any) {
	if (value instanceof Map) {
		// let obj = map_to_object(value);
		// return obj;
		return Array.from(value.entries()); // or with spread: value: [...value]
	} else {
		return value;
	}
}