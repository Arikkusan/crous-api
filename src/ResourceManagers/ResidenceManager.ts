import { Residence, Position } from "crous-api-types";
import { CrousXmlResponse, XmlResidence, XmlResidenceResponse } from "../utils/XmlResponses.js";
import XMLResourceManager from "./XmlResourceManager.js";

export default class ResidenceManager extends XMLResourceManager<Residence> {
	searchByName(name: string): Promise<Residence[]> {
		return new Promise((resolve) => {
			let matchingResidence = this.list.filter((residence) => residence.name.trim().toLowerCase().includes(name.trim().toLowerCase()));
			if (matchingResidence.length > 0) {
				let perfectMatchIdx = matchingResidence.findIndex(
					(residence) => residence.name.trim().toLowerCase() === name.trim().toLowerCase()
				);
				//replace perfect match at the beginning of the array
				perfectMatchIdx > -1 && matchingResidence.unshift(matchingResidence.splice(perfectMatchIdx, 1)[0]);
			}
			resolve(matchingResidence);
		});
	}
	matchXmlFormat(object: CrousXmlResponse): object is XmlResidenceResponse {
		return "residence" in object.root;
	}

	addFromXml(object: XmlResidenceResponse): void {
		object.root.residence!.forEach((residence) => this.add(residence));
	}

	add(item: XmlResidence): void {
		let newResidence = new Residence(item._attributes.id);
		newResidence.name = item._attributes.title;
		newResidence.short_desc = item._attributes.short_desc;
		newResidence.position = new Position(item._attributes.lat, item._attributes.lon, item._attributes.zone, item.address?._text);
		newResidence.services =
			item.services?._text?.match(/(?=\/>).+?(?<=<\/)/gim)?.map((service) => service?.replace(/\/>|<\//gim, "")?.trim()) ?? [];
		newResidence.infos = item.infos?._text ?? "";
		newResidence.contact = item.contact?._text ?? "";
		newResidence.mail = item.mail?._text ?? "";
		newResidence.phone = item.phone?._text ?? "";
		newResidence.websiteUrl = item.internetUrl?._text ?? "";
		newResidence.appointmentUrl = item.appointmentUrl?._text ?? "";
		newResidence.virtualVisitUrl = item.virtualVisitUrl?._text ?? "";
		newResidence.bookingUrl = item.bookingUrl?._text ?? "";
		newResidence.troubleshootingUrl = item.troubleshootingUrl?._text ?? "";

		this.list = Array.from(new Set(this.list.concat([newResidence])));
	}
}
