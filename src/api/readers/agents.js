import { ALL_PROVIDER } from '../utils.js';

const registry = new Map();

export function register(name, impl) { registry.set(name, impl); }

function resolve(provider) { return registry.get(provider) ?? null; }

export async function getAgents(provider) {
  if (provider === ALL_PROVIDER) {
    const out = [];
    for (const [, impl] of registry) {
      try { out.push(...await impl.getAgents()); } catch { /* skip */ }
    }
    return out;
  }
  return resolve(provider)?.getAgents() ?? Promise.resolve([]);
}

export function getAgentDetail(provider, slug) {
  if (provider === ALL_PROVIDER) {
    for (const [, impl] of registry) {
      const d = impl.getAgentDetail(slug);
      if (d) return d;
    }
    return null;
  }
  return resolve(provider)?.getAgentDetail(slug) ?? null;
}
