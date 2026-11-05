import { episodeLabel, type Quote } from '#lib/quote.js';

export const MAX_WALLPAPER_DIMENSION = 8192;
export const MAX_WALLPAPER_PIXELS = 32_000_000;

export type WallpaperOptions = {
	width: number;
	height: number;
	includeEpisodeInfo: boolean;
};

type Dimensions = { width: number | undefined; height: number | undefined };

export function validWallpaperDimensions(
	dimensions: Dimensions
): dimensions is Pick<WallpaperOptions, 'width' | 'height'> {
	const { width, height } = dimensions;
	return (
		typeof width === 'number' &&
		typeof height === 'number' &&
		Number.isInteger(width) &&
		Number.isInteger(height) &&
		width > 0 &&
		height > 0 &&
		width <= MAX_WALLPAPER_DIMENSION &&
		height <= MAX_WALLPAPER_DIMENSION &&
		width * height <= MAX_WALLPAPER_PIXELS
	);
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
	const lines: string[] = [];
	let line = '';

	for (const word of text.trim().split(/\s+/)) {
		const candidate = line ? `${line} ${word}` : word;
		if (line && context.measureText(candidate).width > maxWidth) {
			lines.push(line);
			line = '';
		}

		// Split an unusually long word rather than letting it leave the image.
		for (const character of `${line ? ' ' : ''}${word}`) {
			if (line && context.measureText(line + character).width > maxWidth) {
				lines.push(line);
				line = '';
			}
			line += character;
		}
	}

	if (line) lines.push(line);
	return lines;
}

export function renderWallpaper(
	canvas: HTMLCanvasElement,
	quote: Quote,
	{ width, height, includeEpisodeInfo }: WallpaperOptions,
	scale = 1
) {
	if (!validWallpaperDimensions({ width, height }))
		throw new Error('Invalid wallpaper dimensions.');

	canvas.width = Math.max(1, Math.round(width * scale));
	canvas.height = Math.max(1, Math.round(height * scale));
	const canvasContext = canvas.getContext('2d');
	if (!canvasContext) throw new Error('Your browser could not create the wallpaper.');
	const context = canvasContext;

	const style = getComputedStyle(canvas);
	const fontFamily = style.fontFamily;
	context.scale(canvas.width / width, canvas.height / height);
	context.fillStyle = '#000000';
	context.fillRect(0, 0, width, height);
	context.textBaseline = 'alphabetic';

	function setFont(size: number, spacing: number) {
		context.font = `400 ${size}px ${fontFamily}`;
		context.letterSpacing = `${size * spacing}px`;
	}

	function layout(fontSize: number) {
		setFont(fontSize, 0.015);
		const maxWidth = Math.min(width * 0.8, context.measureText('0').width * 22);
		const lines = wrapText(context, quote.quotation, maxWidth);
		const lineHeight = fontSize * 1.18;
		const metrics = lines.map((line) => context.measureText(line));
		const left = Math.min(...metrics.map((line) => -line.actualBoundingBoxLeft));
		const right = Math.max(...metrics.map((line) => line.actualBoundingBoxRight));
		const top = Math.min(
			...metrics.map((line, index) => index * lineHeight - line.actualBoundingBoxAscent)
		);
		const bottom = Math.max(
			...metrics.map((line, index) => index * lineHeight + line.actualBoundingBoxDescent)
		);

		return { lines, lineHeight, left, top, width: right - left, height: bottom - top };
	}

	let fontSize = Math.min(width * 0.05, height * 0.08);
	let fitted = layout(fontSize);
	// Episode information must never change the quote's size or centered position.
	while (fitted.height > height * 0.84) {
		fontSize *= 0.9;
		fitted = layout(fontSize);
	}

	const left = (width - fitted.width) / 2;
	const top = (height - fitted.height) / 2;
	setFont(fontSize, 0.015);
	context.fillStyle = style.getPropertyValue('--color-quote').trim();
	fitted.lines.forEach((line, index) =>
		context.fillText(line, left - fitted.left, top - fitted.top + index * fitted.lineHeight)
	);

	if (includeEpisodeInfo) {
		// Anchor details below the quote, like the absolutely positioned home-screen row.
		const availableHeight = height - (top + fitted.height) - height * 0.02;
		const detailGap = Math.min(fontSize * 0.34, availableHeight * 0.2);
		let detailSize = fontSize * (2 / 9);

		function layoutDetails() {
			setFont(detailSize * 0.8, 0.08);
			const numberLines = wrapText(context, episodeLabel(quote), fitted.width);
			setFont(detailSize, 0.04);
			const episodeLines = wrapText(context, quote.episodeName, fitted.width);
			const detailHeight =
				detailGap + detailSize * (numberLines.length * 0.8 * 1.6 + episodeLines.length * 1.6);
			return { numberLines, episodeLines, detailHeight };
		}

		let details = layoutDetails();
		while (details.detailHeight > availableHeight) {
			detailSize *= 0.9;
			details = layoutDetails();
		}

		const detailTop = top + fitted.height + detailGap;
		context.textBaseline = 'top';
		context.fillStyle = style.getPropertyValue('--color-episode').trim();
		setFont(detailSize * 0.8, 0.08);
		details.numberLines.forEach((line, index) =>
			context.fillText(line, left, detailTop + index * detailSize * 0.8 * 1.6)
		);
		setFont(detailSize, 0.04);
		details.episodeLines.forEach((line, index) =>
			context.fillText(
				line,
				left,
				detailTop + detailSize * (details.numberLines.length * 0.8 * 1.6 + index * 1.6)
			)
		);
	}
}
