import { CrousXmlResponse, XmlResidenceResponse } from "./XmlResponses";
import { Residence, Position } from "crous-api-types";

export class ResidenceBuilder extends Residence {
	constructor(xmlResidence: XmlResidence) {
		super(xmlResidence._attributes.id);

		this.name = xmlResidence._attributes.title;
		this.short_desc = xmlResidence._attributes.short_desc;
		this.position = new Position(
			xmlResidence._attributes.lat,
			xmlResidence._attributes.lon,
			xmlResidence._attributes.zone,
			xmlResidence.address?._text
		);
		this.services =
			xmlResidence.services?._text?.match(/(?=\/>).+?(?<=<\/)/gim)?.map((service) => service?.replace(/\/>|<\//gim, "")?.trim()) ?? [];
		this.infos = xmlResidence.infos?._text ?? "";
		this.contact = xmlResidence.contact?._text ?? "";
		this.mail = xmlResidence.mail?._text ?? "";
		this.phone = xmlResidence.phone?._text ?? "";
		this.websiteUrl = xmlResidence.internetUrl?._text ?? "";
		this.appointmentUrl = xmlResidence.appointmentUrl?._text ?? "";
		this.virtualVisitUrl = xmlResidence.virtualVisitUrl?._text ?? "";
		this.bookingUrl = xmlResidence.bookingUrl?._text ?? "";
		this.troubleshootingUrl = xmlResidence.troubleshootingUrl?._text ?? "";
	}
}

export interface XmlResidence {
	_attributes: {
		id: string;
		title: string;
		short_desc: string;
		lat: number;
		lon: number;
		zone: string;
	};
	infos: {
		_text: string;
	};
	services: {
		_text: string;
	};
	contact: {
		_text: string;
	};
	address: {
		_text: string;
	};
	mail: {
		_text: string;
	};
	phone: {
		_text: string;
	};
	openingHours: {};
	internetUrl: {
		_text: string;
	};
	appointmentUrl: {
		_text: string;
	};
	virtualVisitUrl: {
		_text: string;
	};
	bookingUrl: {
		_text: string;
	};
	troubleshootingUrl: {
		_text: string;
	};
}

export function isXmlResidence(object: CrousXmlResponse): object is XmlResidenceResponse {
	return "residence" in object.root;
}

export function parseResidencesFromXml(object: XmlResidenceResponse): Residence[] {
	return object.root.residence!.map((residence) => new ResidenceBuilder(residence));
}
