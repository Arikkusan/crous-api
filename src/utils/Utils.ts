export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
	return keys.reduce((o, k) => ((o[k] = obj[k]), o), {} as Pick<T, K>);
}

export function snake(str: string) {
	return (escape(str).match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g) ?? [])
		.map((x: string) => x.toLowerCase())
		.join("_");
}

export function escape(str: string) {
	var accents = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž'";
	var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz ";
	let s = str.split("");
	let strLen = s.length;
	let i, x;
	for (i = 0; i < strLen; i++) {
		if (str[i] !== "'") {
			if ((x = accents.indexOf(str[i])) != -1) {
				s[i] = accentsOut[x];
			}
		} else {
			s.splice(i, 1);
		}
	}
	return s.join("");
}

export function trimLowSnakeEscape(text: string) {
	return snake(text.trim());
}

export function transformCrousName(str: string) {
	let name = snake(str.trim()).replace(/_/g, ".");
	return name == "bourgogne.franche.comte" ? "bfc" : name;
}