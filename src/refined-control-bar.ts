// code from material you theme

import "./refined-control-bar.scss";
import { getSetting, setSetting, waitForElement } from "./utils";

declare global {
	interface Window {
		rnpTimeIndicator: string;
		timeIndicator: string | boolean | number;
	}
}

const injectHTML = (
	type: string,
	html: string,
	parent: Element,
	fun: (dom: HTMLElement) => void = (_dom) => {},
): HTMLElement => {
	const dom = document.createElement(type);
	dom.innerHTML = html;
	fun(dom);

	parent.appendChild(dom);
	return dom;
};

const addPrefixZero = (num: number | string, len: number): string => {
	let numStr = num.toString();
	while (numStr.length < len) {
		numStr = `0${numStr}`;
	}
	return numStr;
};

const timeToSeconds = (time: string): number => {
	let seconds = 0;
	const parts = time.split(":");
	for (let i = 0; i < parts.length; i++) {
		seconds += parseInt(parts[i], 10) * 60 ** (parts.length - i - 1);
	}
	return seconds;
};

const secondsToTime = (seconds: number): string => {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${addPrefixZero(s, 2)}`;
};

const updateTimeIndicator = () => {
	const passed = document.querySelector<HTMLElement>("#rnp-time-passed");
	const rest = document.querySelector<HTMLElement>("#rnp-time-rest");
	const timeNow = document.querySelector<HTMLElement>("time.now");
	const timeAll = document.querySelector<HTMLElement>("time.all");

	if (!passed || !rest || !timeNow || !timeAll) return;

	const passedTime = timeToSeconds(timeNow.innerText);
	const totalTime = timeToSeconds(timeAll.innerText);
	const remainTime = totalTime - passedTime;

	passed.innerText = secondsToTime(passedTime);
	rest.innerText =
		window.rnpTimeIndicator === "remain"
			? `-${secondsToTime(remainTime)}`
			: secondsToTime(totalTime);
};

const updateTimeIndicatorPosition = () => {
	const selectorList = [".brt", ".speed", ".audioEffect", ".spk"];
	let leftestButton: HTMLElement | null = null;

	for (const selector of selectorList) {
		const el = document.querySelector<HTMLElement>(`.m-player ${selector}`);
		leftestButton = el;
		if (!leftestButton) {
			continue;
		}
		if (leftestButton.childElementCount !== 0) {
			break;
		}
	}

	if (!leftestButton) return;

	const computedRight = parseInt(
		window.getComputedStyle(leftestButton).right || "0",
		10,
	);
	const right = computedRight + leftestButton.clientWidth + 15;

	const indicator = document.querySelector<HTMLElement>("#rnp-time-indicator");
	if (indicator) {
		indicator.style.right = `${right}px`;
	}
};

const init = () => {
	if (
		document.body.classList.contains("material-you-theme") ||
		(typeof window.loadedPlugins !== "undefined" &&
			(window.loadedPlugins.MaterialYouTheme ||
				window.loadedPlugins["ark-theme"]))
	) {
		return;
	}

	window.timeIndicator = getSetting("time-indicator", "remain");

	waitForElement("#main-player", (dom) => {
		injectHTML(
			"div",
			`
			<span id="rnp-time-passed">0:00</span>
			/
			<span id="rnp-time-rest">0:00</span>
		`,
			dom,
			(dom) => {
				dom.id = "rnp-time-indicator";
				dom.style.opacity = "0";
				dom.style.pointerEvents = "none";
			},
		);

		const restEl = document.querySelector("#rnp-time-rest");
		if (restEl) {
			restEl.addEventListener("click", () => {
				if ((window.rnpTimeIndicator ?? "remain") === "remain") {
					window.rnpTimeIndicator = "total";
				} else {
					window.rnpTimeIndicator = "remain";
				}
				setSetting("time-indicator", window.rnpTimeIndicator);
				updateTimeIndicator();
				updateTimeIndicatorPosition();
			});
		}

		const timeNowEl = document.querySelector("time.now");
		if (timeNowEl) {
			new MutationObserver(() => {
				updateTimeIndicator();
			}).observe(timeNowEl, { childList: true });
		}

		const brtEl = document.querySelector("#main-player .brt");
		if (brtEl) {
			new MutationObserver(() => {
				updateTimeIndicatorPosition();
			}).observe(brtEl, {
				childList: true,
			});
		}

		const speedEl = document.querySelector("#main-player .speed");
		if (speedEl) {
			new MutationObserver(() => {
				updateTimeIndicatorPosition();
			}).observe(speedEl, {
				childList: true,
			});
		}
	});
};

init();
