<script lang="ts">
	import { tick } from 'svelte';
	import type { Quote } from '#lib/quote.js';
	import { loadQuoteFont, WALLPAPER_EXPORT_LABEL } from '#lib/quote-layout.js';
	import {
		MAX_WALLPAPER_DIMENSION,
		MAX_WALLPAPER_PIXELS,
		renderWallpaper,
		validWallpaperDimensions,
		type WallpaperOptions,
		type WallpaperDimensions
	} from '#lib/wallpaper.js';

	let { quote }: { quote: Quote } = $props();
	let dialog: HTMLDialogElement;
	let exportCanvas = $state<HTMLCanvasElement>();
	let open = $state(false);
	let dimensions = $state<WallpaperDimensions>({
		width: 1920,
		height: 1080
	});
	let useDeviceDimensions = $state(true);
	let includeEpisodeInfo = $state(false);
	let previewReady = $state(false);
	let exporting = $state(false);
	let error = $state('');
	const options = $derived(
		validWallpaperDimensions(dimensions) ? { ...dimensions, includeEpisodeInfo } : undefined
	);

	$effect(() => {
		if (!open) return;
		const previous = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		return () => {
			document.documentElement.style.overflow = previous;
		};
	});

	function setDeviceDimensions() {
		if (!useDeviceDimensions) return;
		const ratio = window.devicePixelRatio || 1;
		const detected = {
			width: Math.round(window.screen.width * ratio),
			height: Math.round(window.screen.height * ratio)
		};
		if (validWallpaperDimensions(detected)) {
			dimensions = detected;
		} else {
			useDeviceDimensions = false;
		}
	}

	export async function showDialog() {
		setDeviceDimensions();
		error = '';
		open = true;
		await tick();
		dialog.showModal();
	}

	function updatePreview(canvas: HTMLCanvasElement, settings: WallpaperOptions | undefined) {
		let active = true;
		previewReady = false;
		error = '';

		if (settings) {
			function draw() {
				if (!active || !settings) return;
				try {
					const scale = Math.min(1, 1200 / Math.max(settings.width, settings.height));
					renderWallpaper(canvas, quote, settings, scale);
					previewReady = true;
				} catch {
					error = 'Unable to create the preview. Try smaller dimensions.';
				}
			}

			void loadQuoteFont(canvas, quote).then(draw, draw);
		}

		return () => {
			active = false;
		};
	}

	async function downloadWallpaper() {
		const settings = options;
		const canvas = exportCanvas;
		if (!settings || !canvas || !previewReady || exporting) return;
		exporting = true;
		error = '';

		try {
			renderWallpaper(canvas, quote, settings);
			const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
			if (!blob) throw new Error('Unable to encode the wallpaper.');
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `swtcww-s${quote.season}e${quote.episode}-${settings.width}x${settings.height}.png`;
			link.click();
			window.setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch {
			error = 'Unable to download the wallpaper. Try smaller dimensions.';
		} finally {
			canvas.width = 0;
			canvas.height = 0;
			exporting = false;
		}
	}
</script>

<dialog
	bind:this={dialog}
	class="font-clone-wars"
	aria-labelledby="wallpaper-title"
	onclose={() => (open = false)}
>
	{#if open}
		<header>
			<h2 id="wallpaper-title">{WALLPAPER_EXPORT_LABEL}</h2>
			<button type="button" class="text-button" onclick={() => dialog.close()}>
				<span class="action-label">Close</span>
			</button>
		</header>

		<div class="preview-space" aria-busy={!previewReady && !!options}>
			<div
				class="preview-frame"
				style:--preview-ratio={options ? options.width / options.height : 16 / 9}
			>
				<canvas
					{@attach (node) => updatePreview(node, options)}
					class:ready={previewReady}
					aria-label={`Wallpaper preview: ${quote.quotation}${includeEpisodeInfo ? ` — ${quote.episodeName}, season ${quote.season}, episode ${quote.episode}` : ''}`}
					>{quote.quotation}</canvas
				>
			</div>
		</div>

		<canvas bind:this={exportCanvas} hidden></canvas>

		<fieldset disabled={exporting}>
			<div class="options">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={includeEpisodeInfo} />
					Include episode info
				</label>
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={useDeviceDimensions}
						onchange={setDeviceDimensions}
					/>
					Use device dimensions
				</label>
			</div>

			<div class="dimensions">
				{#each ['width', 'height'] as const as dimension (dimension)}
					<label>
						{dimension === 'width' ? 'Width' : 'Height'} (px)
						<input
							type="number"
							min="1"
							max={MAX_WALLPAPER_DIMENSION}
							step="1"
							bind:value={dimensions[dimension]}
							disabled={useDeviceDimensions}
							aria-invalid={!options}
							aria-describedby={!options ? 'wallpaper-dimensions-error' : undefined}
						/>
					</label>
				{/each}
			</div>
		</fieldset>

		{#if !options}
			<p id="wallpaper-dimensions-error" class="error" role="alert">
				Enter whole pixels from 1 to {MAX_WALLPAPER_DIMENSION}, up to {MAX_WALLPAPER_PIXELS /
					1_000_000} megapixels total.
			</p>
		{/if}
		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<footer>
			<p>{options ? `${options.width} × ${options.height} px` : 'Custom dimensions'}</p>
			<button
				type="button"
				class="text-button"
				disabled={!options || !previewReady || exporting}
				onclick={downloadWallpaper}
			>
				<span class="action-label">{exporting ? 'Creating PNG…' : 'Download PNG'}</span>
			</button>
		</footer>
	{/if}
</dialog>

<style>
	dialog,
	.preview-frame {
		border: 1px solid color-mix(in srgb, var(--color-quote) 45%, var(--color-background));
		background: var(--color-background);
	}

	dialog {
		width: min(48rem, calc(100% - 2rem));
		max-height: calc(100svh - 2rem);
		margin: auto;
		padding: clamp(1.25rem, 4vw, 2.5rem);
		color: var(--color-quote);
		font-size: 0.875rem;
		line-height: 1.6;
		letter-spacing: 0.04em;
		color-scheme: dark;
	}

	dialog::backdrop {
		background: color-mix(in srgb, var(--color-background) 85%, transparent);
	}

	header,
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	header {
		margin-bottom: 1.5rem;
	}

	.preview-space {
		--preview-max-height: clamp(10rem, 40svh, 26rem);
		container-type: inline-size;
		display: flex;
		height: calc(var(--preview-max-height) + 4px);
		align-items: center;
		padding: 1px;
	}

	.preview-frame {
		/* Reserve both border pixels so extreme aspect ratios stay inside the preview. */
		--preview-height: min(var(--preview-max-height), calc((100cqw - 2px) / var(--preview-ratio)));
		box-sizing: content-box;
		width: calc(var(--preview-height) * var(--preview-ratio));
		height: var(--preview-height);
		margin-inline: auto;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		visibility: hidden;
	}

	canvas.ready {
		visibility: visible;
	}

	fieldset {
		min-width: 0;
		margin: 1.5rem 0;
		padding: 0;
		border: 0;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 2rem;
		margin-bottom: 1.5rem;
	}

	.checkbox-label {
		display: flex;
		min-height: 22px;
		line-height: 22px;
		align-items: center;
		gap: 0.625rem;
		cursor: pointer;
	}

	input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		accent-color: var(--color-episode);
	}

	.dimensions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.5rem;
	}

	.dimensions label {
		display: grid;
		gap: 0.375rem;
	}

	input[type='number'] {
		width: 100%;
		min-width: 0;
		padding: 0.5rem 0;
		border: 0;
		border-bottom: 1px solid var(--color-quote);
		border-radius: 0;
		background: transparent;
		color: var(--color-episode);
		font: inherit;
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
	}

	input:focus-visible {
		outline: 1px solid var(--color-episode);
		outline-offset: 4px;
	}

	input:disabled {
		opacity: 0.45;
	}

	.error {
		margin-bottom: 1rem;
		color: var(--color-episode);
	}

	footer p {
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 40rem) {
		dialog {
			width: calc(100% - 1rem);
			max-height: calc(100svh - 1rem);
		}

		.options {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
