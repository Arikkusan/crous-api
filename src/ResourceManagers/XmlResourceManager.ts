import { CrousData, ResourceManager } from "crous-api-types";

export default abstract class XMLResourceManager<T extends CrousData> extends ResourceManager<T> {
	abstract matchXmlFormat(xml: any): boolean;
	abstract addFromXml(xml: any): void;
}
