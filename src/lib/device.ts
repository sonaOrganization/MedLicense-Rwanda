const MOBILE_UA = /android|iphone|ipad|ipod|windows phone|mobile/i;

export function getDeviceType(userAgent: string): "mobile" | "desktop" {
  return MOBILE_UA.test(userAgent) ? "mobile" : "desktop";
}
