import he from "he";
import { keys } from "ts-transformer-keys";
import { DonneesCrous } from "./DonneesCrous";
import { Menu } from "./Menu";
import { Opening } from "./Opening";
import { Position } from "./Position";
import { CrousXmlResponse, XmlRestaurantResponse } from "./XmlResponses";

export class Restaurant extends DonneesCrous {
	nom: String;
	short_desc: String;
	opening: Opening[];
	position: Position;
	type: String;
	contact?: String;
	horaires?: String;
	moyen_acces?: String;
	pratique?: String | Array<String>;
	paiements?: String[];
	menus: Menu[] = [];

	constructor(object: XmlRestaurant) {
		super(object._attributes.id);
		this.nom = object._attributes.title;
		this.short_desc = object._attributes.short_desc;
		this.opening = object._attributes.opening.split(",").map((opening) => new Opening(opening));
		this.position = new Position(parseInt(object._attributes.lat), parseInt(object._attributes.lon), object._attributes.zone);
		this.type = object._attributes.type;
		this.parse_cdata(object.infos._cdata);
	}

	addMenu(menu: Menu) {
		this.menus.push(menu);
	}

	getTodayMenu(): Menu | undefined {
		return this.menus.find((menu) => menu.isToday());
	}

	keys() {
		return keys<typeof this>().filter((k) => typeof this[k as keyof typeof this] !== "function");
	}

	parse_cdata(_cdata: string): this {
		let tempResto: { [key: string]: string } = {};
		for (let arr of _cdata.replace(/<img.*?>/gi, "").split("<h2>")) {
			arr = arr.replace("</p>", "");
			let [key, value] = arr.split("</h2><p>");
			if (value) {
				let tempValue = value;
				while (tempValue.includes("&#")) {
					tempValue = he.decode(tempValue as string);
				}
				tempValue = tempValue
					.replace(/(<br\/>|\n)+/gi, "\n")
					.match(/(?! ).+(?=\n)/gim)?.join("\n") ?? "";
				tempResto[key.toLowerCase()] = tempValue;
			}
		}
		try {
			this.position.localisation = tempResto.localisation;
			this.horaires = tempResto.horaires;
			this.pratique = tempResto.pratique?.split("\n");
			this.paiements = tempResto["paiements possibles"].split("\n") ?? [];
			this.moyen_acces = tempResto["moyen d'accès"];
		} catch (e) {}
		return this;
	}
	toJson() {
		const jsonifiedThis = super.toJson();
		jsonifiedThis.menus = this.menus.map((menu) => menu.toJson());
		return jsonifiedThis;
	}
}

export interface XmlRestaurant {
	_attributes: {
		id: string;
		title: string;
		opening: string;
		position: string;
		short_desc: string;
		lat: string;
		lon: string;
		zone: string;
		zone2: string;
		type: string;
	};
	infos: {
		_cdata: string;
	};
}

export function isXmlRestaurant(object: CrousXmlResponse): object is XmlRestaurantResponse {
	const castedObject = object as XmlRestaurantResponse;
	return "resto" in object.root && Array.isArray(castedObject.root?.resto) && !!castedObject.root.resto[0].infos;
}

export function parseRestaurantsFromXml(object: XmlRestaurantResponse): Restaurant[] {
	return object.root.resto!.map((resto) => new Restaurant(resto));
}
