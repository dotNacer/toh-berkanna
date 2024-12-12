export interface RoundInterface {
    id: number
    status: 'waiting' | 'in_progress' | 'completed'
    winnerId: string | null
    currentTurn: string | null
    roomId: string
}
