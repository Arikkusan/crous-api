import { Actualites, Crous, Residence, ResourceManager, Restaurant } from "crous-api-types";
import { ActualitesManager, ResidenceManager, RestaurantManager } from "../ResourceManagers/AllManagers.js";
import XMLResourceManager from "../ResourceManagers/XmlResourceManager.js";

export class CrousBuilder implements Crous {
	constructor(id: string, nom: string) {
		this.id = id;
		this.nom = nom;
		this.restaurants = new RestaurantManager();
		this.actualites = new ActualitesManager();
		this.residences = new ResidenceManager();
	}

	nom: string;
	id: string;
	restaurants: ResourceManager<Restaurant>;
	actualites: XMLResourceManager<Actualites>;
	residences: XMLResourceManager<Residence>;
}
