import CrousAPI from "../crousApi.js";
import server from "../__mocks__/server";

let crousApi: CrousAPI;
let interval: NodeJS.Timer;

beforeAll(
	async () =>
		new Promise((resolve) => {
			server.listen();
			jest.useRealTimers().setSystemTime(new Date("2023-06-09"));
			crousApi = new CrousAPI();
			interval = setInterval(() => {
				if (CrousAPI.isLoaded) {
					interval.unref();
					resolve(true);
				}
			}, 500);
		})
);

afterAll(() => {
	interval.unref();
});

afterEach(() => {
	jest.useRealTimers();
});

describe("ResourceManager", () => {
	it("should return crous list", async () => {
		const crousList = await crousApi.getCrousList();
		expect(crousList).toHaveLength(26);
	});

	it("should have a precise number of restaurant for Nantes Crous ", async () => {
		const crousNantes = await crousApi.getCrous("nantes");
		expect(crousNantes?.restaurants.list).toHaveLength(56);
	});

	it("should be able to find a precise restaurant and menus", async () => {
		jest.useFakeTimers().setSystemTime(new Date("2023-06-09"));
		const restaurant = await crousApi.getRestaurant("603");
		expect(restaurant?.nom).toBe("Resto U' Aubépin");
		expect(restaurant?.paiements).toHaveLength(1);
		expect(restaurant?.getTodayMenu()).toBeDefined();
	});
});
