import { useAtomValue } from "jotai";
import React from "react";
import * as S from "@/store/settings";
import { LyricOffsetControl } from "./Controls/LyricOffsetControl";
import { SelectItem } from "./Controls/SelectItem";
import { SliderItem } from "./Controls/SliderItem";
import { SwitchItem } from "./Controls/SwitchItem";
import { FontSettings } from "./Sections/FontSettings";
import { SettingsSection } from "./SettingsSection";

// ==================== 外观 ====================
export const AppearanceSection = React.forwardRef<HTMLDivElement>((_, ref) => {
	return (
		<SettingsSection title="外观" id="appearance" ref={ref}>
			<SelectItem
				label="显示"
				atom={S.exclusiveModeAtom}
				options={[
					{ label: "全部", value: "all" },
					{ label: "仅歌词", value: "lyric-only" },
					{ label: "仅封面", value: "song-info-only" },
				]}
			/>
			<SwitchItem
				label="歌词居中"
				atom={S.centerLyricAtom}
				className="center-lyric-control"
			/>
			<SwitchItem
				label="自动隐藏迷你歌曲信息"
				atom={S.autoHideMiniInfoAtom}
				className="auto-hide-mini-song-info-control"
			/>

			<SelectItem
				label="颜色模式"
				atom={S.colorSchemeAtom}
				options={[
					{ label: "暗色", value: "dark" },
					{ label: "亮色", value: "light" },
					{ label: "系统", value: "auto" },
				]}
			/>

			<SelectItem
				label="沉浸主题色"
				atom={S.accentColorVariantAtom}
				options={[
					{ label: "关", value: "off" },
					{ label: "鲜艳", value: "primary" },
					{ label: "柔和", value: "secondary" },
					{ label: "偏色", value: "tertiary" },
				]}
			/>

			<SwitchItem label="文字阴影" atom={S.textShadowAtom} />
			<SwitchItem label="文字辉光" atom={S.textGlowAtom} />

			<SwitchItem
				label="优化底栏"
				atom={S.refinedControlBarAtom}
				className="refined-control-bar-switch"
			/>
			<SwitchItem label="不自动隐藏底栏" atom={S.alwaysShowBottomBarAtom} />

			{/* TODO: 应用回之前的逻辑 */}
			<SwitchItem
				label="进度条贴底"
				atom={S.bottomProgressBarAtom}
				className="bottom-progressbar-switch"
			/>
			<SwitchItem
				label="进度条悬停预览"
				atom={S.enableProgressbarPreviewAtom}
				note="鼠标悬停在进度条上时显示对应歌词"
			/>
		</SettingsSection>
	);
});

// ==================== 封面 ====================
export const CoverSection = React.forwardRef<HTMLDivElement>((_, ref) => {
	return (
		<SettingsSection title="封面" id="cover" ref={ref}>
			<SelectItem
				label="封面水平对齐"
				atom={S.coverAlignHAtom}
				options={[
					{ label: "居左", value: "left" },
					{ label: "居中", value: "center" },
				]}
			/>
			<SelectItem
				label="封面垂直对齐"
				atom={S.coverAlignVAtom}
				options={[
					{ label: "居下", value: "bottom" },
					{ label: "居中", value: "middle" },
				]}
			/>
			<SwitchItem label="方形专辑封面" atom={S.rectangleCoverAtom} />

			<SliderItem
				label="专辑封面清晰度"
				atom={S.albumSizeAtom}
				min={200}
				max={800}
				step={200}
				defaultValue={200}
				ticks={[200, 400, 600, 800]}
				note="可能带来更慢的加载速度"
			/>

			<SwitchItem label="封面弥散阴影" atom={S.coverBlurryShadowAtom} />
		</SettingsSection>
	);
});

// ==================== 背景 ====================
export const BackgroundSection = React.forwardRef<HTMLDivElement>((_, ref) => {
	const bgType = useAtomValue(S.backgroundTypeAtom);

	return (
		<SettingsSection title="背景" id="background" ref={ref}>
			<SelectItem
				label="类型"
				atom={S.backgroundTypeAtom}
				options={[
					{ label: "流体", value: "fluid" },
					{ label: "模糊", value: "blur" },
					{ label: "渐变", value: "gradient" },
					{ label: "纯色", value: "solid" },
					{ label: "无", value: "none" },
				]}
			/>

			{bgType === "fluid" && (
				<>
					<SwitchItem
						label="静态流体"
						atom={S.staticFluidAtom}
						note="减少流体背景的性能开销"
						className="static-fluid"
					/>
					<SliderItem
						label="暗化"
						atom={S.bgDimForFluidAtom}
						min={0}
						max={90}
						defaultValue={30}
					/>
				</>
			)}

			{bgType === "gradient" && (
				<>
					<SwitchItem
						label="动态渐变"
						atom={S.gradientBgDynamicAtom}
						className="gradient-bg-dynamic"
					/>
					<SliderItem
						label="暗化"
						atom={S.bgDimForGradientAtom}
						min={0}
						max={100}
						defaultValue={45}
					/>
				</>
			)}

			{bgType === "blur" && (
				<>
					<SliderItem
						label="模糊"
						atom={S.bgBlurAtom}
						min={0}
						max={128}
						defaultValue={90}
					/>
					<SliderItem
						label="暗化"
						atom={S.bgDimAtom}
						min={0}
						max={100}
						defaultValue={55}
					/>
				</>
			)}

			{bgType === "none" && (
				<>
					<SliderItem
						label="遮罩模糊"
						atom={S.bgBlurForNoneAtom}
						min={0}
						max={100}
						defaultValue={0}
					/>
					<SliderItem
						label="遮罩暗化"
						atom={S.bgDimForNoneAtom}
						min={0}
						max={90}
						defaultValue={0}
					/>
				</>
			)}

			<SliderItem
				label="透明度"
				atom={S.bgOpacityAtom}
				min={0}
				max={100}
				defaultValue={0}
			/>
		</SettingsSection>
	);
});

// ==================== 歌词 ====================
export const LyricSection = React.forwardRef<HTMLDivElement>((_, ref) => {
	const lyricRotate = useAtomValue(S.lyricRotateAtom);

	return (
		<SettingsSection title="歌词" id="lyric" ref={ref}>
			<SwitchItem label="加粗首行" atom={S.originalLyricBoldAtom} />
			<SliderItem
				label="字体大小"
				atom={S.lyricFontSizeAtom}
				min={16}
				max={64}
				defaultValue={32}
			/>
			<SliderItem
				label="罗马音大小"
				atom={S.lyricRomajiSizeAtom}
				min={0.3}
				max={1.5}
				step={0.05}
				defaultValue={0.6}
			/>
			<SliderItem
				label="翻译大小"
				atom={S.lyricTranslationSizeAtom}
				min={0.3}
				max={1.5}
				step={0.05}
				defaultValue={1.0}
			/>

			<SwitchItem label="歌词渐隐" atom={S.lyricFadeAtom} />
			<SwitchItem label="歌词缩放" atom={S.lyricZoomAtom} />
			<SwitchItem label="歌词模糊" atom={S.lyricBlurAtom} />

			<SwitchItem label="歌词旋转" atom={S.lyricRotateAtom} />
			{lyricRotate && (
				<SliderItem
					label="曲率"
					atom={S.rotateCurvatureAtom}
					min={10}
					max={80}
					defaultValue={30}
				/>
			)}

			<SelectItem
				label="逐字动画"
				atom={S.karaokeAnimationAtom}
				options={[
					{ label: "上浮", value: "float" },
					{ label: "滑动", value: "slide" },
				]}
			/>

			<SelectItem
				label="当前歌词位置"
				atom={S.lyricAlignmentAtom}
				options={[
					{ label: "居上", value: 30 },
					{ label: "居中", value: 50 },
				]}
			/>

			<SwitchItem label="错位滚动动画" atom={S.lyricStaggerAtom} />

			<SelectItem
				label="动画曲线"
				atom={S.lyricAnimationTimingAtom}
				options={[
					{ label: "平滑", value: "smooth" },
					{ label: "急促", value: "sharp" },
					{ label: "温和", value: "lazy" },
					{ label: "缓出", value: "easeout" },
				]}
			/>

			<SwitchItem
				label="长音发光动画"
				atom={S.lyricGlowAtom}
				note="在句末长音单词播放时显示发光动画"
			/>

			<LyricOffsetControl />

			<SelectItem
				label="歌词贡献者显示"
				atom={S.lyricContributorsDisplayAtom}
				options={[
					{ label: "总是", value: "show" },
					{ label: "鼠标移上", value: "hover" },
					{ label: "隐藏", value: "hide" },
				]}
			/>
		</SettingsSection>
	);
});

export const FontSection = React.forwardRef<HTMLDivElement>((_, ref) => (
	<SettingsSection title="字体" id="font" ref={ref}>
		<SwitchItem label="自定义字体" atom={S.customFontAtom} />
		<FontSettings />
	</SettingsSection>
));

export const MiscSection = React.forwardRef<HTMLDivElement>((_, ref) => (
	<SettingsSection title="杂项" id="misc" ref={ref}>
		<SwitchItem label="隐藏歌曲别名/译名" atom={S.hideSongAliasAtom} />
		<SwitchItem label="隐藏评论区" atom={S.hideCommentsAtom} />
		<SwitchItem
			label="局部背景"
			atom={S.partialBgAtom}
			note="该选项为旧版本遗留选项，不保证兼容性。"
		/>
	</SettingsSection>
));

export const ExperimentalSection = React.forwardRef<HTMLDivElement>(
	(_, ref) => {
		const bgType = useAtomValue(S.backgroundTypeAtom);
		const dynamicFluid = !useAtomValue(S.staticFluidAtom);
		const showFluidSettings = bgType === "fluid";

		return (
			<SettingsSection title="实验性选项" id="experimental" ref={ref}>
				<span className="rnp-checkbox-note" style={{ paddingLeft: 0 }}>
					这些选项是实验性的，可能会在下一个版本移除。
				</span>

				{showFluidSettings && dynamicFluid && (
					<SliderItem
						label="流体帧率上限"
						atom={S.fluidMaxFramerateAtom}
						min={0}
						max={4}
						defaultValue={4}
						ticks={[5, 10, 30, 60, Infinity]}
						note="仅在动态流体开启时生效"
					/>
				)}

				{showFluidSettings && (
					<SliderItem
						label="流体模糊度"
						atom={S.fluidBlurAtom}
						min={5}
						max={7}
						defaultValue={6}
						ticks={[32, 64, 128]}
						note="仅在流体开启时生效"
					/>
				)}

				<SwitchItem
					label="隐藏整个底栏"
					atom={S.hideBottomBarWhenIdleAtom}
					note="鼠标不动时隐藏整个底栏"
				/>
				<SwitchItem
					label="演示模式"
					atom={S.presentationModeAtom}
					note="隐藏一切多余元素"
					className="presentation-mode-switch"
				/>
			</SettingsSection>
		);
	},
);

export const AboutSection = React.forwardRef<HTMLDivElement>((_, ref) => (
	<SettingsSection title="关于" id="about" ref={ref}>
		<div className="rnp-about">
			<div className="rnp-about-item">
				<div className="rnp-about-item-title">版本</div>
				<div className="rnp-about-item-content">
					{window.loadedPlugins?.RefinedNowPlaying?.manifest?.version || "Dev"}
				</div>
			</div>
			<div className="rnp-about-item">
				<div className="rnp-about-item-title">Github</div>
				<a
					className="rnp-about-item-content"
					style={{ cursor: "pointer" }}
					onClick={() =>
						betterncm.app.exec(
							"https://github.com/solstice23/refined-now-playing-netease",
						)
					}
				>
					前往
				</a>
			</div>
		</div>
	</SettingsSection>
));
