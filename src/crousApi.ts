import { CrousData, isCrousName } from "crous-api-types";
import axios from "axios";
import { crousWebServiceAxios } from "./utils/AxiosCustom.js";
import { xml2json } from "xml-js";
import { Dataset } from "./utils/Dataset.js";
import { CrousBuilder } from "./classes/Crous.js";
import { byEnum, transformCrousName, trimLowSnakeEscape } from "./utils/Utils.js";

import HolidaysManager from "./utils/HolidaysManager.js";
import publicHolydaysManager from "./utils/publicHolydayManager.js";
import { CronJob } from "cron";

import { CustomResourceManager } from "./ResourceManagers/AllManagers.js";

class CrousAPI {
	static isLoaded: boolean = false;
	private static liensDatasets: string[] = [
		"https://www.data.gouv.fr/api/2/datasets/5548d35cc751df0767a7b26c/resources/?page=1&type=main&page_size=-1", //Actualites
		"https://www.data.gouv.fr/api/2/datasets/5548d994c751df32e0a7b26c/resources/?page=1&type=main&page_size=-1", //Résidences
	];

	private static cache?: CrousAPI;

	private listeCrous: Map<string, CrousBuilder> = new Map<string, CrousBuilder>();
	public holidaysManager: HolidaysManager = new HolidaysManager();
	public publicHolydaysManager: publicHolydaysManager = new publicHolydaysManager();

	constructor() {
		CrousAPI.cache ||= this;
		this.setupApi();
	}

	private setupApi() {
		this.holidaysManager.updateCache().then(() => {
			this.holidaysManager.loadCustomVacances();
			this.publicHolydaysManager.updateCache().then(() => {
				for (const crous of this.listeCrous.values()) {
					crous.actualites.removeAll();
					crous.residences.removeAll();
					crous.restaurants.removeAll();
				}
				global.gc && global.gc(); //use garbage collector
				this.initialisationAPI();
			});
		});
	}

	public static getInstance(): CrousAPI {
		return CrousAPI.cache ?? new CrousAPI();
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
					if (result?.groups) {
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

	listResource(resourceType: string): CrousData[] {
		return this.getCrousList().flatMap<CrousData>((c) => {
			let resourceManager = c[resourceType as keyof CrousBuilder] as CustomResourceManager;
			return resourceManager.list;
		});
	}

	async getResource(resourceType: string, id: string): Promise<CrousData | undefined> {
		return this.listResource(resourceType).find((r) => r.id === id);
	}

	searchResourceByName(resourceType: string, by: byEnum, searchParams: string): Promise<CrousData[] | undefined> {
		let promises = [];
		for (const crous of this.getCrousList()) {
			const resourcePromise = new Promise<CrousData[]>(async (resolve) => {
				const resourceManager = crous[resourceType as keyof CrousBuilder] as CustomResourceManager;
				let result;
				switch (by) {
					case byEnum.name:
						result = await resourceManager.searchByName(searchParams);
						resolve(result);
						break;
					case byEnum.id:
						result = await resourceManager.searchById(searchParams);
						resolve(result);
						break;
					default:
						resolve([]);
				}
				return;
			});

			promises.push(resourcePromise);
		}
		return Promise.all(promises).then((promises) => {
			return promises.flat();
		});
	}

	updateCronJob = new CronJob("0 0 0 * * *", () => CrousAPI.getInstance().setupApi(), null, true, "Europe/Paris");
}

export default CrousAPI;
