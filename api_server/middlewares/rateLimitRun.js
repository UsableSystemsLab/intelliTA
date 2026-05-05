const MIN_INTERVAL_MS = 2000;
const MAX_PER_MINUTE = 30;

const buckets = new Map();

const rateLimitRun = (req, res, next) => {
  const uid = req.firebaseUser?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Missing user context" });
  }

  const now = Date.now();
  let bucket = buckets.get(uid);
  if (!bucket) {
    bucket = { lastRun: 0, minuteStart: now, runsThisMinute: 0 };
    buckets.set(uid, bucket);
  }

  if (now - bucket.minuteStart >= 60000) {
    bucket.minuteStart = now;
    bucket.runsThisMinute = 0;
  }

  const sinceLast = now - bucket.lastRun;
  if (sinceLast < MIN_INTERVAL_MS) {
    const waitMs = MIN_INTERVAL_MS - sinceLast;
    res.set("Retry-After", String(Math.ceil(waitMs / 1000)));
    return res.status(429).json({
      error: "Slow down — wait a moment before running again",
      retryAfterMs: waitMs,
    });
  }

  if (bucket.runsThisMinute >= MAX_PER_MINUTE) {
    const waitMs = 60000 - (now - bucket.minuteStart);
    res.set("Retry-After", String(Math.ceil(waitMs / 1000)));
    return res.status(429).json({
      error: "Run limit reached — try again in a minute",
      retryAfterMs: waitMs,
    });
  }

  bucket.lastRun = now;
  bucket.runsThisMinute += 1;
  next();
};

export default rateLimitRun;
