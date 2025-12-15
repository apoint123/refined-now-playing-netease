import type React from "react";
import { useRef } from "react";

interface ScrollbarProps {
	nonInterludeToAll: number[]; // 映射表：所有歌词 index -> 非间奏歌词 index (间奏歌词则是往前最近的非间奏歌词)
	allToNonInterlude: number[]; // 映射表：非间奏歌词 index -> 所有歌词 index
	currentLine: number;
	containerHeight: number;
	scrollingMode: boolean;
	scrollingFocusLine: number;
	scrollingFocusOnLine: (line: number) => void;
	exitScrollingModeSoon: () => void;
	overviewMode: boolean;
}

export function Scrollbar(props: ScrollbarProps) {
	const scrollbarRef = useRef<HTMLDivElement>(null);
	const thumbRef = useRef<HTMLDivElement>(null);

	const currentLineIndex = props.scrollingMode
		? props.scrollingFocusLine
		: props.currentLine;

	const totalSteps = props.nonInterludeToAll.length;
	const currentStep = props.allToNonInterlude[currentLineIndex] ?? 0;

	const thumbHeight = Math.max(props.containerHeight / (totalSteps || 1), 30);
	const heightOfTrack = props.containerHeight - thumbHeight;
	const perStep = totalSteps > 1 ? heightOfTrack / (totalSteps - 1) : 0;

	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		const thumb = thumbRef.current;
		const scrollbar = scrollbarRef.current;
		if (!thumb || !scrollbar) return;

		e.preventDefault();

		const startX = e.clientX;
		const startY = e.clientY;

		const thumbRect = thumb.getBoundingClientRect();
		const offsetY = e.clientY - thumbRect.top;

		const trackTopY = scrollbar.getBoundingClientRect().top;

		thumb.classList.add("dragging");
		thumb.style.transitionDuration = "0.2s";
		thumb.style.transitionTimingFunction = "ease-out";

		let lastFocusLine = currentStep;

		const onMouseMove = (ev: MouseEvent) => {
			const diffX = ev.clientX - startX;
			let y = ev.clientY - trackTopY - offsetY;

			if (Math.abs(diffX) > 300) {
				y = startY - trackTopY - offsetY;
			}

			const stepHeight = perStep === 0 ? 1 : perStep;
			const closest = Math.max(
				Math.min(Math.round(y / stepHeight), totalSteps - 1),
				0,
			);

			const yOfClosest = closest * perStep;

			thumb.style.top = `${yOfClosest}px`;

			if (lastFocusLine === closest) return;
			lastFocusLine = closest;

			if (props.nonInterludeToAll[closest] !== undefined) {
				props.scrollingFocusOnLine(props.nonInterludeToAll[closest]);
			}
		};

		const onMouseUp = () => {
			thumb.classList.remove("dragging");
			thumb.style.transitionDuration = "";
			thumb.style.transitionTimingFunction = "";

			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);

			props.exitScrollingModeSoon();
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	return (
		<div
			className={`rnp-lyrics-scrollbar ${props.overviewMode ? "overview-mode-hide" : ""}`}
			ref={scrollbarRef}
		>
			<div
				className={`rnp-lyrics-scrollbar-thumb ${totalSteps > 1 ? "" : "no-scroll"}`}
				ref={thumbRef}
				onMouseDown={handleMouseDown}
				style={{
					height: `${thumbHeight}px`,
					top: `${currentStep * perStep}px`,
				}}
			/>
		</div>
	);
}
