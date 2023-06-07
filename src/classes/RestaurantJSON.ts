import { Contact } from "crous-api-types";
import { MenuJson } from "./Menu.js";

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
