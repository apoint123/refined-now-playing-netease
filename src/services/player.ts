import { atom, getDefaultStore } from "jotai";
import type { IInfLinkApi } from "../types/api";
import type { PlaybackStatus, SongInfo } from "../types/smtc";
import { waitForGlobal } from "../utils";

export const playbackStatusAtom = atom<PlaybackStatus>("Paused");
export const currentTimeAtom = atom<number>(0);
export const currentSongInfoAtom = atom<SongInfo | null>(null);

const store = getDefaultStore();

class PlayerService {
	private api: IInfLinkApi | undefined;
	private initialized = false;

	public async init() {
		if (this.initialized) return;

		const api = await waitForGlobal<IInfLinkApi>("InfLinkApi");

		if (!api) {
			console.error("[RNP] Cannot find InfLinkApi.");
			return;
		}

		this.api = api;
		this.initialized = true;
		console.log("[RNP] Connected to InfLinkApi.");

		store.set(playbackStatusAtom, this.api.getPlaybackStatus());
		store.set(currentSongInfoAtom, this.api.getCurrentSong());

		const timeline = this.api.getTimeline();
		if (timeline) {
			store.set(currentTimeAtom, timeline.currentTime);
		}

		this.api.addEventListener("playStateChange", (e) => {
			store.set(playbackStatusAtom, e.detail);
		});

		this.api.addEventListener("rawTimelineUpdate", (e) => {
			store.set(currentTimeAtom, e.detail.currentTime);
		});

		this.api.addEventListener("songChange", (e) => {
			store.set(currentSongInfoAtom, e.detail);
		});
	}

	public seek(timeMs: number) {
		this.api?.seekTo(timeMs);
	}

	public togglePlay() {
		if (!this.api) return;
		if (this.api.getPlaybackStatus() === "Playing") {
			this.api.pause();
		} else {
			this.api.play();
		}
	}
}

export const playerService = new PlayerService();
