export type ReelResponse =
  | { medias: [{ url: string }]; success: true }
  | { success: false };
