import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PwaStatus } from "./PwaStatus";

describe("PwaStatus", () => {
	let container: HTMLDivElement;
	let root: ReturnType<typeof createRoot>;

	beforeEach(() => {
		(
			globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
		).IS_REACT_ACT_ENVIRONMENT = true;
		container = document.createElement("div");
		document.body.append(container);
		root = createRoot(container);
	});

	afterEach(() => {
		act(() => root.unmount());
		container.remove();
	});

	it("blocks applying an update while plan edits are dirty", () => {
		act(() => {
			root.render(
				createElement(PwaStatus, {
					updateAvailable: true,
					offlineReady: false,
					editDirty: true,
					onApplyUpdate: () => undefined,
					onDismissUpdate: () => undefined,
					onDismissOfflineReady: () => undefined,
				}),
			);
		});

		expect(container.querySelector<HTMLButtonElement>(".button-primary")?.disabled).toBe(true);
		expect(container.textContent).toContain("alterações não salvas");
	});

	it("allows applying an update after plan edits are clean", () => {
		act(() => {
			root.render(
				createElement(PwaStatus, {
					updateAvailable: true,
					offlineReady: false,
					editDirty: false,
					onApplyUpdate: () => undefined,
					onDismissUpdate: () => undefined,
					onDismissOfflineReady: () => undefined,
				}),
			);
		});

		expect(container.querySelector<HTMLButtonElement>(".button-primary")?.disabled).toBe(false);
	});
});
