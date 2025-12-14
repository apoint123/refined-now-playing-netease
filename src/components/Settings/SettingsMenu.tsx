import { useEffect, useRef, useState } from "react";
import {
	AboutSection,
	AppearanceSection,
	BackgroundSection,
	CoverSection,
	ExperimentalSection,
	FontSection,
	LyricSection,
	MiscSection,
} from "./Sections";

const TABS = [
	{ id: "appearance", label: "外观" },
	{ id: "cover", label: "封面" },
	{ id: "background", label: "背景" },
	{ id: "lyric", label: "歌词" },
	{ id: "font", label: "字体" },
	{ id: "misc", label: "杂项" },
	{ id: "experimental", label: "实验" },
	{ id: "about", label: "关于" },
];

export const SettingsMenu = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("appearance");

	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	const toggleMenu = () => setIsOpen(!isOpen);

	const handleTabClick = (tabId: string) => {
		setActiveTab(tabId);
		const section = sectionRefs.current.get(tabId);
		if (section && scrollContainerRef.current) {
			const top = section.offsetTop;
			scrollContainerRef.current.scrollTo({ top, behavior: "smooth" });
		}
	};

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleScroll = () => {
			const top = container.scrollTop;
			if (top + container.clientHeight >= container.scrollHeight - 50) {
				setActiveTab(TABS[TABS.length - 1].id);
				return;
			}

			let currentId = TABS[0].id;
			for (const tab of TABS) {
				const section = sectionRefs.current.get(tab.id);
				if (section && section.offsetTop <= top + 100) {
					currentId = tab.id;
				}
			}
			setActiveTab(currentId);
		};

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, []);

	const setRef = (id: string) => (el: HTMLDivElement | null) => {
		if (el) sectionRefs.current.set(id, el);
		else sectionRefs.current.delete(id);
	};

	return (
		<>
			<button
				className={`rnp-settings ${isOpen ? "open" : ""}`}
				onClick={toggleMenu}
				style={{
					opacity: isOpen ? 1 : undefined,
					pointerEvents: "auto",
				}}
				title="设置"
			/>

			<div
				className={`rnp-settings-menu ${isOpen ? "open" : ""}`}
				style={{
					opacity: isOpen ? 1 : 0,
					pointerEvents: isOpen ? "all" : "none",
					transform: isOpen ? "none" : "translateY(-10px)",
				}}
			>
				<div className="rnp-settings-menu-tabs">
					{TABS.map((tab) => (
						<div
							key={tab.id}
							className={`rnp-settings-menu-tab ${activeTab === tab.id ? "active" : ""}`}
							onClick={() => handleTabClick(tab.id)}
							data-tab={tab.id}
						>
							{tab.label}
						</div>
					))}
				</div>

				<div className="rnp-settings-menu-inner" ref={scrollContainerRef}>
					<AppearanceSection ref={setRef("appearance")} />
					<CoverSection ref={setRef("cover")} />
					<BackgroundSection ref={setRef("background")} />
					<LyricSection ref={setRef("lyric")} />
					<FontSection ref={setRef("font")} />
					<MiscSection ref={setRef("misc")} />
					<ExperimentalSection ref={setRef("experimental")} />
					<AboutSection ref={setRef("about")} />
				</div>
			</div>
		</>
	);
};
