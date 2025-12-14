import { useAtom, type WritableAtom } from "jotai";

interface Option<T> {
	value: T;
	label: string;
}

interface SelectItemProps<T extends string | number> {
	atom: WritableAtom<T, [any], void>;
	label: string;
	options: Option<T>[];
}

export const SelectItem = <T extends string | number>({
	atom,
	label,
	options,
}: SelectItemProps<T>) => {
	const [currentValue, setValue] = useAtom(atom);

	return (
		<div className="rnp-select-group-wrapper">
			<label className="rnp-select-group-label">{label}</label>
			<div className="rnp-select-group">
				{options.map((opt) => (
					<button
						key={String(opt.value)}
						className={`rnp-select-group-btn ${currentValue === opt.value ? "selected" : ""}`}
						onClick={() => setValue(opt.value)}
					>
						{opt.label}
					</button>
				))}
			</div>
		</div>
	);
};
