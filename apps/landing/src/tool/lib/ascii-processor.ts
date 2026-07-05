"use client";

import type { ConversionResponse } from "@/tool/components/studio/studio-types";

/* ── Shared conversion primitives ─────────────────────────────────── */

export const ASCII_FONT_RATIO = 0.44; // Matches the PowerShell script & server engine

export const DEFAULT_ASCII_CHARS =
	" .'`^,:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

/** Resolves the active character ramp: default when empty, reversed when inverted. */
export function resolveAsciiRamp(chars: string, invert: boolean): string {
	const base = chars || DEFAULT_ASCII_CHARS;
	return invert ? base.split("").reverse().join("") : base;
}

/** Computes the ASCII grid for a source frame, preserving aspect via the font ratio. */
export function asciiGridFromSource(
	srcWidth: number,
	srcHeight: number,
	columns: number,
): { columns: number; rows: number } {
	const rows = Math.max(
		1,
		Math.round(srcHeight * (columns / srcWidth) * ASCII_FONT_RATIO),
	);
	return { columns, rows };
}

/**
 * The single source of truth for pixel → ASCII conversion. Mirrors the server's
 * pixelBufferToAsciiFrames: luminance via 0.299R+0.587G+0.114B, pixels below the
 * threshold become spaces, and brightness maps across the ramp. No trailing newline.
 */
export function imageDataToAsciiFrame(
	data: Uint8ClampedArray,
	columns: number,
	rows: number,
	ramp: string,
	luminanceThreshold: number,
): string {
	const luminanceRange = Math.max(1, 255 - luminanceThreshold);
	const charCount = ramp.length;
	let frame = "";

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < columns; x++) {
			const i = (y * columns + x) * 4;
			const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

			if (lum < luminanceThreshold) {
				frame += " ";
				continue;
			}

			const charIndex = Math.floor(
				((lum - luminanceThreshold) * (charCount - 1)) / luminanceRange,
			);
			frame += ramp[charIndex] || " ";
		}
		if (y < rows - 1) {
			frame += "\n";
		}
	}

	return frame;
}

/* ── Single-frame preview (image or video at a given time) ────────── */

/**
 * Generates a single ASCII frame from an image or video file at a specific time.
 */
export async function generateSingleFrame(
	file: File,
	options: {
		chars: string;
		columns: number;
		invert: boolean;
		luminanceThreshold: number;
		time?: number;
	}
): Promise<{ frame: string; rows: number; columns: number; colorUrl?: string }> {
	const isImage = file.type.startsWith("image/");

	if (isImage) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const objectUrl = URL.createObjectURL(file);

			img.onload = () => {
				try {
					const result = drawSourceToAscii(img, img.width, img.height, options);
					resolve(result);
				} catch (err) {
					reject(err);
				} finally {
					URL.revokeObjectURL(objectUrl);
				}
			};

			img.onerror = (err) => {
				reject(err);
				URL.revokeObjectURL(objectUrl);
			};

			img.src = objectUrl;
		});
	}

	return new Promise((resolve, reject) => {
		const video = document.createElement("video");
		const objectUrl = URL.createObjectURL(file);

		video.muted = true;
		video.playsInline = true;
		video.preload = "auto";
		video.src = objectUrl;

		const cleanup = () => {
			URL.revokeObjectURL(objectUrl);
			video.onloadeddata = null;
			video.onseeked = null;
			video.onerror = null;
			video.remove();
		};

		const process = () => {
			try {
				const width = video.videoWidth;
				const height = video.videoHeight;

				if (!width || !height) {
					reject(new Error("Video dimensions are not available."));
					cleanup();
					return;
				}

				const result = drawSourceToAscii(video, width, height, options);
				resolve(result);
				cleanup();
			} catch (err) {
				reject(err);
				cleanup();
			}
		};

		video.onloadeddata = () => {
			const seekTime = options.time !== undefined ? options.time : Math.min(1.0, video.duration / 2);
			video.currentTime = seekTime;
		};

		video.onseeked = () => {
			process();
		};

		video.onerror = (err) => {
			reject(err);
			cleanup();
		};

		if (video.readyState >= 2) {
			const seekTime = options.time !== undefined ? options.time : Math.min(1.0, video.duration / 2);
			video.currentTime = seekTime;
		}
	});
}

/** Draws a source (image/video) into a fresh canvas and returns its ASCII frame + color preview. */
function drawSourceToAscii(
	source: CanvasImageSource,
	srcWidth: number,
	srcHeight: number,
	options: {
		chars: string;
		columns: number;
		invert: boolean;
		luminanceThreshold: number;
	},
): { frame: string; rows: number; columns: number; colorUrl?: string } {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) {
		throw new Error("Failed to get canvas context");
	}

	const { columns, rows } = asciiGridFromSource(srcWidth, srcHeight, options.columns);
	canvas.width = columns;
	canvas.height = rows;

	ctx.drawImage(source, 0, 0, columns, rows);
	const colorUrl = canvas.toDataURL("image/webp", 0.8);

	const ramp = resolveAsciiRamp(options.chars, options.invert);
	const data = ctx.getImageData(0, 0, columns, rows).data;
	const frame = imageDataToAsciiFrame(data, columns, rows, ramp, options.luminanceThreshold);

	return { frame, rows, columns, colorUrl };
}

/* ── Full client-side conversion ──────────────────────────────────── */

export type ClientConversionOptions = {
	chars: string;
	columns: number;
	invert: boolean;
	luminanceThreshold: number;
	fps: number;
};

/**
 * Converts an entire video (or image / animated GIF) into ASCII frames fully in the
 * browser — no upload, no server. Returns a ConversionResponse-shaped result that is a
 * drop-in for what the old server endpoint produced.
 */
export async function convertVideoToAsciiFrames(
	file: File,
	options: ClientConversionOptions,
	onProgress?: (ratio: number) => void,
	signal?: AbortSignal,
): Promise<ConversionResponse> {
	const isImage = file.type.startsWith("image/");
	const isGif = file.type === "image/gif";

	// Animated GIF: decode every frame when the ImageDecoder API is available.
	if (isGif && typeof window !== "undefined" && "ImageDecoder" in window) {
		return convertGifToAsciiFrames(file, options, onProgress, signal);
	}

	// Static image (or GIF without ImageDecoder): a single frame.
	if (isImage) {
		const r = await generateSingleFrame(file, { ...options, time: 0 });
		onProgress?.(1);
		return {
			columns: r.columns,
			rows: r.rows,
			fileName: file.name,
			fileSize: file.size,
			fps: options.fps,
			frameCount: 1,
			frames: [r.frame],
			chars: options.chars,
		};
	}

	return convertVideoElementToAsciiFrames(file, options, onProgress, signal);
}

async function convertVideoElementToAsciiFrames(
	file: File,
	options: ClientConversionOptions,
	onProgress?: (ratio: number) => void,
	signal?: AbortSignal,
): Promise<ConversionResponse> {
	const video = document.createElement("video");
	const objectUrl = URL.createObjectURL(file);
	video.muted = true;
	video.playsInline = true;
	video.preload = "auto";
	video.src = objectUrl;

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d", { willReadFrequently: true });

	const cleanup = () => {
		URL.revokeObjectURL(objectUrl);
		video.removeAttribute("src");
		try {
			video.load();
		} catch {
			/* ignore */
		}
		video.remove();
	};

	try {
		if (!ctx) {
			throw new Error("Failed to get canvas context");
		}

		throwIfAborted(signal);
		await onceVideoReady(video, signal);

		const width = video.videoWidth;
		const height = video.videoHeight;
		const duration = video.duration;

		if (!width || !height) {
			throw new Error("Video dimensions are not available.");
		}
		if (!Number.isFinite(duration) || duration <= 0) {
			throw new Error("Could not read the video duration.");
		}

		const { columns, rows } = asciiGridFromSource(width, height, options.columns);
		canvas.width = columns;
		canvas.height = rows;
		const ramp = resolveAsciiRamp(options.chars, options.invert);

		const step = 1 / options.fps;
		const total = Math.max(1, Math.floor(duration * options.fps));
		const frames: string[] = [];

		for (let n = 0; n < total; n++) {
			throwIfAborted(signal);
			const t = Math.min(n * step, duration - 1e-3);
			await seekVideo(video, t, signal);
			ctx.drawImage(video, 0, 0, columns, rows);
			const data = ctx.getImageData(0, 0, columns, rows).data;
			frames.push(imageDataToAsciiFrame(data, columns, rows, ramp, options.luminanceThreshold));
			onProgress?.((n + 1) / total);
		}

		if (frames.length === 0) {
			throw new Error("No frames were produced from this video.");
		}

		return {
			columns,
			rows,
			fileName: file.name,
			fileSize: file.size,
			fps: options.fps,
			frameCount: frames.length,
			frames,
			chars: options.chars,
		};
	} finally {
		cleanup();
	}
}

/* Minimal structural typing for the ImageDecoder Web API (not yet in all TS libs). */
type DecodedImage = {
	displayWidth: number;
	displayHeight: number;
	close: () => void;
};
type ImageDecoderInstance = {
	tracks: {
		ready: Promise<void>;
		selectedTrack?: { frameCount?: number };
	};
	decode: (init: { frameIndex: number }) => Promise<{ image: DecodedImage }>;
	close: () => void;
};
type ImageDecoderLike = new (init: {
	data: ArrayBuffer;
	type: string;
}) => ImageDecoderInstance;

async function convertGifToAsciiFrames(
	file: File,
	options: ClientConversionOptions,
	onProgress?: (ratio: number) => void,
	signal?: AbortSignal,
): Promise<ConversionResponse> {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) {
		throw new Error("Failed to get canvas context");
	}

	// ImageDecoder isn't in every TS lib.dom version yet; reach it off window at runtime.
	const ImageDecoderCtor = (window as unknown as { ImageDecoder: ImageDecoderLike })
		.ImageDecoder;
	const decoder = new ImageDecoderCtor({
		data: await file.arrayBuffer(),
		type: file.type,
	});
	try {
		await decoder.tracks.ready;
		throwIfAborted(signal);

		const track = decoder.tracks.selectedTrack;
		// Some tracks report frameCount lazily; fall back to 1.
		const total: number = track?.frameCount && track.frameCount > 0 ? track.frameCount : 1;

		const ramp = resolveAsciiRamp(options.chars, options.invert);
		const frames: string[] = [];
		let columns = options.columns;
		let rows = 1;

		for (let n = 0; n < total; n++) {
			throwIfAborted(signal);
			const { image } = await decoder.decode({ frameIndex: n });
			try {
				if (n === 0) {
					const grid = asciiGridFromSource(image.displayWidth, image.displayHeight, options.columns);
					columns = grid.columns;
					rows = grid.rows;
					canvas.width = columns;
					canvas.height = rows;
				}
				ctx.drawImage(image as unknown as CanvasImageSource, 0, 0, columns, rows);
				const data = ctx.getImageData(0, 0, columns, rows).data;
				frames.push(imageDataToAsciiFrame(data, columns, rows, ramp, options.luminanceThreshold));
			} finally {
				image.close();
			}
			onProgress?.((n + 1) / total);
		}

		if (frames.length === 0) {
			throw new Error("No frames were produced from this GIF.");
		}

		return {
			columns,
			rows,
			fileName: file.name,
			fileSize: file.size,
			fps: options.fps,
			frameCount: frames.length,
			frames,
			chars: options.chars,
		};
	} finally {
		decoder.close();
	}
}

/* ── Async helpers ────────────────────────────────────────────────── */

function throwIfAborted(signal?: AbortSignal) {
	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}
}

/** Resolves once a video has loaded enough data to read dimensions and seek. */
function onceVideoReady(video: HTMLVideoElement, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (video.readyState >= 2) {
			resolve();
			return;
		}

		const onAbort = () => {
			detach();
			reject(new DOMException("Aborted", "AbortError"));
		};
		const onLoaded = () => {
			detach();
			resolve();
		};
		const onError = () => {
			detach();
			reject(
				new Error(
					"This video format or codec can't be decoded in the browser. Try MP4 (H.264) or WebM.",
				),
			);
		};
		const detach = () => {
			video.removeEventListener("loadeddata", onLoaded);
			video.removeEventListener("error", onError);
			signal?.removeEventListener("abort", onAbort);
		};

		video.addEventListener("loadeddata", onLoaded);
		video.addEventListener("error", onError);
		signal?.addEventListener("abort", onAbort);
	});
}

/** Seeks a video to a time and resolves when the frame is ready. Times out after 5s. */
function seekVideo(video: HTMLVideoElement, time: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => {
			cleanup();
			reject(new Error("Timed out decoding a video frame."));
		}, 5000);

		const cleanup = () => {
			window.clearTimeout(timer);
			video.removeEventListener("seeked", onSeeked);
			video.removeEventListener("error", onError);
			signal?.removeEventListener("abort", onAbort);
		};
		const onAbort = () => {
			cleanup();
			reject(new DOMException("Aborted", "AbortError"));
		};
		const onSeeked = () => {
			cleanup();
			resolve();
		};
		const onError = () => {
			cleanup();
			reject(new Error("Failed to decode a frame while seeking the video."));
		};

		video.addEventListener("seeked", onSeeked);
		video.addEventListener("error", onError);
		signal?.addEventListener("abort", onAbort);

		video.currentTime = time;
	});
}
