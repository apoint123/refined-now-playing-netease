import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { imageInterceptor } from "@/services/image-interceptor.ts";
import { themeService } from "@/services/theme";
import * as S from "@/store/settings";

// 根据布尔值切换 Body Class
const useBodyClass = (className: string, isActive: boolean) => {
	useEffect(() => {
		if (isActive) document.body.classList.add(className);
		else document.body.classList.remove(className);
	}, [className, isActive]);
};

// 设置 CSS 变量
const useCSSVariable = (name: string, value: string | number) => {
	useEffect(() => {
		document.body.style.setProperty(name, String(value));
	}, [name, value]);
};

// 派发自定义事件
const useCustomEvent = (eventName: string, detail: any) => {
	useEffect(() => {
		document.dispatchEvent(new CustomEvent(eventName, { detail }));
	}, [eventName, detail]);
};

export const GlobalStyleManager = () => {
	// ==================== 外观 ====================
	const exclusiveMode = useAtomValue(S.exclusiveModeAtom);
	const centerLyric = useAtomValue(S.centerLyricAtom);
	const autoHideMiniInfo = useAtomValue(S.autoHideMiniInfoAtom);
	const colorScheme = useAtomValue(S.colorSchemeAtom);
	const accentColorVariant = useAtomValue(S.accentColorVariantAtom);
	const textShadow = useAtomValue(S.textShadowAtom);
	const textGlow = useAtomValue(S.textGlowAtom);
	const refinedControlBar = useAtomValue(S.refinedControlBarAtom);
	const alwaysShowBottomBar = useAtomValue(S.alwaysShowBottomBarAtom);
	const bottomProgressBar = useAtomValue(S.bottomProgressBarAtom);
	const enablePreview = useAtomValue(S.enableProgressbarPreviewAtom);

	// Class 绑定
	useBodyClass("no-exclusive-mode", exclusiveMode === "all");
	useBodyClass("lyric-only", exclusiveMode === "lyric-only");
	useBodyClass("song-info-only", exclusiveMode === "song-info-only");
	useBodyClass("center-lyric", centerLyric);
	useBodyClass("auto-hide-mini-song-info", autoHideMiniInfo);
	useBodyClass("rnp-shadow", textShadow);
	useBodyClass("rnp-text-glow", textGlow);
	useBodyClass("refined-control-bar", refinedControlBar);
	useBodyClass("always-show-bottombar", alwaysShowBottomBar);
	useBodyClass("rnp-bottom-progressbar", bottomProgressBar);
	useBodyClass("enable-progressbar-preview", enablePreview);

	useEffect(() => {
		["dark", "light", "auto"].forEach((mode) => {
			document.body.classList.remove(`rnp-${mode}`);
		});
		document.body.classList.add(`rnp-${colorScheme}`);
	}, [colorScheme]);

	// Accent Color 特殊逻辑
	useEffect(() => {
		document.body.classList.remove(
			"enable-accent-color",
			"accent-color-primary",
			"accent-color-secondary",
			"accent-color-tertiary",
			"accent-color-neutral",
		);

		if (accentColorVariant !== "off") {
			document.body.classList.add(
				"enable-accent-color",
				`accent-color-${accentColorVariant}`,
			);

			themeService.setVariant(accentColorVariant);
		}
	}, [accentColorVariant]);

	// ==================== 封面 ====================
	const alignH = useAtomValue(S.coverAlignHAtom);
	const alignV = useAtomValue(S.coverAlignVAtom);
	const rectCover = useAtomValue(S.rectangleCoverAtom);
	const albumSize = useAtomValue(S.albumSizeAtom);
	const blurryShadow = useAtomValue(S.coverBlurryShadowAtom);

	useBodyClass("rectangle-cover", rectCover);
	useBodyClass("cover-blurry-shadow", blurryShadow);

	useEffect(() => {
		["left", "center"].forEach((v) => {
			document.body.classList.remove(`horizontal-align-${v}`);
		});
		document.body.classList.add(`horizontal-align-${alignH}`);
	}, [alignH]);

	useEffect(() => {
		["bottom", "middle"].forEach((v) => {
			document.body.classList.remove(`vertical-align-${v}`);
		});
		document.body.classList.add(`vertical-align-${alignV}`);
	}, [alignV]);

	// 封面特殊逻辑: Album Size
	useEffect(() => {
		imageInterceptor.setTargetSize(albumSize);

		const updateImage = (selector: string) => {
			const img = document.querySelector(selector) as HTMLImageElement;
			if (!img || !img.src) return;

			const currentSrc = img.src;
			const newSrc = currentSrc.replace(
				/thumbnail=\d+y\d+/g,
				`thumbnail=${albumSize}y${albumSize}`,
			);

			if (currentSrc !== newSrc) {
				img.src = newSrc;
			}
		};

		updateImage(".n-single .cdimg img");
	}, [albumSize]);

	// 封面特殊逻辑: Shadow Type Event
	useCustomEvent("rnp-cover-shadow-type", {
		type: blurryShadow ? "colorful" : "black",
	});

	// ==================== 背景 ====================
	const bgType = useAtomValue(S.backgroundTypeAtom);
	const staticFluid = useAtomValue(S.staticFluidAtom);
	const gradientDynamic = useAtomValue(S.gradientBgDynamicAtom);
	const bgBlur = useAtomValue(S.bgBlurAtom);
	const bgDim = useAtomValue(S.bgDimAtom);
	const bgDimGradient = useAtomValue(S.bgDimForGradientAtom);
	const bgDimFluid = useAtomValue(S.bgDimForFluidAtom);
	const bgBlurNone = useAtomValue(S.bgBlurForNoneAtom);
	const bgDimNone = useAtomValue(S.bgDimForNoneAtom);
	const bgOpacity = useAtomValue(S.bgOpacityAtom);

	useEffect(() => {
		["fluid", "blur", "gradient", "solid", "none"].forEach((t) => {
			document.body.classList.remove(`rnp-bg-${t}`);
		});
		document.body.classList.add(`rnp-bg-${bgType}`);
	}, [bgType]);

	useCustomEvent("rnp-background-type", { type: bgType });
	useCustomEvent("rnp-static-fluid", staticFluid);

	useBodyClass("static-fluid", staticFluid);
	useBodyClass("gradient-bg-dynamic", gradientDynamic);

	useCSSVariable("--bg-blur", `${bgBlur}px`);
	useCSSVariable("--bg-dim", bgDim / 100);
	useCSSVariable("--bg-dim-for-gradient-bg", bgDimGradient / 100);
	useCSSVariable("--bg-dim-for-fluid-bg", bgDimFluid / 100);
	useCSSVariable("--bg-blur-for-none-bg-mask", `${bgBlurNone}px`);
	useCSSVariable("--bg-dim-for-none-bg-mask", bgDimNone / 100);
	useCSSVariable("--bg-opacity", 1 - bgOpacity / 100);

	// ==================== 歌词 ====================
	const originalBold = useAtomValue(S.originalLyricBoldAtom);
	const lyricSize = useAtomValue(S.lyricFontSizeAtom);
	const romajiSize = useAtomValue(S.lyricRomajiSizeAtom);
	const transSize = useAtomValue(S.lyricTranslationSizeAtom);
	const lyricFade = useAtomValue(S.lyricFadeAtom);
	const lyricZoom = useAtomValue(S.lyricZoomAtom);
	const lyricBlur = useAtomValue(S.lyricBlurAtom);
	const lyricRotate = useAtomValue(S.lyricRotateAtom);
	const rotateCurve = useAtomValue(S.rotateCurvatureAtom);
	const karaokeAnim = useAtomValue(S.karaokeAnimationAtom);
	const lyricAlign = useAtomValue(S.lyricAlignmentAtom);
	const lyricStagger = useAtomValue(S.lyricStaggerAtom);
	const animTiming = useAtomValue(S.lyricAnimationTimingAtom);
	const lyricGlow = useAtomValue(S.lyricGlowAtom);
	const lyricContributors = useAtomValue(S.lyricContributorsDisplayAtom);
	const lyricOffset = useAtomValue(S.lyricOffsetAtom);

	useBodyClass("original-lyric-bold", originalBold);
	useBodyClass("lyric-rotate", lyricRotate);
	useBodyClass(`rnp-karaoke-animation-${karaokeAnim}`, true);
	useBodyClass(`rnp-current-lyric-alignment-${lyricAlign}`, true);
	useBodyClass(`rnp-lyric-animation-timing-${animTiming}`, true);
	useBodyClass(`rnp-lyric-contributors-${lyricContributors}`, true);

	useCustomEvent("rnp-lyric-font-size", lyricSize);
	useCSSVariable("--lyric-romaji-size-em", `${romajiSize}em`);
	useCSSVariable("--lyric-translation-size-em", `${transSize}em`);

	useCustomEvent("rnp-lyric-fade", lyricFade);
	useCustomEvent("rnp-lyric-zoom", lyricZoom);
	useCustomEvent("rnp-lyric-blur", lyricBlur);
	useCustomEvent("rnp-lyric-rotate", lyricRotate);
	useCustomEvent("rnp-rotate-curvature", rotateCurve);
	useCustomEvent("rnp-karaoke-animation", karaokeAnim);
	useCustomEvent("rnp-current-lyric-alignment-percentage", lyricAlign);
	useCustomEvent("rnp-lyric-stagger", lyricStagger);
	useCustomEvent("rnp-lyric-glow", lyricGlow);
	useCustomEvent("rnp-global-offset", lyricOffset);

	const fontFamily = useAtomValue(S.customFontFamilyAtom);

	useEffect(() => {
		const styleId = "rnp-font-family-controller";
		let style = document.getElementById(styleId) as HTMLStyleElement;

		if (!style) {
			style = document.createElement("style");
			style.id = styleId;
			document.head.appendChild(style);
		}

		const fontStr = fontFamily.length
			? fontFamily.map((font) => `'${font}'`).join(", ")
			: "inherit";

		style.innerHTML = `
            body.rnp-custom-font .g-single-track .lyric *,
            body.rnp-custom-font .n-single .head *,
            body.rnp-custom-font .m-fm > *:not(.fmcmt) * {
                font-family: ${fontStr} !important;
            }
        `;
	}, [fontFamily]);

	// ==================== 杂项 & 实验性 ====================
	const customFont = useAtomValue(S.customFontAtom);
	const hideAlias = useAtomValue(S.hideSongAliasAtom);
	const hideComments = useAtomValue(S.hideCommentsAtom);
	const partialBg = useAtomValue(S.partialBgAtom);
	const fluidMaxFrame = useAtomValue(S.fluidMaxFramerateAtom);
	const fluidBlur = useAtomValue(S.fluidBlurAtom);
	const hideBottomIdle = useAtomValue(S.hideBottomBarWhenIdleAtom);
	const presentation = useAtomValue(S.presentationModeAtom);

	useBodyClass("rnp-custom-font", customFont);
	useBodyClass("hide-song-alias-name", hideAlias);
	useBodyClass("hide-comments", hideComments);
	useBodyClass("partial-bg", partialBg);
	useBodyClass("hide-entire-bottombar-when-idle", hideBottomIdle);
	useBodyClass("presentation-mode", presentation);

	useEffect(() => {
		const arr = ["5", "10", "30", "60", "inf"];
		arr.forEach((f) => {
			document.body.classList.remove(`rnp-fluid-max-framerate-${f}`);
		});
		document.body.classList.add(
			`rnp-fluid-max-framerate-${arr[fluidMaxFrame]}`,
		);
	}, [fluidMaxFrame]);

	useCSSVariable("--fluid-blur", `${2 ** fluidBlur}px`);

	return null;
};
