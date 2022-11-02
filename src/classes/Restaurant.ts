import he from "he";
import { keys } from "ts-transformer-keys";
import { CrousData } from "./DonneesCrous";
import { Menu, MenuJson } from "./Menu";
import { Opening } from "./Opening";
import { Position } from "./Position";

export class Restaurant extends CrousData {
	nom: String;
	short_desc: String;
	opening: Opening[];
	position: Position;
	type: String;
	contact?: Contact;
	horaires?: String;
	moyen_acces?: String;
	paiements?: String[];
	menus: Menu[] = [];

	constructor(object: RestaurantJson) {
		super(object.id.toString());
		this.nom = object.title;
		this.short_desc = object.shortdesc;
		this.opening = object.opening.split(",").map((o) => new Opening(o));
		this.position = new Position(object.lat, object.lon, object.area, object.description);
		this.type = object.type;
		this.moyen_acces = object.access;
		this.contact = object.contact;
		this.horaires = object.operationalhours;
		this.paiements = object.payment.map((p) => p.name);
		let myId = this.id;
		this.menus = object.menus.map((menuList) => menuList.meal.map((repas) => new Menu(myId, menuList.date, repas))).flat();
	}

	getTodayMenu(): Menu | undefined {
		return this.menus.find((menu) => menu.isToday());
	}

	keys() {
		return keys<typeof this>().filter((k) => typeof this[k as keyof typeof this] !== "function");
	}

	toJSON() {
		const jsonifiedThis = super.toJSON();
		jsonifiedThis.menus = this.menus.map((menu) => menu.toJSON());
		return jsonifiedThis;
	}

	parse_cdata(_cdata: string): void {
		throw new Error("Method not implemented.");
	}
}

export interface RestaurantJson {
	id: number;
	title: string;
	lat: number;
	lon: number;
	area: string;
	opening: string;
	closing: string;
	type: string;
	accessibility: boolean;
	wifi: boolean;
	shortdesc: string;
	description: string;
	access: string;
	operationalhours: string;
	contact: Contact;
	photo: {
		src: string;
	};
	payment: { name: string }[];
	menus: MenuJson[];
}

interface Contact {
	tel: string;
	email: string;
}
