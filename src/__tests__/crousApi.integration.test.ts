import { publicHolidaysAxios } from "../utils/AxiosCustom";
import server from "../__mocks__/server";

beforeAll(() => server.listen());

describe("HolidayManager", () => {
	it("should return hello", async () => {
		await publicHolidaysAxios.get("2023").then((res) => console.log(res.data));
		expect(true).toBeTruthy();
	});
});
