<script lang="ts">
	import { getContext } from 'svelte';
	import { HOLOGRAM_CONTEXT, type Hologram } from '#lib/hologram.js';

	let { ready, quote }: { ready: boolean; quote: HTMLElement | undefined } = $props();
	const hologram = getContext<Hologram>(HOLOGRAM_CONTEXT);
	let firstSweep = $state<HTMLDivElement>();
	let secondSweep = $state<HTMLDivElement>();

	$effect(() => {
		if (!ready || !quote || !firstSweep || !secondSweep) return;
		return hologram.start(quote, [firstSweep, secondSweep]);
	});
</script>

<div bind:this={firstSweep} class="hologram-sweep" aria-hidden="true"></div>
<div bind:this={secondSweep} class="hologram-sweep" aria-hidden="true"></div>

<style>
	.hologram-sweep {
		position: fixed;
		z-index: 20;
		top: 0;
		left: 0;
		width: 100%;
		height: clamp(72px, 14dvh, 160px);
		opacity: 0;
		pointer-events: none;
		user-select: none;
		/* Brightness leaves black untouched; scanlines affect only visible content. */
		backdrop-filter: brightness(1.8) saturate(0.8);
		mask-image:
			linear-gradient(transparent, black 38%, black 52%, transparent),
			repeating-linear-gradient(to bottom, black 0 1px, rgb(0 0 0 / 20%) 1px 3px);
		mask-composite: intersect;
		transform: translateY(-100%);
	}

	@media (prefers-reduced-motion: reduce) {
		.hologram-sweep {
			display: none;
		}
	}
</style>
