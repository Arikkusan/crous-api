import { rest } from "msw";
import { setupServer } from "msw/node";

import holidaysJSON from "./data/holidays-2023.json"; //assert { type: "json" };
import publicHolidaysJSON from "./data/publicHolidays-2023.json"; //assert { type: "json" };

// handlers are usually saved in separate file(s) in one  destined place of the app,
// so that you don't have to search for them when the endpoints have changed
const handlers = [
	rest.get("https://data.education.gouv.fr/api/records/1.0/search/", (req, res, ctx) => res(ctx.json(holidaysJSON))),
	rest.get(/https\:\/\/calendrier\.api\.gouv\.fr\/jours-feries\/metropole\/\d{4}/, (req, res, ctx) => res(ctx.json(publicHolidaysJSON))),
];

const server = setupServer(...handlers);
export default server;
