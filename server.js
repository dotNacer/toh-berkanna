const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const { TYPING_PHRASES } = require('./server/typing-phrases')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})

app.get('/', (req, res) => {
    res.send('Hello World')
})

const rooms = new Map()
const readyPlayersMap = new Map()
const selectedHeroes = new Map()
const playerNames = new Map()
const playerHP = new Map()
const roomRounds = new Map()
const roomPhrases = new Map()

io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    const sendRoomsListToAll = () => {
        const availableRooms = Array.from(rooms.entries())
            .filter(([_, players]) => players.length < 2)
            .map(([roomId]) => roomId)
        io.emit('roomsList', availableRooms)
    }

    const cleanupRoom = (roomId) => {
        if (rooms.has(roomId)) {
            io.to(roomId).emit('roomClosed')
            rooms.delete(roomId)
            readyPlayersMap.delete(roomId)
            selectedHeroes.delete(roomId)
            roomRounds.delete(roomId)
            roomPhrases.delete(roomId)
            const players = rooms.get(roomId)
            if (players) {
                players.forEach((playerId) => {
                    playerHP.delete(playerId)
                })
            }
            sendRoomsListToAll()
        }
    }

    socket.on('getRoomsList', () => {
        sendRoomsListToAll()
    })

    socket.on('createRoom', (roomName) => {
        const roomId = `${roomName}_${Date.now()}`
        rooms.set(roomId, [socket.id])
        socket.join(roomId)

        io.to(roomId).emit('roomJoined', {
            roomId: roomId,
            players: [socket.id],
        })

        sendRoomsListToAll()
    })

    socket.on('setPlayerName', (playerName) => {
        playerNames.set(socket.id, playerName)
        io.emit('playerNameUpdate', { playerId: socket.id, playerName })
    })

    socket.on('joinRoom', (roomId) => {
        if (rooms.has(roomId)) {
            const players = rooms.get(roomId)
            if (players.length < 2) {
                socket.join(roomId)
                players.push(socket.id)
                rooms.set(roomId, players)

                const roomPlayerNames = new Map()
                players.forEach((playerId) => {
                    if (playerNames.has(playerId)) {
                        roomPlayerNames.set(playerId, playerNames.get(playerId))
                    }
                })

                io.to(roomId).emit('roomJoined', {
                    roomId: roomId,
                    players: players,
                    playerNames: Array.from(roomPlayerNames),
                })

                sendRoomsListToAll()
            }
        }
    })

    socket.on('leaveRoom', (roomId) => {
        if (rooms.has(roomId)) {
            socket.leave(roomId)
            cleanupRoom(roomId)
        }
    })

    socket.on('setReady', ({ roomId, playerId }) => {
        if (rooms.has(roomId)) {
            if (!readyPlayersMap.has(roomId)) {
                readyPlayersMap.set(roomId, new Set())
            }

            const readyPlayers = readyPlayersMap.get(roomId)
            readyPlayers.add(playerId)

            io.to(roomId).emit('playerReady', {
                playerId,
                isReady: true,
            })

            const players = rooms.get(roomId)
            if (readyPlayers.size === players.length && players.length === 2) {
                const roomHeroes = selectedHeroes.get(roomId)
                if (roomHeroes) {
                    players.forEach((playerId) => {
                        const hero = roomHeroes.get(playerId)
                        if (hero) {
                            playerHP.set(playerId, hero.hp)
                            io.to(roomId).emit('hpUpdate', {
                                playerId,
                                newHP: hero.hp,
                            })
                        }
                    })
                }

                const initialRound = {
                    id: 1,
                    status: 'in_progress',
                    winnerId: null,
                    currentTurn: null,
                    roomId: roomId,
                }
                roomRounds.set(roomId, initialRound)

                io.to(roomId).emit('roundUpdate', initialRound)
                io.to(roomId).emit('battleStart')
                io.to(roomId).emit('battleReady', true)
            }
        }
    })

    socket.on('selectHero', ({ roomId, hero, playerId }) => {
        if (rooms.has(roomId)) {
            if (!selectedHeroes.has(roomId)) {
                selectedHeroes.set(roomId, new Map())
            }
            const roomHeroes = selectedHeroes.get(roomId)
            roomHeroes.set(playerId, hero)

            io.to(roomId).emit('heroSelected', { playerId, hero })
        }
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
        for (const [roomId, players] of rooms.entries()) {
            if (players.includes(socket.id)) {
                cleanupRoom(roomId)
            }
        }
    })

    socket.on('attackPlayer', ({ roomId, targetPlayerId, damage }) => {
        if (rooms.has(roomId)) {
            const players = rooms.get(roomId)
            const currentRound = roomRounds.get(roomId)

            if (
                players.includes(targetPlayerId) &&
                currentRound?.winnerId === socket.id
            ) {
                let currentHP = playerHP.get(targetPlayerId)
                const roomHeroes = selectedHeroes.get(roomId)
                const targetHero = roomHeroes?.get(targetPlayerId)
                const attackerHero = roomHeroes?.get(socket.id)

                if (currentHP === undefined) {
                    currentHP = targetHero?.hp || 0
                }

                // Calcul de la chance d'esquive
                const dodgeValue = targetHero?.dodge || 0
                const maxDodgeChance = 0.75
                const dodgeChance = (dodgeValue / 40) * maxDodgeChance
                const isDodged = Math.random() < dodgeChance

                if (isDodged) {
                    io.to(roomId).emit('battleEvent', {
                        type: 'dodge',
                        targetId: targetPlayerId,
                        attackerId: socket.id,
                        dodgeChance: Math.round(dodgeChance * 100),
                    })
                    // Passer au round suivant sans infliger de dégâts
                    const nextRound = {
                        id: currentRound.id + 1,
                        status: 'in_progress',
                        winnerId: null,
                        currentTurn: null,
                        roomId: roomId,
                    }
                    roomRounds.set(roomId, nextRound)
                    io.to(roomId).emit('roundUpdate', nextRound)
                    return
                }

                // Calcul du coup critique
                const critValue = attackerHero?.criticalChance || 0
                const maxCritChance = 0.75
                const critChance = (critValue / 40) * maxCritChance
                const isCritical = Math.random() < critChance

                // Calcul des dégâts avec critique
                const finalDamage = isCritical
                    ? Math.round(damage * 1.5)
                    : damage

                const newHP = Math.max(0, currentHP - finalDamage)
                playerHP.set(targetPlayerId, newHP)

                io.to(roomId).emit('hpUpdate', {
                    playerId: targetPlayerId,
                    newHP: newHP,
                })

                io.to(roomId).emit('battleEvent', {
                    type: isCritical ? 'critical' : 'hit',
                    targetId: targetPlayerId,
                    attackerId: socket.id,
                    damage: finalDamage,
                    critChance: isCritical
                        ? Math.round(critChance * 100)
                        : undefined,
                })

                if (newHP <= 0) {
                    io.to(roomId).emit('gameOver', {
                        winner: socket.id,
                        loser: targetPlayerId,
                    })

                    setTimeout(() => {
                        cleanupRoom(roomId)
                    }, 6000)
                } else {
                    const nextRound = {
                        id: currentRound.id + 1,
                        status: 'in_progress',
                        winnerId: null,
                        currentTurn: null,
                        roomId: roomId,
                    }
                    roomRounds.set(roomId, nextRound)
                    io.to(roomId).emit('roundUpdate', nextRound)
                }
            }
        }
    })

    socket.on('winRound', ({ roomId, playerId }) => {
        if (rooms.has(roomId)) {
            const currentRound = roomRounds.get(roomId)
            const round = {
                id: currentRound ? currentRound.id : 1,
                status: 'completed',
                winnerId: playerId,
                currentTurn: playerId,
            }
            roomRounds.set(roomId, round)
            io.to(roomId).emit('roundUpdate', round)
        }
    })

    socket.on('startTypingGame', ({ roomId }) => {
        if (rooms.has(roomId)) {
            const currentRound = roomRounds.get(roomId)
            if (currentRound && currentRound.status === 'in_progress') {
                const phraseIndex = Math.floor(
                    Math.random() * TYPING_PHRASES.length
                )
                roomPhrases.set(roomId, phraseIndex)

                io.to(roomId).emit('typingGameStarted', { phraseIndex })
            }
        }
    })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
