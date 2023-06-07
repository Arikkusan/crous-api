import { rest } from "msw";
import { setupServer } from "msw/node";

// handlers are usually saved in separate file(s) in one  destined place of the app,
// so that you don't have to search for them when the endpoints have changed
const handlers = [
	rest.get(/https\:\/\/calendrier\.api\.gouv\.fr\/jours-feries\/metropole\/.+/, (req, res, ctx) => res(ctx.json({ message: "success" }))),
];

const server = setupServer(...handlers);
export default server;
