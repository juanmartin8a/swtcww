export const HOLOGRAM_CONTEXT = Symbol('hologram');

// Use 2⅓ seconds for the full-brightness hold, matching the supplied S1E1 recording.
export const QUOTE_HOLD_MS = (7 / 3) * 1000;
const SWEEP_MS = 2520;
const REVEAL_MS = 350;
const FADE_MS = 1500;
const REVEAL_LEAD_MS = 140;

type Receiver = { node: HTMLElement; animation?: Animation };

export function createHologram() {
	const receivers = new Set<Receiver>();
	let stopCurrent: (() => void) | undefined;

	function register(node: HTMLElement) {
		const receiver: Receiver = { node };
		receivers.add(receiver);
		return () => {
			receiver.animation?.cancel();
			receivers.delete(receiver);
		};
	}

	function start(quote: HTMLElement, sweeps: [HTMLElement, HTMLElement]) {
		stopCurrent?.();
		const timers = new Set<ReturnType<typeof setTimeout>>();
		const animations = new Set<Animation>();
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let disposed = false;
		let suspended = true;
		let firstBurstShown = false;
		let generation = 0;

		function later(callback: () => void, delay: number) {
			const timer = setTimeout(() => {
				timers.delete(timer);
				if (!disposed && !suspended) callback();
			}, delay);
			timers.add(timer);
		}

		function track(animation: Animation, receiver?: Receiver) {
			function release() {
				animations.delete(animation);
				if (receiver?.animation === animation) receiver.animation = undefined;
			}

			animations.add(animation);
			animation.onfinish = () => {
				release();
				animation.cancel();
			};
			animation.oncancel = release;
			return animation;
		}

		function strip(sweep: HTMLElement) {
			const viewportHeight = window.innerHeight;
			const bandHeight = sweep.getBoundingClientRect().height;
			track(
				sweep.animate(
					[
						{ transform: 'translateY(-100%)', opacity: 0, offset: 0 },
						{ opacity: 0.95, offset: REVEAL_LEAD_MS / SWEEP_MS },
						{ transform: `translateY(${viewportHeight}px)`, opacity: 0.95, offset: 1 }
					],
					{ duration: SWEEP_MS, easing: 'linear' }
				)
			);

			for (const receiver of receivers) {
				const bounds = receiver.node.getBoundingClientRect();
				const y = bounds.top + bounds.height / 2;
				// Lead the band centre slightly so the control lights up as it passes.
				const arrival = (SWEEP_MS * (y + bandHeight / 2)) / (viewportHeight + bandHeight);
				later(
					() => {
						if (!receivers.has(receiver) || !receiver.node.isConnected) return;
						const current = Number(getComputedStyle(receiver.node).opacity);
						receiver.animation?.cancel();
						// A second strip re-illuminates the element from its current brightness.
						const duration = REVEAL_MS + FADE_MS;
						receiver.animation = track(
							receiver.node.animate(
								[
									{ opacity: current, offset: 0 },
									{ opacity: 0.7, offset: REVEAL_LEAD_MS / duration },
									{ opacity: 0.6, offset: 210 / duration },
									{ opacity: 1, offset: REVEAL_MS / duration },
									{ opacity: 0, offset: 1 }
								],
								{ duration, easing: 'linear' }
							),
							receiver
						);
					},
					Math.max(0, arrival - REVEAL_LEAD_MS)
				);
			}
		}

		function burst() {
			firstBurstShown = true;
			strip(sweeps[0]);
			if (Math.random() >= 0.5) {
				later(() => strip(sweeps[1]), 400 + Math.random() * 800);
			}
			scheduleNextBurst();
		}

		function scheduleNextBurst() {
			// Measure the interval from this burst's start, including any second strip.
			later(burst, 15_000 + Math.random() * 30_000);
		}

		function clearPlayback() {
			generation++;
			for (const timer of timers) clearTimeout(timer);
			timers.clear();
			for (const animation of animations) animation.cancel();
			animations.clear();
		}

		function refresh() {
			clearPlayback();
			suspended = document.hidden || motion.matches;
			if (suspended || disposed) return;
			if (firstBurstShown) {
				scheduleNextBurst();
			} else {
				const currentGeneration = generation;
				// Start the protected reading period only after the quote's entrance ends.
				void Promise.allSettled(quote.getAnimations().map((animation) => animation.finished)).then(
					() => {
						if (disposed || suspended || generation !== currentGeneration) return;
						later(burst, QUOTE_HOLD_MS + Math.random() * 2000);
					}
				);
			}
		}

		function stop() {
			if (disposed) return;
			disposed = true;
			clearPlayback();
			document.removeEventListener('visibilitychange', refresh);
			motion.removeEventListener('change', refresh);
			if (stopCurrent === stop) stopCurrent = undefined;
		}

		stopCurrent = stop;
		document.addEventListener('visibilitychange', refresh);
		motion.addEventListener('change', refresh);
		refresh();
		return stop;
	}

	return { register, start };
}

export type Hologram = ReturnType<typeof createHologram>;
