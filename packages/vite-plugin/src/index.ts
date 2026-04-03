export type { ImportMapConfig, ManifestV1, RemoteConfig } from "./import-maps";

import { buildDefaults } from "./build-defaults";
import { createExportsPlugin, createImportMapPlugin } from "./import-maps";
import { cdnUrl } from "./workspace";

export { buildDefaults, cdnUrl };

export const mf = {
	importMap: createImportMapPlugin,
	libraryEntries: createExportsPlugin,
};
