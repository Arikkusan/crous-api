import { XmlActualites } from "./Actualites";
import { XmlResidence } from "./Residence";

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

export interface XmlActualitesResponse extends CrousXmlResponse {
	root:{
		article?: XmlActualites[];
	}
}

