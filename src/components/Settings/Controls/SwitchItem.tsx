import { useAtom, type WritableAtom } from "jotai";
import type React from "react";
import { useId } from "react";

interface SwitchItemProps {
	atom: WritableAtom<boolean, [any], void>;
	label: string;
	note?: string;
	className?: string; // 用于兼容旧 CSS 中的特定类名 (如 center-lyric-control)
}

export const SwitchItem: React.FC<SwitchItemProps> = ({
	atom,
	label,
	note,
	className = "",
}) => {
	const [checked, setChecked] = useAtom(atom);
	const id = useId();

	return (
		<>
			<div className={`rnp-checkbox-wrapper ${className}`}>
				<input
					id={id}
					type="checkbox"
					className="rnp-checkbox"
					checked={checked}
					onChange={(e) => setChecked(e.target.checked)}
				/>
				<label htmlFor={id} className="rnp-checkbox-label">
					{label}
				</label>
			</div>
			{note && <span className="rnp-checkbox-note">{note}</span>}
		</>
	);
};
