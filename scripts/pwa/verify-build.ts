import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve("dist");
const expectedBase = process.env.VITE_BASE_PATH ?? "/";
const manifestPath = resolve(dist, "manifest.webmanifest");
const serviceWorkerPath = resolve(dist, "sw.js");
const htmlPath = resolve(dist, "index.html");

async function exists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(`PWA build verification failed: ${message}`);
}

assert(await exists(manifestPath), "dist/manifest.webmanifest is missing");
assert(await exists(serviceWorkerPath), "dist/sw.js is missing");

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
	name?: string;
	short_name?: string;
	display?: string;
	start_url?: string;
	scope?: string;
	id?: string;
	icons?: Array<{ src: string; sizes: string; purpose?: string }>;
	shortcuts?: Array<{ url: string }>;
};
assert(manifest.name === "Zion", "manifest name must be Zion");
assert(manifest.short_name === "Zion", "manifest short_name must be Zion");
assert(manifest.display === "standalone", "manifest display must be standalone");
assert(manifest.start_url === "./#today", "manifest start_url must be ./#today");
assert(manifest.scope === "./", "manifest scope must be ./");
assert(manifest.id === "./", "manifest id must be ./");

const requiredIcons = [
	{ sizes: "192x192", purpose: "any" },
	{ sizes: "512x512", purpose: "any" },
	{ sizes: "512x512", purpose: "maskable" },
];
for (const required of requiredIcons) {
	const icon = manifest.icons?.find(
		(candidate) => candidate.sizes === required.sizes && candidate.purpose === required.purpose,
	);
	assert(icon, `manifest icon ${required.sizes} (${required.purpose}) is missing`);
	const iconPath = resolve(dist, icon.src);
	assert(await exists(iconPath), `manifest icon file is missing: ${icon.src}`);
}

for (const url of ["./#today", "./#plan", "./#completed"]) {
	assert(
		manifest.shortcuts?.some((shortcut) => shortcut.url === url),
		`shortcut ${url} is missing`,
	);
}

const html = await readFile(htmlPath, "utf8");
assert(/<link\b[^>]*rel=["']manifest["']/i.test(html), "index.html has no manifest link");
const manifestHref = html.match(
	/<link\b(?=[^>]*rel=["']manifest["'])[^>]*href=["']([^"']+)["']/i,
)?.[1];
assert(manifestHref, "manifest link has no href");
assert(manifestHref.startsWith(expectedBase), `manifest URL must use Vite base ${expectedBase}`);
const jsFiles = await readdir(resolve(dist, "assets"));
const bundles = await Promise.all(
	jsFiles
		.filter((file) => file.endsWith(".js"))
		.map((file) => readFile(resolve(dist, "assets", file), "utf8")),
);
const registrationBundle = bundles.find((bundle) => bundle.includes(`${expectedBase}sw.js`));
assert(registrationBundle, "service worker registration bundle is missing");
assert(
	registrationBundle.includes(`${expectedBase}sw.js`),
	`service worker URL must use Vite base ${expectedBase}`,
);
assert(
	registrationBundle.includes(`scope:\`${expectedBase}\``),
	`service worker scope must use Vite base ${expectedBase}`,
);

console.info(`PWA build verified for base ${expectedBase}`);
