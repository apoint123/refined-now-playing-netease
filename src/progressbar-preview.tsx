import "./progressbar-preview.scss";
import { getSetting } from "./utils";

const React = window.React;
const { useState, useEffect, useRef } = React;

interface Word {
	word: string;
	time: number;
	duration: number;
}

interface LyricLine {
	time: number;
	duration?: number;
	originalLyric?: string;
	translatedLyric?: string;
	dynamicLyric?: Word[];
	unsynced?: boolean;
}

interface ProgressbarPreviewProps {
	dom: HTMLElement;
	isFM?: boolean;
}

const isFMSession = () => {
	const fmNode = document.querySelector(".m-player-fm");
	return fmNode && !fmNode.classList.contains("f-dn");
};

if (getSetting("enable-progressbar-preview", true)) {
	document.body.classList.add("enable-progressbar-preview");
}

function useRefState<T>(
	initialValue: T,
): [React.MutableRefObject<T>, T, (val: T) => void] {
	const [value, setValue] = useState<T>(initialValue);
	const valueRef = useRef<T>(value);

	const updateValue = (val: T) => {
		valueRef.current = val;
		setValue(val);
	};

	return [valueRef, value, updateValue];
}

let totalLengthInit = 0;
legacyNativeCmder.appendRegisterCall(
	"Load",
	"audioplayer",
	(_: any, info: any) => {
		totalLengthInit = info.duration * 1000;
	},
);

function formatTime(time: number) {
	const h = Math.floor(time / 3600);
	const m = Math.floor((time - h * 3600) / 60);
	const s = Math.floor(time - h * 3600 - m * 60);
	return `${h ? `${h}:` : ""}${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
}

export function ProgressbarPreview(props: ProgressbarPreviewProps) {
	const isCurrentModeSession = () => {
		// 判断是否在当前模式播放 (普通/FM)
		return props.isFM ? isFMSession() : !isFMSession();
	};

	const [visible, setVisible] = useState(false);

	const xRef = useRef(0);
	const yRef = useRef(0);

	const progressBarRef = useRef<HTMLElement>(props.dom);
	useEffect(() => {
		progressBarRef.current = props.dom;
	}, [props.dom]);

	const [_lyrics, lyrics, setLyrics] = useRefState<LyricLine[] | null>(null);
	const [nonInterludeCount, setNonInterludeCount] = useState(0);

	const hoverPercentRef = useRef(0);
	const [currentLine, setCurrentLine] = useState(0);
	const [currentNonInterludeIndex, setCurrentNonInterludeIndex] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);

	const [_totalLength, totalLength, setTotalLength] =
		useRefState<number>(totalLengthInit);

	const containerRef = useRef<HTMLDivElement>(null);
	const subprogressbarInnerRef = useRef<HTMLDivElement>(null);

	const onLyricsUpdate = (e: Event) => {
		const customEvent = e as CustomEvent;
		if (!isCurrentModeSession()) {
			return;
		}
		if (!customEvent.detail) {
			return;
		}
		const newLyrics = customEvent.detail.lyrics as LyricLine[];
		setLyrics(newLyrics);
		setNonInterludeCount(newLyrics.filter((l) => l.originalLyric).length);
	};

	useEffect(() => {
		if (window.currentLyrics) {
			if (isCurrentModeSession()) {
				const currentLyrics = window.currentLyrics.lyrics;
				setLyrics(currentLyrics);
				setNonInterludeCount(
					currentLyrics.filter((l) => l.originalLyric).length,
				);
			}
		}
		document.addEventListener("lyrics-updated", onLyricsUpdate);
		return () => {
			document.removeEventListener("lyrics-updated", onLyricsUpdate);
		};
	}, []);

	const onLoad = (_: any, info: any) => {
		setTotalLength(info.duration * 1000);
	};

	useEffect(() => {
		legacyNativeCmder.appendRegisterCall("Load", "audioplayer", onLoad);
		return () => {
			legacyNativeCmder.removeRegisterCall("Load", "audioplayer", onLoad);
		};
	}, []);

	const updateHoverPercent = () => {
		if (!progressBarRef.current) {
			return;
		}
		const rect = progressBarRef.current.getBoundingClientRect();
		const percent = (xRef.current - rect.left) / rect.width;
		hoverPercentRef.current = percent;
		const calculatedTime = _totalLength.current * percent;
		setCurrentTime(calculatedTime);

		if (_lyrics.current) {
			let cur = 0;
			let nonInterludeIndex = 0;
			for (let i = 0; i < _lyrics.current.length; i++) {
				if (_lyrics.current[i].time <= calculatedTime) {
					cur = i;
					if (_lyrics.current[i].originalLyric) {
						nonInterludeIndex++;
					}
				} else {
					break;
				}
			}
			const currentLyricLine = _lyrics.current[cur];
			if (
				cur === _lyrics.current.length - 1 &&
				currentLyricLine.duration &&
				calculatedTime > currentLyricLine.time + currentLyricLine.duration + 500
			) {
				cur = _lyrics.current.length;
			}

			setCurrentLine(cur);
			setCurrentNonInterludeIndex(Math.max(nonInterludeIndex, 1));

			if (subprogressbarInnerRef.current && _lyrics.current[cur]) {
				const line = _lyrics.current[cur];
				let duration = line.duration || 0;
				if (duration === 0) {
					duration = _totalLength.current - line.time;
				}
				if (duration > 0) {
					subprogressbarInnerRef.current.style.width = `${((calculatedTime - line.time) / duration) * 100}%`;
				} else {
					subprogressbarInnerRef.current.style.width = "0%";
				}
			}
		}
	};

	const updatePosition = () => {
		if (!containerRef.current || !progressBarRef.current) {
			return;
		}
		const width = containerRef.current.clientWidth;
		const height = containerRef.current.clientHeight;
		const rect = progressBarRef.current.getBoundingClientRect();
		let left = xRef.current - width / 2;
		if (left < 0) {
			left = 0;
		}
		if (left + width > window.innerWidth) {
			left = window.innerWidth - width;
		}
		containerRef.current.style.left = `${left}px`;
		containerRef.current.style.top = `${rect.top - height - 5}px`;
	};

	useEffect(() => {
		updatePosition();
	}, [visible, currentLine]);

	const onMouseEnter = (e: MouseEvent) => {
		setVisible(true);
		xRef.current = e.clientX;
		yRef.current = e.clientY;
		updateHoverPercent();
		updatePosition();
	};
	const onMouseLeave = () => {
		setVisible(false);
	};
	const onMouseMove = (e: MouseEvent) => {
		xRef.current = e.clientX;
		yRef.current = e.clientY;
		updateHoverPercent();
		updatePosition();
	};

	useEffect(() => {
		const el = progressBarRef.current;
		if (!el) {
			return;
		}
		el.addEventListener("mouseenter", onMouseEnter);
		el.addEventListener("mouseleave", onMouseLeave);
		el.addEventListener("mousemove", onMouseMove);
		return () => {
			el.removeEventListener("mouseenter", onMouseEnter);
			el.removeEventListener("mouseleave", onMouseLeave);
			el.removeEventListener("mousemove", onMouseMove);
		};
	}, [progressBarRef.current]);

	const isPureMusic =
		lyrics &&
		(lyrics.length === 1 ||
			(lyrics.length <= 10 &&
				lyrics.some((x) => (x.originalLyric ?? "").includes("纯音乐"))) ||
			document
				.querySelector("#main-player")
				?.getAttribute("data-log")
				?.includes('"s_ctype":"voice"') ||
			lyrics[0]?.unsynced);

	return (
		<div
			ref={containerRef}
			className={`progressbar-preview ${visible && !isPureMusic ? "" : "invisible"}`}
		>
			{lyrics?.[currentLine]?.originalLyric && (
				<div className="progressbar-preview-number">
					{currentNonInterludeIndex} / {nonInterludeCount}
				</div>
			)}
			{lyrics?.[currentLine]?.dynamicLyric && (
				<div className="progressbar-preview-line-karaoke">
					{lyrics[currentLine].dynamicLyric?.map((word, i) => {
						const percent = (currentTime - word.time) / word.duration;
						const maskPos =
							100 *
							(1 -
								Math.max(
									0,
									Math.min(1, (currentTime - word.time) / word.duration),
								));
						return (
							<span
								key={i}
								className={`progressbar-preview-line-karaoke-word ${percent >= 0 && percent <= 1 ? "current" : ""} ${percent < 0 ? "upcoming" : ""}`}
								style={{
									WebkitMaskPosition: `${maskPos}%`,
									maskPosition: `${maskPos}%`,
								}}
							>
								{word.word}
							</span>
						);
					})}
				</div>
			)}
			{lyrics &&
				!lyrics[currentLine]?.dynamicLyric &&
				lyrics[currentLine]?.originalLyric && (
					<div className="progressbar-preview-line-original">
						{lyrics[currentLine]?.originalLyric}
					</div>
				)}
			{lyrics && lyrics[currentLine]?.originalLyric === "" && (
				<div className="progressbar-preview-line-original">♪</div>
			)}
			{lyrics?.[currentLine]?.translatedLyric && (
				<div className="progressbar-preview-line-translated">
					{lyrics[currentLine]?.translatedLyric}
				</div>
			)}
			{lyrics?.[currentLine] && (
				<div className="progressbar-preview-subprogressbar">
					<div
						className="progressbar-preview-subprogressbar-inner"
						ref={subprogressbarInnerRef}
					></div>
				</div>
			)}
			{lyrics && lyrics[currentLine] && (
				<div className="progressbar-preview-line-time">
					<div>{formatTime(lyrics[currentLine]?.time / 1000)}</div>
					<div>
						{(lyrics[currentLine]?.duration || 0) > 0
							? formatTime(
									(lyrics[currentLine].time +
										(lyrics[currentLine].duration || 0)) /
										1000,
								)
							: formatTime(totalLength / 1000)}
					</div>
				</div>
			)}
		</div>
	);
}
