import { Actualites } from "./Actualites";
import { Residence } from "./Residence";
import { Restaurant } from "./Restaurant";

export class Crous {
	nom: string = "";
	id: string = "";
	restaurants: Restaurant[] = [];
	actualites: Actualites[] = [];
	residences: Residence[] = [];

	constructor(id: string, nom: string) {
		this.id = id;
		this.nom = nom;
	}

	getRestaurant(id: string): Restaurant | undefined {
		return this.restaurants.find((r) => r.id === id);
	}

	getResidence(id: string): Residence | undefined {
		return this.residences.find((r) => r.id === id);
	}

	getActualite(id: string): Actualites | undefined {
		return this.actualites.find((r) => r.id === id);
	}
}
