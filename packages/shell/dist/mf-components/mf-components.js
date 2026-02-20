import { jsx as n } from "react/jsx-runtime";
import { createElement as o } from "react";
import { createRoot as i } from "react-dom/client";
function l({ label: e = "Click me", onClick: t }) {
  return /* @__PURE__ */ n(
    "button",
    {
      onClick: t,
      style: {
        padding: "8px 16px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        cursor: "pointer",
        backgroundColor: "#f0f0f0"
      },
      children: e
    }
  );
}
class s extends HTMLElement {
  constructor() {
    super(...arguments), this._root = null;
  }
  static get observedAttributes() {
    return ["label"];
  }
  connectedCallback() {
    const t = document.createElement("div");
    this.appendChild(t), this._root = i(t), this._render();
  }
  disconnectedCallback() {
    var t;
    (t = this._root) == null || t.unmount(), this._root = null;
  }
  attributeChangedCallback() {
    this._render();
  }
  get label() {
    return this.getAttribute("label") || "";
  }
  set label(t) {
    this.setAttribute("label", t);
  }
  _render() {
    this._root && this._root.render(
      o(l, {
        label: this.getAttribute("label") || "Web Component Button",
        onClick: () => this.dispatchEvent(new CustomEvent("mf-click", { bubbles: !0 }))
      })
    );
  }
}
customElements.define("mf-button", s);
function d(e, t, r = "add") {
  switch (r) {
    case "add":
      return e + t;
    case "subtract":
      return e - t;
    case "multiply":
      return e * t;
    case "divide":
      return e / t;
  }
}
export {
  l as Button,
  s as MfButton,
  d as calculate
};
