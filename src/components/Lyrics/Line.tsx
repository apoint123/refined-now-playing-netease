import { useAtomValue } from "jotai";
import React, { useEffect, useRef } from "react";
import { showContextMenu } from "@/context-menu";
import type { DynamicLyricWord } from "@/liblyric";
import type { ExtendedLyricLine } from "@/lyric-provider";
import * as S from "@/store/settings";
import { copyTextToClipboard } from "@/utils";

interface LineProps {
	id: number;
	line: ExtendedLyricLine;
	currentLine: number;
	currentTime: number;
	getCurrentTime: () => number;
	playState: boolean;
	jumpToTime: (time: number) => void;
	transform: any;
	outOfRangeScrolling: boolean;
	seekCounter: number;
}

export const Line = React.memo(
	({
		id,
		line,
		currentLine,
		currentTime,
		getCurrentTime,
		playState,
		jumpToTime,
		transform,
		outOfRangeScrolling,
		seekCounter,
	}: LineProps) => {
		const showTranslation = useAtomValue(S.showTranslationAtom);
		const showRomaji = useAtomValue(S.showRomajiAtom);
		const useKaraoke = useAtomValue(S.useKaraokeLyricsAtom);
		const karaokeAnimation = useAtomValue(S.karaokeAnimationAtom);
		const lyricGlow = useAtomValue(S.lyricGlowAtom);

		if (outOfRangeScrolling) {
			return (
				<div
					className={`rnp-lyrics-line ${line.isInterlude ? "rnp-interlude" : ""}`}
					style={{ display: "none" }}
				/>
			);
		}

		if (line.originalLyric === "") {
			line.isInterlude = true;
		}

		const offset = id - currentLine;
		const isCurrent = id === currentLine;
		const isKaraokeActive =
			line.dynamicLyric && useKaraoke && Math.abs(offset) <= 10;

		const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
			e.preventDefault();
			if (line.isInterlude || !line.originalLyric) return;

			let all = line.originalLyric;
			if (showRomaji && line.romanLyric) all += `\n${line.romanLyric}`;
			if (showTranslation && line.translatedLyric)
				all += `\n${line.translatedLyric}`;

			const items: any[] = [
				{ label: "复制该句歌词", callback: () => copyTextToClipboard(all) },
			];

			if (line.romanLyric || line.translatedLyric) {
				items.push({ divider: true });
				items.push({
					label: "复制原文",
					callback: () => copyTextToClipboard(line.originalLyric),
				});
				if (line.romanLyric)
					items.push({
						label: "复制罗马音",
						callback: () => copyTextToClipboard(line.romanLyric!),
					});
				if (line.translatedLyric)
					items.push({
						label: "复制翻译",
						callback: () => copyTextToClipboard(line.translatedLyric!),
					});
			}
			showContextMenu(e.clientX, e.clientY, items);
		};

		return (
			<div
				className={`rnp-lyrics-line ${offset < 0 ? "passed" : ""} ${line.isInterlude ? "rnp-interlude" : ""}`}
				data-offset={offset}
				onClick={() => jumpToTime(line.time + 50)}
				onContextMenu={handleContextMenu}
				style={{
					display: outOfRangeScrolling ? "none" : "block",
					transform: `
                    ${transform.left ? `translateX(${transform.left}px)` : ""}
                    translateY(${transform.top + (transform?.extraTop ?? 0)}px)
                    scale(${transform.scale})
                    ${transform.rotate ? `rotate(${transform.rotate}deg)` : ""}
                `,
					transitionDelay: `${transform.delay}ms`,
					transitionDuration: `${transform?.duration ?? 500}ms`,
					filter: transform?.blur ? `blur(${transform?.blur}px)` : "none",
					opacity: transform?.opacity ?? 1,
					visibility: transform?.outOfRangeHidden ? "hidden" : undefined,
				}}
			>
				{isKaraokeActive ? (
					<KaraokeLine
						words={line.dynamicLyric!}
						isCurrent={isCurrent}
						currentTime={currentTime}
						getCurrentTime={getCurrentTime}
						playState={playState}
						animationType={karaokeAnimation}
						enableGlow={lyricGlow}
						offset={offset}
					/>
				) : (
					line.originalLyric && (
						<div className="rnp-lyrics-line-original">{line.originalLyric}</div>
					)
				)}

				{line.romanLyric && showRomaji && (
					<div className="rnp-lyrics-line-romaji">{line.romanLyric}</div>
				)}
				{line.translatedLyric && showTranslation && (
					<div className="rnp-lyrics-line-translated">
						{line.translatedLyric}
					</div>
				)}

				{line.isInterlude && (
					<Interlude
						id={id}
						line={line}
						currentLine={currentLine}
						currentTime={currentTime}
						playState={playState}
						seekCounter={seekCounter}
					/>
				)}
			</div>
		);
	},
);

interface KaraokeLineProps {
	words: DynamicLyricWord[];
	isCurrent: boolean;
	currentTime: number;
	getCurrentTime: () => number;
	playState: boolean;
	animationType: "float" | "slide";
	enableGlow: boolean;
	offset: number;
}

interface GlowAnimationRef {
	animation: Animation;
	timing: {
		fadeIn: number;
		keep: number;
		fadeAway: number;
		duration: number;
		wordTime: number;
		wordDuration: number;
	};
}

export const KaraokeLine = ({
	words,
	isCurrent,
	currentTime,
	getCurrentTime,
	playState,
	animationType,
	enableGlow,
	offset,
}: KaraokeLineProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const glowAnimationsRef = useRef<GlowAnimationRef[]>([]);

	useEffect(() => {
		if (!isCurrent || !containerRef.current) return;
		containerRef.current.classList.add("force-refresh");
		const timer = setTimeout(() => {
			containerRef.current?.classList.remove("force-refresh");
		}, 6);
		return () => clearTimeout(timer);
	}, [isCurrent]);

	const karaokeAnimationFloat = (
		word: DynamicLyricWord,
	): React.CSSProperties => {
		if (!isCurrent) {
			return {
				transitionDuration: `200ms`,
				transitionDelay: `0ms`,
			};
		}
		if (playState === false && word.time + word.duration - currentTime > 0) {
			return {
				transitionDuration: `0s`,
				transitionDelay: `0ms`,
				opacity: Math.max(
					0.4 + (0.6 * (currentTime - word.time)) / word.duration,
					0.4,
				),
				transform: `translateY(-${Math.max(((currentTime - word.time) / word.duration) * 2, 0)}px)`,
			};
		}
		return {
			transitionDuration: `${word.duration}ms, ${word.duration + 150}ms`,
			transitionDelay: `${word.time - currentTime}ms`,
		};
	};

	const karaokeAnimationSlide = (
		word: DynamicLyricWord,
	): React.CSSProperties => {
		if (!isCurrent) {
			return {
				transitionDuration: `0ms, 0ms, 0.5s`,
				transitionDelay: `0ms`,
			};
		}
		if (playState === false && word.time + word.duration - currentTime > 0) {
			return {
				transitionDuration: `0s, 0s, 0.5s`,
				transitionDelay: `0ms`,
				transform: `translateY(-${Math.max(((currentTime - word.time) / word.duration) * 1, 0)}px)`,
				WebkitMaskPositionX: `${100 - Math.max(((currentTime - word.time) / word.duration) * 100, 0)}%`,
			};
		}
		return {
			transitionDuration: `${word.duration}ms, ${word.duration * 0.8}ms, 0.5s`,
			transitionDelay: `${word.time - currentTime}ms, ${word.time - currentTime + word.duration * 0.5}ms, 0ms`,
			WebkitMaskPositionX: "0%",
		};
	};

	const getAnimStyle = (word: DynamicLyricWord) => {
		if (animationType === "float") {
			return karaokeAnimationFloat(word);
		} else if (animationType === "slide") {
			return karaokeAnimationSlide(word);
		}
		return {};
	};

	useEffect(() => {
		if (!enableGlow || !words) return;

		const trailingIndexes: number[] = [];
		for (let i = 0; i < words.length; i++) {
			if (words[i]?.trailing) {
				trailingIndexes.push(i);
			}
		}
		if (trailingIndexes.length === 0) return;

		const createGlowAnimation = (index: number): GlowAnimationRef | null => {
			if (!containerRef.current?.children[index]) return null;

			const word = words[index];
			const glowTarget = containerRef.current.children[index] as HTMLElement;

			const fadeIn = word.duration * 0.6;
			const keep = word.duration * 0.4;
			const fadeAway = 500;
			const duration = fadeIn + keep + fadeAway;

			const glowAnimationTiming = {
				fadeIn,
				keep,
				fadeAway,
				duration,
				wordTime: word.time,
				wordDuration: word.duration,
			};

			const glowAnimation = glowTarget.animate(
				[
					{
						filter:
							"drop-shadow(0 0 0px rgba(var(--rnp-accent-color-shade-2-rgb), 0)) drop-shadow(0 0 0px rgba(var(--rnp-accent-color-shade-2-rgb), 0))",
					},
					{
						filter:
							"drop-shadow(0 0 15px rgba(var(--rnp-accent-color-shade-2-rgb), 1)) drop-shadow(0 0 10px rgba(var(--rnp-accent-color-shade-2-rgb), 0.5))",
						offset: fadeIn / duration,
					},
					{
						filter:
							"drop-shadow(0 0 15px rgba(var(--rnp-accent-color-shade-2-rgb), 1)) drop-shadow(0 0 10px rgba(var(--rnp-accent-color-shade-2-rgb), 0.5))",
						offset: (fadeIn + keep) / duration,
					},
					{
						filter:
							"drop-shadow(0 0 0px rgba(var(--rnp-accent-color-shade-2-rgb), 0)) drop-shadow(0 0 0px rgba(var(--rnp-accent-color-shade-2-rgb), 0))",
						offset: 1,
					},
				],
				{
					duration: duration,
					fill: "forwards",
					delay: 0,
				},
			);

			glowAnimation.pause();
			glowAnimation.currentTime = 0;

			return {
				animation: glowAnimation,
				timing: glowAnimationTiming,
			};
		};

		glowAnimationsRef.current = [];
		for (let i = 0; i < trailingIndexes.length; i++) {
			const tmp = createGlowAnimation(trailingIndexes[i]);
			if (tmp) glowAnimationsRef.current.push(tmp);
		}

		return () => {
			for (let i = 0; i < glowAnimationsRef.current.length; i++) {
				glowAnimationsRef.current[i].animation.cancel();
			}
			glowAnimationsRef.current = [];
		};
	}, [words, enableGlow, animationType]);

	useEffect(() => {
		for (const glowAnimation of glowAnimationsRef.current) {
			const animation = glowAnimation.animation;
			const timing = glowAnimation.timing;

			if (!isCurrent) {
				if (offset < 0) {
					if (animation.playState === "running") continue;
					animation.currentTime = timing.duration;
				} else {
					animation.currentTime = 0;
					animation.pause();
				}
				continue;
			}

			const realCurrentTime = getCurrentTime();
			const animationTime = realCurrentTime - timing.wordTime;

			if (playState === false) {
				animation.pause();
				animation.currentTime = animationTime;
				continue;
			}
			animation.play();
			animation.currentTime = animationTime;
		}
	}, [isCurrent, offset, playState, currentTime, getCurrentTime]);

	return (
		<div className="rnp-lyrics-line-karaoke" ref={containerRef}>
			{words.map((word, index) => (
				<div
					key={`${animationType}-${index}`}
					className={`rnp-karaoke-word ${word.isCJK ? "is-cjk" : ""} ${word.endsWithSpace ? "end-with-space" : ""}`}
					style={getAnimStyle(word)}
				>
					<span>{word.word}</span>
					{animationType === "slide" && (
						<span
							className="rnp-karaoke-word-filler"
							style={getAnimStyle(word)}
						>
							{word.word}
						</span>
					)}
				</div>
			))}
		</div>
	);
};

interface InterludeProps {
	id: number;
	line: ExtendedLyricLine;
	currentLine: number;
	currentTime: number;
	playState: boolean;
	seekCounter: number;
}

interface DotData {
	time: number;
	duration: number;
}

const Interlude = ({
	id,
	line,
	currentLine,
	currentTime,
	playState,
	seekCounter,
}: InterludeProps) => {
	const dotContainerRef = useRef<HTMLDivElement>(null);

	const dotCount = 3;
	const duration = line.duration ?? 0;
	const perDotTime = Math.floor(duration / dotCount);

	const dots: DotData[] = [];
	for (let i = 0; i < dotCount; i++) {
		dots.push({
			time: line.time + perDotTime * i,
			duration: perDotTime,
		});
	}

	const dotAnimation = (dot: DotData): React.CSSProperties => {
		if (dotContainerRef.current) {
			dotContainerRef.current.classList.add("pause-breath");
		}
		if (currentLine !== id) {
			return {
				transitionDuration: `200ms`,
				transitionDelay: `0ms`,
			};
		}

		if (playState === false && dot.time + dot.duration - currentTime > 0) {
			const scaleValue = Math.max(
				0.9 + ((0.1 * (currentTime - dot.time)) / dot.duration) * 2,
				0.8,
			);

			return {
				transitionDuration: `0s`,
				transitionDelay: `0ms`,
				opacity: Math.max(
					0.2 + (0.7 * (currentTime - dot.time)) / dot.duration,
					0.2,
				),
				transform: `scale(${scaleValue})`,
			};
		}

		if (dotContainerRef.current) {
			dotContainerRef.current.classList.remove("pause-breath");
		}

		return {
			transitionDuration: `${dot.duration}ms, ${dot.duration + 150}ms`,
			transitionDelay: `${dot.time - currentTime}ms`,
		};
	};

	useEffect(() => {
		if (currentLine !== id) return;
		if (!dotContainerRef.current) return;

		dotContainerRef.current.classList.add("force-refresh");

		const timer = setTimeout(() => {
			dotContainerRef.current?.classList?.remove("force-refresh");
		}, 6);

		return () => clearTimeout(timer);
	}, [seekCounter, currentLine, id]);

	return (
		<div className="rnp-interlude-inner" ref={dotContainerRef}>
			{dots.map((dot, index) => {
				return (
					<div
						key={index}
						className="rnp-interlude-dot"
						style={dotAnimation(dot)}
					/>
				);
			})}
		</div>
	);
};
