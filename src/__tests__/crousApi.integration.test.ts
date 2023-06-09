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
})

describe("ResourceManager", () => {
	it("should have fetch results", async () => {
		expect(true).toBeTruthy();
	});

	it("should return crous list", async () => {
		const crousList = await crousApi.getCrousList();
		expect(crousList).toHaveLength(26);
	});
});
