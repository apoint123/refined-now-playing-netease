import { useAtom, type WritableAtom } from "jotai";
import type React from "react";
import { useMemo } from "react";

interface SliderItemProps {
	atom: WritableAtom<number, [any], void>;
	label: string;
	min: number;
	max: number;
	step?: number;
	defaultValue: number; // 用于重置按钮
	ticks?: number[]; // 下方的刻度
	note?: string;
	className?: string;
}

export const SliderItem: React.FC<SliderItemProps> = ({
	atom,
	label,
	min,
	max,
	step = 1,
	defaultValue,
	ticks,
	note,
	className = "",
}) => {
	const [value, setValue] = useAtom(atom);

	// 计算是否有变更（控制重置按钮显示）
	const isChanged = value !== defaultValue;

	const backgroundStyle = useMemo(() => {
		const percent = (value - min) / (max - min);
		return {
			background: `linear-gradient(90deg, var(--rnp-accent-color) ${percent * 100}%, #dfe1e422 ${percent * 100}%)`,
		};
	}, [value, min, max]);

	return (
		<>
			{/* "changed" 类名控制重置按钮的 opacity，参见 settings-menu.scss */}
			<div
				className={`rnp-slider-wrapper ${isChanged ? "changed" : ""} ${ticks ? "with-ticks" : ""} ${className}`}
			>
				<label className="rnp-slider-label">
					{label}
					<button
						className="rnp-slider-reset"
						onClick={() => setValue(defaultValue)}
						aria-label="重置"
					/>
				</label>

				<input
					type="range"
					className="rnp-slider"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={(e) => setValue(parseFloat(e.target.value))}
					style={backgroundStyle}
					onMouseDown={() =>
						document.body.classList.add("rnp-slider-adjusting")
					}
					onMouseUp={() =>
						document.body.classList.remove("rnp-slider-adjusting")
					}
				/>

				{ticks && (
					<div className="rnp-slider-ticks">
						{ticks.map((tick) => (
							<div key={tick} className="rnp-slider-tick">
								{tick === Infinity ? "∞" : tick}
							</div>
						))}
					</div>
				)}
			</div>
			{note && <span className="rnp-slider-note">{note}</span>}
		</>
	);
};
