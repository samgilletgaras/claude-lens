// Pure registry — no knowledge of any specific provider.
// Each provider registers its implementation on import.

const registry = new Map();

export function register(name, impl) { registry.set(name, impl); }

export async function getSystemPrompts(provider) {
  if (provider === 'all') {
    const out = [];
    for (const [id, impl] of registry) {
      try {
        const entries = await impl.getSystemPrompts();
        for (const e of entries) out.push({ ...e, provider: id });
      } catch { /* skip broken providers */ }
    }
    return out;
  }
  const impl = registry.get(provider);
  return impl ? impl.getSystemPrompts() : [];
}
