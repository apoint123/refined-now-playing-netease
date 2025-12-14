import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { customFontFamilyAtom } from "@/store/settings";

const PRESETS = [
	{
		name: "MISans",
		fonts: ["MiSans Medium", "MiSans"],
		url: "https://cdn.cnbj1.fds.api.mi-img.com/vipmlmodel/font/MiSans/MiSans.zip",
	},
	{
		name: "思源黑体",
		fonts: [
			"Source Han Sans SC VF",
			"Source Han Sans CN",
			"Noto Sans",
			"思源黑体",
		],
		url: "https://github.com/adobe-fonts/source-han-sans/raw/release/Variable/OTF/SourceHanSansSC-VF.otf",
	},
	{
		name: "思源宋体",
		fonts: [
			"Source Han Serif SC VF",
			"Source Han Serif CN",
			"Noto Serif",
			"思源宋体",
		],
		url: "https://github.com/adobe-fonts/source-han-serif/raw/release/Variable/OTF/SourceHanSerifSC-VF.otf",
	},
	{
		name: "苹方",
		fonts: ["PingFang SC", "苹方 常规"],
		url: "https://github.com/ShmilyHTT/PingFang/archive/refs/heads/master.zip",
	},
	{
		name: "微软雅黑",
		fonts: ["Microsoft YaHei UI", "Microsoft YaHei"],
		url: "",
	},
];

export const FontSettings = () => {
	const [fontFamily, setFontFamily] = useAtom(customFontFamilyAtom);
	const [inputValue, setInputValue] = useState("");

	useEffect(() => {
		setInputValue(fontFamily.join(", "));
	}, [fontFamily]);

	const handleApplyInput = () => {
		const fonts = inputValue
			.split(/[,，]/)
			.map((s) => s.trim())
			.filter(Boolean);
		setFontFamily(fonts);
	};

	return (
		<div className="rnp-font-settings">
			<div className="rnp-font-input-wrapper" style={{ marginBottom: "20px" }}>
				<input
					type="text"
					className="rnp-input"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onBlur={handleApplyInput}
					onKeyDown={(e) => e.key === "Enter" && handleApplyInput()}
					placeholder="输入字体名称，多字体用逗号分隔..."
					style={{
						width: "100%",
						background: "#dfe1e422",
						border: "none",
						borderRadius: "8px",
						padding: "8px 12px",
						color: "inherit",
						fontSize: "14px",
						outline: "none",
					}}
				/>
			</div>

			<span className="rnp-checkbox-note">
				某些字体可能不在列表中，需要手动输入。
				<br />
				如果顺序在前的字体缺少某些字符，则会使用顺序在后的字体，依次顺延。
			</span>

			<label
				className="rnp-checkbox-label"
				style={{ marginTop: "10px", display: "block" }}
			>
				字体预设
			</label>

			<div
				className="rnp-font-preset-list"
				style={{ display: "flex", flexDirection: "column", gap: "8px" }}
			>
				{PRESETS.map((preset) => (
					<div
						key={preset.name}
						className="rnp-font-preset"
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							background: "#dfe1e411",
							padding: "8px 12px",
							borderRadius: "6px",
						}}
					>
						<span style={{ opacity: 0.8 }}>{preset.name}</span>
						<div style={{ display: "flex", gap: "10px" }}>
							{preset.url && (
								<button
									className="rnp-font-btn download"
									onClick={() => betterncm.app.exec(preset.url)}
									title="下载/查看字体"
									style={{
										background: "transparent",
										border: "none",
										cursor: "pointer",
										opacity: 0.6,
										display: "flex",
										alignItems: "center",
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="18"
										viewBox="0 96 960 960"
										width="18"
										fill="currentColor"
									>
										<path d="M480 776l-160-160 56-56 64 64V336h80v288l64-64 56 56-160 160zm-280 80v-120h80v40h480v-40h80v120H200z" />
									</svg>
								</button>
							)}
							<button
								className="rnp-font-btn apply"
								onClick={() => setFontFamily(preset.fonts)}
								style={{
									background: "var(--rnp-accent-color)",
									color: "#fff",
									border: "none",
									borderRadius: "4px",
									padding: "4px 12px",
									cursor: "pointer",
									fontSize: "13px",
								}}
							>
								应用
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
