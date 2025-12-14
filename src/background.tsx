import "./background.scss";
import ColorThief from "colorthief";
import { useCallback, useEffect, useRef, useState } from "react";
import { getGradientFromPalette } from "./color-utils";

declare global {
	function registerAudioLevelCallback(callback: (value: number) => void): void;
	function unregisterAudioLevelCallback(
		callback: (value: number) => void,
	): void;
}

interface BackgroundProps {
	type?: string; // "blur" | "gradient" | "fluid" | "solid" | "none"
	image: HTMLElement; // HTMLImageElement (普通模式) 或 HTMLDivElement (FM模式)
	isFM?: boolean;
	imageChangedCallback?: (dom: HTMLImageElement) => void;
}

interface SubBackgroundProps {
	url: string;
	static?: boolean;
	isFM?: boolean;
}

const colorThief = new ColorThief();

export function Background(props: BackgroundProps) {
	const [type, setType] = useState<string>(props.type ?? "blur");
	const [url, setUrl] = useState<string>("");
	const [staticFluid, setStaticFluid] = useState<boolean>(true);
	const image = props.image;

	if (!props.isFM) {
		useEffect(() => {
			const imgElement = image as HTMLImageElement;
			const observer = new MutationObserver(() => {
				if (imgElement.src === url) return;
				if (imgElement.complete) {
					setUrl(imgElement.src);
				}
			});
			observer.observe(imgElement, {
				attributes: true,
				attributeFilter: ["src"],
			});
			const onload = () => {
				setUrl(imgElement.src);
			};
			imgElement.addEventListener("load", onload);

			if (imgElement.src) setUrl(imgElement.src);

			return () => {
				observer.disconnect();
				imgElement.removeEventListener("load", onload);
			};
		}, [image, url]);
	} else {
		useEffect(() => {
			const imageContainer = image;
			const getCurrImg = () =>
				imageContainer.querySelector(
					".cvr.j-curr img",
				) as HTMLImageElement | null;

			const currImg = getCurrImg();
			if (currImg) {
				setUrl(currImg.src);
				props.imageChangedCallback?.(currImg);
			}

			const observer = new MutationObserver(() => {
				const img = getCurrImg();
				if (img) {
					setUrl(img.src);
					props.imageChangedCallback?.(img);
				}
			});
			observer.observe(imageContainer, { childList: true, subtree: true });
			return () => {
				observer.disconnect();
			};
		}, [image, props]);
	}

	useEffect(() => {
		const handleTypeChange = (e: Event) => {
			const ce = e as CustomEvent;
			setType(ce.detail.type ?? "blur");
		};
		const handleStaticFluid = (e: Event) => {
			const ce = e as CustomEvent;
			setStaticFluid(ce.detail ?? false);
		};

		document.addEventListener("rnp-background-type", handleTypeChange);
		document.addEventListener("rnp-static-fluid", handleStaticFluid);
		return () => {
			document.removeEventListener("rnp-background-type", handleTypeChange);
			document.removeEventListener("rnp-static-fluid", handleStaticFluid);
		};
	}, []);

	return (
		<>
			{type === "blur" && <BlurBackground url={url} />}
			{type === "gradient" && <GradientBackground url={url} />}
			{type === "fluid" && (
				<FluidBackground url={url} static={staticFluid} isFM={props.isFM} />
			)}
			{type === "solid" && <SolidBackground />}
			{type === "none" && (
				<>
					<div className="rnp-background-none"></div>
					<style>
						{`
							body.mq-playing .g-single {
								background: transparent !important;
							}
							body.mq-playing .g-sd,
							body.mq-playing .g-mn {
								opacity: 0;
							}
						`}
					</style>
				</>
			)}
		</>
	);
}

function BlurBackground(props: SubBackgroundProps) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!props.url || !ref.current) return;
		ref.current.style.backgroundImage = `url(${props.url})`;
		ref.current.style.transition = "background-image 1.5s ease";
	}, [props.url]);

	return <div ref={ref} className="rnp-background-blur" />;
}

function GradientBackground(props: SubBackgroundProps) {
	const [gradient, setGradient] = useState(
		"linear-gradient(-45deg, #666, #fff)",
	);
	useEffect(() => {
		if (!props.url) return;
		const image = new Image();
		image.crossOrigin = "Anonymous";
		image.onload = () => {
			try {
				const palette = colorThief.getPalette(image);
				setGradient(getGradientFromPalette(palette));
			} catch (e) {
				console.warn("ColorThief failed", e);
			}
		};
		image.src = props.url;
	}, [props.url]);

	return (
		<div
			className="rnp-background-gradient"
			style={{ backgroundImage: gradient }}
		/>
	);
}

function FluidBackground(props: SubBackgroundProps) {
	const canvas1 = useRef<HTMLCanvasElement>(null);
	const canvas2 = useRef<HTMLCanvasElement>(null);
	const canvas3 = useRef<HTMLCanvasElement>(null);
	const canvas4 = useRef<HTMLCanvasElement>(null);

	const feTurbulence = useRef<SVGFETurbulenceElement>(null);
	const feDisplacementMap = useRef<SVGFEDisplacementMapElement>(null);
	const fluidContainer = useRef<HTMLDivElement>(null);
	const staticFluidStyleRef = useRef<HTMLStyleElement>(null);
	const [songId, setSongId] = useState("0");

	const getPlayState = () => {
		const selector = props.isFM ? ".m-player-fm .btnp" : "#main-player .btnp";
		return (
			document.querySelector(selector)?.classList.contains("btnp-pause") ??
			false
		);
	};

	const playState = useRef(getPlayState());

	const onPlayStateChange = (id: any, state: any) => {
		playState.current = getPlayState();
		setSongId(String(id));
		if (fluidContainer.current) {
			fluidContainer.current.classList.toggle("paused", !playState.current);
		}
	};

	useEffect(() => {
		if (fluidContainer.current) {
			fluidContainer.current.classList.toggle("paused", !playState.current);
		}
	}, [songId]);

	useEffect(() => {
		window.legacyNativeCmder.appendRegisterCall(
			"PlayState",
			"audioplayer",
			onPlayStateChange,
		);
		return () => {
			window.legacyNativeCmder.removeRegisterCall(
				"PlayState",
				"audioplayer",
				onPlayStateChange,
			);
		};
	}, []);

	useEffect(() => {
		[canvas1, canvas2, canvas3, canvas4].forEach((ref) => {
			if (ref.current) {
				const ctx = ref.current.getContext("2d");
				if (ctx) ctx.filter = "blur(5px)";
			}
		});
	}, []);

	useEffect(() => {
		if (!props.url) return;
		const image = new Image();
		image.crossOrigin = "Anonymous";
		image.onload = () => {
			const { width, height } = image;
			const ctx1 = canvas1.current?.getContext("2d");
			const ctx2 = canvas2.current?.getContext("2d");
			const ctx3 = canvas3.current?.getContext("2d");
			const ctx4 = canvas4.current?.getContext("2d");

			if (ctx1)
				ctx1.drawImage(image, 0, 0, width / 2, height / 2, 0, 0, 100, 100);
			if (ctx2)
				ctx2.drawImage(
					image,
					width / 2,
					0,
					width / 2,
					height / 2,
					0,
					0,
					100,
					100,
				);
			if (ctx3)
				ctx3.drawImage(
					image,
					0,
					height / 2,
					width / 2,
					height / 2,
					0,
					0,
					100,
					100,
				);
			if (ctx4)
				ctx4.drawImage(
					image,
					width / 2,
					height / 2,
					width / 2,
					height / 2,
					0,
					0,
					100,
					100,
				);
		};
		image.src = props.url;

		if (feTurbulence.current) {
			feTurbulence.current.setAttribute(
				"seed",
				String(parseInt(String(Math.random() * 1000), 10)),
			);
		}

		if (staticFluidStyleRef.current) {
			staticFluidStyleRef.current.innerHTML = `
				body.static-fluid .rnp-background-fluid-rect {
					animation-play-state: paused !important;
					animation-delay: -${parseInt(String(Math.random() * 150), 10)}s !important;
				}
				body.static-fluid .rnp-background-fluid-rect canvas {
					animation-play-state: paused !important;
					animation-delay: -${parseInt(String(Math.random() * 60), 10)}s !important;
				}
			`;
		}
	}, [props.url]);

	const onResize = () => {
		const { width, height } = document.body.getBoundingClientRect();
		const viewSize = Math.max(width, height);
		const canvasSize = viewSize * Math.SQRT1_2;

		const canvasList = [canvas1, canvas2, canvas3, canvas4];
		for (let x = 0; x <= 1; x++) {
			for (let y = 0; y <= 1; y++) {
				const canvasRef = canvasList[y * 2 + x];
				if (canvasRef.current) {
					canvasRef.current.style.width = `${canvasSize}px`;
					canvasRef.current.style.height = `${canvasSize}px`;
					const signX = x === 0 ? -1 : 1,
						signY = y === 0 ? -1 : 1;
					canvasRef.current.style.left = `${width / 2 + signX * canvasSize * 0.35 - canvasSize / 2}px`;
					canvasRef.current.style.top = `${height / 2 + signY * canvasSize * 0.35 - canvasSize / 2}px`;
				}
			}
		}
	};

	useEffect(() => {
		window.addEventListener("resize", onResize);
		onResize();
		return () => {
			window.removeEventListener("resize", onResize);
		};
	}, []);

	const setDisplacementScale = useCallback((value: number) => {
		if (!feDisplacementMap.current) return;
		feDisplacementMap.current.setAttribute("scale", String(value));
	}, []);

	// Audio-responsive background (For LibVolumeLevelProvider)
	const libPlay = window.loadedPlugins.LibFrontendPlay as any;

	useEffect(() => {
		let cleanUp = () => {};

		if (libPlay) {
			/*const processor = useRef({});
			useEffect(() => {
				processor.current.audioContext = new AudioContext();
				processor.current.audioSource = null;
				processor.current.analyser = processor.current.audioContext.createAnalyser();
				//processor.current.analyser.connect(processor.current.audioContext.destination);
				processor.current.analyser.fftSize = 512;
				processor.current.filter = processor.current.audioContext.createBiquadFilter();
				processor.current.filter.type = 'lowpass';
				processor.current.bufferLength = processor.current.analyser.frequencyBinCount;
				processor.current.dataArray = new Float32Array(processor.current.bufferLength);
			}, []);

			const onAudioSourceChange = (e) => {
				processor.current.audio = e.detail;
				console.log('audio source changed', processor.current.audio);
				if (!processor.current.audio) return;
				if (processor.current.audioSource) processor.current.audioSource.disconnect();
				processor.current.audioSource = processor.current.audioContext.createMediaElementSource(processor.current.audio);
				processor.current.audioSource.connect(processor.current.filter).connect(processor.current.analyser);
				processor.current.audioSource.connect(processor.current.audioContext.destination);
			};

			useEffect(() => {
				loadedPlugins.LibFrontendPlay.addEventListener(
					"updateCurrentAudioPlayer",
					onAudioSourceChange
				);
				return () => {
					loadedPlugins.LibFrontendPlay.removeEventListener(
						"updateCurrentAudioPlayer",
						onAudioSourceChange
					);
				}
			}, []);*/

			const processor: any = {
				bufferLength: 1024,
				dataArray: new Float32Array(1024),
			};
			let request = 0;

			const animate = () => {
				request = requestAnimationFrame(animate);
				if (!playState.current) return;

				if (libPlay.currentAudioAnalyser) {
					libPlay.currentAudioAnalyser.getFloatFrequencyData(
						processor.dataArray,
					);
					const max = Math.max(...processor.dataArray);
					const percentage = 1.3 ** (max / 20) * 2 - 1;
					setDisplacementScale(
						Math.min(600, Math.max(200, 800 - percentage * 800)),
					);
				}
			};
			request = requestAnimationFrame(animate);
			cleanUp = () => cancelAnimationFrame(request);
		} else if (typeof registerAudioLevelCallback === "function") {
			// Audio-responsive background (For LibVolumeLevelProvider)
			let audioLevels: Record<number, number> = {},
				audioLevelSum = 0,
				now = 0;
			const maxq: number[] = [],
				minq: number[] = [];

			const onAudioLevelChange = (value: number) => {
				if (!playState.current) return;
				now += 1;

				const updateQueues = (currVal: number, currIdx: number) => {
					while (maxq.length && audioLevels[maxq[maxq.length - 1]] <= currVal)
						maxq.pop();
					maxq.push(currIdx);
					while (minq.length && audioLevels[minq[minq.length - 1]] >= currVal)
						minq.pop();
					minq.push(currIdx);
				};

				if (now <= 100) {
					audioLevels[now] = value;
					audioLevelSum += value;
					updateQueues(value, now);
					setDisplacementScale(400 - value * 200);
					return;
				}

				audioLevelSum -= audioLevels[now - 100];
				delete audioLevels[now - 100];
				audioLevels[now] = value;
				audioLevelSum += value;

				updateQueues(value, now);

				while (maxq[0] <= now - 100) maxq.shift();
				while (minq[0] <= now - 100) minq.shift();

				let percentage =
					(value - audioLevels[minq[0]]) /
					(audioLevels[maxq[0]] - audioLevels[minq[0]]);

				if (Number.isNaN(percentage)) percentage = 1 / 3;

				// Ease function
				const easeInOutQuint = (x: number) =>
					x < 0.5 ? 16 * x * x * x * x * x : 1 - (-2 * x + 2) ** 5 / 2;
				percentage = easeInOutQuint(percentage);

				const scale = 500 - percentage * 300;

				if (!feDisplacementMap.current) return;
				const oldScale = parseFloat(
					feDisplacementMap.current.getAttribute("scale") || "400",
				);
				setDisplacementScale(oldScale + (scale - oldScale) * 0.1);
			};

			registerAudioLevelCallback(onAudioLevelChange);
			cleanUp = () => {
				unregisterAudioLevelCallback(onAudioLevelChange);
				setDisplacementScale(400);
			};
		}

		return cleanUp;
	}, [songId, setDisplacementScale, libPlay]);

	return (
		<>
			<style ref={staticFluidStyleRef} type="text/css">
				{`
					body.static-fluid .rnp-background-fluid-rect {
						animation-play-state: paused !important;
						animation-delay: 0s !important;
					}
					body.static-fluid .rnp-background-fluid-rect canvas {
						animation-play-state: paused !important;
						animation-delay: 0s !important;
					}
				`}
			</style>
			<svg width="0" height="0" style={{ position: "absolute" }}>
				<filter
					id="fluid-filter"
					x="-20%"
					y="-20%"
					width="140%"
					height="140%"
					filterUnits="objectBoundingBox"
					primitiveUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feTurbulence
						ref={feTurbulence}
						type="fractalNoise"
						baseFrequency="0.005"
						numOctaves="1"
						seed="0"
					></feTurbulence>
					{props.static ? (
						<feDisplacementMap
							key={1}
							in="SourceGraphic"
							scale="400"
						></feDisplacementMap>
					) : (
						<feDisplacementMap
							key={2}
							ref={feDisplacementMap}
							in="SourceGraphic"
							scale="400"
						></feDisplacementMap>
					)}
				</filter>
			</svg>
			<div
				className="rnp-background-fluid"
				style={{ backgroundImage: `url(${props.url})` }}
			>
				<div className="rnp-background-fluid-rect" ref={fluidContainer}>
					<canvas
						ref={canvas1}
						className="rnp-background-fluid-canvas"
						// @ts-expect-error: Custom attribute not in standard definitions
						canvasID="1"
						width="100"
						height="100"
					/>
					<canvas
						ref={canvas2}
						className="rnp-background-fluid-canvas"
						// @ts-expect-error
						canvasID="2"
						width="100"
						height="100"
					/>
					<canvas
						ref={canvas3}
						className="rnp-background-fluid-canvas"
						// @ts-expect-error
						canvasID="3"
						width="100"
						height="100"
					/>
					<canvas
						ref={canvas4}
						className="rnp-background-fluid-canvas"
						// @ts-expect-error
						canvasID="4"
						width="100"
						height="100"
					/>
				</div>
			</div>
		</>
	);
}

function SolidBackground() {
	return <div className="rnp-background-solid"></div>;
}
