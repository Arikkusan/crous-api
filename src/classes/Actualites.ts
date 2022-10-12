import { keys } from "ts-transformer-keys";
import { DonneesCrous } from "./DonneesCrous";
import { CrousXmlResponse, XmlActualitesResponse } from "./XmlResponses";

export class Actualites extends DonneesCrous {
	titre: String;
	date: String;
	category: String;
	image: String;
	content: String;
	type: string;
	constructor(xmlActualites: XmlActualites) {
		super(xmlActualites._attributes.id);
		this.titre = xmlActualites._attributes.titre;
		this.date = xmlActualites._attributes.date;
		this.category = xmlActualites._attributes.category;
		this.image = xmlActualites._attributes.image;
		this.content = xmlActualites._cdata;
		this.type = xmlActualites._attributes.type;
	}

	keys() {
		return keys<typeof this>().filter((k) => typeof this[k as keyof typeof this] !== "function");
	}
	parse_cdata(_cdata: string): void {
		throw new Error("Method not implemented.");
	}
}

export interface XmlActualites {
	_attributes: {
		id: string;
		titre: string;
		date: string;
		category: string;
		image: string;
		type: string;
	};
	_cdata: string;
}

export function isXmlActualites(object: CrousXmlResponse): object is XmlActualitesResponse {
	const castedObject = object as XmlActualitesResponse;
	return "article" in object.root && Array.isArray(castedObject.root?.article);
}

export function parseActualitesFromXml(object: XmlActualitesResponse): Actualites[] {
	return object.root.article!.map((article) => new Actualites(article));
}
