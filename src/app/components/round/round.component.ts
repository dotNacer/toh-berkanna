import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RoundInterface } from '../../data/roundInterface'
import { BattleService } from '../../services/battle.service'
import { BattleState } from '../../services/battle.service'
import { TypingGameComponent } from '../typing-game/typing-game.component'

@Component({
    selector: 'app-round',
    standalone: true,
    imports: [CommonModule, TypingGameComponent],
    template: `
        <div class="round-container p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 class="text-lg font-bold mb-2">Manche {{ round.id }}</h3>

            <div class="status-info mb-4">
                <p class="text-gray-700">Statut: {{ getStatusText() }}</p>
                <p *ngIf="round.winnerId" class="text-green-600">
                    Gagnant: {{ getWinnerName() }}
                </p>
            </div>

            <div *ngIf="round.status === 'in_progress' && !round.winnerId">
                <app-typing-game
                    [roomId]="battleState.roomId!"
                    (onComplete)="onGameComplete()"
                ></app-typing-game>
            </div>
        </div>
    `,
})
export class RoundComponent {
    @Input() round!: RoundInterface
    @Input() battleState!: BattleState

    constructor(private battleService: BattleService) {}

    getStatusText(): string {
        switch (this.round.status) {
            case 'waiting':
                return 'En attente'
            case 'in_progress':
                return 'En cours'
            case 'completed':
                return 'Terminée'
            default:
                return ''
        }
    }

    getWinnerName(): string {
        if (!this.round.winnerId) return ''
        return (
            this.battleState.playerNames.get(this.round.winnerId) ||
            'Joueur inconnu'
        )
    }

    onGameComplete() {
        this.battleService.winRound()
    }
}
