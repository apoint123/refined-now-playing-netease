import { useAtom } from "jotai";
import { lyricOffsetAtom } from "@/store/settings";
import { SliderItem } from "./SliderItem";

export const LyricOffsetControl = () => {
	const [offset, setOffset] = useAtom(lyricOffsetAtom);

	const formatOffset = (ms: number) => {
		const sign = ms > 0 ? "+" : ms < 0 ? "-" : "";
		const sec = (Math.abs(ms) / 1000).toFixed(1).replace(/\.0$/, "");
		return `${sign}${sec}s`;
	};

	const getTip = (ms: number) => {
		if (ms === 0) return "未设置";
		return ms > 0 ? "歌词提前" : "歌词滞后";
	};

	return (
		<div className="rnp-lyric-offset">
			<div>
				<label className="rnp-checkbox-label">全局偏移</label>
				<button
					className={`rnp-slider-reset ${offset !== 0 ? "active" : ""}`}
					onClick={() => setOffset(0)}
				/>
				<div style={{ flex: 1 }}></div>
				<label id="rnp-lyric-offset-number">{formatOffset(offset)}</label>
			</div>

			<SliderItem
				atom={lyricOffsetAtom}
				label=""
				min={-10000}
				max={10000}
				step={100}
				defaultValue={0}
				className="rnp-slider-wrapper"
			/>

			<div>
				<button onClick={() => setOffset((o) => o - 100)}>-</button>
				<label id="rnp-lyric-offset-tip">{getTip(offset)}</label>
				<button onClick={() => setOffset((o) => o + 100)}>+</button>
			</div>
		</div>
	);
};
