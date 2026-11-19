// Deterministic local-time assertions: Node re-reads TZ on subsequent Date calls.
process.env.TZ = "UTC";
