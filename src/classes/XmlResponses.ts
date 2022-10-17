import { XmlActualites } from "./Actualites";
import { XmlMenuList } from "./Menu";
import { XmlResidence } from "./Residence";
import { XmlRestaurant } from "./Restaurant";

export interface CrousXmlResponse {
	_declaration: {
		_attributes: {
			version: string;
			encoding: string;
		};
	};
	root: {};
}

export interface XmlRestaurantResponse extends CrousXmlResponse {
	root:{
		resto?: XmlRestaurant[];
	}
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

export interface XmlMenuResponse extends CrousXmlResponse {
	root:{
		resto?: XmlMenuList[];
	}
}

