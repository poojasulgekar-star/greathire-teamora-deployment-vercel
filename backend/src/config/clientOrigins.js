export function getClientOrigins() {
  let origins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  if (origins.length > 0) return [...new Set(origins)];

  if (process.env.NODE_ENV === "production") {
    throw new Error("CLIENT_ORIGIN must be set in production (no wildcard CORS allowed).");
  }

  return ["http://localhost:5173"];
}

export function getPrimaryClientOrigin(req) {
  let allowed = getClientOrigins();

  if (req && typeof req.get === "function") {
    let rawOrigin = req.get("origin") || req.get("referer") || "";
    try {
      if (rawOrigin) {
        let originUrl = new URL(rawOrigin).origin.replace(/\/+$/, "");
        if (allowed.includes(originUrl)) {
          return originUrl;
        }
      }
    } catch {
      // ignore malformed URLs
    }
  }

  // Prioritize production (non-localhost) origin over localhost
  let prodOrigin = allowed.find((o) => !o.includes("localhost") && !o.includes("127.0.0.1"));
  return prodOrigin || allowed[0] || "http://localhost:5173";
}
