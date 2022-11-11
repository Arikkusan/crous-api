import { Crous } from "crous-api-types";

export class CrousBuilder extends Crous {
	constructor(id: string, nom: string) {
		super();
		this.id = id;
		this.nom = nom;
	}
}
