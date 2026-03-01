import { existsSync, readFileSync } from "node:fs";
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

export function external(
	specifier: string,
	options?: { externals?: string[] },
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
	let url = `https://esm.sh/${baseName}@${version}${subpath}`;

	if (options?.externals?.length) {
		url += `?external=${options.externals.join(",")}`;
	}

	return url;
}
