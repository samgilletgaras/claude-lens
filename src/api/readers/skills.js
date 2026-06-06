const registry = new Map();

export function register(name, impl) { registry.set(name, impl); }

function resolve(provider) { return registry.get(provider) ?? null; }

export const getSkills = (provider) =>
  resolve(provider)?.getSkills() ?? Promise.resolve([]);

export const getSkillDetail = (provider, slug) =>
  resolve(provider)?.getSkillDetail(slug) ?? null;
