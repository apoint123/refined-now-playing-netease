import "./mini-song-info.scss";

const React = window.React;
const { useState, useEffect } = React;

interface MiniSongInfoProps {
	image: HTMLImageElement;
	infContainer: HTMLElement;
}

export function MiniSongInfo(props: MiniSongInfoProps) {
	const [title, setTitle] = useState<string>("");
	const [artist, setArtist] = useState<string>("");
	const [album, setAlbum] = useState<string>("");

	const image = props.image;
	const infContainer = props.infContainer;

	useEffect(() => {
		const observer = new MutationObserver(() => {
			if (image.src === album) return;
			if (image.complete) {
				setAlbum(image.src);
			}
		});
		observer.observe(image, { attributes: true, attributeFilter: ["src"] });

		const onload = () => {
			setAlbum(image.src);
		};
		image.addEventListener("load", onload);

		if (image.complete || image.src) {
			setAlbum(image.src);
		}

		return () => {
			observer.disconnect();
			image.removeEventListener("load", onload);
		};
	}, [image, album]);

	useEffect(() => {
		const updateInfo = () => {
			if (!infContainer) return;

			const titleEl = infContainer.querySelector(".title .name");
			const titleText = titleEl ? titleEl.textContent?.trim() || "" : "";

			const artistLinks = infContainer.querySelectorAll(
				".info .playfrom > li:first-child a",
			);
			const artistText = Array.from(artistLinks)
				.map((a) => a.textContent?.trim())
				.filter(Boolean)
				.join(" / ");

			setTitle(titleText);
			setArtist(artistText);
		};

		updateInfo();

		const observer = new MutationObserver(() => {
			updateInfo();
		});
		observer.observe(infContainer, { childList: true, subtree: true });

		return () => {
			observer.disconnect();
		};
	}, [infContainer]);

	return (
		<>
			<div className="album">
				<img src={album} alt="" />
			</div>
			<div className="info">
				<div className="title">{title}</div>
				<div className="artist">{artist}</div>
			</div>
		</>
	);
}
