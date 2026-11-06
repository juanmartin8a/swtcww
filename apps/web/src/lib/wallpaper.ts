import type { Quote } from '#lib/quote.js';
import { layoutQuote, setQuoteFont } from '#lib/quote-layout.js';

export const MAX_WALLPAPER_DIMENSION = 8192;
export const MAX_WALLPAPER_PIXELS = 16_000_000;

export type WallpaperOptions = {
	width: number;
	height: number;
	includeEpisodeInfo: boolean;
	layoutScale: number;
};

export type WallpaperDimensions = { width: number | undefined; height: number | undefined };

export function validWallpaperDimensions(
	dimensions: WallpaperDimensions
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

export function renderWallpaper(
	canvas: HTMLCanvasElement,
	quote: Quote,
	{ width: outputWidth, height: outputHeight, includeEpisodeInfo, layoutScale }: WallpaperOptions,
	scale = 1
) {
	if (!validWallpaperDimensions({ width: outputWidth, height: outputHeight }))
		throw new Error('Invalid image dimensions.');

	canvas.width = Math.max(1, Math.round(outputWidth * scale));
	canvas.height = Math.max(1, Math.round(outputHeight * scale));
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Your browser could not create the image.');

	const width = outputWidth / layoutScale;
	const height = outputHeight / layoutScale;
	const style = getComputedStyle(canvas);
	const {
		fontFamily,
		typography,
		fontSize,
		fitted,
		detailSize,
		detailTop,
		numberLines,
		episodeLines,
		numberBaseline,
		nameBaseline
	} = layoutQuote(context, quote, width, height, style);
	context.scale(canvas.width / width, canvas.height / height);
	context.fillStyle = style.getPropertyValue('--color-background').trim();
	context.fillRect(0, 0, width, height);

	const left = (width - fitted.width) / 2;
	const top = (height - fitted.height) / 2;
	context.textBaseline = 'alphabetic';
	setQuoteFont(context, fontFamily, fontSize, typography.tracking);
	context.fillStyle = style.getPropertyValue('--color-quote').trim();
	fitted.lines.forEach((line, index) =>
		context.fillText(line, left, top + fitted.baseline + index * fitted.lineHeight)
	);

	if (includeEpisodeInfo) {
		context.fillStyle = style.getPropertyValue('--color-episode').trim();
		setQuoteFont(
			context,
			fontFamily,
			detailSize * typography.numberScale,
			typography.numberTracking
		);
		numberLines.forEach((line, index) =>
			context.fillText(
				line,
				left,
				detailTop +
					numberBaseline +
					index * detailSize * typography.numberScale * typography.detailLineHeight
			)
		);
		setQuoteFont(context, fontFamily, detailSize, typography.detailTracking);
		episodeLines.forEach((line, index) =>
			context.fillText(
				line,
				left,
				detailTop +
					nameBaseline +
					detailSize *
						typography.detailLineHeight *
						(numberLines.length * typography.numberScale + index)
			)
		);
	}
}
