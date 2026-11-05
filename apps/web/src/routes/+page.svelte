<script lang="ts">
	import WallpaperExport from '#lib/components/WallpaperExport.svelte';
	import { episodeLabel } from '#lib/quote.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let wallpaperExport = $state<ReturnType<typeof WallpaperExport>>();
	let detailsPinned = $state(false);
	let quoteReady = $state(false);

	function toggleDetails() {
		detailsPinned = !detailsPinned;
	}

	function fitQuote(node: HTMLParagraphElement, quotation: string) {
		let active = true;
		quoteReady = false;

		function fit() {
			// Start with the CSS width, then remove the unused space after wrapped lines.
			node.style.width = '';
			const range = document.createRange();
			range.selectNodeContents(node);
			const width = Math.max(0, ...Array.from(range.getClientRects(), (rect) => rect.width));
			if (width > 0) node.style.width = `${Math.ceil(width)}px`;
		}

		function reveal() {
			if (!active) return;
			fit();
			quoteReady = true;
		}

		// Measure with the final font before fading in the quote. A failed font load
		// still reveals the quote, measured with the fallback font.
		void document.fonts.load(getComputedStyle(node).font, quotation).then(reveal, reveal);

		window.addEventListener('resize', fit);
		document.fonts.addEventListener('loadingdone', fit);

		return () => {
			active = false;
			window.removeEventListener('resize', fit);
			document.fonts.removeEventListener('loadingdone', fit);
		};
	}
</script>

<svelte:head>
	<title>SWTCWW</title>
</svelte:head>

<main class="quote-screen">
	{#await data.quote then quote}
		<div class="quote-card font-clone-wars text-quote" class:ready={quoteReady}>
			<p
				{@attach (node) => fitQuote(node, quote.quotation)}
				class="quote text-left leading-[1.18] font-normal tracking-[0.015em]"
			>
				{quote.quotation}
			</p>
			<div class="quote-actions">
				<button
					type="button"
					class="episode-details text-button hover-reveal"
					class:revealed={detailsPinned}
					aria-pressed={detailsPinned}
					onclick={toggleDetails}
				>
					<span class="episode-text">
						<span class="episode-number">{episodeLabel(quote)}</span>
						<span class="episode-name">{quote.episodeName}</span>
					</span>
				</button>
				<button
					type="button"
					class="export-button text-button hover-reveal"
					onclick={() => wallpaperExport?.showDialog()}
					aria-haspopup="dialog"
				>
					<span class="export-label">Export wallpaper</span>
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
		background: black;
	}

	.quote {
		width: fit-content;
		max-width: min(100%, 22ch);
		/* Keep the opening-card proportions, including on short landscape screens. */
		font-size: min(5vw, 8svh);
		overflow-wrap: break-word;
	}

	.quote-card {
		position: relative;
		max-width: 100%;
	}

	.quote-card.ready {
		/* Match the opening's steady 1.5-second fade. */
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
		/* Keep the details and export action out of the centered quote's layout. */
		position: absolute;
		top: calc(100% + clamp(0.375rem, 1.7vw, 2rem));
		right: 0;
		left: 0;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem 1.5rem;
		font-size: clamp(0.75rem, 1.4vw, 1rem);
		line-height: 1.6;
		letter-spacing: 0.04em;
	}

	.episode-details {
		flex: 0 1 auto;
		width: fit-content;
		min-width: 0;
		max-width: 100%;
		text-align: left;
		text-decoration: none;
		overflow-wrap: anywhere;
	}

	.export-button {
		position: relative;
		flex-shrink: 0;
		align-self: flex-start;
		width: fit-content;
		color: var(--color-quote);
		text-align: right;
		text-decoration: none;
		cursor: default;
	}

	.export-button::before {
		/* Center the expanded hit area around the label without moving the text. */
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
		text-underline-offset: 0.25em;
		cursor: pointer;
	}

	.export-label:hover {
		text-decoration: underline;
	}

	.episode-text {
		display: block;
	}

	.episode-number,
	.episode-name {
		display: block;
	}

	.episode-number,
	.export-button {
		font-size: 0.8em;
		letter-spacing: 0.08em;
	}

	@media (max-width: 40rem) {
		.quote-actions {
			line-height: 1.4;
		}
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
