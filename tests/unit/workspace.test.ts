import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
	existsSync: vi.fn(),
	readFileSync: vi.fn(),
}));

import { existsSync, readFileSync } from "node:fs";
import {
	external,
	findWorkspaceRoot,
	getDeps,
	resetDepsCache,
} from "../../packages/vite-plugin/src/workspace";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

beforeEach(() => {
	vi.restoreAllMocks();
	resetDepsCache();
});

describe("findWorkspaceRoot", () => {
	it("finds workspace root in current directory", () => {
		mockExistsSync.mockImplementation((p) =>
			String(p).endsWith("pnpm-workspace.yaml"),
		);
		expect(findWorkspaceRoot("/projects/my-app")).toBe("/projects/my-app");
	});

	it("finds workspace root by walking up", () => {
		mockExistsSync.mockImplementation(
			(p) => String(p) === "/projects/pnpm-workspace.yaml",
		);
		expect(findWorkspaceRoot("/projects/my-app/packages/foo")).toBe(
			"/projects",
		);
	});

	it("throws when no workspace root found", () => {
		mockExistsSync.mockReturnValue(false);
		expect(() => findWorkspaceRoot("/some/path")).toThrow(
			"Could not find pnpm-workspace.yaml",
		);
	});
});

describe("getDeps", () => {
	function setupWorkspace(yaml: string) {
		mockExistsSync.mockImplementation((p) =>
			String(p).endsWith("pnpm-workspace.yaml"),
		);
		mockReadFileSync.mockReturnValue(yaml);
	}

	it("parses catalogs from workspace yaml", () => {
		setupWorkspace(`
catalogs:
  default:
    react: "^18.2.0"
    react-dom: "^18.2.0"
  mui:
    "@mui/material": "^5.0.0"
`);
		const deps = getDeps();
		expect(deps).toEqual({
			react: "^18.2.0",
			"react-dom": "^18.2.0",
			"@mui/material": "^5.0.0",
		});
	});

	it("caches result on second call", () => {
		setupWorkspace(`
catalogs:
  default:
    react: "^18.2.0"
`);
		getDeps();
		getDeps();
		expect(mockReadFileSync).toHaveBeenCalledTimes(1);
	});

	it("returns empty object when no catalogs", () => {
		setupWorkspace("packages:\n  - packages/*\n");
		expect(getDeps()).toEqual({});
	});
});

describe("external", () => {
	function setupWorkspace(deps: Record<string, string>) {
		const catalogEntries = Object.entries(deps)
			.map(([k, v]) => `    "${k}": "${v}"`)
			.join("\n");
		const yaml = `catalogs:\n  default:\n${catalogEntries}\n`;
		mockExistsSync.mockImplementation((p) =>
			String(p).endsWith("pnpm-workspace.yaml"),
		);
		mockReadFileSync.mockReturnValue(yaml);
	}

	it("generates CDN URL for unscoped package", () => {
		setupWorkspace({ react: "^18.2.0" });
		expect(external("react")).toBe("https://esm.sh/react@^18.2.0");
	});

	it("generates CDN URL for scoped package", () => {
		setupWorkspace({ "@mui/material": "^5.0.0" });
		expect(external("@mui/material")).toBe(
			"https://esm.sh/@mui/material@^5.0.0",
		);
	});

	it("includes subpath in URL", () => {
		setupWorkspace({ "@mui/material": "^5.0.0" });
		expect(external("@mui/material/Button")).toBe(
			"https://esm.sh/@mui/material@^5.0.0/Button",
		);
	});

	it("appends externals as query parameter", () => {
		setupWorkspace({ react: "^18.2.0" });
		expect(external("react", { externals: ["react-dom", "scheduler"] })).toBe(
			"https://esm.sh/react@^18.2.0?external=react-dom,scheduler",
		);
	});

	it("throws for unknown package", () => {
		setupWorkspace({ react: "^18.2.0" });
		expect(() => external("vue")).toThrow(
			'Package "vue" not found in pnpm-workspace.yaml catalogs',
		);
	});
});
