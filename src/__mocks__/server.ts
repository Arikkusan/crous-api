import { rest } from "msw";
import { setupServer } from "msw/node";
import { readFileSync } from "fs";

const mockFolderPath = "./mockData";

const holidaysJSON = JSON.parse(readFileSync(`${mockFolderPath}/holidays-2023.json`, "utf8"));
const publicHolidaysJSON = JSON.parse(readFileSync(`${mockFolderPath}/publicHolidays-2023.json`, "utf8"));
const datasetActus = JSON.parse(readFileSync(`${mockFolderPath}/datasetActus.json`, "utf8"));
const datasetLogements = JSON.parse(readFileSync(`${mockFolderPath}/datasetLogements.json`, "utf8"));
const crousWebServiceFeed = readFileSync(`${mockFolderPath}/crousWebServiceFeed.htm`).toString();

const handlers = [
	rest.get("https://data.education.gouv.fr/api/records/1.0/search/", (req, res, ctx) => res(ctx.json(holidaysJSON))),
	rest.get(/https?:\/\/calendrier\.api\.gouv\.fr\/jours-feries\/metropole\/\d{4}/, (req, res, ctx) => res(ctx.json(publicHolidaysJSON))),
	rest.get("https://www.data.gouv.fr/api/2/datasets/5548d35cc751df0767a7b26c/resources/", (req, res, ctx) => res(ctx.json(datasetActus))),
	rest.get("https://www.data.gouv.fr/api/2/datasets/5548d994c751df32e0a7b26c/resources/", (req, res, ctx) => res(ctx.json(datasetLogements))),
	rest.get(/https?:\/\/webservices-v2\.crous-mobile\.fr(?::8080)?\/feed\/?/, async (req, res, ctx) => {
		const crousName = req.url.toString().match(/feed\/(?<crousName>.+?)\//)?.groups?.crousName;
		if (!crousName) {
			return res(ctx.body(crousWebServiceFeed));
		} else {
			const fileName = req.url.toString().split("/").pop();
			let filePath, fileData;
			if (fileName?.endsWith(".xml")) {
				filePath = `${mockFolderPath}/${crousName}/${fileName}`;
				fileData = await readFileSync(filePath);
				return res(ctx.xml(fileData.toString()));
			} else if (fileName?.endsWith(".json")) {
				filePath = `${mockFolderPath}/${crousName}/restaurant.json`;
				fileData = await readFileSync(filePath);
				return res(ctx.json(fileData.toString()));
			} else {
				throw new Error("File extension not supported");
			}
		}
	}),
];

const server = setupServer(...handlers);
export default server;
