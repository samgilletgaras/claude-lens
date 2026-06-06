const registry = new Map();

export function register(name, impl) { registry.set(name, impl); }

function resolve(provider) { return registry.get(provider) ?? null; }

export const getAgents = (provider) =>
  resolve(provider)?.getAgents() ?? Promise.resolve([]);

export const getAgentDetail = (provider, slug) =>
  resolve(provider)?.getAgentDetail(slug) ?? null;
