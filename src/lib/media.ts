const fallbackLocation = {
  protocol: "http:",
  hostname: "localhost",
  port: "",
  pathname: "/geniehub-realty",
  origin: "http://localhost",
};

function getRuntimeLocation() {
  return typeof window !== "undefined" ? window.location : fallbackLocation;
}

export function resolveMediaUrl(path?: string | null): string {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const location = getRuntimeLocation();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const isLocalXampp = ["localhost", "127.0.0.1"].includes(location.hostname) && location.pathname.startsWith("/geniehub-realty");

  if (isLocalXampp && !normalizedPath.startsWith("/geniehub-realty/")) {
    return `${location.origin}/geniehub-realty${normalizedPath}`;
  }

  return `${location.origin}${normalizedPath}`;
}
