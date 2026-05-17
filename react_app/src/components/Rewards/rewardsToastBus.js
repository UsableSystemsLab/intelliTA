const listeners = new Set();
let counter = 0;

export function emitRewardsToast(toast) {
    const id = ++counter;
    const enriched = { id, ...toast };
    listeners.forEach((fn) => fn(enriched));
    return id;
}

export function subscribeRewardsToast(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function emitFromRewardsResponse(rewards) {
    if (!rewards || typeof rewards !== 'object') return;
    if (rewards.points_earned > 0) {
        emitRewardsToast({
            kind: 'points',
            points: rewards.points_earned,
            lines: rewards.lines || [],
        });
    }
    (rewards.badges_awarded || []).forEach((badge) => {
        emitRewardsToast({ kind: 'badge', badge });
    });
}
