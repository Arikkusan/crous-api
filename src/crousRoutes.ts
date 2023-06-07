import { Request, Router, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { CronJob } from "cron";

import * as Swagger from "swagger-ui-express";
import { Namespace, Socket } from "socket.io";

import * as swaggerDoc from "./swagger.json" assert { type: "json" };

import CrousAPI from "./crousApi.js";
import { CrousData, Crous, CustomSocketData, CustomHolidays, ResourceManager } from "crous-api-types";
import { HolidayZone } from "crous-api-types/types/HolidayZones";
import HolidaysManager from "./utils/HolidaysManager.js";
import PublicHolydaysManager from "./utils/publicHolydayManager.js";

const allSockets: Map<string, CustomSocketData> = new Map();

const crousApi: CrousAPI = new CrousAPI();

const router: Router = Router();
let wssWorkspace: Namespace;

const swaggerOptions = {
	customCss: ".swagger-ui .topbar { display: none }",
	customSiteTitle: "Documentation",
	customfavIcon: "/favicon.ico",
};

router.use("/docs", Swagger.serveFiles(swaggerDoc, swaggerOptions), Swagger.setup(swaggerDoc));

const apiRateLimit = rateLimit({
	windowMs: 1 * 1000, // 1 seconds
	max: 1, // Limit each IP to 1 requests per `window` (here, per 1 seconds)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	skip: (request) => {
		let socketId: string | undefined = request?.headers["x-socket-id"]?.toString();
		return !!socketId && wssWorkspace.sockets.has(socketId);
	},
});

router.use("/", apiRateLimit);

router.use(function (req: Request, res: Response, next: NextFunction) {
	console.log("Time:", Date.now());
	next();
});

router.get("/", (req: Request, res: Response) => {
	res.send(crousApi.getCrousList());
});

router.get("/restaurant/:idRestaurant", async(req: Request, res: Response) => {
	const { idRestaurant } = req.params;
	try {
		let restaurant = await crousApi.getRestaurant(idRestaurant);
		if(!restaurant) return res.status(404).send(`No restaurant found with id ${idRestaurant}`);
		else res.json(restaurant);
	} catch (e) {
		res.status(404).send(`No restaurant found with id ${idRestaurant}`);
	}
});

router.get("/residence/:idResidence", async(req: Request, res: Response) => {
	const { idResidence } = req.params;
	try {
		let residence = await crousApi.getResidence(idResidence);
		if(!residence) return res.status(404).send(`No residence found with id ${idResidence}`);
		else res.json(residence);
	} catch (e) {
		res.status(404).send(`No residence found with id ${idResidence}`);
	}
});

router.get("/actualite/:idActualites", async(req: Request, res: Response) => {
	const { idActualites } = req.params;
	try {
		let actualites = await crousApi.getActualites(idActualites);
		if(!actualites) return res.status(404).send(`No actualites found with id ${idActualites}`);
		else res.json(actualites);
	} catch (e) {
		res.status(404).send(`No actualites found with id ${idActualites}`);
	}
});

router.get("/:nomCrous", (req: Request, res: Response) => {
	let { nomCrous } = req.params;
	try {
		res.json(crousApi.getCrous(nomCrous));
	} catch (e) {
		res.status(404).send(`${nomCrous} is not a valid Crous name`);
	}
});

router.get("/:nomCrous/:resource", (req: Request, res: Response) => {
	let { nomCrous, resource } = req.params;
	try {
		let crous = crousApi.getCrous(nomCrous);
		if (!crous) throw new Error("Crous not found");
		let payload = crous[resource as keyof Crous] as ResourceManager<CrousData>;
		if (!payload) throw new Error("resource not found");
		res.json(payload);
	} catch (e) {
		res.status(404).send(`resource ${req.params.resource} not found in crous ${nomCrous}`);
	}
});

router.get("/:nomCrous/:resource/:resourceId", async(req: Request, res: Response) => {
	let { nomCrous, resource, resourceId } = req.params;
	try {
		let crous = crousApi.getCrous(nomCrous);
		if (!crous) throw new Error("Crous not found");
		let payload = crous[resource as keyof Crous] as ResourceManager<CrousData>;
		if (!payload) throw new Error("resource not found");
		let resourceItem = await payload.get(resourceId);
		if(!resourceItem) throw new Error("resource item not found");
		else res.json(resourceItem);
	} catch (e) {
		console.error(e);
		res.status(404).send(`${resource} with id ${req.params.resourceId} not found in crous ${nomCrous}`);
	}
});

function setupRouter(workspace: Namespace): Router {
	wssWorkspace = workspace;

	wssWorkspace.on("connection", (socket: Socket) => {
		const parsedQuery = JSON.parse(JSON.stringify(socket.handshake.query));
		const socketSettings: CustomSocketData = parsedQuery as CustomSocketData;
		if (socketSettings.followingRestaurants) {
			if (!Array.isArray(socketSettings.followingRestaurants) && typeof socketSettings.followingRestaurants === "string") {
				socketSettings.followingRestaurants = (<string>socketSettings.followingRestaurants).split(",") ?? [];
			} else {
				socketSettings.followingRestaurants = [];
			}
		} else {
			socketSettings.followingRestaurants = [];
		}
		allSockets.set(socket.id, socketSettings);
		setupSocketFunctions(socket);
	});
	return router;
}

//setup socket functions
const setupSocketFunctions = (socket: Socket) => {
	socket.on("subscribeToMenu", async (idRestaurant: string) => {
		let socketData = allSockets.get(socket.id);
		let localRestaurant = await crousApi.getRestaurant(idRestaurant);
		if (socketData && localRestaurant != null) {
			// ajoute le nouveau restaurant à la liste des restaurants suivis via un Set pour garantir l'unicité des identifiants
			socketData.followingRestaurants = [...new Set([...(socketData.followingRestaurants ?? []), idRestaurant])];
		}
	});

	socket.on("unsubscribeToMenu", (idRestaurant: string) => {
		let socketData = allSockets.get(socket.id);
		if (socketData) {
			// supprime le restaurant de la liste des restaurants suivis
			if (socketData.followingRestaurants && socketData.followingRestaurants.length > 0) {
				socketData.followingRestaurants = socketData.followingRestaurants?.filter((id: string) => id != idRestaurant);
			}
		}
	});

	socket.on("disconnect", () => {
		allSockets.delete(socket.id);
	});
};

//cronjob pour envoyer les menus à 11h tous les jours (si il y a un menu)
const cronJob = new CronJob(
	"0 0 11 * * *",
	async () => {
		const crousApi = new CrousAPI();
		const holidaysManager = new HolidaysManager();
		await holidaysManager.updateCache();
		await holidaysManager.loadCustomVacances();

		const publicHolydaysManager = new PublicHolydaysManager();
		await publicHolydaysManager.updateCache();

		const holidays = holidaysManager.getStandardVacances();
		const customHolidays = holidaysManager.getCustomVacances() ?? {};
		const publicHolidays = publicHolydaysManager.getPublicHolydays();

		const skipZoneList: (CustomHolidays | HolidayZone)[] = [];

		for (const publicHoliday of publicHolidays) {
			if (publicHoliday.actual) {
				return;
			}
		}

		for (const holiday of holidays.values()) {
			if (holiday.actual && !skipZoneList.includes(holiday.zones)) {
				skipZoneList.push(holiday.zones);
			}
		}
		for (const [zone, holidays] of Object.entries(customHolidays)) {
			for (const holiday of holidays) {
				if (holiday.actual && !skipZoneList.includes(zone as CustomHolidays)) {
					skipZoneList.push(zone as CustomHolidays);
					break;
				}
			}
		}

		for (let [socketId, socket] of wssWorkspace.sockets) {
			const socketData = allSockets.get(socketId);
			const zoneVacances = socketData?.vacancesZones;
			const vacancesCustom = socketData?.vacancesCustom;

			if (!socketData || skipZoneList.includes(zoneVacances!) || skipZoneList.includes(vacancesCustom!)) continue;

			if ((zoneVacances && skipZoneList.includes(zoneVacances)) || (vacancesCustom && skipZoneList.includes(vacancesCustom))) continue;

			const followingRestaurants = socketData?.followingRestaurants;
			if (!!followingRestaurants && followingRestaurants.length > 0) {
				for (const restaurantId of followingRestaurants) {
					const restaurant = await crousApi.getRestaurant(restaurantId);
					if (!!restaurant && restaurant.opening[new Date().getDay()] && restaurant.getTodayMenu()) {
						socket.emit("menuSubscription", restaurantId, restaurant?.getTodayMenu());
					}
				}
			}
		}
	},
	null,
	true,
	"Europe/Paris"
);

router.get("*", (req: Request, res: Response) => {
	res.redirect("/");
});

export default setupRouter;
