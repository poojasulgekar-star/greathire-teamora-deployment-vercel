const LOCAL_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

export function getClientOrigins() {
  let origins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  let defaults = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.vercel.app",
    "https://frontend-sravans-projects-d52b9dc4.vercel.app",
    "https://frontend-three-alpha-37.vercel.app",
  ];

  for (let def of defaults) {
    if (!origins.includes(def)) origins.push(def);
  }

  return [...new Set(origins)];
}

export function isOriginAllowed(origin) {
  if (!origin) return true;
  let normalized = origin.trim().replace(/\/+$/, "");

  // Always allow any localhost / 127.0.0.1 port during local development
  if (LOCAL_ORIGIN_REGEX.test(normalized)) {
    return true;
  }

  let allowed = getClientOrigins();
  return allowed.some((cleanAllowed) => {
    let clean = cleanAllowed.trim().replace(/\/+$/, "");
    if (clean === normalized) return true;
    if (clean.includes("*")) {
      let regex = new RegExp("^" + clean.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
      return regex.test(normalized);
    }
    return false;
  });
}

export function getPrimaryClientOrigin(req) {
  if (req && typeof req.get === "function") {
    let rawOrigin = req.get("origin") || req.get("referer") || "";
    try {
      if (rawOrigin) {
        let originUrl = new URL(rawOrigin).origin.replace(/\/+$/, "");
        if (isOriginAllowed(originUrl)) {
          return originUrl;
        }
      }
    } catch {
      // ignore malformed URLs
    }
  }

  let allowed = getClientOrigins();
  // Prioritize production (non-wildcard, non-localhost) origin over localhost
  let prodOrigin = allowed.find(
    (o) => !o.includes("*") && !o.includes("localhost") && !o.includes("127.0.0.1")
  );
  return prodOrigin || "https://frontend-sravans-projects-d52b9dc4.vercel.app";
}
