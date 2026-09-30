import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, relative, join } from "node:path";

export function offlineBuildPlugin() {
  let config;
  return {
    name: "eduregistro-offline-precache",
    apply: "build",
    configResolved(value) { config = value; },
    async closeBundle() {
      const directory = resolve(config.root, config.build.outDir);
      async function walk(path) {
        const entries = await readdir(path, { withFileTypes: true });
        return (await Promise.all(entries.map((entry) => entry.isDirectory()
          ? walk(join(path, entry.name)) : [join(path, entry.name)]))).flat();
      }
      const files = (await walk(directory)).filter((file) => relative(directory, file) !== "sw.js").sort();
      const template = await readFile(resolve(config.root, "public/sw.js"), "utf8");
      const hash = createHash("sha256").update(template);
      for (const file of files) hash.update(relative(directory, file)).update(await readFile(file));
      const manifest = files.map((file) => `./${relative(directory, file).replaceAll("\\", "/")}`);
      await writeFile(join(directory, "sw.js"), template
        .replace("__BUILD_REVISION__", hash.digest("hex").slice(0, 16))
        .replace('/* __PRECACHE_FILES__ */ ["./"]', JSON.stringify(manifest)));
    },
  };
}
