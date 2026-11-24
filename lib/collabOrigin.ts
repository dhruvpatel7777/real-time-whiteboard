// Local origin marker for Yjs transactions
export const createLocalOrigin = (userId: string) => `local-user-${userId}-${Date.now()}`;
