/** Client-safe constants (no server-only imports). */
export const WS_COOKIE = "ot_ws";

/** Public base URL of this app — used to build auth redirect/invite links. */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
