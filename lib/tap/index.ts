import { Tap } from "@atproto/tap";

const TAP_URL = process.env.TAP_URL || "http://localhost:2480";
const TAP_ADMIN_PASSWORD = process.env.TAP_ADMIN_PASSWORD;

let _tap: Tap | null = null;

export const getTap = (): Tap => {
  if (!_tap) {
    _tap = new Tap(TAP_URL, { adminPassword: TAP_ADMIN_PASSWORD });
  }
  return _tap;
};
