import { Actualites } from "crous-api-types";
import { XmlActualites, XmlActualitesResponse, CrousXmlResponse } from "../utils/XmlResponses.js";
import XMLResourceManager from "./XmlResourceManager.js";

export default class ActualitesManager extends XMLResourceManager<Actualites> {
	searchByName(name: string): Promise<Actualites[]> {
		return new Promise((resolve) => {
			let matchingActualites = this.list.filter((actualites) => actualites.titre.trim().toLowerCase().includes(name.trim().toLowerCase()));
			if (matchingActualites.length > 0) {
				let perfectMatchIdx = matchingActualites.findIndex(
					(actualites) => actualites.titre.trim().toLowerCase() === name.trim().toLowerCase()
				);
				//replace perfect match at the beginning of the array
				perfectMatchIdx > -1 && matchingActualites.unshift(matchingActualites.splice(perfectMatchIdx, 1)[0]);
			}
			resolve(matchingActualites);
		});
	}

	add(item: XmlActualites): void {
		let newActualites = new Actualites(item._attributes.id);
		newActualites.titre = item._attributes.titre;
		newActualites.date = item._attributes.date;
		newActualites.category = item._attributes.category;
		newActualites.image = item._attributes.image;
		newActualites.content = item._cdata;
		newActualites.type = item._attributes.type;

		this.list = Array.from(new Set(this.list.concat([newActualites])));
	}

	addFromXml(object: XmlActualitesResponse): void {
		object.root.article?.forEach((article) => this.add(article));
	}

	matchXmlFormat(object: CrousXmlResponse): object is XmlActualitesResponse {
		const castedObject = object as XmlActualitesResponse;
		return "article" in object.root && Array.isArray(castedObject.root?.article);
	}
}
