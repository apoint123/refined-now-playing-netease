import type React from "react";
import { forwardRef } from "react";

interface SettingsSectionProps {
	title: string;
	id: string;
	children: React.ReactNode;
}

export const SettingsSection = forwardRef<HTMLDivElement, SettingsSectionProps>(
	({ title, id, children }, ref) => {
		return (
			<div className="rnp-group" data-tab={id} ref={ref}>
				<div className="rnp-group-title">{title}</div>
				{children}
			</div>
		);
	},
);

SettingsSection.displayName = "SettingsSection";
