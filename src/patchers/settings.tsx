import { Provider } from "jotai";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { GlobalStyleManager } from "@/components/GlobalStyleManager";
import { SettingsMenu } from "@/components/Settings/SettingsMenu";

export class SettingsPatcher {
	private root: Root | null = null;
	private container: HTMLElement | null = null;

	constructor(private isFM: boolean = false) {}

	/**
	 * @description 挂载 React 设置菜单和全局样式管理器
	 * @param targetContainer 要把菜单插入到的父容器
	 */
	public mount(targetContainer: Element) {
		if (this.root) return;

		this.container = document.createElement("div");
		this.container.id = this.isFM ? "rnp-react-root-fm" : "rnp-react-root";
		this.container.style.position = "absolute";
		this.container.style.top = "0";
		this.container.style.left = "0";
		this.container.style.width = "100%";
		this.container.style.height = "100%";
		this.container.style.pointerEvents = "none";
		this.container.style.zIndex = "100";

		targetContainer.appendChild(this.container);

		this.root = createRoot(this.container);

		this.root.render(
			<React.StrictMode>
				<Provider>
					<GlobalStyleManager />
					<SettingsMenu />
				</Provider>
			</React.StrictMode>,
		);
	}

	public unmount() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		if (this.container) {
			this.container.remove();
			this.container = null;
		}
	}
}
