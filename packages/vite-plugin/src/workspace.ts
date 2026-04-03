import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { getBasePackageName } from "./utils";

let _deps: Record<string, string> | null = null;

export function findWorkspaceRoot(from: string): string {
	let dir = from;
	while (true) {
		if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) {
			throw new Error("Could not find pnpm-workspace.yaml");
		}
		dir = parent;
	}
}

export function getDeps(): Record<string, string> {
	if (_deps) {
		return _deps;
	}

	const root = findWorkspaceRoot(process.cwd());
	const wsPath = resolve(root, "pnpm-workspace.yaml");
	const ws = parseYaml(readFileSync(wsPath, "utf-8"));

	const deps: Record<string, string> = {};
	if (ws.catalogs) {
		for (const catalog of Object.values(ws.catalogs)) {
			Object.assign(deps, catalog as Record<string, string>);
		}
	}

	_deps = deps;
	return deps;
}

export function resetDepsCache(): void {
	_deps = null;
}

let _workspacePackages: Map<string, string> | null = null;

/** Returns a map of package name -> package directory for all workspace packages. */
export function getWorkspacePackages(from = process.cwd()): Map<string, string> {
	if (_workspacePackages) return _workspacePackages;

	const root = findWorkspaceRoot(from);
	const wsPath = resolve(root, "pnpm-workspace.yaml");
	const packageNameToDir = new Map<string, string>();

	try {
		const ws = parseYaml(readFileSync(wsPath, "utf-8"));
		const patterns: string[] = ws.packages || [];
		for (const pattern of patterns) {
			// Handle simple `dir/*` glob patterns
			const prefix = pattern.endsWith("/*") ? pattern.slice(0, -2) : null;
			if (!prefix) continue;
			const dir = resolve(root, prefix);
			if (!existsSync(dir)) continue;
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				if (!entry.isDirectory()) continue;
				const pkgJsonPath = resolve(dir, entry.name, "package.json");
				if (!existsSync(pkgJsonPath)) continue;
				try {
					const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
					if (pkgJson.name) {
						packageNameToDir.set(pkgJson.name, resolve(dir, entry.name));
					}
				} catch {
					// Ignore malformed package.json
				}
			}
		}
	} catch {
		// Ignore errors (e.g., no pnpm-workspace.yaml)
	}

	_workspacePackages = packageNameToDir;
	return packageNameToDir;
}

export function resetWorkspacePackagesCache(): void {
	_workspacePackages = null;
}

export function cdnUrl(
	specifier: string,
	options?: { externals?: string[]; dev?: boolean },
): string {
	const baseName = getBasePackageName(specifier);
	const deps = getDeps();
	const version = deps[baseName];
	if (!version) {
		throw new Error(
			`Package "${baseName}" not found in pnpm-workspace.yaml catalogs`,
		);
	}

	const subpath = specifier.slice(baseName.length);
	const url = new URL(`https://esm.sh/${baseName}@${version}${subpath}`);
	const params: string[] = [];

	if (options?.externals?.length) {
		params.push(`external=${options.externals.join(",")}`);
	}

	if (options?.dev) {
		params.push("dev");
	}

	if (params.length) {
		url.search = params.join("&");
	}

	return url.toString();
}
