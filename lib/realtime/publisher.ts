export type RealtimeEvent = 'match.updated' | 'score.created' | 'match.started' | 'match.paused' | 'match.resumed' | 'match.completed'

export type RealtimeMessage = { type: RealtimeEvent; eventId?: string; matchId: string; version?: number }

export interface RealtimePublisher { publish(message: RealtimeMessage): Promise<void> }

export const realtimePublisher: RealtimePublisher = { async publish(_message) { /* Polling is the active transport; this boundary supports SSE later. */ } }
