export const BASE_PATH = "/writing";

/** Prefix a root-relative public asset or API path with Next's `basePath`. */
export function assetPath(path: string): string {
  if (!path.startsWith("/") || path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}

/** Strip Next's `basePath` prefix from a browser pathname, returning `"/"` at the zone root. */
export function stripBasePath(pathname: string): string {
  if (pathname === BASE_PATH || pathname === `${BASE_PATH}/`) return "/";
  if (pathname.startsWith(`${BASE_PATH}/`)) return pathname.slice(BASE_PATH.length);
  return pathname;
}
