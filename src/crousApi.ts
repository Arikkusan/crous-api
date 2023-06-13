import { Residence, Restaurant, Actualites } from "crous-api-types";
import axios from "axios";
import { crousWebServiceAxios } from "./utils/AxiosCustom.js";
import { xml2json } from "xml-js";
import { Dataset } from "./utils/Dataset.js";
import { isCrousName } from "crous-api-types";
import { CrousBuilder } from "./classes/Crous.js";
import { transformCrousName, trimLowSnakeEscape } from "./utils/Utils.js";

import HolidaysManager from "./utils/HolidaysManager.js";
import publicHolydaysManager from "./utils/publicHolydayManager.js";
import { CronJob } from "cron";

class CrousAPI {
	static isLoaded: boolean = false;
	private static liensDatasets: string[] = [
		"https://www.data.gouv.fr/api/2/datasets/5548d35cc751df0767a7b26c/resources/?page=1&type=main&page_size=-1", //Actualites
		"https://www.data.gouv.fr/api/2/datasets/5548d994c751df32e0a7b26c/resources/?page=1&type=main&page_size=-1", //Résidences
	];

	static cache: CrousAPI | null = null;

	private listeCrous: Map<string, CrousBuilder> = new Map<string, CrousBuilder>();
	public holidaysManager: HolidaysManager = new HolidaysManager();
	public publicHolydaysManager: publicHolydaysManager = new publicHolydaysManager();

	constructor() {
		if (CrousAPI.cache === null) {
			CrousAPI.cache = this;
			CrousAPI.setupApi();
		} else {
			return CrousAPI.cache;
		}
	}

	private static setupApi() {
		const api = this.cache ?? new this();
		api.holidaysManager.updateCache().then(() => {
			api.holidaysManager.loadCustomVacances();
			api.publicHolydaysManager.updateCache().then(() => {
				for (const crous of api.listeCrous.values()) {
					crous.actualites.removeAll();
					crous.residences.removeAll();
					crous.restaurants.removeAll();
				}
				api.initialisationAPI();
			});
		});
	}

	public static getInstance(): CrousAPI {
		return new CrousAPI();
	}

	private async initialisationAPI() {
		let promises: Promise<void>[] = [];
		const timerName = `${Date.now()} - Récupération datasets`;
		console.time(timerName);
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

						const crous = this.listeCrous.get(idCrous);

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
						if (crous?.residences.matchXmlFormat(parsedResult)) {
							crous.residences.addFromXml(parsedResult);
						} else if (crous?.actualites.matchXmlFormat(parsedResult)) {
							crous.actualites.addFromXml(parsedResult);
						}
					}
				}
				resolve();
			});
			promises.push(promise);
			//#endregion
		}
		await Promise.all(promises);
		promises = [];
		await this.fetchRestaurants();
		console.timeEnd(timerName);
		CrousAPI.isLoaded = true;
	}

	public async fetchRestaurants() {
		const minifiedJsonEndpoint = (crousName: string) => `/externe/crous-${crousName}.min.json`;
		const data: string = await crousWebServiceAxios.get("").then((res) => res.data);
		const crousShortNames: string[] = [];
		for (const match of data.matchAll(/(?<=href=").+?(?=\/">)/g)) {
			const possibleCrousName = match[0];
			if (isCrousName(possibleCrousName)) crousShortNames.push(possibleCrousName);
		}
		for await (const crousShortName of crousShortNames) {
			const crous = this.listeCrous.get(crousShortName);
			const minifiedJsonUrl = `${crousShortName}/${minifiedJsonEndpoint(crousShortName)}`.replace(/(?<!http:)\/{2,}/g, "/");
			const res = await crousWebServiceAxios.get(minifiedJsonUrl);
			if (!res || !res?.data) continue;
			typeof res.data == "string" && (res.data = JSON.parse(res.data.replace(/	/g, "")));
			if (!res.data) continue;
			const { restaurants } = res.data;
			crous?.restaurants?.addSome(restaurants);
		}
	}

	getCrous(id: string): CrousBuilder | undefined {
		return this.listeCrous.get(id);
	}

	getCrousList(): CrousBuilder[] {
		return Array.from(this.listeCrous.values());
	}

	getRestaurant(id: string): Promise<Restaurant | undefined> {
		let promises = [];
		for (const crous of this.listeCrous.values()) {
			let restaurantPromise = crous.restaurants.get(id);
			promises.push(restaurantPromise);
		}
		return Promise.any(promises).then((restaurant) => {
			return restaurant;
		});
	}

	getResidence(id: string): Promise<Residence | undefined> {
		let promises = [];
		for (const crous of this.listeCrous.values()) {
			let residencePromise = crous.residences.get(id);
			promises.push(residencePromise);
		}
		return Promise.any(promises).then((residence) => {
			return residence;
		});
	}

	getActualites(id: string): Promise<Actualites | undefined> {
		let promises = [];
		for (const crous of this.listeCrous.values()) {
			let actualitePromise = crous.actualites.get(id);
			promises.push(actualitePromise);
		}
		return Promise.any(promises).then((actualite) => {
			return actualite;
		});
	}

	updateCronJob = new CronJob("0 0 0 * * *", () => CrousAPI.setupApi(), null, true, "Europe/Paris");
}

export default CrousAPI;
