// Export centralisé de tous les repositories

export { memberRepository, MemberRepository } from './MemberRepository';
export { eventRepository, EventRepository } from './EventRepository';
export type { Event, EventRegistration } from './EventRepository';
export { spotlightRepository, SpotlightRepository } from './SpotlightRepository';
export type { Spotlight, SpotlightPresence, SpotlightEvaluation } from './SpotlightRepository';
export { evaluationRepository, EvaluationRepository } from './EvaluationRepository';
export type { Evaluation } from './EvaluationRepository';
export { vipRepository, VipRepository } from './VipRepository';
export type { VipHistoryEntry } from './VipRepository';
