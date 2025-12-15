import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import type { ExtendedLyricLine } from "@/lyric-provider";
import * as S from "@/store/settings";

export interface TransformItem {
	top: number;
	scale: number;
	delay: number;
	blur?: number;
	opacity?: number;
	rotate?: number;
	extraTop?: number;
	left?: number;
	outOfRangeHidden?: boolean;
	duration?: number;
}

const getCustomFunc = (key: string) => {
	const raw = localStorage.getItem(key);
	return raw
		? (new Function("offset", raw) as (offset: number) => number)
		: null;
};
const customOpacityFunc = getCustomFunc("rnp-custom-opacity-func");
const customBlurFunc = getCustomFunc("rnp-custom-blur-func");
const customScaleFunc = getCustomFunc("rnp-custom-scale-func");

interface UseLyricLayoutProps {
	lyrics: ExtendedLyricLine[] | null;
	containerRef: React.RefObject<HTMLDivElement>;
	heightOfItems: React.MutableRefObject<number[]>;
	currentLine: number;
	scrollingMode: boolean;
	scrollingFocusLine: number;
	recalcCounter: number;
}

export const useLyricLayout = ({
	lyrics,
	containerRef,
	heightOfItems,
	currentLine,
	scrollingMode,
	scrollingFocusLine,
	recalcCounter,
}: UseLyricLayoutProps) => {
	const [lineTransforms, setLineTransforms] = useState<TransformItem[]>([]);
	const shouldTransit = useRef(true);

	const fontSize = useAtomValue(S.lyricFontSizeAtom);
	const lyricFade = useAtomValue(S.lyricFadeAtom);
	const lyricZoom = useAtomValue(S.lyricZoomAtom);
	const lyricBlur = useAtomValue(S.lyricBlurAtom);
	const lyricRotate = useAtomValue(S.lyricRotateAtom);
	const rotateCurvature = useAtomValue(S.rotateCurvatureAtom);
	const alignmentPercent = useAtomValue(S.lyricAlignmentAtom);
	const lyricStagger = useAtomValue(S.lyricStaggerAtom);
	const showTrans = useAtomValue(S.showTranslationAtom);
	const showRomaji = useAtomValue(S.showRomajiAtom);
	const useKaraoke = useAtomValue(S.useKaraokeLyricsAtom);
	const karaokeAnim = useAtomValue(S.karaokeAnimationAtom);

	const previousFocusedLineRef = useRef(0);
	const focusLine = scrollingMode ? scrollingFocusLine : currentLine;

	useEffect(() => {
		if (!lyrics || !containerRef.current) return;

		const containerHeight = containerRef.current.clientHeight;
		const space = fontSize * 1.2;

		const items = containerRef.current.children;
		for (let i = 0; i < lyrics.length + 1; i++) {
			const item = items[i] as HTMLElement;
			if (item) {
				heightOfItems.current[i] = item.clientHeight;
			} else {
				heightOfItems.current[i] = 50;
			}
		}

		const delayByOffset = (offset: number) => {
			if (focusLine === previousFocusedLineRef.current || scrollingMode)
				return 0;
			if (!lyricStagger) return 0;
			const sign = focusLine - previousFocusedLineRef.current > 0 ? 1 : -1;
			offset = Math.max(-4, Math.min(4, offset)) * sign + 4;
			return offset * 50;
		};

		const scaleByOffset = (offset: number) => {
			if (!lyricZoom) return 1;
			if (customScaleFunc) {
				try {
					return customScaleFunc(offset);
				} catch (e) {
					console.error(e);
				}
			}
			offset = Math.abs(offset);
			offset = Math.max(1 - offset * 0.2, 0);
			return offset * offset * offset * 0.3 + 0.7;
		};

		const blurByOffset = (offset: number) => {
			if (!lyricBlur || scrollingMode) return 0;
			if (customBlurFunc) {
				try {
					return customBlurFunc(offset);
				} catch (e) {
					console.error(e);
				}
			}
			offset = Math.abs(offset);
			if (offset === 0) return 0;
			return Math.min(0.5 + 1 * offset, 4.5);
		};

		const opacityByOffset = (offset: number) => {
			if (!lyricFade || scrollingMode) return 1;
			if (customOpacityFunc) {
				try {
					return customOpacityFunc(offset);
				} catch (e) {
					console.error(e);
				}
			}
			offset = Math.abs(offset);
			if (offset <= 1) return 1;
			return Math.max(1 - 0.4 * (offset - 1), 0);
		};

		const setRotateTransform = (
			line: TransformItem,
			yOffset: number,
			height: number,
		) => {
			if (!lyricRotate) return;
			const origin = [-120 + (rotateCurvature - 25), -(yOffset + height / 2)];
			const len = Math.sqrt(origin[0] * origin[0] + origin[1] * origin[1]);

			line.rotate = Math.min(
				(yOffset / window.innerHeight) * -rotateCurvature,
				90,
			);
			const deg =
				line.rotate + (Math.atan2(origin[1], origin[0]) * 180) / Math.PI;

			line.extraTop = Math.sin((deg * Math.PI) / 180) * len - origin[1];
			line.left = Math.cos((deg * Math.PI) / 180) * len - origin[0];

			const opacity =
				1 - 1 * Math.abs((yOffset * 2) / window.innerHeight) ** 1.15 * 1.2;
			line.opacity = Math.max(opacity, 0);

			if (opacity <= -1.5) line.outOfRangeHidden = true;
			else if (line.outOfRangeHidden) delete line.outOfRangeHidden;
		};

		const transforms: TransformItem[] = [];
		for (let i = 0; i <= lyrics.length; i++) {
			transforms.push({ top: 0, scale: 1, delay: 0 });
		}

		let current = Math.min(Math.max(focusLine ?? 0, 0), lyrics.length - 1);
		if (current === -1) current = 0;

		if (!heightOfItems.current[current]) heightOfItems.current[current] = 50;

		transforms[current].top =
			containerHeight * (alignmentPercent * 0.01) -
			heightOfItems.current[current] / 2;
		transforms[current].scale = 1;
		transforms[current].delay = delayByOffset(0);
		transforms[current].blur = blurByOffset(0);

		for (let i = current - 1; i >= 0; i--) {
			transforms[i].scale = scaleByOffset(current - i);
			transforms[i].blur = blurByOffset(i - current);
			transforms[i].opacity = opacityByOffset(i - current);
			const scaledHeight =
				(heightOfItems.current[i] || 30) * transforms[i].scale;
			transforms[i].top = transforms[i + 1].top - scaledHeight - space;
			transforms[i].delay = delayByOffset(i - current);
			setRotateTransform(
				transforms[i],
				transforms[current].top - transforms[i].top,
				scaledHeight,
			);
		}

		for (let i = current + 1; i < lyrics.length; i++) {
			transforms[i].scale = scaleByOffset(i - current);
			transforms[i].blur = blurByOffset(i - current);
			transforms[i].opacity = opacityByOffset(i - current);
			const previousScaledHeight =
				(heightOfItems.current[i - 1] || 30) * transforms[i - 1].scale;
			transforms[i].top = transforms[i - 1].top + previousScaledHeight + space;
			transforms[i].delay = delayByOffset(i - current);
			setRotateTransform(
				transforms[i],
				transforms[current].top - transforms[i].top,
				(heightOfItems.current[i] || 30) * transforms[i].scale,
			);
		}

		const footerIdx = lyrics.length;
		transforms[footerIdx].scale = scaleByOffset(lyrics.length - 1 - current);
		transforms[footerIdx].blur = blurByOffset(lyrics.length - 1 - current);
		transforms[footerIdx].opacity = opacityByOffset(
			lyrics.length - 1 - current,
		);

		if (lyrics.length > 0) {
			const previousScaledHeight =
				(heightOfItems.current[lyrics.length - 1] || 30) *
				transforms[lyrics.length - 1].scale;
			transforms[footerIdx].top =
				transforms[lyrics.length - 1].top +
				previousScaledHeight +
				Math.min(space * 1.5, 90);
		} else {
			transforms[footerIdx].top =
				containerHeight / 2 - (heightOfItems.current[lyrics.length] || 50) / 2;
		}
		transforms[footerIdx].delay = delayByOffset(lyrics.length - current);
		setRotateTransform(
			transforms[footerIdx],
			transforms[current].top - transforms[footerIdx].top,
			(heightOfItems.current[lyrics.length] || 50) *
				transforms[footerIdx].scale,
		);

		const currentLineHeight = heightOfItems.current[current];
		heightOfItems.current[current] = currentLineHeight;

		if (!shouldTransit.current && !scrollingMode) {
			for (let i = 0; i <= lyrics.length; i++) {
				transforms[i].delay = 0;
				transforms[i].duration = 0;
			}
		}

		setLineTransforms(transforms);
		previousFocusedLineRef.current = focusLine;

		shouldTransit.current = true;
	}, [
		focusLine,
		fontSize,
		lyricFade,
		lyricZoom,
		lyricBlur,
		lyricRotate,
		rotateCurvature,
		alignmentPercent,
		lyricStagger,
		showTrans,
		showRomaji,
		useKaraoke,
		karaokeAnim,
		lyrics,
		recalcCounter,
	]);

	return { lineTransforms, shouldTransit };
};
