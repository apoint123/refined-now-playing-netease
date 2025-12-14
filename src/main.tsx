import "./styles.scss";
import "./exclusive-modes.scss";
import "./FM.scss";
import "./experimental.scss";
// @ts-expect-error: HTML import handled by global.d.ts
import settingsMenuHTML from "./settings-menu.html";
import "./settings-menu.scss";
import { argb2Rgb, rgb2Argb } from "./color-utils.js";
import {
	chunk,
	copyTextToClipboard,
	getSetting,
	setSetting,
	waitForElement,
	waitForElementAsync,
} from "./utils";
import "./refined-control-bar.js";
import {
	Hct,
	QuantizerCelebi,
	Score,
	themeFromSourceColor,
} from "@importantimport/material-color-utilities";
import { Background } from "./background.js";
import {
	compatibilityWizard,
	hijackFailureNoticeCheck,
} from "./compatibility-check.js";
import { showContextMenu } from "./context-menu.js";
import { CoverShadow } from "./cover-shadow";
import { FontSettings } from "./font-settings.js";
import { Lyrics } from "./lyrics.js";
import { MiniSongInfo } from "./mini-song-info.js";
import { ProgressbarPreview } from "./progressbar-preview.js";
import { whatsNew } from "./whats-new.js";
import "./material-you-compatibility.scss";
import { createRoot } from "react-dom/client";

const ReactDOM = window.ReactDOM;

const updateAccentColor = (name: string, argb: number, isFM = false) => {
	const [r, g, b] = [...argb2Rgb(argb)];
	if (isFM) {
		document.body.style.setProperty(`--${name}-fm`, `rgb(${r}, ${g}, ${b})`);
		document.body.style.setProperty(`--${name}-rgb-fm`, `${r}, ${g}, ${b}`);
		return;
	}
	document.body.style.setProperty(`--${name}`, `rgb(${r}, ${g}, ${b})`);
	document.body.style.setProperty(`--${name}-rgb`, `${r}, ${g}, ${b}`);
};

const useGreyAccentColor = (isFM = false) => {
	updateAccentColor("rnp-accent-color-dark", rgb2Argb(150, 150, 150), isFM);
	updateAccentColor(
		"rnp-accent-color-on-primary-dark",
		rgb2Argb(10, 10, 10),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-shade-1-dark",
		rgb2Argb(210, 210, 210),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-shade-2-dark",
		rgb2Argb(255, 255, 255),
		isFM,
	);
	updateAccentColor("rnp-accent-color-bg-dark", rgb2Argb(50, 50, 50), isFM);

	updateAccentColor("rnp-accent-color-light", rgb2Argb(120, 120, 120), isFM);
	updateAccentColor(
		"rnp-accent-color-on-primary-light",
		rgb2Argb(250, 250, 250),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-shade-1-light",
		rgb2Argb(40, 40, 40),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-shade-2-light",
		rgb2Argb(20, 20, 20),
		isFM,
	);
	updateAccentColor("rnp-accent-color-bg-light", rgb2Argb(190, 190, 190), isFM);
};

let lastDom: HTMLImageElement | HTMLCanvasElement | null = null;
let lastIsFM = false;

const calcAccentColor = (
	dom: HTMLImageElement | HTMLCanvasElement,
	isFM = false,
) => {
	lastDom = dom.cloneNode(true) as HTMLImageElement;
	lastIsFM = isFM;

	const canvas = document.createElement("canvas");
	canvas.width = 50;
	canvas.height = 50;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	if (dom instanceof HTMLImageElement) {
		ctx.drawImage(dom, 0, 0, dom.naturalWidth, dom.naturalHeight, 0, 0, 50, 50);
	} else {
		ctx.drawImage(dom, 0, 0, dom.width, dom.height, 0, 0, 50, 50);
	}

	const pixels = chunk(Array.from(ctx.getImageData(0, 0, 50, 50).data), 4).map(
		(pixel) => {
			return (
				(((pixel[3] << 24) >>> 0) |
					((pixel[0] << 16) >>> 0) |
					((pixel[1] << 8) >>> 0) |
					pixel[2]) >>>
				0
			);
		},
	);

	const quantizedColors = QuantizerCelebi.quantize(pixels, 128);
	const sortedQuantizedColors = Array.from(quantizedColors).sort(
		(a, b) => b[1] - a[1],
	);

	/*Array.from(quantizedColors).sort((a, b) => b[1] - a[1]).slice(0, 50).map((x) => {
		console.log(...argb2Rgb(x[0]), x[1]);
	});*/
	const mostFrequentColors = sortedQuantizedColors
		.slice(0, 5)
		.map((x) => argb2Rgb(x[0]));
	if (mostFrequentColors.every((x) => Math.max(...x) - Math.min(...x) < 5)) {
		useGreyAccentColor();
		return;
	}

	const ranked = Score.score(new Map(sortedQuantizedColors.slice(0, 50)));
	const top = ranked[0];
	const theme = themeFromSourceColor(top);

	const variant =
		(window.accentColorVariant as
			| "primary"
			| "secondary"
			| "tertiary"
			| "neutral") ?? "primary";

	// theme.schemes.light.bgDarken = (Hct.from(theme.palettes.neutral.hue, theme.palettes.neutral.chroma, 97.5)).toInt();
	updateAccentColor("rnp-accent-color-dark", theme.schemes.dark[variant], isFM);
	updateAccentColor(
		"rnp-accent-color-on-primary-dark",
		Hct.from(
			theme.palettes[variant].hue,
			theme.palettes[variant].chroma,
			20,
		).toInt(),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-shade-1-dark",
		Hct.from(
			theme.palettes[variant].hue,
			theme.palettes[variant].chroma,
			80,
		).toInt(),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-shade-2-dark",
		Hct.from(
			theme.palettes[variant].hue,
			theme.palettes[variant].chroma,
			90,
		).toInt(),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-bg-dark",
		Hct.from(
			theme.palettes.secondary.hue,
			theme.palettes.secondary.chroma,
			20,
		).toInt(),
		isFM,
	);

	updateAccentColor(
		"rnp-accent-color-light",
		theme.schemes.light.onPrimaryContainer,
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-on-primary-light",
		Hct.from(
			theme.palettes[variant].hue,
			theme.palettes[variant].chroma,
			100,
		).toInt(),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-shade-1-light",
		Hct.from(
			theme.palettes[variant].hue,
			theme.palettes[variant].chroma,
			25,
		).toInt(),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-shade-2-light",
		Hct.from(
			theme.palettes[variant].hue,
			theme.palettes[variant].chroma,
			15,
		).toInt(),
		isFM,
	);
	updateAccentColor(
		"rnp-accent-color-bg-light",
		Hct.from(
			theme.palettes.secondary.hue,
			theme.palettes.secondary.chroma,
			90,
		).toInt(),
		isFM,
	);
};

const recalcAccentColor = () => {
	if (lastDom) {
		calcAccentColor(lastDom, lastIsFM);
	}
};

var lastCDImage = "";
const updateCDImage = () => {
	if (!document.querySelector(".g-single")) {
		return;
	}

	const imgDom = document.querySelector(
		".n-single .cdimg img",
	) as HTMLImageElement;
	if (!imgDom) {
		return;
	}

	const realCD = document.querySelector(".n-single .cdimg");

	const update = () => {
		const cdImage = imgDom.src;
		if (cdImage === lastCDImage) {
			return;
		}
		lastCDImage = cdImage;
		calcAccentColor(imgDom);
	};

	if (imgDom.complete) {
		update();
		realCD?.classList.remove("loading");
	} else {
		realCD?.classList.add("loading");
	}
};

var lastTitle = "";
const titleSizeController = document.createElement("style");
titleSizeController.innerHTML = "";
document.head.appendChild(titleSizeController);

const recalculateTitleSize = (forceRefresh = false) => {
	const title = document.querySelector(
		".g-single .g-singlec-ct .n-single .mn .head .inf .title",
	) as HTMLElement;
	if (!title) {
		return;
	}
	if (title.innerText === lastTitle && !forceRefresh) {
		return;
	}
	lastTitle = title.innerText;
	const text = title.innerText;
	const testDiv = document.createElement("div");
	testDiv.style.position = "absolute";
	testDiv.style.top = "-9999px";
	testDiv.style.left = "-9999px";
	testDiv.style.width = "auto";
	testDiv.style.height = "auto";
	testDiv.style.whiteSpace = "nowrap";
	testDiv.innerText = text;
	document.body.appendChild(testDiv);

	const maxThreshold = Math.max(
		Math.min(document.body.clientHeight * 0.05, 60),
		45,
	);
	const minThreshold = 24;
	const titleElement = document.querySelector(
		".g-single-track .g-singlec-ct .n-single .mn .head .inf .title",
	);
	const targetWidth = titleElement ? titleElement.clientWidth : 0;

	if (targetWidth === 0) {
		return;
	}

	let l = 1;
	let r = 61;
	while (l < r) {
		const mid = Math.floor((l + r) / 2);
		testDiv.style.fontSize = `${mid}px`;
		const width = testDiv.clientWidth;
		if (width > targetWidth) {
			r = mid;
		} else {
			l = mid + 1;
		}
	}
	let fontSize = l - 1;
	while (testDiv.clientWidth > targetWidth) {
		fontSize--;
		testDiv.style.fontSize = `${fontSize}px`;
	}
	fontSize = Math.max(Math.min(fontSize, maxThreshold), minThreshold);
	testDiv.style.fontSize = `${fontSize}px`;
	// const width = testDiv.clientWidth;
	document.body.removeChild(testDiv);
	titleSizeController.innerHTML = `
		.g-single .g-singlec-ct .n-single .mn .head .inf .title h1 {
			font-size: ${fontSize}px !important;
		}
	`;
};
const verticalAlignMiddleController = document.createElement("style");
verticalAlignMiddleController.innerHTML = "";
document.head.appendChild(verticalAlignMiddleController);

window.addEventListener("resize", () => {
	recalculateTitleSize(true);
});

const moveTags = () => {
	const titleBase = document.querySelector(
		".g-single-track .g-singlec-ct .n-single .mn .head .inf .title",
	);
	if (!titleBase) {
		return;
	}
	const tags = titleBase.querySelector("h1 > .name > .tag-wrap");
	if (!tags) {
		return;
	}
	const existingTags = titleBase.querySelector("h1 > .tag-wrap");
	if (existingTags) {
		existingTags.remove();
	}
	titleBase.querySelector("h1")?.appendChild(tags);
};

const calcTitleScroll = () => {
	moveTags();
	const titleContainer = document.querySelector(
		".g-single .g-singlec-ct .n-single .mn .head .inf .title .name",
	);
	if (!titleContainer) {
		return;
	}
	if ((titleContainer?.firstChild?.nodeType ?? 0) === 3) {
		const titleInner = document.createElement("div");
		titleInner.classList.add("name-inner");
		titleInner.innerHTML = titleContainer.innerHTML.replace(/&nbsp;/g, " ");
		titleContainer.innerHTML = "";
		titleContainer.appendChild(titleInner);
	}
	/*const containerWidth = titleContainer.clientWidth;
	const innerWidth = titleContainer.querySelector('.name-inner').clientWidth;
	if (containerWidth < innerWidth && innerWidth - containerWidth < 20) {
		titleSizeController.innerHTML = `
			.g-single .g-singlec-ct .n-single .mn .head .inf .title h1 {
				font-size: ${titleSizeController.innerHTML.match(/font-size: (\d+)px/)[1] - 1}px !important;
			}
		`;
	}
	if (containerWidth < innerWidth) {
		titleContainer.classList.add('scroll');
	} else {
		titleContainer.classList.remove('scroll');
	}
	titleContainer.style.setProperty('--scroll-offset', `${innerWidth - containerWidth}px`);
	titleContainer.style.setProperty('--scroll-speed', `${(innerWidth - containerWidth) / 30}s`);*/
};

waitForElement("#main-player, .m-pinfo", (dom) => {
	dom.addEventListener("mouseenter", () => {
		document.body.classList.add("bottombar-hover");
	});
	dom.addEventListener("mouseleave", () => {
		document.body.classList.remove("bottombar-hover");
	});
});

const addOrRemoveGlobalClassByOption = (
	className: string,
	optionValue: boolean | string,
) => {
	if (optionValue) {
		document.body.classList.add(className);
	} else {
		document.body.classList.remove(className);
	}
};

const shouldSettingMenuReload = [true, true]; // index = int(isFM)
const addSettingsMenu = async (isFM = false) => {
	if (shouldSettingMenuReload[isFM ? 1 : 0]) {
		shouldSettingMenuReload[isFM ? 1 : 0] = false;
	} else {
		return;
	}

	const sliderEnhance = (slider: HTMLInputElement) => {
		const isMidSlider = slider.classList.contains("mid-slider");
		slider.addEventListener("input", (e) => {
			const target = e.target as HTMLInputElement;
			const value = parseFloat(target.value);
			const min = parseFloat(target.min);
			const max = parseFloat(target.max);
			const percent = (value - min) / (max - min);
			const bg = `linear-gradient(90deg, var(--rnp-accent-color) ${percent * 100}%, #dfe1e422 ${percent * 100}%)`;
			if (!isMidSlider) target.style.background = bg;

			if (value !== parseFloat(target.getAttribute("default") || "0")) {
				target.parentElement?.classList.add("changed");
			} else {
				target.parentElement?.classList.remove("changed");
			}
		});
		if (slider.parentElement?.querySelector(".rnp-slider-reset")) {
			slider.parentElement
				.querySelector(".rnp-slider-reset")
				?.addEventListener("click", (e) => {
					const target = e.target as HTMLElement;
					const slider = target.parentElement?.parentElement?.querySelector(
						".rnp-slider",
					) as HTMLInputElement;
					if (slider) {
						slider.value = slider.getAttribute("default") || "0";
						slider.dispatchEvent(new Event("input"));
						slider.dispatchEvent(new Event("change"));
					}
				});
		}
		slider.dispatchEvent(new Event("input"));
	};

	const bindCheckboxToClass = (
		checkbox: HTMLInputElement,
		className: string,
		defaultValue = false,
		callback: (val: boolean) => void = () => {},
	) => {
		checkbox.checked = getSetting(checkbox.id, defaultValue) as boolean;
		checkbox.addEventListener("change", (e) => {
			const target = e.target as HTMLInputElement;
			shouldSettingMenuReload[isFM ? 1 : 0] = true;
			setSetting(checkbox.id, target.checked);
			addOrRemoveGlobalClassByOption(className, target.checked);
			callback(target.checked);
		});
		addOrRemoveGlobalClassByOption(className, checkbox.checked);
		callback(checkbox.checked);
	};

	const bindCheckboxToFunction = (
		checkbox: HTMLInputElement,
		func: (val: boolean) => void,
		defaultValue = false,
	) => {
		checkbox.checked = getSetting(checkbox.id, defaultValue) as boolean;
		checkbox.addEventListener("change", (e) => {
			const target = e.target as HTMLInputElement;
			shouldSettingMenuReload[isFM ? 1 : 0] = true;
			setSetting(checkbox.id, target.checked);
			func(target.checked);
		});
		func(checkbox.checked);
	};

	const bindSliderToCSSVariable = (
		slider: HTMLInputElement,
		variable: string,
		defaultValue = 0,
		event = "input",
		mapping = (x: string | number) => {
			return x;
		},
		addClassWhenAdjusting = "",
	) => {
		slider.value = String(getSetting(slider.id, defaultValue));
		slider.dispatchEvent(new Event("input"));
		slider.addEventListener(event, (e) => {
			const target = e.target as HTMLInputElement;
			const value = target.value;
			document.body.style.setProperty(variable, String(mapping(value)));
		});
		slider.addEventListener("change", (e) => {
			const target = e.target as HTMLInputElement;
			shouldSettingMenuReload[isFM ? 1 : 0] = true;
			setSetting(slider.id, target.value);
		});
		if (addClassWhenAdjusting) {
			slider.addEventListener("mousedown", () => {
				document.body.classList.add(addClassWhenAdjusting);
			});
			slider.addEventListener("mouseup", () => {
				document.body.classList.remove(addClassWhenAdjusting);
			});
		}
		document.body.style.setProperty(variable, String(mapping(slider.value)));
		sliderEnhance(slider);
	};

	const bindSliderToFunction = (
		slider: HTMLInputElement,
		func: (val: any) => void,
		defaultValue = 0,
		event = "input",
		mapping = (x: any) => {
			return x;
		},
		addClassWhenAdjusting = "",
	) => {
		slider.value = String(getSetting(slider.id, defaultValue));
		slider.dispatchEvent(new Event("input"));
		slider.addEventListener(event, (e) => {
			const target = e.target as HTMLInputElement;
			const value = target.value;
			func(mapping(value));
		});
		slider.addEventListener("change", (e) => {
			const target = e.target as HTMLInputElement;
			shouldSettingMenuReload[isFM ? 1 : 0] = true;
			setSetting(slider.id, target.value);
		});
		if (addClassWhenAdjusting) {
			slider.addEventListener("mousedown", () => {
				document.body.classList.add(addClassWhenAdjusting);
			});
			slider.addEventListener("mouseup", () => {
				document.body.classList.remove(addClassWhenAdjusting);
			});
		}
		func(mapping(slider.value));
		sliderEnhance(slider);
	};

	const bindSelectGroupToClasses = (
		selectGroup: HTMLElement,
		defaultValue: string,
		mapping = (x: string) => {
			return x;
		},
		callback = (x: string) => {},
	) => {
		const buttons = selectGroup.querySelectorAll(".rnp-select-group-btn");
		buttons.forEach((button) => {
			button.addEventListener("click", (e) => {
				const target = e.target as HTMLElement;
				const value = target.getAttribute("value");
				if (!value) return;

				buttons.forEach((btn) => {
					btn.classList.remove("selected");
					const val = btn.getAttribute("value");
					if (val) document.body.classList.remove(mapping(val));
				});
				target.classList.add("selected");
				document.body.classList.add(mapping(value));
				shouldSettingMenuReload[isFM ? 1 : 0] = true;
				setSetting(selectGroup.id, value);
				callback(value);
			});
		});
		const value = getSetting(selectGroup.id, defaultValue) as string;
		buttons.forEach((button) => {
			if (button.getAttribute("value") === value) {
				button.classList.add("selected");
				document.body.classList.add(mapping(value));
			} else {
				button.classList.remove("selected");
				const val = button.getAttribute("value");
				if (val) document.body.classList.remove(mapping(val));
			}
		});
		callback(value);
	};

	const getOptionDom = <T extends HTMLElement = HTMLElement>(
		selector: string,
	): T | null => {
		if (isFM) return document.querySelector(`${selector}-fm`);
		return document.querySelector(selector);
	};

	const initSettings = () => {
		// 外观
		const exclusiveModes = getOptionDom("#exclusive-modes");
		const centerLyric = getOptionDom<HTMLInputElement>("#center-lyric");
		const autoHideMiniSongInfo = getOptionDom<HTMLInputElement>(
			"#auto-hide-mini-song-info",
		);
		const colorScheme = getOptionDom("#color-scheme");
		const accentColorVariant = getOptionDom("#accent-color-variant");
		const textShadow = getOptionDom<HTMLInputElement>("#text-shadow");
		const textGlow = getOptionDom<HTMLInputElement>("#text-glow");
		const refinedControlBar = getOptionDom<HTMLInputElement>(
			"#refined-control-bar",
		);
		const alwaysShowBottomBar = getOptionDom<HTMLInputElement>(
			"#always-show-bottombar",
		);
		const bottomProgressBar = getOptionDom<HTMLInputElement>(
			"#bottom-progressbar",
		);
		const enableProgressbarPreview = getOptionDom<HTMLInputElement>(
			"#enable-progressbar-preview",
		);

		if (exclusiveModes) {
			bindSelectGroupToClasses(
				exclusiveModes,
				"none",
				(x) => (x === "all" ? "no-exclusive-mode" : x),
				() => {
					window.dispatchEvent(new Event("recalc-lyrics"));
					recalculateTitleSize();
				},
			);
		}

		if (centerLyric) bindCheckboxToClass(centerLyric, "center-lyric", false);
		if (autoHideMiniSongInfo)
			bindCheckboxToClass(
				autoHideMiniSongInfo,
				"auto-hide-mini-song-info",
				true,
			);
		if (colorScheme)
			bindSelectGroupToClasses(colorScheme, "auto", (x) => `rnp-${x}`);

		if (accentColorVariant) {
			bindSelectGroupToClasses(
				accentColorVariant,
				"primary",
				(x) => `accent-color-${x}`,
				(x) => {
					if (x === "off")
						document.body.classList.remove("enable-accent-color");
					else document.body.classList.add("enable-accent-color");
					window.accentColorVariant = x === "off" ? "primary" : x;
					recalcAccentColor();
				},
			);
		}

		if (textShadow) {
			bindCheckboxToClass(textShadow, "rnp-shadow", false, (x) => {
				if (x && textGlow) {
					textGlow.checked = false;
					textGlow.dispatchEvent(new Event("change"));
				}
			});
		}

		if (textGlow) {
			bindCheckboxToClass(textGlow, "rnp-text-glow", false, (x) => {
				if (x && textShadow) {
					textShadow.checked = false;
					textShadow.dispatchEvent(new Event("change"));
				}
			});
		}

		if (refinedControlBar)
			bindCheckboxToClass(refinedControlBar, "refined-control-bar", true);
		if (alwaysShowBottomBar)
			bindCheckboxToClass(alwaysShowBottomBar, "always-show-bottombar", false);
		if (bottomProgressBar)
			bindCheckboxToClass(bottomProgressBar, "rnp-bottom-progressbar", false);
		if (enableProgressbarPreview)
			bindCheckboxToClass(
				enableProgressbarPreview,
				"enable-progressbar-preview",
				true,
			);

		// 封面
		const horizontalAlign = getOptionDom("#horizontal-align");
		const verticalAlign = getOptionDom("#vertical-align");
		const rectangleCover = getOptionDom<HTMLInputElement>("#rectangle-cover");
		const albumSize = getOptionDom<HTMLInputElement>("#album-size");
		const coverBlurryShadow = getOptionDom<HTMLInputElement>(
			"#cover-blurry-shadow",
		);

		if (horizontalAlign) {
			bindSelectGroupToClasses(
				horizontalAlign,
				"left",
				(x) => `horizontal-align-${x}`,
				() => {
					recalculateTitleSize();
				},
			);
		}
		if (verticalAlign) {
			bindSelectGroupToClasses(
				verticalAlign,
				"bottom",
				(x) => `vertical-align-${x}`,
				() => {
					recalculateTitleSize();
				},
			);
		}
		if (rectangleCover)
			bindCheckboxToClass(rectangleCover, "rectangle-cover", true);

		if (albumSize) {
			bindSliderToFunction(
				albumSize,
				(x) => {
					const size = parseInt(String(x), 10);
					window.albumSize = size;
					const img = getOptionDom<HTMLImageElement>(".n-single .cdimg img");
					if (!img?.src) return;
					const currentSrc = img.src;
					const newSrc = currentSrc.replace(
						/thumbnail=\d+y\d+/g,
						`thumbnail=${window.albumSize}y${window.albumSize}`,
					);
					if (currentSrc !== newSrc) {
						img.src = newSrc;
					}
				},
				200,
				"change",
				(x) => {
					const val = parseInt(String(x), 10);
					return val === 200 ? 210 : val;
				},
			);
		}

		if (coverBlurryShadow) {
			bindCheckboxToClass(
				coverBlurryShadow,
				"cover-blurry-shadow",
				true,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-cover-shadow-type", {
							detail: { type: x ? "colorful" : "black" },
						}),
					);
				},
			);
		}

		// 背景
		const backgroundType = getOptionDom("#background-type");
		const bgBlur = getOptionDom<HTMLInputElement>("#bg-blur");
		const bgDim = getOptionDom<HTMLInputElement>("#bg-dim");
		const bgDimForGradientBg = getOptionDom<HTMLInputElement>(
			"#bg-dim-for-gradient-bg",
		);
		const bgDimForFluidBg = getOptionDom<HTMLInputElement>(
			"#bg-dim-for-fluid-bg",
		);
		const bgBlurForNoneBgMask = getOptionDom<HTMLInputElement>(
			"#bg-blur-for-none-bg-mask",
		);
		const bgDimForNoneBgMask = getOptionDom<HTMLInputElement>(
			"#bg-dim-for-none-bg-mask",
		);
		const bgOpacity = getOptionDom<HTMLInputElement>("#bg-opacity");
		const gradientBgDynamic = getOptionDom<HTMLInputElement>(
			"#gradient-bg-dynamic",
		);
		const staticFluid = getOptionDom<HTMLInputElement>("#static-fluid");

		if (backgroundType) {
			bindSelectGroupToClasses(
				backgroundType,
				"blur",
				(x) => `rnp-bg-${x}`,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-background-type", { detail: { type: x } }),
					);
				},
			);
		}

		if (bgBlur)
			bindSliderToCSSVariable(
				bgBlur,
				"--bg-blur",
				90,
				"change",
				(x) => `${x}px`,
			);
		if (bgDim)
			bindSliderToCSSVariable(
				bgDim,
				"--bg-dim",
				55,
				"change",
				(x) => parseInt(String(x), 10) / 100,
			);
		if (bgDimForGradientBg) {
			bindSliderToCSSVariable(
				bgDimForGradientBg,
				"--bg-dim-for-gradient-bg",
				45,
				"change",
				(x) => parseInt(String(x), 10) / 100,
			);
		}
		if (bgDimForFluidBg) {
			bindSliderToCSSVariable(
				bgDimForFluidBg,
				"--bg-dim-for-fluid-bg",
				30,
				"change",
				(x) => parseInt(String(x), 10) / 100,
			);
		}
		if (bgBlurForNoneBgMask) {
			bindSliderToCSSVariable(
				bgBlurForNoneBgMask,
				"--bg-blur-for-none-bg-mask",
				0,
				"change",
				(x) => `${x}px`,
			);
		}
		if (bgDimForNoneBgMask) {
			bindSliderToCSSVariable(
				bgDimForNoneBgMask,
				"--bg-dim-for-none-bg-mask",
				0,
				"change",
				(x) => parseInt(String(x), 10) / 100,
			);
		}
		if (bgOpacity) {
			bindSliderToCSSVariable(
				bgOpacity,
				"--bg-opacity",
				0,
				"change",
				(x) => 1 - parseInt(String(x), 10) / 100,
			);
		}

		if (gradientBgDynamic)
			bindCheckboxToClass(gradientBgDynamic, "gradient-bg-dynamic", true);
		if (staticFluid) {
			bindCheckboxToClass(staticFluid, "static-fluid", false, (x) => {
				document.dispatchEvent(
					new CustomEvent("rnp-static-fluid", { detail: x }),
				);
			});
		}

		// 歌词
		const originalLyricBold = getOptionDom<HTMLInputElement>(
			"#original-lyric-bold",
		);
		const lyricFontSize = getOptionDom<HTMLInputElement>("#lyric-font-size");
		const lyricRomajiSizeEm = getOptionDom<HTMLInputElement>(
			"#lyric-romaji-size-em",
		);
		const lyricTranslationSizeEm = getOptionDom<HTMLInputElement>(
			"#lyric-translation-size-em",
		);
		const lyricFade = getOptionDom<HTMLInputElement>("#lyric-fade");
		const lyricZoom = getOptionDom<HTMLInputElement>("#lyric-zoom");
		const lyricBlur = getOptionDom<HTMLInputElement>("#lyric-blur");
		const lyricRotate = getOptionDom<HTMLInputElement>("#lyric-rotate");
		const RotateCurvature = getOptionDom<HTMLInputElement>("#rotate-curvature");
		const karaokeAnimation = getOptionDom("#karaoke-animation");
		const currentLyricAlignmentPercentage = getOptionDom(
			"#current-lyric-alignment-percentage",
		);
		const lyricStagger = getOptionDom<HTMLInputElement>("#lyric-stagger");
		const lyricAnimationTiming = getOptionDom("#lyric-animation-timing");
		const lyricGlow = getOptionDom<HTMLInputElement>("#lyric-glow");
		const lyricContributorsDisplay = getOptionDom(
			"#lyric-contributors-display",
		);

		if (originalLyricBold)
			bindCheckboxToClass(originalLyricBold, "original-lyric-bold", true);

		if (lyricFontSize) {
			bindSliderToFunction(
				lyricFontSize,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-lyric-font-size", { detail: x }),
					);
				},
				32,
				"change",
			);
		}

		if (lyricRomajiSizeEm) {
			bindSliderToFunction(
				lyricRomajiSizeEm,
				(x) => {
					document.body.style.setProperty("--lyric-romaji-size-em", `${x}em`);
					window.dispatchEvent(new Event("recalc-lyrics"));
				},
				0.6,
				"change",
			);
		}

		if (lyricTranslationSizeEm) {
			bindSliderToFunction(
				lyricTranslationSizeEm,
				(x) => {
					document.body.style.setProperty(
						"--lyric-translation-size-em",
						`${x}em`,
					);
					window.dispatchEvent(new Event("recalc-lyrics"));
				},
				1.0,
				"change",
			);
		}

		if (lyricZoom) {
			bindCheckboxToFunction(
				lyricZoom,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-lyric-zoom", { detail: x }),
					);
				},
				false,
			);
		}

		if (lyricFade) {
			bindCheckboxToFunction(
				lyricFade,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-lyric-fade", { detail: x }),
					);
				},
				false,
			);
		}

		if (lyricBlur) {
			bindCheckboxToFunction(
				lyricBlur,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-lyric-blur", { detail: x }),
					);
				},
				false,
			);
		}

		if (lyricRotate) {
			bindCheckboxToClass(lyricRotate, "lyric-rotate", false, (x) => {
				document.dispatchEvent(
					new CustomEvent("rnp-lyric-rotate", { detail: x }),
				);
			});
		}

		if (RotateCurvature) {
			bindSliderToFunction(
				RotateCurvature,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-rotate-curvature", { detail: x }),
					);
				},
				25,
				"change",
			);
		}

		if (karaokeAnimation) {
			bindSelectGroupToClasses(
				karaokeAnimation,
				"float",
				(x) => `rnp-karaoke-animation-${x}`,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-karaoke-animation", { detail: x }),
					);
				},
			);
		}

		if (currentLyricAlignmentPercentage) {
			bindSelectGroupToClasses(
				currentLyricAlignmentPercentage,
				"50",
				(x) => `rnp-current-lyric-alignment-${x}`,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-current-lyric-alignment-percentage", {
							detail: parseInt(x, 10),
						}),
					);
				},
			);
		}

		if (lyricStagger) {
			bindCheckboxToFunction(
				lyricStagger,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-lyric-stagger", { detail: x }),
					);
				},
				true,
			);
		}

		if (lyricAnimationTiming) {
			bindSelectGroupToClasses(
				lyricAnimationTiming,
				"smooth",
				(x) => `rnp-lyric-animation-timing-${x}`,
			);
		}

		if (lyricGlow) {
			bindCheckboxToFunction(
				lyricGlow,
				(x) => {
					document.dispatchEvent(
						new CustomEvent("rnp-lyric-glow", { detail: x }),
					);
				},
				true,
			);
		}

		if (lyricContributorsDisplay) {
			bindSelectGroupToClasses(
				lyricContributorsDisplay,
				"hover",
				(x) => `rnp-lyric-contributors-${x}`,
			);
		}

		// offset 控制
		const lyricOffsetSlider = getOptionDom<HTMLInputElement>(
			"#rnp-lyric-offset-slider",
		);
		const lyricOffsetAdd = getOptionDom("#rnp-lyric-offset-add");
		const lyricOffsetSub = getOptionDom("#rnp-lyric-offset-sub");
		const lyricOffsetReset = getOptionDom("#rnp-lyric-offset-reset");
		const lyricOffsetNumber = getOptionDom("#rnp-lyric-offset-number");
		const lyricOffsetTip = getOptionDom("#rnp-lyric-offset-tip");

		if (
			lyricOffsetSlider &&
			lyricOffsetNumber &&
			lyricOffsetTip &&
			lyricOffsetReset
		) {
			bindSliderToFunction(
				lyricOffsetSlider,
				(val) => {
					const ms = parseInt(String(val), 10);
					document.dispatchEvent(
						new CustomEvent("rnp-global-offset", { detail: ms }),
					);

					const sign = ["-", "", "+"][Math.sign(ms) + 1];
					const sec = (Math.abs(ms) / 1000).toFixed(1).replace(/\.0$/, "");
					lyricOffsetNumber.innerHTML = `${sign}${sec}s`;

					if (ms === 0) {
						lyricOffsetTip.innerHTML = "未设置";
						lyricOffsetReset.classList.remove("active");
					} else {
						lyricOffsetTip.innerHTML = ms > 0 ? "歌词提前" : "歌词滞后";
						lyricOffsetReset.classList.add("active");
					}

					shouldSettingMenuReload[isFM ? 1 : 0] = true;
					setSetting("lyric-offset", ms);
				},
				parseInt(String(getSetting("lyric-offset", 0)), 10),
				"change",
			);
		}

		const setLyricOffsetValue = (ms: number) => {
			if (!lyricOffsetSlider) return;
			lyricOffsetSlider.value = String(ms);
			lyricOffsetSlider.dispatchEvent(new Event("input"));
			lyricOffsetSlider.dispatchEvent(new Event("change"));
		};

		lyricOffsetAdd?.addEventListener("click", () => {
			setLyricOffsetValue(
				parseInt(String(getSetting("lyric-offset", 0)), 10) + 100,
			);
		});
		lyricOffsetSub?.addEventListener("click", () => {
			setLyricOffsetValue(
				parseInt(String(getSetting("lyric-offset", 0)), 10) - 100,
			);
		});
		lyricOffsetReset?.addEventListener("click", () => {
			setLyricOffsetValue(0);
		});

		// 字体
		const customFont = getOptionDom<HTMLInputElement>("#custom-font");
		if (customFont) bindCheckboxToClass(customFont, "rnp-custom-font", false);

		const customFontSectionContainer = getOptionDom("#rnp-custom-font-section");
		if (customFontSectionContainer) {
			const containerRoot = createRoot(customFontSectionContainer);
			containerRoot.render(<FontSettings />);
		}

		// 实验性选项
		const fluidMaxFramerate = getOptionDom<HTMLInputElement>(
			"#fluid-max-framerate",
		);
		const fluidBlur = getOptionDom<HTMLInputElement>("#fluid-blur");
		const hideEntireBottombar = getOptionDom<HTMLInputElement>(
			"#hide-entire-bottombar-when-idle",
		);
		const presentationMode =
			getOptionDom<HTMLInputElement>("#presentation-mode");

		if (fluidMaxFramerate) {
			bindSliderToFunction(
				fluidMaxFramerate,
				(x) => {
					const val = parseInt(String(x), 10);
					const arr = ["5", "10", "30", "60", "inf"];
					for (let i = 0; i <= 4; i++) {
						document.body.classList.remove(`rnp-fluid-max-framerate-${arr[i]}`);
					}
					document.body.classList.add(`rnp-fluid-max-framerate-${arr[val]}`);
				},
				Number(getSetting("fluid-max-framerate", 5)),
				"change",
			);
		}

		if (fluidBlur) {
			bindSliderToCSSVariable(
				fluidBlur,
				"--fluid-blur",
				6,
				"change",
				(x) => `${parseInt(String(2 ** Number(x)), 10)}px`,
			);
		}

		if (hideEntireBottombar) {
			bindCheckboxToClass(
				hideEntireBottombar,
				"hide-entire-bottombar-when-idle",
				false,
			);
		}

		presentationMode?.addEventListener("change", (e) => {
			const target = e.target as HTMLInputElement;
			addOrRemoveGlobalClassByOption("presentation-mode", target.checked);
		});

		// 杂项
		const hideSongAliasName = getOptionDom<HTMLInputElement>(
			"#hide-song-alias-name",
		);
		const hideComments = getOptionDom<HTMLInputElement>("#hide-comments");
		const partialBg = getOptionDom<HTMLInputElement>("#partial-bg");

		if (hideSongAliasName)
			bindCheckboxToClass(hideSongAliasName, "hide-song-alias-name", false);
		if (hideComments) bindCheckboxToClass(hideComments, "hide-comments", false);
		if (partialBg) bindCheckboxToClass(partialBg, "partial-bg", false);

		// 关于
		const versionNumber = getOptionDom("#rnp-version-number");
		if (versionNumber && window.loadedPlugins.RefinedNowPlaying) {
			versionNumber.innerHTML =
				window.loadedPlugins.RefinedNowPlaying.manifest.version;
		}

		const openWhatsNew = getOptionDom("#open-whats-new");
		openWhatsNew?.addEventListener("click", () => {
			whatsNew(true);
		});
	};

	const initTabs = (menu: HTMLElement) => {
		const tabs = menu.querySelectorAll<HTMLElement>(
			".rnp-settings-menu-tabs .rnp-settings-menu-tab",
		);
		const container = menu.querySelector(
			".rnp-settings-menu-inner",
		) as HTMLElement;

		if (!container) return;

		const sections = container.querySelectorAll<HTMLElement>(".rnp-group");

		const activeGroup = container.querySelector(
			".rnp-group.active",
		) as HTMLElement;
		let active = activeGroup?.dataset?.tab ?? "appearance";

		const setActive = (name: string | undefined) => {
			if (!name || name === active) return;
			active = name;
			tabs.forEach((x) => {
				if (x.dataset.tab === name) x.classList.add("active");
				else x.classList.remove("active");
			});
		};

		tabs.forEach((x) => {
			x.addEventListener("click", () => {
				const tabName = x.dataset.tab;
				if (!tabName) return;

				const targetSection = container.querySelector(
					`.rnp-group[data-tab="${tabName}"]`,
				) as HTMLElement;

				if (targetSection) {
					const top = targetSection.offsetTop + 5;
					container.scrollTo({ top, behavior: "smooth" });
				}
			});
		});

		container.addEventListener("scroll", () => {
			const top = container.scrollTop;

			if (top + container.clientHeight >= container.scrollHeight) {
				const lastSection = sections[sections.length - 1];
				if (lastSection) setActive(lastSection.dataset.tab);
				return;
			}

			let name = active;
			sections.forEach((x) => {
				if (x.offsetTop <= top) {
					name = x.dataset.tab ?? name;
				}
			});
			setActive(name);
		});

		const settingsInput = menu.querySelector("input.rnp-settings");
		settingsInput?.addEventListener("click", () => {
			container.dispatchEvent(new Event("scroll"));
		});
	};

	const settingsMenu = document.createElement("div");
	if (isFM) {
		settingsMenu.id = "settings-menu-fm";
		settingsMenu.innerHTML = settingsMenuHTML.replace(
			/(id|for)="(.*?)"/gi,
			'$1="$2-fm"',
		);
	} else {
		settingsMenu.id = "settings-menu";
		settingsMenu.innerHTML = settingsMenuHTML;
	}

	if (document.querySelector(settingsMenu.id)) {
		document.querySelector(settingsMenu.id)?.remove();
	}

	if (!isFM) document.querySelector(".g-single")?.appendChild(settingsMenu);
	else
		document
			.querySelector("#page_pc_userfm_songplay")
			?.appendChild(settingsMenu);
	initSettings();
	initTabs(settingsMenu);
	hijackFailureNoticeCheck();
	/*channel.call(
		"app.getLocalConfig",
		(GpuAccelerationEnabled) => {
			if (!~~GpuAccelerationEnabled) {
				document.body.classList.add('gpu-acceleration-disabled');
			}
		},
		["setting", "hardware-acceleration"]
	);*/
};

const toggleFullScreen = (force: boolean | null = null) => {
	if (!document.fullscreenElement) {
		if (force === false) return;
		document.documentElement.requestFullscreen();
		if (window.loadedPlugins.RoundCornerNCM) {
			betterncm.app.setRoundedCorner(false);
		}
		document.body.classList.add("rnp-full-screen");
		const btn = document.querySelector(
			".rnp-full-screen-button",
		) as HTMLElement;
		if (btn) btn.title = "退出全屏";
	} else {
		if (document.exitFullscreen) {
			if (force === true) return;
			document.exitFullscreen();
			if (window.loadedPlugins.RoundCornerNCM) {
				betterncm.app.setRoundedCorner(true);
			}
			document.body.classList.remove("rnp-full-screen");
			const btn = document.querySelector(
				".rnp-full-screen-button",
			) as HTMLElement;
			if (btn) btn.title = "全屏";
		}
	}
};

const addFullScreenButton = (container: Element | null = null) => {
	if (!container) container = document.body; // Fallback
	const fullScreenButton = document.createElement("div");
	fullScreenButton.classList.add("rnp-full-screen-button");
	fullScreenButton.title = "全屏";
	fullScreenButton.addEventListener("click", () => {
		toggleFullScreen();
	});
	document.body.appendChild(fullScreenButton);

	var fullScreenClock = document.createElement("div");
	fullScreenClock.classList.add("rnp-full-screen-clock");
	function updateClock() {
		var currentTime = new Date();
		var hours = String(currentTime.getHours());
		var minutes = String(currentTime.getMinutes());

		hours = `0${hours}`.slice(-2);
		minutes = `0${minutes}`.slice(-2);
		fullScreenClock.textContent = `${hours}:${minutes}`;
	}
	updateClock();
	setInterval(updateClock, 1000);
	document.body.appendChild(fullScreenClock);
};

new MutationObserver(() => {
	if (
		!document.body.classList.contains("mq-playing") &&
		document.body.classList.contains("rnp-full-screen")
	) {
		toggleFullScreen(false);
	}
}).observe(document.body, { attributes: true, attributeFilter: ["class"] });

// intercept src setter of HTMLImageElement
const _src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
Object.defineProperty(HTMLImageElement.prototype, "src", {
	get: function (this: HTMLImageElement) {
		return _src?.get?.call(this);
	},
	set: function (this: HTMLImageElement, src: string) {
		if (this.classList.contains("j-flag")) {
			if (!window.albumSize) {
				window.albumSize = 210;
			}
			const size = window.albumSize || 210;
			src = src.replace(/thumbnail=\d+y\d+/g, `thumbnail=${size}y${size}`);
			if (src.startsWith("data:image/gif;")) {
				src =
					"orpheus://cache/?https://p1.music.126.net/UeTuwE7pvjBpypWLudqukA==/3132508627578625.jpg";
			}
		}
		return _src?.set?.call(this, src);
	},
});

plugin.onLoad(async (p) => {
	compatibilityWizard();

	document.body.classList.add("refined-now-playing");

	if (!window.loadedPlugins.MaterialYouTheme) {
		document.body.classList.add("no-material-you-theme");
	}

	new MutationObserver(async () => {
		// Now playing page
		const singlePage = document.querySelector(".g-single:not(.patched)");
		if (singlePage) {
			singlePage.classList.add("patched");
			waitForElement(".n-single .cdimg img", (dom) => {
				const img = dom as HTMLImageElement;
				img.addEventListener("load", updateCDImage);
				new MutationObserver(updateCDImage).observe(img, {
					attributes: true,
					attributeFilter: ["src"],
				});

				img.addEventListener("contextmenu", (e) => {
					const event = e as MouseEvent;
					event.preventDefault();
					event.stopPropagation();
					const imageURL = img.src
						.replace(/^orpheus:\/\/cache\/\?/, "")
						.replace(/\?.*$/, "");
					showContextMenu(event.clientX, event.clientY, [
						{
							label: "复制图片地址",
							callback: () => {
								copyTextToClipboard(imageURL);
							},
						},
						{
							label: "在浏览器中打开图片",
							callback: () => {
								betterncm.app.exec(`${imageURL}`);
							},
						},
					]);
				});
			});

			waitForElement(
				".g-single .g-singlec-ct .n-single .mn .head .inf",
				(dom) => {
					const infoContainer = dom as HTMLElement;
					const addCopySelectionToItems = (
						items: any[],
						closetSelector: string,
					) => {
						const selection = window.getSelection();
						if (
							selection?.toString().trim() &&
							// @ts-expect-error
							selection.baseNode?.parentElement?.closest(closetSelector)
						) {
							const selectedText = selection.toString().trim();
							items.unshift({
								label: "复制",
								callback: () => {
									copyTextToClipboard(selectedText);
								},
							});
						}
					};

					infoContainer.addEventListener("contextmenu", (e) => {
						const event = e as MouseEvent;
						const target = event.target as HTMLElement;
						event.preventDefault();
						event.stopPropagation();

						if (target.closest(".title .name")) {
							const nameEl = infoContainer.querySelector(
								".title .name",
							) as HTMLElement;
							const songName = nameEl?.innerText || "";
							const items = [
								{
									label: "复制歌曲名",
									callback: () => {
										copyTextToClipboard(songName);
									},
								},
							];
							addCopySelectionToItems(items, ".title .name");
							showContextMenu(event.clientX, event.clientY, items);
							return;
						}

						if (target.closest(".info .alias")) {
							const aliasEl = infoContainer.querySelector(
								".info .alias",
							) as HTMLElement;
							const songAlias = aliasEl?.innerText || "";
							const items = [
								{
									label: "复制歌曲别名",
									callback: () => {
										copyTextToClipboard(songAlias);
									},
								},
							];
							addCopySelectionToItems(items, ".info .alias");
							showContextMenu(event.clientX, event.clientY, items);
							return;
						}
					});
				},
			);

			const background = document.createElement("div");
			background.classList.add("rnp-bg");
			const bgImg = await waitForElementAsync(".n-single .cdimg img");
			ReactDOM.render(
				<Background
					type={String(getSetting("background-type", "fluid"))}
					image={bgImg as HTMLImageElement}
				/>,
				background,
			);
			document.querySelector(".g-single")?.appendChild(background);

			const coverShadowController = document.createElement("div");
			coverShadowController.classList.add("rnp-cover-shadow-controller");
			const shadowImg = await waitForElementAsync(".n-single .cdimg img");
			ReactDOM.render(
				<CoverShadow image={shadowImg as HTMLImageElement} />,
				coverShadowController,
			);
			document.body.appendChild(coverShadowController);

			waitForElement(
				".g-single-track .g-singlec-ct .n-single .mn .lyric",
				(oldLyrics) => {
					oldLyrics.remove();
				},
			);
			const lyrics = document.createElement("div");
			lyrics.classList.add("lyric");
			ReactDOM.render(<Lyrics />, lyrics);
			waitForElement(".g-single-track .g-singlec-ct .n-single .wrap", (dom) => {
				dom.appendChild(lyrics);
			});

			const miniSongInfo = document.createElement("div");
			miniSongInfo.classList.add("rnp-mini-song-info");
			setTimeout(async () => {
				const miniInfoImg = await waitForElementAsync(".n-single .cdimg img");
				const miniInfoContainer = await waitForElementAsync(
					".g-single .g-singlec-ct .n-single .mn .head .inf",
				);

				ReactDOM.render(
					<MiniSongInfo
						image={miniInfoImg as HTMLImageElement}
						infContainer={miniInfoContainer as HTMLElement}
					/>,
					miniSongInfo,
				);
				document.querySelector(".g-single")?.appendChild(miniSongInfo);
			}, 0);

			addSettingsMenu();
			addFullScreenButton(document.querySelector(".g-single"));

			whatsNew();
		}
	}).observe(document.body, { childList: true });

	new MutationObserver(() => {
		recalculateTitleSize();
		calcTitleScroll();
	}).observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		characterData: true,
		attributeFilter: ["src"],
	});

	// Add progressbar hover preview
	waitForElement("#main-player .prg", (dom) => {
		const progressbarPreview = document.createElement("div");
		progressbarPreview.classList.add("rnp-progressbar-preview");
		ReactDOM.render(
			<ProgressbarPreview dom={dom as HTMLElement} />,
			progressbarPreview,
		);
		document.body.appendChild(progressbarPreview);
	});
	waitForElement(".m-player-fm .prg", (dom) => {
		const progressbarPreview = document.createElement("div");
		progressbarPreview.classList.add("rnp-progressbar-preview");
		progressbarPreview.classList.add("rnp-progressbar-preview-fm");
		ReactDOM.render(
			<ProgressbarPreview dom={dom as HTMLElement} isFM />,
			progressbarPreview,
		);
		document.body.appendChild(progressbarPreview);
	});

	// Fix incomptibility with light theme
	const lightThemeFixStyle = document.createElement("link");
	lightThemeFixStyle.rel = "stylesheet";
	document.head.appendChild(lightThemeFixStyle);
	new MutationObserver(() => {
		if (document.body.classList.contains("mq-playing")) {
			if (
				lightThemeFixStyle.href !==
				"orpheus://orpheus/style/res/less/default/css/skin.ls.css"
			) {
				lightThemeFixStyle.href =
					"orpheus://orpheus/style/res/less/default/css/skin.ls.css";
			}
		} else {
			if (lightThemeFixStyle.href !== "") {
				lightThemeFixStyle.href = "";
			}
		}
	}).observe(document.body, { attributes: true, attributeFilter: ["class"] });

	let previousHasClass = document.body.classList.contains("mq-playing");
	new MutationObserver(() => {
		const hasClass = document.body.classList.contains("mq-playing");
		if (hasClass !== previousHasClass) {
			previousHasClass = hasClass;
			if (hasClass) {
				for (let i = 0; i < 10; i++) {
					setTimeout(() => {
						window.dispatchEvent(new Event("recalc-lyrics"));
						window.dispatchEvent(new Event("recalc-title"));
					}, 50 * i);
				}
			}
		}
	}).observe(document.body, { attributes: true, attributeFilter: ["class"] });

	// 私人 FM
	const patchFM = async () => {
		const fmPage = document.querySelector(
			"#page_pc_userfm_songplay:not(.patched)",
		);
		if (fmPage) {
			fmPage.classList.add("patched");
			if (FMObserver) FMObserver.disconnect();

			const lyrics = document.createElement("div");
			lyrics.classList.add("lyric");
			document.querySelector("#page_pc_userfm_songplay")?.appendChild(lyrics);
			ReactDOM.render(<Lyrics isFM={true} />, lyrics);
			for (let i = 0; i < 15; i++) {
				setTimeout(() => {
					window.dispatchEvent(new Event("resize"));
				}, 200 * i);
			}

			const background = document.createElement("div");
			background.classList.add("rnp-bg", "fm-bg");

			const fmCover = await waitForElementAsync(
				"#page_pc_userfm_songplay .fmplay .covers",
			);
			ReactDOM.render(
				<Background
					type={String(getSetting("background-type", "fluid"))}
					image={fmCover as HTMLImageElement}
					isFM={true}
					imageChangedCallback={(dom) => {
						if (!dom) return;
						calcAccentColor(dom, true);
					}}
				/>,
				background,
			);
			document
				.querySelector("#page_pc_userfm_songplay")
				?.appendChild(background);
			addSettingsMenu(true);
		}
	};

	const FMObserver = new MutationObserver(patchFM);
	window.addEventListener("hashchange", async () => {
		if (!window.location.hash.startsWith("#/m/fm/")) {
			FMObserver.disconnect();
			return;
		}
		for (let i = 0; i < 10; i++) {
			setTimeout(() => {
				window.dispatchEvent(new Event("recalc-lyrics"));
				window.dispatchEvent(new Event("recalc-title"));
			}, 50 * i);
		}
		FMObserver.observe(document.body, { childList: true });
		window.dispatchEvent(new Event("recalc-lyrics"));
	});

	// Listen system theme change
	const toggleSystemDarkmodeClass = (
		media: MediaQueryList | MediaQueryListEvent,
	) => {
		document.body.classList.add(
			media.matches ? "rnp-system-dark" : "rnp-system-light",
		);
		document.body.classList.remove(
			media.matches ? "rnp-system-light" : "rnp-system-dark",
		);
		if (document.body.classList.contains("rnp-system-dynamic-theme-auto")) {
			window.mdThemeType = media.matches ? "dark" : "light";
		}
	};
	const systemDarkmodeMedia = window.matchMedia("(prefers-color-scheme: dark)");
	systemDarkmodeMedia.addEventListener("change", (e) => {
		toggleSystemDarkmodeClass(e);
	});
	toggleSystemDarkmodeClass(systemDarkmodeMedia);

	// Idle detection
	const IdleThreshold = 1.5 * 1000;
	let idleTimer: ReturnType<typeof setTimeout> | null = null;
	let idle = false;
	let debounceTime: number | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const resetIdleTimer = () => {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(() => {
			idle = true;
			document.body.classList.add("rnp-idle");
			if (debounceTimer) clearTimeout(debounceTimer);
		}, IdleThreshold);
	};

	const resetIdle = () => {
		if (idle) {
			idle = false;
			document.body.classList.remove("rnp-idle");
			debounceTime = new Date().getTime();
		}
		resetIdleTimer();
	};

	const setIdle = () => {
		debounceTimer = setTimeout(
			() => {
				if (idleTimer) clearTimeout(idleTimer);
				idle = true;
				document.body.classList.add("rnp-idle");
			},
			Math.max((debounceTime ?? 0) + 325 - new Date().getTime(), 0),
		);
	};

	resetIdleTimer();
	document.addEventListener("mousemove", resetIdle);
	document.addEventListener("mouseout", (e) => {
		if (e.relatedTarget === null) {
			setIdle();
		}
	});

	// Listen for now playing open
	new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.addedNodes.length > 0) {
				mutation.addedNodes.forEach((node) => {
					const el = node as HTMLElement;
					if (el.classList && el.classList.contains("g-single")) {
						document.body.classList.add("mq-playing");
						el.classList.add("z-show");
					}
				});
			}
		});
	}).observe(document.body, { childList: true });
	/*new MutationObserver(() => {
		if (!document.body.classList.contains('mq-playing') && !document.querySelector('.g-single')?.classList.contains('z-show')) {
			if (document.body.classList.contains('mq-playing-init')) {
				document.body.classList.remove('mq-playing-init');
			}
		}
	}).observe(document.body, { attributes: true, attributeFilter: ['class'] });*/
});

plugin.onConfig((tools) => {
	return dom(
		"div",
		{},
		dom("span", {
			innerHTML: "打开正在播放界面以调整设置 ",
			style: { fontSize: "18px" },
		}),
		tools.makeBtn("打开", async () => {
			(document.querySelector("a[data-action='max']") as HTMLElement)?.click();
		}),
		dom("div", { innerHTML: "", style: { height: "20px" } }),
		dom("span", {
			innerHTML: "进入兼容性检查页面 ",
			style: { fontSize: "18px" },
		}),
		tools.makeBtn("兼容性检查", async () => {
			compatibilityWizard(true);
		}),
	);
});
