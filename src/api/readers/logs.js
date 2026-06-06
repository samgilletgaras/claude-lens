const registry = new Map();

export function register(name, impl) { registry.set(name, impl); }

function resolve(provider) { return registry.get(provider) ?? null; }

export const getLogs = (provider, page = 0, pageSize = 10) =>
  resolve(provider)?.getLogs(page, pageSize) ?? Promise.resolve({ data: [], total: 0 });
