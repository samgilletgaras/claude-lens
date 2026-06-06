const registry = new Map();

export function register(name, impl) { registry.set(name, impl); }

function resolve(provider) { return registry.get(provider) ?? null; }

export const getMcps = (provider, id = null) =>
  resolve(provider)?.getMcps(id) ?? Promise.resolve(id ? null : []);
