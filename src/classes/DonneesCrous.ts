import pick from "./Utils";

export abstract class CrousData {
	id: string;
	toJSON(): any {
		return pick(this, ...this.keys());
	}
	constructor(id: string) {
		this.id = id;
	}
	abstract keys(): Array<keyof this>;
}

export abstract class XmlBasedCrousData extends CrousData{
	abstract parse_cdata(_cdata: string): void;
}
