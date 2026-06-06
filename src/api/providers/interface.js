/**
 * A provider module exports only metadata + availability. The data methods
 * (getProjects/getSessions/getMessages/getStats/getSkills/…) are NOT on the
 * provider — each reader self-registers them via `register('<id>', …)` into its
 * registry hub (`readers/*.js`). The provider module's only job is to import its
 * `readers/<id>/*.js` modules (triggering registration) and describe itself.
 *
 * @typedef {Object} Provider
 * @property {string} name - human-readable display name
 * @property {string} [icon] - optional lucide icon name, surfaced via /api/config and resolved on the frontend by iconFor()
 * @property {{hasHistory:boolean, hasStats:boolean, hasLogs:boolean, hasSkills:boolean, hasAgents:boolean, hasMcps:boolean, hasMemory:boolean, hasPlans:boolean}} capabilities
 * @property {() => Promise<boolean>} isAvailable
 */
