import { episodeLabel, type Quote } from '#lib/quote.js';

export const WALLPAPER_EXPORT_LABEL = 'Export wallpaper';

export function loadQuoteFont(element: Element, quote: Quote) {
	return document.fonts.load(
		`400 16px ${getComputedStyle(element).fontFamily}`,
		quote.quotation + quote.episodeName + episodeLabel(quote) + WALLPAPER_EXPORT_LABEL
	);
}

export function setQuoteFont(
	context: CanvasRenderingContext2D,
	fontFamily: string,
	size: number,
	spacing: number
) {
	context.font = `400 ${size}px ${fontFamily}`;
	context.letterSpacing = `${size * spacing}px`;
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

export function layoutQuote(
	context: CanvasRenderingContext2D,
	quote: Quote,
	width: number,
	height: number,
	style: CSSStyleDeclaration
) {
	const fontFamily = style.fontFamily;
	const typography = {
		widthScale: Number(style.getPropertyValue('--quote-width-scale')),
		heightScale: Number(style.getPropertyValue('--quote-height-scale')),
		lineLength: Number(style.getPropertyValue('--quote-line-length')),
		lineHeight: Number(style.getPropertyValue('--quote-line-height')),
		tracking: Number(style.getPropertyValue('--quote-tracking')),
		detailMin: Number(style.getPropertyValue('--episode-font-min')),
		detailMax: Number(style.getPropertyValue('--episode-font-max')),
		detailWidthScale: Number(style.getPropertyValue('--episode-width-scale')),
		detailGapMin: Number(style.getPropertyValue('--episode-gap-min')),
		detailGapMax: Number(style.getPropertyValue('--episode-gap-max')),
		detailGapWidthScale: Number(style.getPropertyValue('--episode-gap-width-scale')),
		actionGap: Number(style.getPropertyValue('--quote-action-gap')),
		detailLineHeight: Number(style.getPropertyValue('--episode-line-height')),
		detailTracking: Number(style.getPropertyValue('--episode-tracking')),
		numberScale: Number(style.getPropertyValue('--episode-number-scale')),
		numberTracking: Number(style.getPropertyValue('--episode-number-tracking'))
	};
	context.textBaseline = 'alphabetic';

	function baseline(size: number, lineHeight: number) {
		// Match CSS line boxes by centering font metrics around the alphabetic baseline.
		const metrics = context.measureText('Mg');
		const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
		const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
		return (size * lineHeight - ascent - descent) / 2 + ascent;
	}

	function measureQuote(fontSize: number) {
		setQuoteFont(context, fontFamily, fontSize, 0);
		const maxWidth = Math.min(width * 0.8, context.measureText('0').width * typography.lineLength);
		setQuoteFont(context, fontFamily, fontSize, typography.tracking);
		const lines = wrapText(context, quote.quotation, maxWidth);
		const lineHeight = fontSize * typography.lineHeight;
		const metrics = lines.map((line) => context.measureText(line));
		return {
			lines,
			lineHeight,
			width: Math.max(...metrics.map((line) => line.width)),
			height: lines.length * lineHeight,
			baseline: baseline(fontSize, typography.lineHeight)
		};
	}

	let fontSize = Math.min(width * typography.widthScale, height * typography.heightScale);
	let fitted = measureQuote(fontSize);
	while (fitted.height > height * 0.84) {
		fontSize *= 0.9;
		fitted = measureQuote(fontSize);
	}

	const availableHeight = (height - fitted.height) / 2 - height * 0.02;
	const detailGap = Math.min(
		Math.max(
			typography.detailGapMin,
			Math.min(width * typography.detailGapWidthScale, typography.detailGapMax)
		),
		availableHeight * 0.2
	);
	const detailTop = (height + fitted.height) / 2 + detailGap;
	let detailSize = Math.max(
		typography.detailMin,
		Math.min(width * typography.detailWidthScale, typography.detailMax)
	);

	function measureDetails() {
		setQuoteFont(
			context,
			fontFamily,
			detailSize * typography.numberScale,
			typography.numberTracking
		);
		const exportWidth = context.measureText(WALLPAPER_EXPORT_LABEL).width;
		// Leave the same room for the home-screen export action when wrapping details.
		const detailWidth =
			fitted.width > exportWidth + typography.actionGap
				? fitted.width - exportWidth - typography.actionGap
				: fitted.width;
		const numberLines = wrapText(context, episodeLabel(quote), detailWidth);
		const numberBaseline = baseline(
			detailSize * typography.numberScale,
			typography.detailLineHeight
		);
		const numberWidth = Math.max(...numberLines.map((line) => context.measureText(line).width));
		setQuoteFont(context, fontFamily, detailSize, typography.detailTracking);
		const episodeLines = wrapText(context, quote.episodeName, detailWidth);
		const nameBaseline = baseline(detailSize, typography.detailLineHeight);
		const nameWidth = Math.max(0, ...episodeLines.map((line) => context.measureText(line).width));
		const detailHeight =
			detailSize *
			typography.detailLineHeight *
			(numberLines.length * typography.numberScale + episodeLines.length);
		return {
			detailWidth,
			detailHeight,
			numberLines,
			episodeLines,
			numberBaseline,
			nameBaseline,
			width: Math.max(numberWidth, nameWidth)
		};
	}

	let details = measureDetails();
	// Details have their own type scale. Only unusually small outputs need fitting;
	// their visibility and size must never change the quote's size or position.
	while (
		detailGap + details.detailHeight > availableHeight ||
		details.width > details.detailWidth
	) {
		detailSize *= 0.9;
		details = measureDetails();
	}

	return {
		fontSize,
		fitted,
		detailSize,
		detailGap,
		detailTop,
		fontFamily,
		typography,
		numberLines: details.numberLines,
		episodeLines: details.episodeLines,
		numberBaseline: details.numberBaseline,
		nameBaseline: details.nameBaseline
	};
}
