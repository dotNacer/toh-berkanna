import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BattleState, BattleEvent } from '../../services/battle.service'
import { TranslateModule } from '@ngx-translate/core'
@Component({
    selector: 'app-battle-events',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
        <div class="battle-events p-4 bg-gray-100 rounded-lg mt-4">
            <div *ngFor="let event of battleEvents" class="mb-2">
                <div
                    [ngClass]="{
                        'text-green-600': event.type === 'dodge',
                        'text-red-600': event.type === 'hit'
                    }"
                >
                    <span *ngIf="event.type === 'dodge'">
                        {{ getPlayerName(event.targetId) }}
                        {{ 'EVENTS.DODGE' | translate }}
                        {{ getPlayerName(event.attackerId) }}! ({{
                            event.dodgeChance
                        }}% chance)
                    </span>
                    <span *ngIf="event.type === 'hit'">
                        {{ getPlayerName(event.targetId) }}
                        {{ 'EVENTS.HIT' | translate }}
                        {{ event.damage }}
                        {{ 'EVENTS.DAMAGE' | translate }}
                        {{ getPlayerName(event.attackerId) }}
                    </span>
                </div>
            </div>
        </div>
    `,
    styleUrl: './battle-events.component.css',
})
export class BattleEventsComponent {
    @Input() battleState!: BattleState
    battleEvents: BattleEvent[] = []

    getPlayerName(playerId: string): string {
        return this.battleState.playerNames.get(playerId) || 'Joueur inconnu'
    }
}
