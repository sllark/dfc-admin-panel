export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ensureMinDuration(startedAt, minMs = 600) {
  const elapsed = Date.now() - startedAt;
  const remaining = minMs - elapsed;
  if (remaining > 0) await wait(remaining);
}

