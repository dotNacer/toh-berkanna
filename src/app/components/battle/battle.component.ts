import { HeroService } from './../../services/hero.service'
import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BattleService, BattleState } from '../../services/battle.service'
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { HeroInterface } from '../../data/heroInterface'
import { HeroCardComponent } from '../hero-card/hero-card.component'
import { RoundComponent } from '../round/round.component'
import { RoundHistoryComponent } from '../round-history/round-history.component'
import { TranslateModule } from '@ngx-translate/core'
@Component({
    selector: 'app-battle',
    standalone: true,
    imports: [
        CommonModule,
        HeroCardComponent,
        RoundComponent,
        RoundHistoryComponent,
        TranslateModule,
    ],
    templateUrl: './battle.component.html',
    styleUrl: './battle.component.css',
})
export class BattleComponent implements OnInit, OnDestroy {
    heroes: HeroInterface[] = []
    battleState!: BattleState
    selectedHero: HeroInterface | null = null
    private subscription: Subscription = new Subscription()
    isPlayerReady: boolean = false
    battleEvents: {
        message: string
        type: 'dodge' | 'hit' | 'critical'
        isCurrentPlayer: boolean
    }[] = []
    private readonly EVENT_DURATION = 3000 // 3 secondes

    constructor(
        private battleService: BattleService,
        private router: Router,
        private route: ActivatedRoute,
        private heroService: HeroService
    ) {}

    ngOnInit(): void {
        this.subscription.add(
            this.battleService.getBattleState().subscribe((state) => {
                this.battleState = state
                this.isPlayerReady = state.readyPlayers.has(
                    this.battleService.getPlayerId()
                )
                if (!state.roomId) {
                    this.router.navigate(['/lobby'])
                }
            })
        )
        this.heroService.getHeroes().subscribe((heroes) => {
            this.heroes = heroes
        })
        this.subscription.add(
            this.battleService.getBattleEvents().subscribe((event) => {
                const isCurrentPlayer = event.targetId === this.getPlayerId()
                let message = ''

                switch (event.type) {
                    case 'dodge':
                        message = `${this.battleState.playerNames.get(
                            event.targetId
                        )} a esquivé l'attaque! (${
                            event.dodgeChance
                        }% de chance)`
                        break
                    case 'critical':
                        message = `${this.battleState.playerNames.get(
                            event.targetId
                        )} a reçu un coup critique de ${
                            event.damage
                        } points de dégâts! (${event.critChance}% de chance)`
                        break
                    case 'hit':
                        message = `${this.battleState.playerNames.get(
                            event.targetId
                        )} a reçu ${event.damage} points de dégâts!`
                        break
                }

                this.battleEvents.push({
                    message,
                    type: event.type,
                    isCurrentPlayer,
                })

                setTimeout(() => {
                    this.battleEvents = this.battleEvents.filter(
                        (e) => e.message !== message
                    )
                }, this.EVENT_DURATION)
            })
        )
    }

    ngOnDestroy(): void {
        this.battleService.leaveRoom()
        this.subscription.unsubscribe()
    }

    selectHero(hero: HeroInterface): void {
        this.selectedHero = hero
        this.battleService.selectHero(hero)
    }

    leaveRoom(): void {
        this.battleService.leaveRoom()
    }

    setReady(): void {
        if (this.selectedHero) {
            this.isPlayerReady = true
            this.battleService.setReady()
        }
    }

    public getPlayerId(): string {
        return this.battleService.getPlayerId()
    }

    public attackPlayer(playerId: string): void {
        this.battleService.attackPlayer(playerId)
    }

    canAttack(targetId: string): boolean {
        const round = this.battleState.currentRound
        if (!round || round.status !== 'completed') return false
        return round.winnerId === this.getPlayerId()
    }
}
