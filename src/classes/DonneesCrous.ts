import pick from "./Utils";

export abstract class DonneesCrous {
	id: String;
	toJson(): any {
		return pick(this, ...this.keys());
	}
	constructor(id: String) {
		this.id = id;
	}
	abstract keys(): Array<keyof this>;
	abstract parse_cdata(_cdata: string): void;
}
