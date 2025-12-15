import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtendedLyricLine, ProcessedLyricsState } from "@/lyric-provider";

interface LyricsDataState {
	lyrics: ExtendedLyricLine[] | null;
	contributors: ProcessedLyricsState["contributors"] | null;
	isUnsynced: boolean;
	hasTranslation: boolean;
	hasRomaji: boolean;
	hasKaraoke: boolean;
	isPureMusic: boolean;
	maps: {
		allToNonInterlude: number[];
		nonInterludeToAll: number[];
	};
}

const INITIAL_STATE: LyricsDataState = {
	lyrics: null,
	contributors: null,
	isUnsynced: false,
	hasTranslation: false,
	hasRomaji: false,
	hasKaraoke: false,
	isPureMusic: false,
	maps: {
		allToNonInterlude: [],
		nonInterludeToAll: [],
	},
};

export type LyricEventType = "new" | "amend" | "update";

const preProcessMapping = (lyrics: ExtendedLyricLine[] = []) => {
	const allToNonInterlude: number[] = [];
	const nonInterludeToAll: number[] = [];
	let cnt = 0;

	for (let i = 0; i < lyrics.length; i++) {
		const line = lyrics[i];
		if (line.isInterlude) {
			if (allToNonInterlude.length > 0) {
				allToNonInterlude.push(allToNonInterlude[allToNonInterlude.length - 1]);
			} else {
				allToNonInterlude.push(0);
			}
		} else {
			nonInterludeToAll.push(i);
			allToNonInterlude.push(cnt);
			cnt++;
		}
	}
	return { allToNonInterlude, nonInterludeToAll };
};

const checkPureMusic = (lyrics: ExtendedLyricLine[] | null) => {
	if (!lyrics) return false;
	return (
		lyrics.length === 1 ||
		(lyrics.length <= 10 &&
			lyrics.some((x) => (x.originalLyric ?? "").includes("纯音乐")))
	);
};

export const useLyricsData = (isFM: boolean) => {
	const [data, setData] = useState<LyricsDataState>(INITIAL_STATE);
	const [lyricEvent, setLyricEvent] = useState<{
		type: LyricEventType;
		timestamp: number;
	} | null>(null);

	const lyricsRef = useRef<ExtendedLyricLine[] | null>(null);

	const isCurrentModeSession = useCallback(() => {
		const fmPlayer = document.querySelector(".m-player-fm");
		const isFMSession = fmPlayer ? !fmPlayer.classList.contains("f-dn") : false;
		return isFM ? isFMSession : !isFMSession;
	}, [isFM]);

	const handleUpdate = useCallback(
		(detail: ProcessedLyricsState & { amend?: boolean }) => {
			const rawLyrics = detail.lyrics;
			const maps = preProcessMapping(rawLyrics);
			const pureMusic = checkPureMusic(rawLyrics);

			lyricsRef.current = rawLyrics;

			setData(() => ({
				lyrics: rawLyrics,
				contributors: detail.contributors,
				isUnsynced: detail.unsynced ?? false,
				hasTranslation: rawLyrics.some((x) => x.translatedLyric),
				hasRomaji: rawLyrics.some((x) => x.romanLyric),
				hasKaraoke: rawLyrics.some((x) => x.dynamicLyric),
				isPureMusic: pureMusic,
				maps,
			}));

			if (detail.amend) {
				setLyricEvent({ type: "amend", timestamp: Date.now() });
			} else {
				setLyricEvent({ type: "new", timestamp: Date.now() });
			}
		},
		[],
	);

	useEffect(() => {
		if (window.currentLyrics) {
			handleUpdate(window.currentLyrics);
		}

		const onLyricsUpdate = (
			e: CustomEvent<ProcessedLyricsState & { amend?: boolean }>,
		) => {
			if (!e.detail) return;

			if (!isCurrentModeSession()) return;

			handleUpdate(e.detail);
		};

		document.addEventListener("lyrics-updated", onLyricsUpdate);
		return () => {
			document.removeEventListener("lyrics-updated", onLyricsUpdate);
		};
	}, [isCurrentModeSession, handleUpdate]);

	return {
		...data,
		lyricsRef,
		lyricEvent,
	};
};
