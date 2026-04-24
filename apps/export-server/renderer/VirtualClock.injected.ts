/**
 * VirtualClock.injected.ts
 *
 * Deterministic clock injected into chrome-headless-shell before page load.
 * Patches all five browser time APIs so Framer Motion, React scheduler,
 * CSS animations, and all timeouts advance only when clock.tick() is called.
 *
 * Safe to patch all five here (including setTimeout/setInterval) because
 * HeadlessExperimental.beginFrame freezes Chrome between calls — there is
 * no event loop running that could deadlock on a patched setTimeout.
 *
 * Exposed as window.__virtualClock for HeadlessRenderer to call tick().
 */

// This function is converted to a string and injected. Do not use imports.
export function getVirtualClockScript(): string {
  return `
(function() {
  'use strict';

  let virtualNow    = performance.now();
  const rafQueue    = new Map();
  const timerQueue  = [];
  let   nextRafId   = 1;
  let   nextTimerId = 100000;

  // ── performance.now ────────────────────────────────────────────────────────
  const _realPerfNow = performance.now.bind(performance);
  performance.now = function() { return virtualNow; };

  // ── Date.now ───────────────────────────────────────────────────────────────
  Date.now = function() { return Math.floor(virtualNow); };

  // ── requestAnimationFrame ──────────────────────────────────────────────────
  window.requestAnimationFrame = function(cb) {
    const id = nextRafId++;
    rafQueue.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = function(id) {
    rafQueue.delete(id);
  };

  // ── setTimeout ─────────────────────────────────────────────────────────────
  const _realSetTimeout  = window.setTimeout.bind(window);
  const _realClearTimeout = window.clearTimeout.bind(window);
  window.setTimeout = function(cb, delay) {
    delay = delay || 0;
    const id = nextTimerId++;
    timerQueue.push({ id, cb, fireAt: virtualNow + delay });
    return id;
  };
  window.clearTimeout = function(id) {
    const idx = timerQueue.findIndex(t => t.id === id);
    if (idx !== -1) timerQueue.splice(idx, 1);
  };

  // ── setInterval ────────────────────────────────────────────────────────────
  // Convert to recurring setTimeout entries
  window.setInterval = function(cb, delay) {
    delay = delay || 16;
    let id = nextTimerId++;
    function schedule() {
      timerQueue.push({ id, cb: () => { cb(); schedule(); }, fireAt: virtualNow + delay });
    }
    schedule();
    return id;
  };
  window.clearInterval = window.clearTimeout;

  // ── clock.tick ─────────────────────────────────────────────────────────────
  function tick(ms) {
    virtualNow += (ms || 0);

    // Fire due setTimeout/setInterval callbacks
    const due = timerQueue.filter(t => t.fireAt <= virtualNow);
    due.forEach(t => {
      const idx = timerQueue.indexOf(t);
      if (idx !== -1) timerQueue.splice(idx, 1);
    });
    due.forEach(t => { try { t.cb(); } catch(e) {} });

    // Fire all queued rAF callbacks
    const pending = Array.from(rafQueue.entries());
    rafQueue.clear();
    pending.forEach(([, cb]) => { try { cb(virtualNow); } catch(e) {} });
  }

  // Expose on window for HeadlessRenderer to call via page.evaluate
  window.__virtualClock = { tick, getCurrentTime: () => virtualNow };

  // Expose "real" versions for internal coordination
  window.__realSetTimeout = _realSetTimeout;
  window.__realClearTimeout = _realClearTimeout;
  window.__realPerformanceNow = _realPerfNow;

  console.log('[VirtualClock] Installed. All time APIs are deterministic.');
})();
  `.trim()
}
