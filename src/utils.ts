export const waitForElement = (
	selector: string,
	fun: (dom: Element) => void,
) => {
	const selectors = selector.split(",");
	let done = true;
	for (const s of selectors) {
		if (!document.querySelector(s)) {
			done = false;
			break;
		}
	}

	if (done) {
		for (const s of selectors) {
			const el = document.querySelector(s);
			if (el) fun(el);
		}
		return;
	}

	const interval = setInterval(() => {
		let done = true;
		for (const s of selectors) {
			if (!document.querySelector(s)) {
				done = false;
				break;
			}
		}
		if (done) {
			clearInterval(interval);
			for (const s of selectors) {
				const el = document.querySelector(s);
				if (el) fun(el);
			}
		}
	}, 100);
};

export const waitForElementAsync = async (
	selector: string,
): Promise<Element | null> => {
	const existing = document.querySelector(selector);
	if (existing) {
		return existing;
	}
	return await betterncm.utils.waitForElement(selector);
};

export const getSetting = (
	option: string,
	defaultValue: string | boolean | number = "",
): string | boolean | number => {
	if (option.endsWith("-fm")) {
		option = option.replace(/-fm$/, "");
	}
	const key = `refined-now-playing-${option}`;
	let value: string | null | boolean = localStorage.getItem(key);

	if (value === null) {
		value = defaultValue as string;
	}

	if (value === "true") {
		return true;
	}
	if (value === "false") {
		return false;
	}

	return value;
};

export const setSetting = (
	option: string,
	value: string | boolean | number,
) => {
	const key = `refined-now-playing-${option}`;
	localStorage.setItem(key, String(value));
};

export const chunk = <T>(input: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < input.length; i += size) {
		result.push(input.slice(i, i + size));
	}
	return result;
};

export const copyTextToClipboard = (text: string) => {
	const textarea = document.createElement("textarea");
	textarea.style.position = "fixed";
	textarea.style.top = "0";
	textarea.style.left = "0";
	textarea.style.opacity = "0";
	textarea.style.pointerEvents = "none";
	textarea.value = text;
	document.body.appendChild(textarea);
	textarea.select();
	document.execCommand("copy", true);
	document.body.removeChild(textarea);
};

export const cyrb53 = (str: string, seed = 0): number => {
	let h1 = 0xdeadbeef ^ seed,
		h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch = 0; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}

	h1 =
		Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
		Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 =
		Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
		Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
