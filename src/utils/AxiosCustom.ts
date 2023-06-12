import axios from "axios";

const crousWebServiceAxios = axios.create({
	baseURL: "http://webservices-v2.crous-mobile.fr/feed",
});

const crousDatasetAxios = axios.create({});

const publicHolidaysAxios = axios.create({
	baseURL: "https://calendrier.api.gouv.fr/jours-feries/metropole",
});

export { crousWebServiceAxios, crousDatasetAxios, publicHolidaysAxios };