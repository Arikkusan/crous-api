import RestaurantManager from "./RestaurantManager.js";
import ActualitesManager from "./ActualitesManager.js";
import ResidenceManager from "./ResidenceManager.js";

export {
	RestaurantManager,
	ActualitesManager,
	ResidenceManager
};
export type CustomResourceManager = RestaurantManager | ActualitesManager | ResidenceManager;