export type { ImportMapConfig } from "./import-maps";

import type { buildDefaults } from "./build-defaults";
import { createExportsPlugin, createImportMapPlugin } from "./import-maps";
import { cdnUrl } from "./workspace";

export { type buildDefaults, cdnUrl };

export const mf = {
	importMap: createImportMapPlugin,
	libraryEntries: createExportsPlugin,
	cdnUrl,
};
