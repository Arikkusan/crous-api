import { Residence, Position, Crous } from "crous-api-types";
import { CrousXmlResponse, XmlResidence, XmlResidenceResponse } from "../utils/XmlResponses.js";
import XMLResourceManager from "./XmlResourceManager.js";

export default class ResidenceManager extends XMLResourceManager<Residence> {
	searchByName(name: string): Promise<Residence[]> {
		throw new Error("Method not implemented.");
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
