import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHologram, QUOTE_HOLD_MS } from '../src/lib/hologram.ts';

function environment(
	t,
	randomValues,
	{ hidden = false, reducedMotion = false, entrance = [] } = {}
) {
	let now = 0;
	let nextId = 0;
	const timers = new Map();
	const strips = [];
	const animations = [];
	const restorers = [];
	const document = Object.assign(new EventTarget(), { hidden });
	const motion = Object.assign(new EventTarget(), { matches: reducedMotion });
	for (const [key, value] of Object.entries({
		document,
		window: { matchMedia: () => motion, innerHeight: 900 },
		getComputedStyle: (node) => ({ opacity: String(node.opacity ?? 0) })
	})) {
		const original = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { value, configurable: true });
		restorers.push(() => {
			if (original) Object.defineProperty(globalThis, key, original);
			else delete globalThis[key];
		});
	}
	t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
		const id = ++nextId;
		timers.set(id, { callback, at: now + delay });
		return id;
	});
	t.mock.method(globalThis, 'clearTimeout', (id) => timers.delete(id));
	t.mock.method(Math, 'random', () => {
		assert.ok(randomValues.length, 'Unexpected random decision');
		return randomValues.shift();
	});

	function tick(ms) {
		const end = now + ms;
		while (true) {
			const next = [...timers]
				.filter(([, timer]) => timer.at <= end)
				.sort((a, b) => a[1].at - b[1].at)[0];
			if (!next) break;
			const [id, timer] = next;
			timers.delete(id);
			now = timer.at;
			timer.callback();
		}
		now = end;
	}
	function element(top = 0, height = 126) {
		return {
			isConnected: true,
			getBoundingClientRect: () => ({ top, height }),
			animate(keyframes, options) {
				const animation = {
					node: this,
					at: now,
					keyframes,
					options,
					cancelled: false,
					cancel() {
						this.cancelled = true;
						this.oncancel?.();
					}
				};
				animations.push(animation);
				const index = sweeps.indexOf(this);
				if (index !== -1) strips.push({ index, at: now });
				return animation;
			}
		};
	}
	const sweeps = [element(), element()];
	const hologram = createHologram();
	const quote = { getAnimations: () => entrance };
	const stop = hologram.start(quote, sweeps);
	const stops = [stop];
	t.after(() => {
		for (const stop of stops) stop();
		for (const restore of restorers) restore();
	});
	return {
		tick,
		strips,
		animations,
		element,
		hologram,
		quote,
		sweeps,
		stop,
		stops,
		document,
		motion,
		randomValues
	};
}

// Allow the entrance-animation promise to settle before advancing the fake clock.
async function settle() {
	await Promise.resolve();
	await Promise.resolve();
}

test('first burst is guaranteed after the full quote hold plus 0–2s', async (t) => {
	const env = environment(t, [0.5, 0, 0.5]);
	await settle();
	env.tick(QUOTE_HOLD_MS + 999);
	assert.deepEqual(env.strips, []);
	env.tick(1);
	assert.deepEqual(env.strips, [{ index: 0, at: QUOTE_HOLD_MS + 1000 }]);
});

test('the protected hold waits for the entrance animation to finish', async (t) => {
	let finishEntrance;
	const finished = new Promise((resolve) => {
		finishEntrance = resolve;
	});
	const env = environment(t, [0, 0, 0.5], { entrance: [{ finished }] });
	await settle();
	env.tick(10_000);
	assert.deepEqual(env.strips, []);
	finishEntrance();
	await settle();
	env.tick(QUOTE_HOLD_MS - 1);
	assert.deepEqual(env.strips, []);
	env.tick(1);
	assert.deepEqual(env.strips, [{ index: 0, at: 10_000 + QUOTE_HOLD_MS }]);
});

test('each burst independently schedules the next start 15–45s later', async (t) => {
	const env = environment(t, [0, 0, 0, 0, 0.5, 0, 0.999999, 0, 0]);
	await settle();
	env.tick(QUOTE_HOLD_MS);
	for (const gap of [15_000, 30_000, 15_000 + 0.999999 * 30_000]) {
		const previous = env.strips.at(-1).at;
		const count = env.strips.length;
		env.tick(gap - 1);
		assert.equal(env.strips.length, count);
		env.tick(1);
		assert.equal(env.strips.length, count + 1);
		assert.equal(env.strips.at(-1).at, previous + gap);
	}
	assert.equal(env.randomValues.length, 0, 'Only strip count and interval are chosen per burst');
});

test('strip-count coin uses equal halves, with a 0.4–1.2s second-strip gap', async (t) => {
	await t.test('below 0.5 gives one strip', async (t) => {
		const env = environment(t, [0, 0.499999, 0]);
		await settle();
		env.tick(QUOTE_HOLD_MS + 2000);
		assert.equal(env.strips.length, 1);
	});
	await t.test('0.5 gives two strips with minimum spacing', async (t) => {
		const env = environment(t, [0, 0.5, 0, 0]);
		await settle();
		env.tick(QUOTE_HOLD_MS + 399);
		assert.equal(env.strips.length, 1);
		env.tick(1);
		assert.equal(env.strips[1].index, 1);
		assert.equal(env.strips[1].at - env.strips[0].at, 400);
	});
	await t.test('maximum random spacing stays below 1.2s', async (t) => {
		const env = environment(t, [0, 0.9, 0.999999, 0]);
		await settle();
		env.tick(QUOTE_HOLD_MS + 1200);
		const gap = env.strips[1].at - env.strips[0].at;
		assert.ok(gap >= 400 && gap <= 1200);
	});
});

test('a double-strip burst measures the next interval from its first strip', async (t) => {
	const env = environment(t, [0, 0.5, 0.5, 0, 0, 0]);
	await settle();
	env.tick(QUOTE_HOLD_MS + 14_999);
	assert.deepEqual(env.strips, [
		{ index: 0, at: QUOTE_HOLD_MS },
		{ index: 1, at: QUOTE_HOLD_MS + 800 }
	]);
	env.tick(1);
	assert.deepEqual(env.strips[2], { index: 0, at: QUOTE_HOLD_MS + 15_000 });
});

test('cleanup cancels both a pending second strip and the next burst', async (t) => {
	const env = environment(t, [0, 0.8, 0.5, 0]);
	await settle();
	env.tick(QUOTE_HOLD_MS + 200);
	env.stop();
	env.tick(120_000);
	assert.equal(env.strips.length, 1);
	assert.ok(env.animations.every((animation) => animation.cancelled));
});

test('each control lights up at its own position using the rendered strip height', async (t) => {
	const env = environment(t, [0, 0, 0]);
	for (const sweep of env.sweeps) sweep.getBoundingClientRect = () => ({ height: 200 });
	const header = env.element(0, 20);
	const button = env.element(440, 20);
	env.hologram.register(header);
	env.hologram.register(button);
	await settle();
	env.tick(QUOTE_HOLD_MS + 111);
	assert.equal(env.animations.length, 1);
	env.tick(1);
	assert.equal(env.animations[1].node, header);
	env.tick(1008);
	const reveal = env.animations[2];
	assert.equal(reveal.node, button);
	assert.equal(reveal.at, QUOTE_HOLD_MS + 1120);
	const peak = reveal.keyframes.find((frame) => frame.opacity === 1);
	assert.ok(Math.abs(reveal.options.duration * (1 - peak.offset) - 1500) < 0.001);
	assert.equal(reveal.keyframes.at(-1).opacity, 0);

	reveal.onfinish();
	assert.equal(reveal.cancelled, true, 'Completed animations release their effects');
});

test('a second strip re-illuminates a control from its current brightness', async (t) => {
	const env = environment(t, [0, 0.5, 0, 0]);
	const button = env.element(0, 20);
	const unregister = env.hologram.register(button);
	await settle();
	env.tick(QUOTE_HOLD_MS + 200);
	const first = env.animations.find((animation) => animation.node === button);
	button.opacity = 0.4;
	env.tick(400);
	const second = env.animations.filter((animation) => animation.node === button)[1];
	assert.equal(first.cancelled, true);
	assert.equal(second.keyframes[0].opacity, 0.4);
	// A delayed cancel event from the first animation must not lose the current one.
	first.oncancel();
	unregister();
	assert.equal(second.cancelled, true);
});

test('unregistering a control before arrival prevents its pending reveal', async (t) => {
	const env = environment(t, [0, 0, 0]);
	const button = env.element(440, 20);
	const unregister = env.hologram.register(button);
	await settle();
	env.tick(QUOTE_HOLD_MS);
	unregister();
	env.tick(2000);
	assert.ok(env.animations.every((animation) => animation.node !== button));
});

test('stopping before the entrance finishes prevents a late first burst', async (t) => {
	let finishEntrance;
	const finished = new Promise((resolve) => {
		finishEntrance = resolve;
	});
	const env = environment(t, [], { entrance: [{ finished }] });
	env.stop();
	finishEntrance();
	await settle();
	env.tick(120_000);
	assert.equal(env.strips.length, 0);
});

test('starting a new playback cancels the old schedule and active effects', async (t) => {
	const env = environment(t, [0, 0.5, 0, 0, 0.5, 0, 0]);
	await settle();
	env.tick(QUOTE_HOLD_MS + 200);
	const stop = env.hologram.start(env.quote, env.sweeps);
	env.stops.push(stop);
	assert.ok(env.animations.every((animation) => animation.cancelled));
	await settle();
	env.tick(QUOTE_HOLD_MS + 999);
	assert.equal(env.strips.length, 1, 'The old second strip must be cancelled');
	env.tick(1);
	assert.equal(env.strips.length, 2);
});

test('hidden tabs suspend playback and resume without catching up bursts', async (t) => {
	const env = environment(t, [0, 0, 0, 0.5, 0, 0]);
	await settle();
	env.tick(QUOTE_HOLD_MS);
	env.document.hidden = true;
	env.document.dispatchEvent(new Event('visibilitychange'));
	env.tick(120_000);
	assert.equal(env.strips.length, 1);
	env.document.hidden = false;
	env.document.dispatchEvent(new Event('visibilitychange'));
	env.tick(29_999);
	assert.equal(env.strips.length, 1);
	env.tick(1);
	assert.equal(env.strips.length, 2);
});

test('reduced motion suppresses scheduling until the preference changes', async (t) => {
	const env = environment(t, [0, 0, 0], { reducedMotion: true });
	await settle();
	env.tick(120_000);
	assert.equal(env.strips.length, 0);
	env.motion.matches = false;
	env.motion.dispatchEvent(new Event('change'));
	await settle();
	env.tick(QUOTE_HOLD_MS);
	assert.equal(env.strips.length, 1);
});

test('enabling reduced motion cancels active effects and pending strips', async (t) => {
	const env = environment(t, [0, 0.5, 0, 0]);
	env.hologram.register(env.element(0, 20));
	await settle();
	env.tick(QUOTE_HOLD_MS + 200);
	assert.equal(env.animations.length, 2);
	env.motion.matches = true;
	env.motion.dispatchEvent(new Event('change'));
	assert.ok(env.animations.every((animation) => animation.cancelled));
	env.tick(120_000);
	assert.equal(env.strips.length, 1);
});

test('both strips reveal the header, episode info, and export independently', async (t) => {
	const env = environment(t, [0, 0.5, 0, 0]);
	const controls = [env.element(0, 72), env.element(450, 64), env.element(450, 20)];
	for (const control of controls) env.hologram.register(control);
	await settle();
	env.tick(QUOTE_HOLD_MS + 2520 + 400);
	for (const control of controls) {
		const reveals = env.animations.filter((animation) => animation.node === control);
		assert.equal(reveals.length, 2);
		assert.equal(reveals[0].cancelled, true);
		assert.equal(reveals[1].cancelled, false);
		const peak = reveals[1].keyframes.find((frame) => frame.opacity === 1);
		assert.ok(Math.abs(reveals[1].options.duration * (1 - peak.offset) - 1500) < 0.001);
		assert.equal(reveals[1].keyframes.at(-1).opacity, 0);
	}
});
