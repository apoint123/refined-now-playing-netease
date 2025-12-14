import {
	copyTextToClipboard,
	getSetting,
	waitForElement,
	waitForElementAsync,
} from "./utils";
import "./refined-control-bar";
import { createRoot } from "react-dom/client";
import { Background } from "./background";
import { compatibilityWizard } from "./compatibility-check";
import { showContextMenu } from "./context-menu";
import { CoverShadow } from "./cover-shadow";
import { Lyrics } from "./lyrics";
import { MiniSongInfo } from "./mini-song-info";
import { SettingsPatcher } from "./patchers/settings";
import { ProgressbarPreview } from "./progressbar-preview";
import { imageInterceptor } from "./services/image-interceptor.ts";
import { playerService } from "./services/player";
import { themeService } from "./services/theme";
import { whatsNew } from "./whats-new";

import "./styles.scss";
import "./exclusive-modes.scss";
import "./FM.scss";
import "./experimental.scss";
import "./material-you-compatibility.scss";
import "./settings-menu.scss";

var lastCDImage = "";
const updateCDImage = () => {
	if (!document.querySelector(".g-single")) {
		return;
	}

	const imgDom = document.querySelector(
		".n-single .cdimg img",
	) as HTMLImageElement;
	if (!imgDom) {
		return;
	}

	const realCD = document.querySelector(".n-single .cdimg");

	const update = () => {
		const cdImage = imgDom.src;
		if (cdImage === lastCDImage) {
			return;
		}
		lastCDImage = cdImage;
		themeService.calcAccentColor(imgDom);
	};

	if (imgDom.complete) {
		update();
		realCD?.classList.remove("loading");
	} else {
		realCD?.classList.add("loading");
	}
};

var lastTitle = "";
const titleSizeController = document.createElement("style");
titleSizeController.innerHTML = "";
document.head.appendChild(titleSizeController);

const recalculateTitleSize = (forceRefresh = false) => {
	const title = document.querySelector(
		".g-single .g-singlec-ct .n-single .mn .head .inf .title",
	) as HTMLElement;
	if (!title) {
		return;
	}
	if (title.innerText === lastTitle && !forceRefresh) {
		return;
	}
	lastTitle = title.innerText;
	const text = title.innerText;
	const testDiv = document.createElement("div");
	testDiv.style.position = "absolute";
	testDiv.style.top = "-9999px";
	testDiv.style.left = "-9999px";
	testDiv.style.width = "auto";
	testDiv.style.height = "auto";
	testDiv.style.whiteSpace = "nowrap";
	testDiv.innerText = text;
	document.body.appendChild(testDiv);

	const maxThreshold = Math.max(
		Math.min(document.body.clientHeight * 0.05, 60),
		45,
	);
	const minThreshold = 24;
	const titleElement = document.querySelector(
		".g-single-track .g-singlec-ct .n-single .mn .head .inf .title",
	);
	const targetWidth = titleElement ? titleElement.clientWidth : 0;

	if (targetWidth === 0) {
		return;
	}

	let l = 1;
	let r = 61;
	while (l < r) {
		const mid = Math.floor((l + r) / 2);
		testDiv.style.fontSize = `${mid}px`;
		const width = testDiv.clientWidth;
		if (width > targetWidth) {
			r = mid;
		} else {
			l = mid + 1;
		}
	}
	let fontSize = l - 1;
	while (testDiv.clientWidth > targetWidth) {
		fontSize--;
		testDiv.style.fontSize = `${fontSize}px`;
	}
	fontSize = Math.max(Math.min(fontSize, maxThreshold), minThreshold);
	testDiv.style.fontSize = `${fontSize}px`;
	// const width = testDiv.clientWidth;
	document.body.removeChild(testDiv);
	titleSizeController.innerHTML = `
		.g-single .g-singlec-ct .n-single .mn .head .inf .title h1 {
			font-size: ${fontSize}px !important;
		}
	`;
};
const verticalAlignMiddleController = document.createElement("style");
verticalAlignMiddleController.innerHTML = "";
document.head.appendChild(verticalAlignMiddleController);

window.addEventListener("resize", () => {
	recalculateTitleSize(true);
});

const moveTags = () => {
	const titleBase = document.querySelector(
		".g-single-track .g-singlec-ct .n-single .mn .head .inf .title",
	);
	if (!titleBase) {
		return;
	}
	const tags = titleBase.querySelector("h1 > .name > .tag-wrap");
	if (!tags) {
		return;
	}
	const existingTags = titleBase.querySelector("h1 > .tag-wrap");
	if (existingTags) {
		existingTags.remove();
	}
	titleBase.querySelector("h1")?.appendChild(tags);
};

const calcTitleScroll = () => {
	moveTags();
	const titleContainer = document.querySelector(
		".g-single .g-singlec-ct .n-single .mn .head .inf .title .name",
	);
	if (!titleContainer) {
		return;
	}
	if ((titleContainer?.firstChild?.nodeType ?? 0) === 3) {
		const titleInner = document.createElement("div");
		titleInner.classList.add("name-inner");
		titleInner.innerHTML = titleContainer.innerHTML.replace(/&nbsp;/g, " ");
		titleContainer.innerHTML = "";
		titleContainer.appendChild(titleInner);
	}
	/*const containerWidth = titleContainer.clientWidth;
	const innerWidth = titleContainer.querySelector('.name-inner').clientWidth;
	if (containerWidth < innerWidth && innerWidth - containerWidth < 20) {
		titleSizeController.innerHTML = `
			.g-single .g-singlec-ct .n-single .mn .head .inf .title h1 {
				font-size: ${titleSizeController.innerHTML.match(/font-size: (\d+)px/)[1] - 1}px !important;
			}
		`;
	}
	if (containerWidth < innerWidth) {
		titleContainer.classList.add('scroll');
	} else {
		titleContainer.classList.remove('scroll');
	}
	titleContainer.style.setProperty('--scroll-offset', `${innerWidth - containerWidth}px`);
	titleContainer.style.setProperty('--scroll-speed', `${(innerWidth - containerWidth) / 30}s`);*/
};

waitForElement("#main-player, .m-pinfo", (dom) => {
	dom.addEventListener("mouseenter", () => {
		document.body.classList.add("bottombar-hover");
	});
	dom.addEventListener("mouseleave", () => {
		document.body.classList.remove("bottombar-hover");
	});
});

const toggleFullScreen = (force: boolean | null = null) => {
	if (!document.fullscreenElement) {
		if (force === false) return;
		document.documentElement.requestFullscreen();
		if (window.loadedPlugins.RoundCornerNCM) {
			betterncm.app.setRoundedCorner(false);
		}
		document.body.classList.add("rnp-full-screen");
		const btn = document.querySelector(
			".rnp-full-screen-button",
		) as HTMLElement;
		if (btn) btn.title = "退出全屏";
	} else {
		if (document.exitFullscreen) {
			if (force === true) return;
			document.exitFullscreen();
			if (window.loadedPlugins.RoundCornerNCM) {
				betterncm.app.setRoundedCorner(true);
			}
			document.body.classList.remove("rnp-full-screen");
			const btn = document.querySelector(
				".rnp-full-screen-button",
			) as HTMLElement;
			if (btn) btn.title = "全屏";
		}
	}
};

const addFullScreenButton = (container: Element | null = null) => {
	if (!container) container = document.body; // Fallback
	const fullScreenButton = document.createElement("div");
	fullScreenButton.classList.add("rnp-full-screen-button");
	fullScreenButton.title = "全屏";
	fullScreenButton.addEventListener("click", () => {
		toggleFullScreen();
	});
	document.body.appendChild(fullScreenButton);

	var fullScreenClock = document.createElement("div");
	fullScreenClock.classList.add("rnp-full-screen-clock");
	function updateClock() {
		var currentTime = new Date();
		var hours = String(currentTime.getHours());
		var minutes = String(currentTime.getMinutes());

		hours = `0${hours}`.slice(-2);
		minutes = `0${minutes}`.slice(-2);
		fullScreenClock.textContent = `${hours}:${minutes}`;
	}
	updateClock();
	setInterval(updateClock, 1000);
	document.body.appendChild(fullScreenClock);
};

new MutationObserver(() => {
	if (
		!document.body.classList.contains("mq-playing") &&
		document.body.classList.contains("rnp-full-screen")
	) {
		toggleFullScreen(false);
	}
}).observe(document.body, { attributes: true, attributeFilter: ["class"] });

plugin.onLoad(async () => {
	imageInterceptor.enable();
	await playerService.init();
	compatibilityWizard();

	document.body.classList.add("refined-now-playing");

	if (!window.loadedPlugins.MaterialYouTheme) {
		document.body.classList.add("no-material-you-theme");
	}

	new MutationObserver(async () => {
		// Now playing page
		const singlePage = document.querySelector(".g-single:not(.patched)");
		if (singlePage) {
			singlePage.classList.add("patched");
			waitForElement(".n-single .cdimg img", (dom) => {
				const img = dom as HTMLImageElement;
				img.addEventListener("load", updateCDImage);
				new MutationObserver(updateCDImage).observe(img, {
					attributes: true,
					attributeFilter: ["src"],
				});

				img.addEventListener("contextmenu", (e) => {
					const event = e as MouseEvent;
					event.preventDefault();
					event.stopPropagation();
					const imageURL = img.src
						.replace(/^orpheus:\/\/cache\/\?/, "")
						.replace(/\?.*$/, "");
					showContextMenu(event.clientX, event.clientY, [
						{
							label: "复制图片地址",
							callback: () => {
								copyTextToClipboard(imageURL);
							},
						},
						{
							label: "在浏览器中打开图片",
							callback: () => {
								betterncm.app.exec(`${imageURL}`);
							},
						},
					]);
				});
			});

			waitForElement(
				".g-single .g-singlec-ct .n-single .mn .head .inf",
				(dom) => {
					const infoContainer = dom as HTMLElement;
					const addCopySelectionToItems = (
						items: any[],
						closetSelector: string,
					) => {
						const selection = window.getSelection();
						if (
							selection?.toString().trim() &&
							// @ts-expect-error
							selection.baseNode?.parentElement?.closest(closetSelector)
						) {
							const selectedText = selection.toString().trim();
							items.unshift({
								label: "复制",
								callback: () => {
									copyTextToClipboard(selectedText);
								},
							});
						}
					};

					infoContainer.addEventListener("contextmenu", (e) => {
						const event = e as MouseEvent;
						const target = event.target as HTMLElement;
						event.preventDefault();
						event.stopPropagation();

						if (target.closest(".title .name")) {
							const nameEl = infoContainer.querySelector(
								".title .name",
							) as HTMLElement;
							const songName = nameEl?.innerText || "";
							const items = [
								{
									label: "复制歌曲名",
									callback: () => {
										copyTextToClipboard(songName);
									},
								},
							];
							addCopySelectionToItems(items, ".title .name");
							showContextMenu(event.clientX, event.clientY, items);
							return;
						}

						if (target.closest(".info .alias")) {
							const aliasEl = infoContainer.querySelector(
								".info .alias",
							) as HTMLElement;
							const songAlias = aliasEl?.innerText || "";
							const items = [
								{
									label: "复制歌曲别名",
									callback: () => {
										copyTextToClipboard(songAlias);
									},
								},
							];
							addCopySelectionToItems(items, ".info .alias");
							showContextMenu(event.clientX, event.clientY, items);
							return;
						}
					});
				},
			);

			const background = document.createElement("div");
			background.classList.add("rnp-bg");
			const bgImg = await waitForElementAsync(".n-single .cdimg img");
			createRoot(background).render(
				<Background
					type={String(getSetting("background-type", "fluid"))}
					image={bgImg as HTMLImageElement}
				/>,
			);
			document.querySelector(".g-single")?.appendChild(background);

			const coverShadowController = document.createElement("div");
			coverShadowController.classList.add("rnp-cover-shadow-controller");
			const shadowImg = await waitForElementAsync(".n-single .cdimg img");
			createRoot(coverShadowController).render(
				<CoverShadow image={shadowImg as HTMLImageElement} />,
			);
			document.body.appendChild(coverShadowController);

			waitForElement(
				".g-single-track .g-singlec-ct .n-single .mn .lyric",
				(oldLyrics) => {
					oldLyrics.remove();
				},
			);
			const lyrics = document.createElement("div");
			lyrics.classList.add("lyric");
			createRoot(lyrics).render(<Lyrics />);
			waitForElement(".g-single-track .g-singlec-ct .n-single .wrap", (dom) => {
				dom.appendChild(lyrics);
			});

			const miniSongInfo = document.createElement("div");
			miniSongInfo.classList.add("rnp-mini-song-info");
			setTimeout(async () => {
				const miniInfoImg = await waitForElementAsync(".n-single .cdimg img");
				const miniInfoContainer = await waitForElementAsync(
					".g-single .g-singlec-ct .n-single .mn .head .inf",
				);

				createRoot(miniSongInfo).render(
					<MiniSongInfo
						image={miniInfoImg as HTMLImageElement}
						infContainer={miniInfoContainer as HTMLElement}
					/>,
				);
				document.querySelector(".g-single")?.appendChild(miniSongInfo);
			}, 0);

			const settingsPatcher = new SettingsPatcher(false);
			const container = document.querySelector(".g-single");
			if (container) {
				settingsPatcher.mount(container);
			}
			addFullScreenButton(document.querySelector(".g-single"));

			whatsNew();
		}
	}).observe(document.body, { childList: true });

	new MutationObserver(() => {
		recalculateTitleSize();
		calcTitleScroll();
	}).observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		characterData: true,
		attributeFilter: ["src"],
	});

	// Add progressbar hover preview
	waitForElement("#main-player .prg", (dom) => {
		const progressbarPreview = document.createElement("div");
		progressbarPreview.classList.add("rnp-progressbar-preview");
		createRoot(progressbarPreview).render(
			<ProgressbarPreview dom={dom as HTMLElement} />,
		);
		document.body.appendChild(progressbarPreview);
	});
	waitForElement(".m-player-fm .prg", (dom) => {
		const progressbarPreview = document.createElement("div");
		progressbarPreview.classList.add("rnp-progressbar-preview");
		progressbarPreview.classList.add("rnp-progressbar-preview-fm");
		createRoot(progressbarPreview).render(
			<ProgressbarPreview dom={dom as HTMLElement} />,
		);
		document.body.appendChild(progressbarPreview);
	});

	// Fix incomptibility with light theme
	const lightThemeFixStyle = document.createElement("link");
	lightThemeFixStyle.rel = "stylesheet";
	document.head.appendChild(lightThemeFixStyle);
	new MutationObserver(() => {
		if (document.body.classList.contains("mq-playing")) {
			if (
				lightThemeFixStyle.href !==
				"orpheus://orpheus/style/res/less/default/css/skin.ls.css"
			) {
				lightThemeFixStyle.href =
					"orpheus://orpheus/style/res/less/default/css/skin.ls.css";
			}
		} else {
			if (lightThemeFixStyle.href !== "") {
				lightThemeFixStyle.href = "";
			}
		}
	}).observe(document.body, { attributes: true, attributeFilter: ["class"] });

	let previousHasClass = document.body.classList.contains("mq-playing");
	new MutationObserver(() => {
		const hasClass = document.body.classList.contains("mq-playing");
		if (hasClass !== previousHasClass) {
			previousHasClass = hasClass;
			if (hasClass) {
				for (let i = 0; i < 10; i++) {
					setTimeout(() => {
						window.dispatchEvent(new Event("recalc-lyrics"));
						window.dispatchEvent(new Event("recalc-title"));
					}, 50 * i);
				}
			}
		}
	}).observe(document.body, { attributes: true, attributeFilter: ["class"] });

	// 私人 FM
	const patchFM = async () => {
		const fmPage = document.querySelector(
			"#page_pc_userfm_songplay:not(.patched)",
		);
		if (fmPage) {
			fmPage.classList.add("patched");
			if (FMObserver) FMObserver.disconnect();

			const lyrics = document.createElement("div");
			lyrics.classList.add("lyric");
			document.querySelector("#page_pc_userfm_songplay")?.appendChild(lyrics);
			createRoot(lyrics).render(<Lyrics isFM={true} />);
			for (let i = 0; i < 15; i++) {
				setTimeout(() => {
					window.dispatchEvent(new Event("resize"));
				}, 200 * i);
			}

			const background = document.createElement("div");
			background.classList.add("rnp-bg", "fm-bg");

			const fmCover = await waitForElementAsync(
				"#page_pc_userfm_songplay .fmplay .covers",
			);
			createRoot(background).render(
				<Background
					type={String(getSetting("background-type", "fluid"))}
					image={fmCover as HTMLImageElement}
					isFM={true}
					imageChangedCallback={(dom) => {
						if (!dom) return;
						themeService.calcAccentColor(dom, true);
					}}
				/>,
			);
			document
				.querySelector("#page_pc_userfm_songplay")
				?.appendChild(background);

			const fmSettingsPatcher = new SettingsPatcher(true);
			const fmContainer = document.querySelector("#page_pc_userfm_songplay");
			if (fmContainer) {
				fmSettingsPatcher.mount(fmContainer);
			}
		}
	};

	const FMObserver = new MutationObserver(patchFM);
	window.addEventListener("hashchange", async () => {
		if (!window.location.hash.startsWith("#/m/fm/")) {
			FMObserver.disconnect();
			return;
		}
		for (let i = 0; i < 10; i++) {
			setTimeout(() => {
				window.dispatchEvent(new Event("recalc-lyrics"));
				window.dispatchEvent(new Event("recalc-title"));
			}, 50 * i);
		}
		FMObserver.observe(document.body, { childList: true });
		window.dispatchEvent(new Event("recalc-lyrics"));
	});

	// Listen system theme change
	const toggleSystemDarkmodeClass = (
		media: MediaQueryList | MediaQueryListEvent,
	) => {
		document.body.classList.add(
			media.matches ? "rnp-system-dark" : "rnp-system-light",
		);
		document.body.classList.remove(
			media.matches ? "rnp-system-light" : "rnp-system-dark",
		);
		if (document.body.classList.contains("rnp-system-dynamic-theme-auto")) {
			window.mdThemeType = media.matches ? "dark" : "light";
		}
	};
	const systemDarkmodeMedia = window.matchMedia("(prefers-color-scheme: dark)");
	systemDarkmodeMedia.addEventListener("change", (e) => {
		toggleSystemDarkmodeClass(e);
	});
	toggleSystemDarkmodeClass(systemDarkmodeMedia);

	// Idle detection
	const IdleThreshold = 1.5 * 1000;
	let idleTimer: ReturnType<typeof setTimeout> | null = null;
	let idle = false;
	let debounceTime: number | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const resetIdleTimer = () => {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(() => {
			idle = true;
			document.body.classList.add("rnp-idle");
			if (debounceTimer) clearTimeout(debounceTimer);
		}, IdleThreshold);
	};

	const resetIdle = () => {
		if (idle) {
			idle = false;
			document.body.classList.remove("rnp-idle");
			debounceTime = Date.now();
		}
		resetIdleTimer();
	};

	const setIdle = () => {
		debounceTimer = setTimeout(
			() => {
				if (idleTimer) clearTimeout(idleTimer);
				idle = true;
				document.body.classList.add("rnp-idle");
			},
			Math.max((debounceTime ?? 0) + 325 - Date.now(), 0),
		);
	};

	resetIdleTimer();
	document.addEventListener("mousemove", resetIdle);
	document.addEventListener("mouseout", (e) => {
		if (e.relatedTarget === null) {
			setIdle();
		}
	});

	// Listen for now playing open
	new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.addedNodes.length > 0) {
				mutation.addedNodes.forEach((node) => {
					const el = node as HTMLElement;
					if (el.classList?.contains("g-single")) {
						document.body.classList.add("mq-playing");
						el.classList.add("z-show");
					}
				});
			}
		});
	}).observe(document.body, { childList: true });
	/*new MutationObserver(() => {
		if (!document.body.classList.contains('mq-playing') && !document.querySelector('.g-single')?.classList.contains('z-show')) {
			if (document.body.classList.contains('mq-playing-init')) {
				document.body.classList.remove('mq-playing-init');
			}
		}
	}).observe(document.body, { attributes: true, attributeFilter: ['class'] });*/
});

plugin.onConfig((tools) => {
	return dom(
		"div",
		{},
		dom("span", {
			innerHTML: "打开正在播放界面以调整设置 ",
			style: { fontSize: "18px" },
		}),
		tools.makeBtn("打开", async () => {
			(document.querySelector("a[data-action='max']") as HTMLElement)?.click();
		}),
		dom("div", { innerHTML: "", style: { height: "20px" } }),
		dom("span", {
			innerHTML: "进入兼容性检查页面 ",
			style: { fontSize: "18px" },
		}),
		tools.makeBtn("兼容性检查", async () => {
			compatibilityWizard(true);
		}),
	);
});
