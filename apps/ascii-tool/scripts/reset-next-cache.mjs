import { rmSync } from "node:fs";
import { join } from "node:path";

const cacheDirectories = [".next", "next-dist"].map((directory) =>
	join(process.cwd(), directory),
);

for (const cacheDirectory of cacheDirectories) {
	try {
		rmSync(cacheDirectory, { force: true, recursive: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn(`Failed to clear cache directory ${cacheDirectory}: ${message}`);
	}
}
