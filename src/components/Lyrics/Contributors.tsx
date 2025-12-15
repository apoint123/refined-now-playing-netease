import React from "react";
import type { LyricRole, ProcessedLyricsState } from "../../lyric-provider";

interface TransformItem {
	top: number;
	scale: number;
	delay: number;
	blur?: number;
	opacity?: number;
	rotate?: number;
	extraTop?: number;
	left?: number;
	outOfRangeHidden?: boolean;
	duration?: number;
}

interface ContributorsProps {
	transforms: TransformItem;
	contributors: ProcessedLyricsState["contributors"] | null;
}

export const Contributors = ({
	transforms,
	contributors,
}: ContributorsProps) => {
	return (
		<div
			className="rnp-contributors"
			style={{
				transform: `
                    ${transforms.left ? `translateX(${transforms.left}px)` : ""}
                    translateY(${transforms.top + (transforms?.extraTop ?? 0)}px)
                    scale(${transforms.scale})
                    ${transforms.rotate ? `rotate(${transforms.rotate}deg)` : ""}
                `,
				transitionDelay: `${transforms.delay}ms, ${transforms.delay}ms`,
				transitionDuration: `${transforms?.duration ?? 500}ms`,
				filter: transforms?.blur ? `blur(${transforms?.blur}px)` : "none",
				opacity: transforms?.opacity ?? 1,
				visibility: transforms?.outOfRangeHidden ? "hidden" : undefined,
			}}
		>
			<div className="rnp-contributors-inner">
				{(contributors?.roles ?? []).map((role, index) => (
					<Artist key={index} role={role} />
				))}
				<Contributor text="歌词贡献者" user={contributors?.original} />
				<Contributor text="翻译贡献者" user={contributors?.translation} />
				<Contributor text="歌词来源" user={contributors?.lyricSource} />
			</div>
		</div>
	);
};

const Artist = ({ role }: { role: LyricRole }) => {
	if (!role) return null;
	return (
		<div className="rnp-contributor rnp-contributor-artist">
			<span>{role.roleName}: </span>
			{role.artistMetaList.map((artist, index) => (
				<React.Fragment key={index}>
					{artist.artistId ? (
						<a
							className="rnp-contributor-artist"
							href={`#/m/artist/?id=${artist.artistId}`}
						>
							{artist.artistName}
						</a>
					) : (
						<span className="rnp-contributor-artist">{artist.artistName}</span>
					)}
					{index < role.artistMetaList.length - 1 && <span>, </span>}
				</React.Fragment>
			))}
		</div>
	);
};

const Contributor = ({
	text,
	user,
}: {
	text: string;
	user?: { userid?: number | string; name: string };
}) => {
	if (!user) return null;
	return (
		<div className="rnp-contributor rnp-contributor-lyrics">
			<span>{text}: </span>
			{user.userid ? (
				<a
					className="rnp-contributor-user"
					href={`#/m/personal/?uid=${user.userid}`}
				>
					{user.name}
				</a>
			) : (
				<span className="rnp-contributor-user">{user.name}</span>
			)}
		</div>
	);
};
