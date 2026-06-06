const registry = new Map();

export function register(name, impl) { registry.set(name, impl); }

function resolve(provider) { return registry.get(provider) ?? null; }

export const getMemory = (provider, project, filename) =>
  resolve(provider)?.getMemory(project, filename) ?? Promise.resolve([]);
