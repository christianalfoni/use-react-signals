// When on server we drop out of using "useSyncExternalStore" as there is really no
// reason to run it (It holds no state, just subscribes to updates)
export const isServer = typeof window === "undefined";
