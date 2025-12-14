import type { ProcessedLyricsState } from "../lyric-provider";

export interface LyricsUpdatedDetail extends ProcessedLyricsState {
	amend?: boolean;
	unsynced?: boolean;
}

interface CustomEventMap {
	"lyrics-updated": CustomEvent<LyricsUpdatedDetail>;
	"recalc-lyrics": CustomEvent<void>;

	"rnp-lyric-font-size": CustomEvent<number>;
	"rnp-lyric-fade": CustomEvent<boolean>;
	"rnp-lyric-zoom": CustomEvent<boolean>;
	"rnp-lyric-blur": CustomEvent<boolean>;
	"rnp-lyric-rotate": CustomEvent<boolean>;
	"rnp-rotate-curvature": CustomEvent<number>;
	"rnp-karaoke-animation": CustomEvent<"float" | "slide">;
	"rnp-current-lyric-alignment-percentage": CustomEvent<number>;
	"rnp-lyric-stagger": CustomEvent<boolean>;
	"rnp-lyric-glow": CustomEvent<boolean>;
	"rnp-global-offset": CustomEvent<number>;
}

declare global {
	interface Document {
		addEventListener<K extends keyof CustomEventMap>(
			type: K,
			listener: (this: Document, ev: CustomEventMap[K]) => any,
			options?: boolean | AddEventListenerOptions,
		): void;
		removeEventListener<K extends keyof CustomEventMap>(
			type: K,
			listener: (this: Document, ev: CustomEventMap[K]) => any,
			options?: boolean | AddEventListenerOptions,
		): void;
		dispatchEvent<K extends keyof CustomEventMap>(
			ev: CustomEventMap[K],
		): boolean;
	}

	interface Window {
		addEventListener<K extends keyof CustomEventMap>(
			type: K,
			listener: (this: Window, ev: CustomEventMap[K]) => any,
			options?: boolean | AddEventListenerOptions,
		): void;
		removeEventListener<K extends keyof CustomEventMap>(
			type: K,
			listener: (this: Window, ev: CustomEventMap[K]) => any,
			options?: boolean | AddEventListenerOptions,
		): void;
	}
}
