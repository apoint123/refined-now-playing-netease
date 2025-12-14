// 类型定义来自 https://github.com/apoint123/inflink-rs

export type PlaybackStatus = "Playing" | "Paused";

export type CoverSource =
	| { type: "Url"; value: string }
	| { type: "Base64"; value: string };

export interface SongInfo {
	songName: string;
	albumName: string;
	authorName: string;
	cover: CoverSource | null;
	/**
	 * 原始封面 URL
	 */
	originalCoverUrl?: string | undefined;
	/**
	 * 歌曲ID
	 */
	ncmId: number;
	/**
	 * 单位毫秒
	 */
	duration?: number | undefined;
}

export interface TimelineInfo {
	currentTime: number;
	totalTime: number;
}

export interface VolumeInfo {
	volume: number;
	isMuted: boolean;
}

export interface MetadataPayload extends SongInfo {}
export interface PlayStatePayload {
	status: PlaybackStatus;
}
export interface TimelinePayload {
	currentTime: number;
	totalTime: number;
}

export type RepeatMode = "None" | "Track" | "List" | "AI";

export interface PlayMode {
	isShuffling: boolean;
	repeatMode: RepeatMode;
}

export interface PlayModePayload extends PlayMode {}
export interface VolumePayload extends VolumeInfo {}

export interface InfLinkEventMap {
	songChange: CustomEvent<SongInfo>;
	playStateChange: CustomEvent<PlaybackStatus>;
	timelineUpdate: CustomEvent<TimelineInfo>;
	rawTimelineUpdate: CustomEvent<TimelineInfo>;
	playModeChange: CustomEvent<PlayMode>;
	volumeChange: CustomEvent<VolumeInfo>;
}
