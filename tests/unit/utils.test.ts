import { describe, expect, it } from "vitest";
import {
	escapeRegExp,
	getBasePackageName,
} from "../../packages/vite-plugin/src/utils";

describe("getBasePackageName", () => {
	it("returns unscoped package name", () => {
		expect(getBasePackageName("react")).toBe("react");
	});

	it("returns unscoped package name ignoring subpath", () => {
		expect(getBasePackageName("react/jsx-runtime")).toBe("react");
	});

	it("returns scoped package name", () => {
		expect(getBasePackageName("@mui/material")).toBe("@mui/material");
	});

	it("returns scoped package name ignoring subpath", () => {
		expect(getBasePackageName("@mui/material/Button")).toBe("@mui/material");
	});

	it("handles scoped package with no subpath", () => {
		expect(getBasePackageName("@scope/pkg")).toBe("@scope/pkg");
	});
});

describe("escapeRegExp", () => {
	it("escapes special regex characters", () => {
		expect(escapeRegExp("foo.bar+baz")).toBe("foo\\.bar\\+baz");
	});

	it("escapes all special characters", () => {
		expect(escapeRegExp(".*+?^${}()|[]\\")).toBe(
			"\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
		);
	});

	it("returns unchanged string when no special chars", () => {
		expect(escapeRegExp("react")).toBe("react");
	});

	it("handles empty string", () => {
		expect(escapeRegExp("")).toBe("");
	});
});
