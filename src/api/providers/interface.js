/**
 * @typedef {Object} Provider
 * @property {string} name - human-readable display name
 * @property {{hasHistory:boolean, hasStats:boolean, hasLogs:boolean, hasSkills:boolean, hasAgents:boolean, hasMcps:boolean, hasMemory:boolean, hasPlans:boolean}} capabilities
 * @property {() => Promise<boolean>} isAvailable
 * @property {() => Promise<import('../readers/sessions.js').ProjectSummary[]>} getProjects
 * @property {(project: string, page: number, pageSize: number) => Promise<{data: any[], total: number}>} getSessions
 * @property {(project: string, session: string) => Promise<any[]>} getMessages
 * @property {(project?: string|null) => Promise<any|null>} getStats
 */
