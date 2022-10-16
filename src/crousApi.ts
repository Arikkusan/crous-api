import { isXmlRestaurant, parseRestaurantsFromXml, Restaurant } from "./classes/Restaurant";
import { isXmlMenu, Menu, parseMenusFromXml } from "./classes/Menu";
import axios from "axios";
import { xml2json } from "xml-js";
import { Dataset } from "./classes/Dataset";
import { isXmlActualites, parseActualitesFromXml } from "./classes/Actualites";
import { isXmlResidence, parseResidencesFromXml, Residence } from "./classes/Residence";
import { Crous } from "./classes/Crous";
import { CronJob } from "cron";

String.prototype.snake = function (this: string) {
	return (this.escape().match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g) ?? [])
		.map((x: String) => x.toLowerCase())
		.join("_");
};

String.prototype.escape = function (this: string) {
	var accents = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž'";
	var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz ";
	let s = this.split("");
	let strLen = s.length;
	let i, x;
	for (i = 0; i < strLen; i++) {
		if (this[i] !== "'") {
			if ((x = accents.indexOf(this[i])) != -1) {
				s[i] = accentsOut[x];
			}
		} else {
			s.splice(i, 1);
		}
	}
	return s.join("");
};

function trimLowSnakeEscape(text: string) {
	return text.trim().toLowerCase().snake().escape();
}

var promises: Promise<any>[] = [];

class CrousAPI {
	static isLoaded: boolean = false;
	private static liensDatasets: string[] = [
		"https://www.data.gouv.fr/api/2/datasets/5548d35cc751df0767a7b26c/resources/?page=1&type=main&page_size=-1", //Actualites
		"https://www.data.gouv.fr/api/2/datasets/5548d994c751df32e0a7b26c/resources/?page=1&type=main&page_size=-1", //Résidences
		"https://www.data.gouv.fr/api/2/datasets/55f28fe088ee386774a46ec2/resources/?page=1&type=main&page_size=-1", //Restaurants
	];

	static cache: CrousAPI | null = null;

	private listeCrous: Map<String, Crous> = new Map<String, Crous>();

	public static getInstance(): CrousAPI {
		return new CrousAPI();
	}

	private async initialisationAPI() {
		promises = [];
		console.time("récupération datasets");
		for (const lien of CrousAPI.liensDatasets) {
			let promise = new Promise<void>(async (resolve) => {
				let { data } = await axios({
					method: "get",
					url: lien,
					transformResponse: [(data: string) => JSON.parse(data)?.data],
				});

				//#region Récupération des données
				for await (const dataset of data as Dataset[]) {
					let result = /^(?<type>.+?)(?=(?: du)? CROUS)(?:.+)(?<=CROUS (?:de |du |d'| )?)(?<crous>.+)/gim.exec(dataset.title);
					if (result && result.groups) {
						const nomCrous = result.groups.crous;
						const idCrous = trimLowSnakeEscape(nomCrous);

						if (!this.listeCrous.has(idCrous)) {
							this.listeCrous.set(idCrous, new Crous(idCrous, nomCrous));
						}

						let { data } = await axios({
							method: "get",
							url: dataset.url,
						});

						let parsedResult = JSON.parse(xml2json(data, { compact: true }));
						if (isXmlRestaurant(parsedResult)) {
							let restaurants = parseRestaurantsFromXml(parsedResult);
							this.listeCrous.get(idCrous)?.restaurants.push(...restaurants);
						} else if (isXmlActualites(parsedResult)) {
							let actualites = parseActualitesFromXml(parsedResult);
							this.listeCrous.get(idCrous)?.actualites.push(...actualites);
						} else if (isXmlResidence(parsedResult)) {
							let residences = parseResidencesFromXml(parsedResult);
							this.listeCrous.get(idCrous)?.residences.push(...residences);
						}
					}
				}
				resolve();
			});
			promises.push(promise);
			//#endregion
		}
		await Promise.all(promises);
		await this.recuperationMenus();
		console.timeEnd("récupération datasets");
		CrousAPI.isLoaded = true;
	}

	public async recuperationMenus() {
		const lienDataset = "https://www.data.gouv.fr/api/2/datasets/55f27f8988ee383ebda46ec1/resources/?page=1&type=main&page_size=-1";
		let { data } = await axios({
			method: "get",
			url: lienDataset,
			transformResponse: [(data: string) => JSON.parse(data)?.data],
		});
		for (const dataset of data as Dataset[]) {
			let result = /^(?<type>.+?)(?=(?: du)? CROUS)(?:.+)(?<=CROUS (?:de |du |d'| )?)(?<crous>.+)/gim.exec(dataset.title);
			if (result && result.groups) {
				const nomCrous = result.groups.crous;
				const idCrous = trimLowSnakeEscape(nomCrous);

				if (!this.listeCrous.has(idCrous)) {
					this.listeCrous.set(idCrous, new Crous(idCrous, nomCrous));
				}

				let { data } = await axios({
					method: "get",
					url: dataset.url,
				});

				let parsedResult = JSON.parse(xml2json(data, { compact: true }));
				if (isXmlMenu(parsedResult)) {
					let listsOfMenus = parseMenusFromXml(parsedResult).reduce((acc: { id: string; menus: Menu[] }[], menu: Menu) => {
						const index = acc.findIndex((a) => a.id === menu.id);
						if (index === -1) {
							acc.push({ id: menu.id.toString(), menus: [menu] });
						} else {
							acc[index].menus.push(menu);
						}
						return acc;
					}, []);
					for await (const listOfMenu of listsOfMenus) {
						let restaurant = this.listeCrous.get(idCrous)?.restaurants.find((r) => r.id === listOfMenu.id);
						!!restaurant && (restaurant.menus = listOfMenu.menus);
					}
				} else {
					continue;
				}
			}
		}
	}

	constructor() {
		if (CrousAPI.cache === null) {
			CrousAPI.cache = this;
			this.initialisationAPI();
		} else {
			return CrousAPI.cache;
		}
	}

	getCrous(id: string): Crous | undefined {
		return this.listeCrous.get(id);
	}

	getCrousList(): Crous[] {
		return Array.from(this.listeCrous.values());
	}

	getRestaurant(id: string): Restaurant | undefined {
		for (const crous of this.listeCrous.values()) {
			let restaurant = crous.getRestaurant(id);
			if (restaurant) {
				return restaurant;
			}
		}
		return undefined;
	}

	getResidence(id: string): Residence | undefined {
		for (const crous of this.listeCrous.values()) {
			let residence = crous.getResidence(id);
			if (residence) {
				return residence;
			}
		}
		return undefined;
	}
}

export default CrousAPI;

new CronJob(
	"59 */30 * * * *",
	() => {
		CrousAPI.getInstance().recuperationMenus();
	},
	null,
	true,
	"Europe/Paris"
);
