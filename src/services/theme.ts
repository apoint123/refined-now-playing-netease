import {
	Hct,
	QuantizerCelebi,
	Score,
	themeFromSourceColor,
} from "@material/material-color-utilities";
import { argb2Rgb, rgb2Argb } from "@/color-utils";
import { chunk } from "@/utils";

class ThemeService {
	private lastDom: HTMLImageElement | HTMLCanvasElement | null = null;
	private lastIsFM = false;
	private currentVariant: "primary" | "secondary" | "tertiary" | "neutral" =
		"primary";

	// 设置当前的变体 (由 GlobalStyleManager 调用)
	public setVariant(variant: "primary" | "secondary" | "tertiary" | "neutral") {
		this.currentVariant = variant;
		this.recalc();
	}

	private updateAccentColor(name: string, argb: number, isFM = false) {
		const [r, g, b] = [...argb2Rgb(argb)];
		const suffix = isFM ? "-fm" : "";
		document.body.style.setProperty(
			`--${name}${suffix}`,
			`rgb(${r}, ${g}, ${b})`,
		);
		document.body.style.setProperty(
			`--${name}-rgb${suffix}`,
			`${r}, ${g}, ${b}`,
		);
	}

	private useGreyAccentColor(isFM = false) {
		this.updateAccentColor(
			"rnp-accent-color-dark",
			rgb2Argb(150, 150, 150),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-on-primary-dark",
			rgb2Argb(10, 10, 10),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-shade-1-dark",
			rgb2Argb(210, 210, 210),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-shade-2-dark",
			rgb2Argb(255, 255, 255),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-bg-dark",
			rgb2Argb(50, 50, 50),
			isFM,
		);

		this.updateAccentColor(
			"rnp-accent-color-light",
			rgb2Argb(120, 120, 120),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-on-primary-light",
			rgb2Argb(250, 250, 250),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-shade-1-light",
			rgb2Argb(40, 40, 40),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-shade-2-light",
			rgb2Argb(20, 20, 20),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-bg-light",
			rgb2Argb(190, 190, 190),
			isFM,
		);
	}

	public calcAccentColor(
		dom: HTMLImageElement | HTMLCanvasElement,
		isFM = false,
	) {
		// 保存状态以便重新计算 (例如切换变体时)
		this.lastDom =
			dom instanceof HTMLImageElement
				? (dom.cloneNode(true) as HTMLImageElement)
				: dom;
		this.lastIsFM = isFM;

		const canvas = document.createElement("canvas");
		canvas.width = 50;
		canvas.height = 50;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		try {
			if (dom instanceof HTMLImageElement) {
				ctx.drawImage(
					dom,
					0,
					0,
					dom.naturalWidth,
					dom.naturalHeight,
					0,
					0,
					50,
					50,
				);
			} else {
				ctx.drawImage(dom, 0, 0, dom.width, dom.height, 0, 0, 50, 50);
			}
		} catch (e) {
			console.warn(
				"RefinedNowPlaying: Failed to draw image for color extraction",
				e,
			);
			return;
		}

		const pixels = chunk(
			Array.from(ctx.getImageData(0, 0, 50, 50).data),
			4,
		).map((pixel) => {
			return (
				(((pixel[3] << 24) >>> 0) |
					((pixel[0] << 16) >>> 0) |
					((pixel[1] << 8) >>> 0) |
					pixel[2]) >>>
				0
			);
		});

		const quantizedColors = QuantizerCelebi.quantize(pixels, 128);
		const sortedQuantizedColors = Array.from(quantizedColors).sort(
			(a, b) => b[1] - a[1],
		);

		const mostFrequentColors = sortedQuantizedColors
			.slice(0, 5)
			.map((x) => argb2Rgb(x[0]));

		// 如果颜色过于接近灰色或单一，使用默认灰色主题
		if (mostFrequentColors.every((x) => Math.max(...x) - Math.min(...x) < 5)) {
			this.useGreyAccentColor(isFM);
			return;
		}

		const ranked = Score.score(new Map(sortedQuantizedColors.slice(0, 50)));
		const top = ranked[0];
		const theme = themeFromSourceColor(top);

		const variant = this.currentVariant;

		// Dark Theme Colors
		this.updateAccentColor(
			"rnp-accent-color-dark",
			theme.schemes.dark[variant],
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-on-primary-dark",
			Hct.from(
				theme.palettes[variant].hue,
				theme.palettes[variant].chroma,
				20,
			).toInt(),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-shade-1-dark",
			Hct.from(
				theme.palettes[variant].hue,
				theme.palettes[variant].chroma,
				80,
			).toInt(),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-shade-2-dark",
			Hct.from(
				theme.palettes[variant].hue,
				theme.palettes[variant].chroma,
				90,
			).toInt(),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-bg-dark",
			Hct.from(
				theme.palettes.secondary.hue,
				theme.palettes.secondary.chroma,
				20,
			).toInt(),
			isFM,
		);

		// Light Theme Colors
		this.updateAccentColor(
			"rnp-accent-color-light",
			theme.schemes.light.onPrimaryContainer,
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-on-primary-light",
			Hct.from(
				theme.palettes[variant].hue,
				theme.palettes[variant].chroma,
				100,
			).toInt(),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-shade-1-light",
			Hct.from(
				theme.palettes[variant].hue,
				theme.palettes[variant].chroma,
				25,
			).toInt(),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-shade-2-light",
			Hct.from(
				theme.palettes[variant].hue,
				theme.palettes[variant].chroma,
				15,
			).toInt(),
			isFM,
		);
		this.updateAccentColor(
			"rnp-accent-color-bg-light",
			Hct.from(
				theme.palettes.secondary.hue,
				theme.palettes.secondary.chroma,
				90,
			).toInt(),
			isFM,
		);
	}

	public recalc() {
		if (this.lastDom) {
			this.calcAccentColor(this.lastDom, this.lastIsFM);
		}
	}
}

export const themeService = new ThemeService();
