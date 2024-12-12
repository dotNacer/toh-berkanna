import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { HeroInterface } from '../data/heroInterface'
import { RoundInterface } from '../data/roundInterface'
/*
Idées jeux : 
- Jeux de rapidité de frappe, le premier ayant tappé la phrase inflige un coup
- Jeu quizz, le premier ayant répondu inflige un coup
*/
export interface BattleState {
    roomId: string | null
    players: string[]
    playerNames: Map<string, string>
    isReady: boolean
    availableRooms: string[]
    selectedHeroes: Map<string, HeroInterface>
    readyPlayers: Set<string>
    currentHP: Map<string, number>
    winner: string | null
    currentRound: RoundInterface | null
}

export interface BattleEvent {
    type: 'dodge' | 'hit' | 'critical'
    targetId: string
    attackerId: string
    damage?: number
    dodgeChance?: number
    critChance?: number
}

@Injectable({
    providedIn: 'root',
})
export class BattleService {
    private socket: Socket
    private battleState = new BehaviorSubject<BattleState>({
        roomId: null,
        players: [],
        playerNames: new Map(),
        isReady: false,
        availableRooms: [],
        selectedHeroes: new Map(),
        readyPlayers: new Set(),
        currentHP: new Map(),
        winner: null,
        currentRound: null,
    })
    private typingGameEvents = new Subject<any>()
    private battleEvents = new Subject<BattleEvent>()

    constructor() {
        this.socket = io('129.151.253.246:3000/', {
            transports: ['websocket'],
        })

        this.setupSocketListeners()
    }

    private setupSocketListeners(): void {
        this.socket.on('roomsList', (rooms: string[]) => {
            this.battleState.next({
                ...this.battleState.value,
                availableRooms: rooms,
            })
        })

        this.socket.on(
            'roomJoined',
            (data: { roomId: string; players: string[] }) => {
                this.battleState.next({
                    ...this.battleState.value,
                    roomId: data.roomId,
                    players: data.players,
                    readyPlayers: new Set(),
                    isReady: false,
                })
            }
        )

        this.socket.on('battleReady', (isReady: boolean) => {
            if (isReady) {
                const allPlayersReady = this.battleState.value.players.every(
                    (playerId) =>
                        this.battleState.value.readyPlayers.has(playerId)
                )

                this.battleState.next({
                    ...this.battleState.value,
                    isReady:
                        allPlayersReady &&
                        this.battleState.value.players.length === 2,
                })
            }
        })

        this.socket.on('roomClosed', () => {
            this.battleState.next({
                ...this.battleState.value,
                roomId: null,
                players: [],
                isReady: false,
                readyPlayers: new Set(),
            })
        })

        this.socket.on(
            'heroSelected',
            ({ playerId, hero }: { playerId: string; hero: HeroInterface }) => {
                const currentHeroes = new Map(
                    this.battleState.value.selectedHeroes
                )
                currentHeroes.set(playerId, hero)
                this.battleState.next({
                    ...this.battleState.value,
                    selectedHeroes: currentHeroes,
                })
            }
        )

        this.socket.on(
            'playerReady',
            ({ playerId, isReady }: { playerId: string; isReady: boolean }) => {
                const currentReadyPlayers = new Set(
                    this.battleState.value.readyPlayers
                )

                if (isReady) {
                    currentReadyPlayers.add(playerId)
                } else {
                    currentReadyPlayers.delete(playerId)
                }

                const allPlayersReady = this.battleState.value.players.every(
                    (playerId) => currentReadyPlayers.has(playerId)
                )

                this.battleState.next({
                    ...this.battleState.value,
                    readyPlayers: currentReadyPlayers,
                    isReady:
                        allPlayersReady &&
                        this.battleState.value.players.length === 2,
                })
            }
        )

        this.socket.on(
            'playerNameUpdate',
            ({
                playerId,
                playerName,
            }: {
                playerId: string
                playerName: string
            }) => {
                const currentPlayerNames = new Map(
                    this.battleState.value.playerNames
                )
                currentPlayerNames.set(playerId, playerName)
                this.battleState.next({
                    ...this.battleState.value,
                    playerNames: currentPlayerNames,
                })
            }
        )

        this.socket.on('battleStart', () => {
            const currentHP = new Map<string, number>()
            this.battleState.value.players.forEach((playerId) => {
                const hero = this.battleState.value.selectedHeroes.get(playerId)
                if (hero) {
                    currentHP.set(playerId, hero.hp)
                }
            })

            this.battleState.next({
                ...this.battleState.value,
                currentHP,
            })
        })

        this.socket.on(
            'hpUpdate',
            ({ playerId, newHP }: { playerId: string; newHP: number }) => {
                const currentHP = new Map(this.battleState.value.currentHP)
                currentHP.set(playerId, newHP)
                this.battleState.next({
                    ...this.battleState.value,
                    currentHP,
                })
            }
        )

        this.socket.on(
            'gameOver',
            ({ winner, loser }: { winner: string; loser: string }) => {
                const winnerName =
                    this.battleState.value.playerNames.get(winner) ||
                    'Joueur inconnu'
                this.battleState.next({
                    ...this.battleState.value,
                    winner: winnerName,
                })

                // Quitter la room après 5 secondes
                setTimeout(() => {
                    this.leaveRoom()
                    // Rediriger vers le lobby
                    window.location.href = '/lobby'
                }, 5000)
            }
        )

        this.socket.on('roundUpdate', (round: RoundInterface) => {
            this.battleState.next({
                ...this.battleState.value,
                currentRound: round,
            })

            // Si la manche est complétée et que nous sommes le gagnant, attaquer automatiquement
            if (
                round.status === 'completed' &&
                round.winnerId === this.socket.id
            ) {
                const opponent = this.battleState.value.players.find(
                    (playerId) => playerId !== this.socket.id
                )
                if (opponent) {
                    const attackerHero =
                        this.battleState.value.selectedHeroes.get(
                            this.socket.id
                        )
                    if (attackerHero) {
                        this.attackPlayer(opponent)
                    }
                }
            }
        })

        this.socket.on('battleStart', () => {
            // Initialiser la première manche
            const initialRound: RoundInterface = {
                id: 1,
                status: 'in_progress',
                winnerId: null,
                currentTurn: null,
                roomId: this.battleState.value.roomId!,
            }

            this.battleState.next({
                ...this.battleState.value,
                currentRound: initialRound,
            })
        })

        this.socket.on('typingGameStarted', ({ phraseIndex }) => {
            this.typingGameEvents.next({
                type: 'gameStarted',
                phraseIndex,
            })
        })

        this.socket.on('battleEvent', (event: BattleEvent) => {
            this.battleEvents.next(event)
            if (event.type === 'dodge') {
                console.log(
                    `${this.battleState.value.playerNames.get(
                        event.targetId
                    )} a esquivé l'attaque! (${event.dodgeChance}% de chance)`
                )
            } else if (event.type === 'hit') {
                console.log(
                    `${this.battleState.value.playerNames.get(
                        event.targetId
                    )} a reçu ${event.damage} points de dégâts!`
                )
            }
        })
    }

    createRoom(roomName: string): void {
        this.socket.emit('createRoom', roomName)
    }

    joinRoom(roomId: string): void {
        this.socket.emit('joinRoom', roomId)
    }

    getRoomsList(): void {
        this.socket.emit('getRoomsList')
    }

    getBattleState(): Observable<BattleState> {
        return this.battleState.asObservable()
    }

    leaveRoom(): void {
        if (this.battleState.value.roomId) {
            this.socket.emit('leaveRoom', this.battleState.value.roomId)
            this.battleState.next({
                ...this.battleState.value,
                roomId: null,
                players: [],
                isReady: false,
                readyPlayers: new Set(),
            })
        }
    }

    selectHero(hero: HeroInterface): void {
        if (this.battleState.value.roomId) {
            this.socket.emit('selectHero', {
                roomId: this.battleState.value.roomId,
                hero,
                playerId: this.socket.id,
            })
        }
    }

    setReady(): void {
        if (this.battleState.value.roomId) {
            this.socket.emit('setReady', {
                roomId: this.battleState.value.roomId,
                playerId: this.socket.id,
            })
        }
    }

    getPlayerId(): string {
        if (!this.socket?.id) {
            throw new Error('Socket not initialized')
        }
        return this.socket.id
    }

    setPlayerName(playerName: string): void {
        this.socket.emit('setPlayerName', playerName)
    }

    attackPlayer(targetPlayerId: string): void {
        const roomId = this.battleState.value.roomId
        const attackerId = this.socket?.id

        if (!roomId || !attackerId) {
            console.error('Room ID or Attacker ID not found')
            return
        }

        const attackerHero =
            this.battleState.value.selectedHeroes.get(attackerId)

        if (attackerHero) {
            this.socket.emit('attackPlayer', {
                roomId: roomId,
                targetPlayerId,
                damage: attackerHero.attackDamage,
            })
        }
    }

    // Méthode pour gagner la manche
    winRound(): void {
        if (this.battleState.value.roomId) {
            this.socket.emit('winRound', {
                roomId: this.battleState.value.roomId,
                playerId: this.socket.id,
            })
        }
    }

    startTypingGame(roomId: string): void {
        this.socket.emit('startTypingGame', { roomId })
    }

    getTypingGameEvents() {
        return this.typingGameEvents.asObservable()
    }

    getBattleEvents(): Observable<BattleEvent> {
        return this.battleEvents.asObservable()
    }
}
