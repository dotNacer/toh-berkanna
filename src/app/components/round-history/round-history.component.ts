import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BattleState } from '../../services/battle.service'
import { TranslateModule } from '@ngx-translate/core'

@Component({
    selector: 'app-round-history',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './round-history.component.html',
})
export class RoundHistoryComponent {
    @Input() battleState!: BattleState
    @Input() currentPlayerId!: string

    roundLogs: { roundId: number; winnerId: string }[] = []

    ngOnChanges() {
        const currentRound = this.battleState.currentRound
        if (currentRound?.status === 'completed' && currentRound.winnerId) {
            const existingLog = this.roundLogs.find(
                (log) => log.roundId === currentRound.id
            )
            if (!existingLog) {
                this.roundLogs.push({
                    roundId: currentRound.id,
                    winnerId: currentRound.winnerId,
                })
            }
        }
    }

    getWinnerName(winnerId: string): string {
        return this.battleState.playerNames.get(winnerId) || 'Joueur inconnu'
    }
}
