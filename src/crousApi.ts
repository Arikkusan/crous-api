import { RestaurantBuilder, RestaurantJson } from "./classes/Restaurant";
import { Residence, Restaurant, Actualites } from "crous-api-types";
import axios from "axios";
import { xml2json } from "xml-js";
import { Dataset } from "./classes/Dataset";
import { isXmlActualites, parseActualitesFromXml } from "./classes/Actualites";
import { isXmlResidence, parseResidencesFromXml } from "./classes/Residence";
import { isValidCrousName, CROUS_NAME, Crous } from "crous-api-types";
import { CrousBuilder } from "./classes/Crous";

function snake(str: string) {
	return (escape(str).match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g) ?? [])
		.map((x: string) => x.toLowerCase())
		.join("_");
}

function escape(str: string) {
	var accents = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž'";
	var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz ";
	let s = str.split("");
	let strLen = s.length;
	let i, x;
	for (i = 0; i < strLen; i++) {
		if (str[i] !== "'") {
			if ((x = accents.indexOf(str[i])) != -1) {
				s[i] = accentsOut[x];
			}
		} else {
			s.splice(i, 1);
		}
	}
	return s.join("");
}

function trimLowSnakeEscape(text: string) {
	return snake(text.trim());
}

function transformCrousName(str: string) {
	let name = snake(str.trim()).replace(/_/g, ".");
	return name == "bourgogne.franche.comte" ? "bfc" : name;
}

var promises: Promise<void>[] = [];

class CrousAPI {
	static isLoaded: boolean = false;
	private static liensDatasets: string[] = [
		"https://www.data.gouv.fr/api/2/datasets/5548d35cc751df0767a7b26c/resources/?page=1&type=main&page_size=-1", //Actualites
		"https://www.data.gouv.fr/api/2/datasets/5548d994c751df32e0a7b26c/resources/?page=1&type=main&page_size=-1", //Résidences
	];

	static cache: CrousAPI | null = null;

	private listeCrous: Map<string, Crous> = new Map<string, Crous>();

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
						const idCrous = transformCrousName(trimLowSnakeEscape(nomCrous));

						if (!this.listeCrous.has(idCrous)) {
							this.listeCrous.set(idCrous, new CrousBuilder(idCrous, nomCrous));
						}

						let { data } = await axios({
							method: "get",
							url: dataset.url,
						});

						let parsedResult;
						try {
							parsedResult = JSON.parse(xml2json(data, { compact: true }));
						} catch (err) {
							console.error(
								(err as Error).message == "Attribute without value"
									? `Erreur lors du parsing XML de ${dataset.title} : le fichier semble être mal formé`
									: err
							);
							continue;
						}
						if (isXmlActualites(parsedResult)) {
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
		await this.fetchRestaurants();
		console.timeEnd("récupération datasets");
		CrousAPI.isLoaded = true;
	}

	public async fetchRestaurants() {
		const baseUrl = "http://webservices-v2.crous-mobile.fr/feed";
		const minifiedJsonEndpoint = (crousName: CROUS_NAME) => `/externe/crous-${crousName}.min.json`;
		const data: string = await axios({ method: "GET", url: baseUrl }).then((res) => res.data);
		let reducedCrous = data
			.replace(/<\/a>.+\n/g, "\n")
			.split("\n")
			.reduce((acc: CROUS_NAME[], str) => {
				const regResult = /<a href=(?:"|')(?<url>.+?\/)(?:"|')>/g.exec(str);
				const url = regResult?.groups?.url?.replace("/", "");
				if (!!url && isValidCrousName(url)) acc.push(url);
				return acc;
			}, []);
		for (const crousShortName of reducedCrous) {
			const minifiedJsonUrl = `${baseUrl}/${crousShortName}/${minifiedJsonEndpoint(crousShortName)}`.replace(/(?<!http:)\/{2,}/g, "/");
			// console.log(minifiedJsonUrl);
			const res = await axios({ method: "GET", url: minifiedJsonUrl });
			if (!res || !res?.data) continue;
			typeof res.data == "string" && (res.data = JSON.parse(res.data.replace(/	/g, "")));
			if (!res.data) continue;
			const { restaurants }: { restaurants: RestaurantJson[] } = res.data;
			for (const restaurant of restaurants ?? []) {
				const crous = this.listeCrous.get(crousShortName);
				if (crous) {
					crous.restaurants.push(new RestaurantBuilder(restaurant));
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

	getActualites(id: string): Actualites | undefined {
		for (const crous of this.listeCrous.values()) {
			let actualite = crous.getActualite(id);
			if (actualite) {
				return actualite;
			}
		}
		return undefined;
	}
}

export default CrousAPI;
