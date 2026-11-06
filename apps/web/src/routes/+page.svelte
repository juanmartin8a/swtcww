<script lang="ts">
	import WallpaperExport from '#lib/components/WallpaperExport.svelte';
	import { episodeLabel, type Quote } from '#lib/quote.js';
	import { layoutQuote, loadQuoteFont, IMAGE_EXPORT_LABEL } from '#lib/quote-layout.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let wallpaperExport = $state<ReturnType<typeof WallpaperExport>>();
	let detailsPinned = $state(false);
	let quoteReady = $state(false);
	let measurementCanvas = $state<HTMLCanvasElement>();
	let composition = $state<ReturnType<typeof layoutQuote>>();

	function toggleDetails() {
		detailsPinned = !detailsPinned;
	}

	function fitQuote(node: HTMLParagraphElement, quote: Quote) {
		let active = true;
		quoteReady = false;

		function fit() {
			const context = measurementCanvas?.getContext('2d');
			if (context) {
				composition = layoutQuote(
					context,
					quote,
					window.innerWidth,
					window.innerHeight,
					getComputedStyle(node)
				);
			}
		}

		function reveal() {
			if (!active) return;
			fit();
			quoteReady = true;
		}

		// Measure with the final font before fading in the quote. A failed font load
		// still reveals the quote, measured with the fallback font.
		void loadQuoteFont(node, quote).then(reveal, reveal);

		window.addEventListener('resize', fit);
		document.fonts.addEventListener('loadingdone', fit);

		return () => {
			active = false;
			window.removeEventListener('resize', fit);
			document.fonts.removeEventListener('loadingdone', fit);
		};
	}
</script>

{#snippet textLines(lines: string[])}
	{#each lines as line, index (index)}
		<span class="text-line">{line}</span>
	{/each}
{/snippet}

<main class="quote-screen">
	{#await data.quote then quote}
		<canvas bind:this={measurementCanvas} hidden></canvas>
		<div
			class="quote-card font-clone-wars text-quote"
			class:ready={quoteReady}
			style:--quote-font-size={composition ? `${composition.fontSize}px` : undefined}
			style:--episode-font-size={composition ? `${composition.detailSize}px` : undefined}
			style:--episode-gap={composition ? `${composition.detailGap}px` : undefined}
			style:width={composition ? `${composition.fitted.width}px` : undefined}
		>
			<p {@attach (node) => fitQuote(node, quote)} class="quote">
				{#if composition}
					{@render textLines(composition.fitted.lines)}
				{:else}
					{quote.quotation}
				{/if}
			</p>
			<div class="quote-actions">
				<button
					type="button"
					class="episode-details text-button hover-reveal"
					class:revealed={detailsPinned}
					aria-pressed={detailsPinned}
					onclick={toggleDetails}
				>
					<span class="episode-number">
						{@render textLines(composition?.numberLines ?? [episodeLabel(quote)])}
					</span>
					<span class="episode-name">
						{@render textLines(composition?.episodeLines ?? [quote.episodeName])}
					</span>
				</button>
				<button
					type="button"
					class="export-button text-button hover-reveal"
					onclick={() => wallpaperExport?.showDialog()}
					aria-haspopup="dialog"
				>
					<span class="export-label action-label">{IMAGE_EXPORT_LABEL}</span>
				</button>
			</div>
		</div>
		<WallpaperExport {quote} bind:this={wallpaperExport} />
	{:catch error}
		<p class="load-error font-clone-wars" role="alert">
			{error?.message ?? 'Unable to load a quote right now. Please refresh to try again.'}
		</p>
	{/await}
</main>

<style>
	.quote-screen {
		display: flex;
		min-height: 100svh;
		align-items: center;
		justify-content: center;
		padding: 8svh 10vw;
		background: var(--color-background);
	}

	.quote {
		width: fit-content;
		max-width: min(100%, calc(var(--quote-line-length) * 1ch));
		line-height: var(--quote-line-height);
		letter-spacing: calc(var(--quote-tracking) * 1em);
		text-align: left;
		overflow-wrap: break-word;
	}

	.quote-card {
		--quote-font-size: min(
			calc(var(--quote-width-scale) * 100vw),
			calc(var(--quote-height-scale) * 100svh)
		);
		--episode-font-size: clamp(
			calc(var(--episode-font-min) * 1px),
			calc(var(--episode-width-scale) * 100vw),
			calc(var(--episode-font-max) * 1px)
		);
		--episode-gap: clamp(
			calc(var(--episode-gap-min) * 1px),
			calc(var(--episode-gap-width-scale) * 100vw),
			calc(var(--episode-gap-max) * 1px)
		);
		position: relative;
		max-width: 100%;
		font-size: var(--quote-font-size);
	}

	.quote-card.ready {
		animation: quote-reveal 1500ms linear both;
	}

	@keyframes quote-reveal {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.load-error {
		color: var(--color-quote);
		text-align: center;
	}

	.quote-actions {
		position: absolute;
		top: calc(100% + var(--episode-gap));
		right: 0;
		left: 0;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: calc(var(--quote-action-gap) * 1px);
		font-size: var(--episode-font-size);
		line-height: var(--episode-line-height);
		letter-spacing: calc(var(--episode-tracking) * 1em);
	}

	.episode-details {
		flex: 0 1 auto;
		width: fit-content;
		min-width: 0;
		max-width: 100%;
		text-align: left;
	}

	.export-button {
		position: relative;
		flex-shrink: 0;
		width: fit-content;
		color: var(--color-quote);
		text-align: right;
		cursor: default;
	}

	.export-button::before {
		/* The hit area reveals the button; the raised label alone gets text-hover styling. */
		position: absolute;
		inset: 50% -0.75rem auto;
		height: 100%;
		min-height: 44px;
		content: '';
		transform: translateY(-50%);
	}

	.export-label {
		position: relative;
		z-index: 1;
		display: block;
	}

	.episode-number,
	.episode-name {
		display: block;
	}

	.text-line {
		display: block;
		white-space: pre;
	}

	.episode-number,
	.export-button {
		font-size: calc(var(--episode-number-scale) * 1em);
		letter-spacing: calc(var(--episode-number-tracking) * 1em);
	}

	@media (prefers-reduced-motion: reduce) {
		.quote-card.ready {
			animation: none;
		}
	}

	@media (scripting: enabled) {
		.quote-card:not(.ready) {
			visibility: hidden;
		}
	}
</style>
