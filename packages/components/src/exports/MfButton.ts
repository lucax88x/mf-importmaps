import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Button } from "./Button";

export class MfButton extends HTMLElement {
	private _root: Root | null = null;

	static get observedAttributes() {
		return ["label"];
	}

	connectedCallback() {
		const container = document.createElement("div");
		this.appendChild(container);
		this._root = createRoot(container);
		this._render();
	}

	disconnectedCallback() {
		this._root?.unmount();
		this._root = null;
	}

	attributeChangedCallback() {
		this._render();
	}

	get label(): string {
		return this.getAttribute("label") || "";
	}

	set label(value: string) {
		this.setAttribute("label", value);
	}

	private _render() {
		if (!this._root) return;
		this._root.render(
			createElement(Button, {
				label: this.getAttribute("label") || "Web Component Button",
				onClick: () =>
					this.dispatchEvent(new CustomEvent("mf-click", { bubbles: true })),
			}),
		);
	}
}

customElements.define("mf-button", MfButton);

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"mf-button": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement>,
				HTMLElement
			> & {
				label?: string;
			};
		}
	}
}
