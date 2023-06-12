import CrousAPI from "../crousApi.js";
import server from "../__mocks__/server";

let crousApi: CrousAPI;
let interval: NodeJS.Timer;

beforeAll(
	() =>
		new Promise((resolve) => {
			server.listen();
			crousApi = new CrousAPI();
			interval = setInterval(() => {
				if (CrousAPI.isLoaded) {
					crousApi.updateCronJob.stop();
					interval.unref();
					resolve(true);
				}
			}, 1000);
		})
);

afterAll(() => {
	interval.unref();
});

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
});

describe("ResourceManager", () => {
	it("should return crous list", async () => {
		const crousList = crousApi.getCrousList();
		expect(crousList).toHaveLength(26);
	});

	it("should have a precise number of restaurant for Nantes Crous ", async () => {
		const crousNantes = crousApi.getCrous("nantes");
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
