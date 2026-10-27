export function getClientOrigins() {
  let origins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  let defaults = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://*.vercel.app",
    "https://frontend-three-alpha-37.vercel.app",
  ];

  for (let def of defaults) {
    if (!origins.includes(def)) origins.push(def);
  }

  return [...new Set(origins)];
}

export function getPrimaryClientOrigin(req) {
  let allowed = getClientOrigins();

  if (req && typeof req.get === "function") {
    let rawOrigin = req.get("origin") || req.get("referer") || "";
    try {
      if (rawOrigin) {
        let originUrl = new URL(rawOrigin).origin.replace(/\/+$/, "");
        let isAllowed = allowed.some((cleanAllowed) => {
          let clean = cleanAllowed.replace(/\/+$/, "");
          if (clean === originUrl) return true;
          if (clean.includes("*")) {
            let regex = new RegExp("^" + clean.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
            return regex.test(originUrl);
          }
          return false;
        });
        if (isAllowed) {
          return originUrl;
        }
      }
    } catch {
      // ignore malformed URLs
    }
  }

  // Prioritize production (non-wildcard, non-localhost) origin over localhost
  let prodOrigin = allowed.find(
    (o) => !o.includes("*") && !o.includes("localhost") && !o.includes("127.0.0.1")
  );
  return prodOrigin || "https://frontend-three-alpha-37.vercel.app";
}
