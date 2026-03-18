/**
 * Request-scoped context storage for correlated logging.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

export const requestContext = {
  enterWith(store: RequestContextStore) {
    storage.enterWith(store);
  },

  getStore() {
    return storage.getStore();
  },

  getRequestId() {
    return storage.getStore()?.requestId;
  },
};
