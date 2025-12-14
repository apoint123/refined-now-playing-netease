import { type LyricLine, parseLyric } from "./liblyric/index";
import { cyrb53 } from "./utils";

export interface ExtendedLyricLine extends LyricLine {
	isInterlude?: boolean;
	unsynced?: boolean;
}

// 这些是推断的结构
interface RawLyricsUser {
	nickname: string;
	userid: number;
}

interface ArtistMeta {
	artistName: string;
	artistId: number;
}

export interface LyricRole {
	roleName: string;
	artistMetaList: ArtistMeta[];
}

interface RawLyricsData {
	lrc?: { lyric?: string; version?: number };
	ytlrc?: { lyric?: string };
	ttlrc?: { lyric?: string };
	tlyric?: { lyric?: string };
	yromalrc?: { lyric?: string };
	romalrc?: { lyric?: string };
	yrc?: { lyric?: string };
	lyricUser?: RawLyricsUser;
	transUser?: RawLyricsUser;
	roles?: LyricRole[];
	source?: { name: string };
	data?: number;
}

export interface ProcessedLyricsState {
	lyrics: ExtendedLyricLine[];
	contributors: {
		original?: { name: string; userid: number };
		translation?: { name: string; userid: number };
		roles?: LyricRole[];
		lyricSource?: { name: string };
	};
	unsynced?: boolean;
	hash?: string;
}

declare global {
	interface Window {
		currentLyrics: ProcessedLyricsState;
		onProcessLyrics: (
			rawLyrics: RawLyricsData | string,
			songID: string | number,
		) => any;
	}
}

// Trigger lyrics-updated event when lyrics are updated
// Also provide a global variable `currentLyrics` for other scripts to use

const preProcessLyrics = (
	lyrics: RawLyricsData,
): ExtendedLyricLine[] | null => {
	if (!lyrics) return null;
	if (!lyrics.lrc) lyrics.lrc = {};

	const original = (lyrics?.lrc?.lyric ?? "").replace(/\u3000/g, " ");
	const translation =
		lyrics?.ytlrc?.lyric ?? lyrics?.ttlrc?.lyric ?? lyrics?.tlyric?.lyric ?? "";
	const roma = lyrics?.yromalrc?.lyric ?? lyrics?.romalrc?.lyric ?? "";
	const dynamic = lyrics?.yrc?.lyric ?? "";
	const approxLines = original.match(/\[(.*?)\]/g)?.length ?? 0;

	const parsed = parseLyric(
		original,
		translation,
		roma,
		dynamic,
	) as ExtendedLyricLine[];

	if (approxLines - parsed.length > approxLines * 0.7) {
		// 某些特殊情况（逐字歌词残缺不全）
		return parseLyric(original, translation, roma) as ExtendedLyricLine[];
	}
	return parsed;
};

const processLyrics = async (
	lyrics: ExtendedLyricLine[],
): Promise<ExtendedLyricLine[]> => {
	for (const line of lyrics) {
		if (line.originalLyric === "") {
			line.isInterlude = true;
		}
	}
	/*for (const line of lyrics) {
		if (!line.dynamicLyric) {
			// 拆开每一个 CJK 字符，但是保留英文单词不拆
			// 例: "测试a test" => ["测", "试", "a", "test"]
			line.dynamicLyric = line.originalLyric.replace(/([\p{Unified_Ideograph}|\u3040-\u309F|\u30A0-\u30FF])/gu, ' $1 ').replace(/\s+/g, ' ').trim().split(' ').map((x) => {
				return {
					word: x,
				};
			});
		}
		for (const word of line.dynamicLyric) {
			// 如果是日语浊音符，就合并到前一个单词
			if (word.word === 'ﾞ' || word.word === 'ﾟ') {
				const prevWord = line.dynamicLyric[line.dynamicLyric.indexOf(word) - 1];
				if (prevWord) {
					prevWord.word += word.word;
					if (prevWord.durations) prevWord.durations += word.durations;
					line.dynamicLyric.splice(line.dynamicLyric.indexOf(word), 1);
				}
			}
		}
		// const sentense = line.dynamicLyric.map((x) => x.word).join('');
		// console.log(sentense);
	}*/
	return lyrics;
};

let currentRawLRC: string | null = null;

const _onProcessLyrics = window.onProcessLyrics ?? ((x: any) => x);

window.onProcessLyrics = (
	_rawLyrics: RawLyricsData | string,
	songID: string | number,
) => {
	if (
		!_rawLyrics ||
		(typeof _rawLyrics === "object" && _rawLyrics?.data === -400)
	)
		return _onProcessLyrics(_rawLyrics, songID);

	let rawLyrics: RawLyricsData;

	if (typeof _rawLyrics === "string") {
		// local lyrics
		rawLyrics = {
			lrc: {
				lyric: _rawLyrics,
			},
			source: {
				name: "本地",
			},
		};
	} else {
		rawLyrics = _rawLyrics;
	}

	const currentLrcText = rawLyrics?.lrc?.lyric ?? "";

	if (currentLrcText !== currentRawLRC) {
		console.log("Update Raw Lyrics", rawLyrics);
		currentRawLRC = currentLrcText;

		const preprocessedLyrics = preProcessLyrics(rawLyrics);

		if (preprocessedLyrics) {
			setTimeout(async () => {
				const processedLyrics = await processLyrics(preprocessedLyrics);

				const lyrics: ProcessedLyricsState = {
					lyrics: processedLyrics,
					contributors: {},
				};

				if (processedLyrics[0]?.unsynced) {
					lyrics.unsynced = true;
				}

				if (rawLyrics?.lyricUser) {
					lyrics.contributors.original = {
						name: rawLyrics.lyricUser.nickname,
						userid: rawLyrics.lyricUser.userid,
					};
				}
				if (rawLyrics?.transUser) {
					lyrics.contributors.translation = {
						name: rawLyrics.transUser.nickname,
						userid: rawLyrics.transUser.userid,
					};
				}

				lyrics.contributors.roles = rawLyrics?.roles ?? [];

				lyrics.contributors.roles = lyrics.contributors.roles.filter((role) => {
					if (
						role.artistMetaList.length === 1 &&
						role.artistMetaList[0].artistName === "无" &&
						role.artistMetaList[0].artistId === 0
					) {
						return false;
					}
					return true;
				});

				for (let i = 0; i < lyrics.contributors.roles.length; i++) {
					const metaList = JSON.stringify(
						lyrics.contributors.roles[i].artistMetaList,
					);
					if (!lyrics.contributors.roles[i]) continue;

					for (let j = i + 1; j < lyrics.contributors.roles.length; j++) {
						if (
							JSON.stringify(lyrics.contributors.roles[j].artistMetaList) ===
							metaList
						) {
							lyrics.contributors.roles[i].roleName +=
								`、${lyrics.contributors.roles[j].roleName}`;
							lyrics.contributors.roles.splice(j, 1);
							j--;
						}
					}
				}

				if (rawLyrics?.source) {
					lyrics.contributors.lyricSource = rawLyrics.source;
				}

				const playingId = betterncm.ncm.getPlaying()?.id ?? "";
				const lyricsContent = processedLyrics
					.map((x) => x.originalLyric)
					.join("\\");
				lyrics.hash = `${playingId}-${cyrb53(lyricsContent)}`;

				window.currentLyrics = lyrics;

				console.group("Update Processed Lyrics");
				console.log("lyrics", window.currentLyrics.lyrics);
				console.log("contributors", window.currentLyrics.contributors);
				console.log("hash", window.currentLyrics.hash);
				console.groupEnd();

				document.dispatchEvent(
					new CustomEvent("lyrics-updated", { detail: window.currentLyrics }),
				);
			}, 0);
		}
	}
	return _onProcessLyrics(_rawLyrics, songID);
};
