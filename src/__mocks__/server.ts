import { rest } from "msw";
import { setupServer } from "msw/node";
import { readFileSync, writeFileSync } from "fs";

const mockFolderPath = "./mockData";

const holidaysJSON = JSON.parse(readFileSync(`${mockFolderPath}/holidays-2023.json`, "utf8"));
const publicHolidaysJSON = JSON.parse(readFileSync(`${mockFolderPath}/publicHolidays-2023.json`, "utf8"));
const datasetActus = JSON.parse(readFileSync(`${mockFolderPath}/datasetActus.json`, "utf8"));
const datasetLogements = JSON.parse(readFileSync(`${mockFolderPath}/datasetLogements.json`, "utf8"));

// handlers are usually saved in separate file(s) in one  destined place of the app,
// so that you don't have to search for them when the endpoints have changed
const handlers = [
	rest.get("https://data.education.gouv.fr/api/records/1.0/search/", (req, res, ctx) => res(ctx.json(holidaysJSON))),
	rest.get(/https\:\/\/calendrier\.api\.gouv\.fr\/jours-feries\/metropole\/\d{4}/, (req, res, ctx) => res(ctx.json(publicHolidaysJSON))),
	rest.get("https://www.data.gouv.fr/api/2/datasets/5548d35cc751df0767a7b26c/resources/", (req, res, ctx) => res(ctx.json(datasetActus))),
	rest.get("https://www.data.gouv.fr/api/2/datasets/5548d994c751df32e0a7b26c/resources/", (req, res, ctx) => res(ctx.json(datasetLogements))),
	rest.get(
		/http:\/\/webservices-v2\.crous-mobile\.fr(?::8080)?\/feed\/(?<crousName>.+?)\/externe\/crous-\k<crousName>\.min\.json/,
		(req, res, ctx) => {
			const crousName = req.url.toString().match(/externe\/crous-(?<crousName>.+)\.min\.json/)?.groups?.crousName;
			if (!crousName) return res(ctx.status(404));
			let data = readFileSync(`${mockFolderPath}/${crousName}/restaurant.json`);
			let dataJSON = JSON.parse(data.toString());
			return res(ctx.json(dataJSON));
		}
	),
	rest.get(/http:\/\/webservices-v2\.crous-mobile\.fr(?::8080)?\/feed\/(?<crousName>.+?)\/\k<crousName>-logement\.xml/, async (req, res, ctx) => {
		const crousName = req.url.toString().match(/(?<crousName>.+?)\/\k<crousName>-logement\.xml/)?.groups?.crousName;
		if (!crousName) return res(ctx.status(404));
		const data = await readFileSync(`${mockFolderPath}/${crousName}/${crousName}-logement.xml`);
		return res(ctx.xml(data.toString()));
	}),
	rest.get(/http:\/\/webservices-v2\.crous-mobile\.fr(?::8080)?\/feed\/(?<crousName>.+?)\/externe\/actu.xml/, async (req, res, ctx) => {
		const crousName = req.url.toString().match(/feed\/(?<crousName>.+?)\/externe\/actu.xml/)?.groups?.crousName;

		if (!crousName) return res(ctx.status(404));
		const data = await readFileSync(`${mockFolderPath}/${crousName}/actu.xml`).toString();
		if (!data) return res(ctx.status(404));
		return res(ctx.xml(data.toString()));
	}),
];

const server = setupServer(...handlers);
export default server;
