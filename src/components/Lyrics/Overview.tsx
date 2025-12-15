import { useAtomValue, useSetAtom } from "jotai";
import type React from "react";
import { useEffect } from "react";
import type { ExtendedLyricLine } from "@/lyric-provider";
import { overviewScrollingAtom } from "@/store/lyric-view";
import * as S from "@/store/settings";

interface OverviewProps {
	lyrics: ExtendedLyricLine[];
	currentLine: number;
	isUnsynced: boolean;
	jumpToTime: (time: number) => void;
	overviewContainerRef: React.RefObject<HTMLDivElement>;
	exitOverviewModeScrollingSoon: (timeout?: number) => void;
}

export const Overview = ({
	lyrics,
	currentLine,
	isUnsynced,
	jumpToTime,
	overviewContainerRef,
	exitOverviewModeScrollingSoon,
}: OverviewProps) => {
	const showTranslation = useAtomValue(S.showTranslationAtom);
	const showRomaji = useAtomValue(S.showRomajiAtom);
	const setScrolling = useSetAtom(overviewScrollingAtom);

	useEffect(() => {
		const container = overviewContainerRef.current;
		if (!container) return;

		let selecting = false;

		const onWheel = () => {
			setScrolling(true);
			if (!selecting) {
				exitOverviewModeScrollingSoon();
			}
		};

		const onMouseDown = (e: MouseEvent) => {
			if (e.button !== 0) return;
			const target = e.target as HTMLElement;
			if (!target.closest(".rnp-lyrics-overview-line")) return;

			selecting = true;
			setScrolling(true);

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		};

		const onMouseMove = () => {
			if (!selecting) return;
			setScrolling(true);
		};

		const onMouseUp = () => {
			if (!selecting) return;
			selecting = false;
			setScrolling(true);
			exitOverviewModeScrollingSoon();

			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};

		container.addEventListener("wheel", onWheel);
		container.addEventListener("mousedown", onMouseDown);

		return () => {
			container.removeEventListener("wheel", onWheel);
			container.removeEventListener("mousedown", onMouseDown);
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};
	}, [overviewContainerRef, setScrolling, exitOverviewModeScrollingSoon]);

	return (
		<div
			className="rnp-lyrics rnp-lyrics-overview-container"
			ref={overviewContainerRef}
		>
			<div className="rnp-lyrics-overview">
				{isUnsynced && (
					<div className="rnp-lyrics-overview-line unsynced-indicator">
						歌词暂不支持滚动
					</div>
				)}

				{lyrics.map((line, index) => (
					<div
						key={index}
						className={`
                            rnp-lyrics-overview-line
                            ${index === currentLine ? "current" : ""}
                            ${index < currentLine ? "passed" : ""}
                            ${line.isInterlude ? "interlude" : ""}
                        `}
						onContextMenu={(e) => {
							e.preventDefault();
							if (isUnsynced) return;
							jumpToTime(line.time + 50);
							exitOverviewModeScrollingSoon(0);
						}}
					>
						{!line.isInterlude && (
							<div className="rnp-lyrics-overview-line-original">
								{line.originalLyric}
							</div>
						)}
						{line.romanLyric && showRomaji && (
							<div className="rnp-lyrics-overview-line-romaji">
								{line.romanLyric}
							</div>
						)}
						{line.translatedLyric && showTranslation && (
							<div className="rnp-lyrics-overview-line-translation">
								{line.translatedLyric}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};
