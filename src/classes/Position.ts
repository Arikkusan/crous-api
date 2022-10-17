export class Position {
	lat: Number;
	lon: Number;
	zone: String;
	localisation: String;
	constructor(lat: Number = 0, lon: Number = 0, zone: String = "", localisation: String = "") {
		this.lat = lat;
		this.lon = lon;
		this.zone = zone;
		this.localisation = localisation;
	}
}