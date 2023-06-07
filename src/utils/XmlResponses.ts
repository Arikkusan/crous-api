export interface CrousXmlResponse {
	_declaration: {
		_attributes: {
			version: string;
			encoding: string;
		};
	};
	root: {};
}

export interface XmlResidenceResponse extends CrousXmlResponse {
	root:{
		residence?: XmlResidence[];
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

export interface XmlActualitesResponse extends CrousXmlResponse {
	root:{
		article?: XmlActualites[];
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
