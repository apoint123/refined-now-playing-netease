import { atomWithPluginSetting } from "./utils";

// ==================== 外观 ====================
export const exclusiveModeAtom = atomWithPluginSetting<
	"all" | "lyric-only" | "song-info-only" | "none"
>("exclusive-modes", "all");
export const centerLyricAtom = atomWithPluginSetting("center-lyric", false);
export const autoHideMiniInfoAtom = atomWithPluginSetting(
	"auto-hide-mini-song-info",
	true,
);
export const colorSchemeAtom = atomWithPluginSetting<"dark" | "light" | "auto">(
	"color-scheme",
	"auto",
);
export const accentColorVariantAtom = atomWithPluginSetting<
	"off" | "primary" | "secondary" | "tertiary" | "neutral"
>("accent-color-variant", "primary");
export const textShadowAtom = atomWithPluginSetting("text-shadow", false);
export const textGlowAtom = atomWithPluginSetting("text-glow", false);
export const refinedControlBarAtom = atomWithPluginSetting(
	"refined-control-bar",
	true,
);
export const alwaysShowBottomBarAtom = atomWithPluginSetting(
	"always-show-bottombar",
	false,
);
export const bottomProgressBarAtom = atomWithPluginSetting(
	"bottom-progressbar",
	false,
);
export const enableProgressbarPreviewAtom = atomWithPluginSetting(
	"enable-progressbar-preview",
	true,
);

// ==================== 封面 ====================
export const coverAlignHAtom = atomWithPluginSetting<"left" | "center">(
	"horizontal-align",
	"left",
);
export const coverAlignVAtom = atomWithPluginSetting<"bottom" | "middle">(
	"vertical-align",
	"bottom",
);
export const rectangleCoverAtom = atomWithPluginSetting(
	"rectangle-cover",
	true,
);
export const albumSizeAtom = atomWithPluginSetting("album-size", 200);
export const coverBlurryShadowAtom = atomWithPluginSetting(
	"cover-blurry-shadow",
	true,
);

// ==================== 背景 ====================
export const backgroundTypeAtom = atomWithPluginSetting<
	"fluid" | "blur" | "gradient" | "solid" | "none"
>("background-type", "fluid");
export const staticFluidAtom = atomWithPluginSetting("static-fluid", false);
export const gradientBgDynamicAtom = atomWithPluginSetting(
	"gradient-bg-dynamic",
	true,
);
export const bgBlurAtom = atomWithPluginSetting("bg-blur", 90);
export const bgDimAtom = atomWithPluginSetting("bg-dim", 55);
export const bgDimForGradientAtom = atomWithPluginSetting(
	"bg-dim-for-gradient-bg",
	45,
);
export const bgDimForFluidAtom = atomWithPluginSetting(
	"bg-dim-for-fluid-bg",
	30,
);
export const bgBlurForNoneAtom = atomWithPluginSetting(
	"bg-blur-for-none-bg-mask",
	0,
);
export const bgDimForNoneAtom = atomWithPluginSetting(
	"bg-dim-for-none-bg-mask",
	0,
);
export const bgOpacityAtom = atomWithPluginSetting("bg-opacity", 0);

// ==================== 歌词 ====================
export const originalLyricBoldAtom = atomWithPluginSetting(
	"original-lyric-bold",
	true,
);
export const lyricFontSizeAtom = atomWithPluginSetting("lyric-font-size", 32);
export const lyricRomajiSizeAtom = atomWithPluginSetting(
	"lyric-romaji-size-em",
	0.6,
);
export const lyricTranslationSizeAtom = atomWithPluginSetting(
	"lyric-translation-size-em",
	1.0,
);
export const lyricFadeAtom = atomWithPluginSetting("lyric-fade", false);
export const lyricZoomAtom = atomWithPluginSetting("lyric-zoom", false);
export const lyricBlurAtom = atomWithPluginSetting("lyric-blur", false);
export const lyricRotateAtom = atomWithPluginSetting("lyric-rotate", false);
export const rotateCurvatureAtom = atomWithPluginSetting(
	"rotate-curvature",
	30,
);
export const karaokeAnimationAtom = atomWithPluginSetting<"float" | "slide">(
	"karaoke-animation",
	"float",
);
export const lyricAlignmentAtom = atomWithPluginSetting(
	"current-lyric-alignment-percentage",
	50,
);
export const lyricStaggerAtom = atomWithPluginSetting("lyric-stagger", true);
export const lyricAnimationTimingAtom = atomWithPluginSetting<
	"smooth" | "sharp" | "lazy" | "easeout"
>("lyric-animation-timing", "smooth");
export const lyricGlowAtom = atomWithPluginSetting("lyric-glow", true);
export const lyricOffsetAtom = atomWithPluginSetting("lyric-offset", 0);
export const lyricContributorsDisplayAtom = atomWithPluginSetting<
	"show" | "hover" | "hide"
>("lyric-contributors-display", "hover");

// ==================== 字体 ====================
export const customFontAtom = atomWithPluginSetting("custom-font", false);
export const customFontFamilyAtom = atomWithPluginSetting<string[]>(
	"font-family",
	[],
);

// ==================== 杂项 ====================
export const hideSongAliasAtom = atomWithPluginSetting(
	"hide-song-alias-name",
	false,
);
export const hideCommentsAtom = atomWithPluginSetting("hide-comments", false);
export const partialBgAtom = atomWithPluginSetting("partial-bg", false);

// ==================== 实验性 ====================
export const fluidMaxFramerateAtom = atomWithPluginSetting(
	"fluid-max-framerate",
	4,
); // 0-4 代表不同档位
export const fluidBlurAtom = atomWithPluginSetting("fluid-blur", 6); // 指数
export const hideBottomBarWhenIdleAtom = atomWithPluginSetting(
	"hide-entire-bottombar-when-idle",
	false,
);
export const presentationModeAtom = atomWithPluginSetting(
	"presentation-mode",
	false,
);
