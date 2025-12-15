import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtendedLyricLine } from "@/lyric-provider";

interface UseLyricScrollProps {
	containerRef: React.RefObject<HTMLDivElement>;
	lyricsRef: React.MutableRefObject<ExtendedLyricLine[] | null>;
	currentLine: number;
	isPlaying: boolean;
	requestTransition: () => void;
}

export const useLyricScroll = ({
	containerRef,
	lyricsRef,
	currentLine,
	isPlaying,
	requestTransition,
}: UseLyricScrollProps) => {
	const [scrollingMode, setScrollingModeState] = useState(false);
	const [scrollingFocusLine, setScrollingFocusLine] = useState(0);

	const _scrollingMode = useRef(false);
	const _scrollingFocusLine = useRef(0);
	const _currentLine = useRef(currentLine);
	const exitScrollingModeTimeout = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		_currentLine.current = currentLine;
		if (!_scrollingMode.current) {
			setScrollingFocusLine(currentLine);
			_scrollingFocusLine.current = currentLine;
		}
	}, [currentLine]);

	const setScrollingMode = useCallback(
		(enable: boolean) => {
			_scrollingMode.current = enable;
			setScrollingModeState(enable);

			if (containerRef.current) {
				if (enable) containerRef.current.classList.add("scrolling");
				else containerRef.current.classList.remove("scrolling");
			}
		},
		[containerRef],
	);

	const cancelExitScrollingModeTimeout = useCallback(() => {
		if (exitScrollingModeTimeout.current) {
			clearTimeout(exitScrollingModeTimeout.current);
			exitScrollingModeTimeout.current = null;
		}
	}, []);

	const exitScrollingModeSoon = useCallback(
		(timeout = 2500) => {
			cancelExitScrollingModeTimeout();
			if (!isPlaying) return;

			exitScrollingModeTimeout.current = setTimeout(() => {
				setScrollingMode(false);
				setScrollingFocusLine(_currentLine.current);
				_scrollingFocusLine.current = _currentLine.current;
				requestTransition();
			}, timeout);
		},
		[
			isPlaying,
			cancelExitScrollingModeTimeout,
			requestTransition,
			setScrollingMode,
		],
	);

	const scrollingFocusOnLine = useCallback(
		(line: number) => {
			if (line == null) return;
			requestTransition();
			setScrollingMode(true);
			setScrollingFocusLine(line);
			_scrollingFocusLine.current = line;
		},
		[requestTransition, setScrollingMode],
	);

	const onWheel = useCallback(
		(e: WheelEvent) => {
			if (!lyricsRef.current) return;

			if (e.deltaY < 0) {
				for (
					let target = _scrollingFocusLine.current - 1;
					target >= 0;
					target--
				) {
					if (!lyricsRef.current[target].isInterlude) {
						scrollingFocusOnLine(target);
						break;
					}
				}
				exitScrollingModeSoon();
			} else if (e.deltaY > 0) {
				for (
					let target = _scrollingFocusLine.current + 1;
					target < lyricsRef.current.length;
					target++
				) {
					if (!lyricsRef.current[target].isInterlude) {
						scrollingFocusOnLine(target);
						break;
					}
				}
				exitScrollingModeSoon();
			}
		},
		[lyricsRef, scrollingFocusOnLine, exitScrollingModeSoon],
	);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const scrollHandler = (e: Event) => {
			e.stopPropagation();
			e.preventDefault();
			return false;
		};

		const wheelHandler = (e: WheelEvent) => {
			e.stopPropagation();
			e.preventDefault();
			onWheel(e);
			return false;
		};

		const mouseLeaveHandler = () => {
			exitScrollingModeSoon(1000);
		};

		container.addEventListener("scroll", scrollHandler, { passive: false });
		container.addEventListener("wheel", wheelHandler, { passive: false });
		container.addEventListener("mouseleave", mouseLeaveHandler);

		return () => {
			container.removeEventListener("scroll", scrollHandler);
			container.removeEventListener("wheel", wheelHandler);
			container.removeEventListener("mouseleave", mouseLeaveHandler);
		};
	}, [containerRef, onWheel, exitScrollingModeSoon]);

	return {
		scrollingMode,
		scrollingFocusLine,
		setScrollingMode,
		scrollingFocusOnLine,
		exitScrollingModeSoon,
	};
};
