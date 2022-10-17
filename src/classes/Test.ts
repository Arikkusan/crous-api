import { keys } from "ts-transformer-keys";
import { DonneesCrous } from "./DonneesCrous";

export class Test extends DonneesCrous {
	parse_cdata(_cdata: string): void {
		throw new Error("Method not implemented.");
	}
	keys() {
		return keys<typeof this>().filter((k) => typeof this[k as keyof typeof this] !== "function");
	}
	static datasetType = "test";
	nom: String;

	constructor(id: String) {
		super(id);
		this.nom = "";
	}

	toJson() {
		return {
			id: this.id,
			nom: this.nom,
		};
	}
}
