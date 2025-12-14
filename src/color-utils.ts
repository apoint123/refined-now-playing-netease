type RGB = [number, number, number];

export const rgb2Hsl = ([r, g, b]: RGB): RGB => {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0,
		s = 0,
		l = (max + min) / 2;

	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return [h, s, l];
};

export const hsl2Rgb = ([h, s, l]: RGB): RGB => {
	let r: number, g: number, b: number;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	return [r * 255, g * 255, b * 255];
};

export const normalizeColor = ([r, g, b]: RGB): RGB => {
	if (Math.max(r, g, b) - Math.min(r, g, b) < 5) {
		return [150, 150, 150];
	}

	const mix = (a: number, b: number, p: number) =>
		Math.round(a * (1 - p) + b * p);

	const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	if (luminance < 60) {
		[r, g, b] = [r, g, b].map((c) =>
			mix(c, 255, 0.3 * (1 - luminance / 60)),
		) as RGB;
	} else if (luminance > 180) {
		[r, g, b] = [r, g, b].map((c) =>
			mix(c, 0, 0.5 * ((luminance - 180) / 76)),
		) as RGB;
	}

	let [h, s, l] = rgb2Hsl([r, g, b]);

	s = Math.max(0.3, Math.min(0.8, s));
	l = Math.max(0.5, Math.min(0.8, l));

	[r, g, b] = hsl2Rgb([h, s, l]);

	return [r, g, b];
};

export const calcWhiteShadeColor = ([r, g, b]: RGB, p = 0.5): RGB => {
	const mix = (a: number, b: number, p: number) =>
		Math.round(a * (1 - p) + b * p);
	return [r, g, b].map((c) => mix(c, 255, p)) as RGB;
};

export const calcLuminance = (color: RGB): number => {
	let [r, g, b] = color.map((c) => c / 255);
	[r, g, b] = [r, g, b].map((c) => {
		if (c <= 0.03928) {
			return c / 12.92;
		}
		return ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const rgb2Lab = (color: RGB): RGB => {
	let [r, g, b] = color.map((c) => c / 255);
	[r, g, b] = [r, g, b].map((c) => {
		if (c <= 0.03928) {
			return c / 12.92;
		}
		return ((c + 0.055) / 1.055) ** 2.4;
	});
	[r, g, b] = [r, g, b].map((c) => c * 100);
	const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
	const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
	const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
	const xyz2Lab = (c: number) => {
		if (c > 0.008856) {
			return c ** (1 / 3);
		}
		return 7.787 * c + 16 / 116;
	};
	const L = 116 * xyz2Lab(y / 100) - 16;
	const A = 500 * (xyz2Lab(x / 95.047) - xyz2Lab(y / 100));
	const B = 200 * (xyz2Lab(y / 100) - xyz2Lab(z / 108.883));
	return [L, A, B];
};

export const calcColorDifference = (color1: RGB, color2: RGB): number => {
	const [L1, A1, B1] = rgb2Lab(color1);
	const [L2, A2, B2] = rgb2Lab(color2);
	const deltaL = L1 - L2;
	const deltaA = A1 - A2;
	const deltaB = B1 - B2;
	return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
};

export const getGradientFromPalette = (palette: RGB[]): string => {
	let sortedPalette = [...palette].sort((a, b) => {
		return calcLuminance(a) - calcLuminance(b);
	});
	sortedPalette = sortedPalette.slice(
		Math.max(0, sortedPalette.length / 2 - 4),
		sortedPalette.length / 2 + 4,
	);

	sortedPalette = sortedPalette.sort((a, b) => {
		return rgb2Hsl(b)[1] - rgb2Hsl(a)[1];
	});
	sortedPalette = sortedPalette.slice(0, 6);

	if (sortedPalette.length === 0) return "linear-gradient(-45deg, #000, #000)";

	const count = sortedPalette.length;
	const differences = new Array(count);
	for (let i = 0; i < count; i++) {
		differences[i] = new Array(count).fill(0);
	}
	for (let i = 0; i < count; i++) {
		for (let j = i + 1; j < count; j++) {
			differences[i][j] = calcColorDifference(
				sortedPalette[i],
				sortedPalette[j],
			);
			differences[j][i] = differences[i][j];
		}
	}

	const used = new Array(count).fill(false);
	let min = 10000000;
	let ansSeq: number[] = [];

	const dfs = (depth: number, seq: number[] = [], currentMax = -1) => {
		if (depth === count) {
			if (currentMax < min) {
				min = currentMax;
				ansSeq = seq;
			}
			return;
		}
		for (let i = 0; i < count; i++) {
			if (used[i]) continue;
			used[i] = true;
			const diff = seq.length > 0 ? differences[seq[depth - 1]][i] : -1;
			dfs(depth + 1, seq.concat(i), Math.max(currentMax, diff));
			used[i] = false;
		}
	};

	for (let i = 0; i < count; i++) {
		used[i] = true;
		dfs(1, [i]);
		used[i] = false;
	}

	const colors: RGB[] = [];
	for (const i of ansSeq) {
		colors.push(sortedPalette[i]);
	}
	if (colors.length === 0) sortedPalette.forEach((c) => colors.push(c));

	let ans = "linear-gradient(-45deg,";
	for (let i = 0; i < colors.length; i++) {
		ans += `rgb(${colors[i][0]}, ${colors[i][1]}, ${colors[i][2]})`;
		if (i !== colors.length - 1) {
			ans += ",";
		}
	}
	ans += ")";
	return ans;
};

export const argb2Rgb = (x: number): RGB => {
	// const a = (x >> 24) & 0xff;
	const r = (x >> 16) & 0xff;
	const g = (x >> 8) & 0xff;
	const b = x & 0xff;
	return [r, g, b];
};

export const rgb2Argb = (r: number, g: number, b: number): number => {
	return (0xff << 24) | (r << 16) | (g << 8) | b;
};

export const Rgb2Hex = (r: number, g: number, b: number): string => {
	return (
		"#" +
		[r, g, b]
			.map((x) => {
				const hex = x.toString(16);
				return hex.length === 1 ? `0${hex}` : hex;
			})
			.join("")
	);
};
