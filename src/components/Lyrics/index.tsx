import { useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	currentSongInfoAtom,
	currentTimeAtom,
	playbackStatusAtom,
	playerService,
} from "@/services/player";
import { overviewModeAtom } from "@/store/lyric-view";
import { lyricFontSizeAtom, lyricOffsetAtom } from "@/store/settings";
import { Contributors } from "./Contributors";
import { Controls } from "./Controls";
import { useLyricLayout } from "./hooks/useLyricLayout";
import { useLyricScroll } from "./hooks/useLyricScroll";
import { useLyricsData } from "./hooks/useLyricsData";
import { Line } from "./Line";
import { Overview } from "./Overview";
import { Scrollbar } from "./Scrollbar";
import "@/lyric-provider";

import "./lyrics.scss";

interface LyricsProps {
	isFM?: boolean;
}

export function Lyrics({ isFM = false }: LyricsProps) {
	const currentTime = useAtomValue(currentTimeAtom); // ms
	const currentTimeRef = useRef(currentTime);
	const playbackStatus = useAtomValue(playbackStatusAtom);
	const songInfo = useAtomValue(currentSongInfoAtom);
	const globalOffset = useAtomValue(lyricOffsetAtom);
	const offsetRef = useRef(globalOffset);
	const overviewMode = useAtomValue(overviewModeAtom);
	const fontSize = useAtomValue(lyricFontSizeAtom);

	const isPlaying = playbackStatus === "Playing";
	const songId = songInfo?.ncmId ?? 0;

	const {
		lyrics,
		contributors,
		isUnsynced,
		maps,
		lyricsRef,
		hasTranslation,
		hasRomaji,
		hasKaraoke,
		isPureMusic,
		lyricEvent,
	} = useLyricsData(isFM);

	const [currentLine, setCurrentLine] = useState(0);
	const [seekCounter, setSeekCounter] = useState(0);
	const lastTimeRef = useRef(0);
	const [stableTime, setStableTime] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: 创建一个只在切行或者seek更新时变化的稳定时间以避免重置样式
	useEffect(() => {
		setStableTime(currentTime + globalOffset);
	}, [currentLine, seekCounter, globalOffset]);

	useEffect(() => {
		if (!lyrics) return;

		const currentTimeWithOffset = currentTime + globalOffset;

		if (currentTimeWithOffset < lastTimeRef.current - 200) {
			setSeekCounter(Date.now());
		}
		lastTimeRef.current = currentTimeWithOffset;

		let cur = 0;
		for (let i = 0; i < lyrics.length; i++) {
			if (lyrics[i].time <= currentTimeWithOffset) {
				cur = i;
			} else {
				break;
			}
		}

		const lastLine = lyrics[lyrics.length - 1];
		if (
			cur === lyrics.length - 1 &&
			lastLine?.duration &&
			currentTimeWithOffset > lastLine.time + lastLine.duration + 500
		) {
			cur = lyrics.length;
		}

		setCurrentLine(cur);
	}, [currentTime, globalOffset, lyrics]);

	const containerRef = useRef<HTMLDivElement>(null);
	const heightOfItems = useRef<number[]>([]);
	const [recalcCounter, setRecalcCounter] = useState(0);

	const requestTransition = useCallback(() => {}, []);

	const {
		scrollingMode,
		scrollingFocusLine,
		setScrollingMode,
		scrollingFocusOnLine,
		exitScrollingModeSoon,
	} = useLyricScroll({
		containerRef,
		lyricsRef,
		currentLine,
		isPlaying,
		requestTransition,
	});

	const { lineTransforms } = useLyricLayout({
		lyrics,
		containerRef,
		heightOfItems,
		currentLine,
		scrollingMode,
		scrollingFocusLine,
		recalcCounter,
	});

	useEffect(() => {
		if (!lyricEvent) return;

		if (lyricEvent.type === "new") {
			setScrollingMode(false);
			setCurrentLine(0);
			setStableTime(0 + globalOffset);
			if (containerRef.current) {
				containerRef.current.scrollTop = 0;
			}
		} else if (lyricEvent.type === "amend") {
			setRecalcCounter(Date.now());
		}
	}, [lyricEvent, setScrollingMode, globalOffset]);

	useEffect(() => {
		const handleResize = () => {
			heightOfItems.current = [];
			setRecalcCounter(Date.now());
		};
		const handleRecalc = () => handleResize();

		const resizeObserver = new ResizeObserver(handleResize);
		if (containerRef.current) resizeObserver.observe(containerRef.current);

		window.addEventListener("recalc-lyrics", handleRecalc);
		window.addEventListener("resize", handleResize);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("recalc-lyrics", handleRecalc);
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const jumpToTime = useCallback(
		(time: number) => {
			const targetTime = time - globalOffset;
			setScrollingMode(false);
			playerService.seek(targetTime);
			setSeekCounter(Date.now());

			if (!isPlaying) {
				playerService.togglePlay();
			}
		},
		[globalOffset, isPlaying, setScrollingMode],
	);

	const overviewContainerRef = useRef<HTMLDivElement>(null);
	const handleSelectAll = useCallback(() => {
		const container = overviewContainerRef.current;
		if (!container) return;
		const selection = window.getSelection();
		const range = document.createRange();
		range.selectNodeContents(container);
		if (selection) {
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}, []);

	const hideMainLyrics = overviewMode || isUnsynced;

	useEffect(() => {
		currentTimeRef.current = currentTime;
		offsetRef.current = globalOffset;
	}, [currentTime, globalOffset]);

	const getCurrentTime = useCallback(() => {
		return currentTimeRef.current + offsetRef.current;
	}, []);

	useEffect(() => {
		if (!isPlaying) {
			setStableTime(currentTimeRef.current + globalOffset);
		}
	}, [isPlaying, globalOffset]);

	return (
		<>
			<div
				className={`rnp-lyrics ${isPureMusic ? "pure-music" : ""} ${hideMainLyrics ? "overview-mode-hide" : ""}`}
				ref={containerRef}
				style={{
					fontSize: `${fontSize}px`,
				}}
			>
				{lyrics?.map((line, index) => (
					<Line
						key={`${songId}-${index}`}
						id={index}
						line={line}
						currentLine={currentLine}
						currentTime={stableTime}
						getCurrentTime={getCurrentTime}
						seekCounter={seekCounter}
						playState={isPlaying}
						jumpToTime={isPureMusic ? () => {} : jumpToTime}
						transform={lineTransforms[index] ?? { top: 0, scale: 1, delay: 0 }}
						outOfRangeScrolling={
							scrollingMode &&
							lyrics.length > 100 &&
							Math.abs(index - scrollingFocusLine) > 20
						}
					/>
				))}

				<Contributors
					transforms={
						lineTransforms[lyrics?.length ?? 0] ?? {
							top: 0,
							scale: 1,
							delay: 0,
						}
					}
					contributors={contributors}
				/>
			</div>

			<Scrollbar
				nonInterludeToAll={maps.nonInterludeToAll}
				allToNonInterlude={maps.allToNonInterlude}
				currentLine={currentLine}
				containerHeight={containerRef.current?.clientHeight ?? 0}
				scrollingMode={scrollingMode}
				scrollingFocusLine={scrollingFocusLine}
				scrollingFocusOnLine={scrollingFocusOnLine}
				exitScrollingModeSoon={exitScrollingModeSoon}
				overviewMode={hideMainLyrics}
			/>

			<Controls
				hasTranslation={hasTranslation}
				hasRomaji={hasRomaji}
				hasKaraoke={hasKaraoke}
				isUnsynced={isUnsynced}
				onSelectAll={handleSelectAll}
			/>

			{(overviewMode || isUnsynced) && lyrics && (
				<Overview
					lyrics={lyrics}
					currentLine={currentLine}
					isUnsynced={isUnsynced}
					jumpToTime={jumpToTime}
					overviewContainerRef={overviewContainerRef}
					exitOverviewModeScrollingSoon={() => {}}
				/>
			)}
		</>
	);
}
