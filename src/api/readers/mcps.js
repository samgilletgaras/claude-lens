import { ALL_PROVIDER } from '../utils.js';

const registry = new Map();

export function register(name, impl) { registry.set(name, impl); }

function resolve(provider) { return registry.get(provider) ?? null; }

export async function getMcps(provider, id = null) {
  if (provider === ALL_PROVIDER) {
    if (id) {
      for (const [, impl] of registry) {
        const d = await impl.getMcps(id);
        if (d) return d;
      }
      return null;
    }
    const out = [];
    for (const [, impl] of registry) {
      try { out.push(...await impl.getMcps(null)); } catch { /* skip */ }
    }
    return out;
  }
  return resolve(provider)?.getMcps(id) ?? Promise.resolve(id ? null : []);
}
