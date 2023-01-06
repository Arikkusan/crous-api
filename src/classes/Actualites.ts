import { CrousXmlResponse, XmlActualitesResponse } from "./XmlResponses";
import { Actualites } from "crous-api-types";

export class ActualitesBuilder extends Actualites {
	constructor(xmlActualites: XmlActualites) {
		super(xmlActualites._attributes.id);
		this.titre = xmlActualites._attributes.titre;
		this.date = xmlActualites._attributes.date;
		this.category = xmlActualites._attributes.category;
		this.image = xmlActualites._attributes.image;
		this.content = xmlActualites._cdata;
		this.type = xmlActualites._attributes.type;
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
	return object.root.article!.map((article) => new ActualitesBuilder(article));
}
