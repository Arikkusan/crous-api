const CROUS_NAMES = [
	"aix.marseille",
	"amiens",
	"antilles.guyane",
	"bfc",
	"bordeaux",
	"clermont.ferrand",
	"corte",
	"creteil",
	"grenoble",
	"lille",
	"limoges",
	"lyon",
	"montpellier",
	"nancy.metz",
	"nantes",
	"nice",
	"normandie",
	"orleans.tours",
	"paris",
	"poitiers",
	"reims",
	"rennes",
	"reunion",
	"strasbourg",
	"toulouse",
	"versailles",
] as const;

type CROUS_NAMES_TYPE = typeof CROUS_NAMES;
export type CROUS_NAME = CROUS_NAMES_TYPE[number];

export function isValidCrousName(maybeCrousName: unknown): maybeCrousName is CROUS_NAME {
	return CROUS_NAMES.includes(maybeCrousName as CROUS_NAME);
}
