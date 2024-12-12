import {
    Component,
    OnInit,
    OnDestroy,
    Output,
    EventEmitter,
    Input,
    ViewChild,
    ElementRef,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TypingPhrase } from '../../data/typingPhraseInterface'
import { TYPING_PHRASES } from '../../data/typing-phrases'
import { BattleService } from '../../services/battle.service'
import { Subscription } from 'rxjs'

@Component({
    selector: 'app-typing-game',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './typing-game.component.html',
})
export class TypingGameComponent implements OnInit, OnDestroy {
    @Output() onComplete = new EventEmitter<void>()
    @Input() roomId!: string
    @ViewChild('inputField') inputField!: ElementRef<HTMLInputElement>

    currentPhrase!: TypingPhrase
    userInput: string = ''
    hasError: boolean = false
    isGameComplete: boolean = false
    isGameStarted: boolean = false
    private subscription: Subscription = new Subscription()

    constructor(private battleService: BattleService) {}

    ngOnInit() {
        this.isGameComplete = false
        this.userInput = ''

        // S'abonner aux événements du jeu
        this.subscription.add(
            this.battleService.getTypingGameEvents().subscribe((event) => {
                if (event.type === 'gameStarted') {
                    this.currentPhrase = TYPING_PHRASES[event.phraseIndex]
                    this.isGameStarted = true
                    // Focus l'input après un court délai pour s'assurer que le DOM est prêt
                    setTimeout(() => {
                        this.inputField?.nativeElement?.focus()
                    }, 0)
                }
            })
        )

        // Démarrer le jeu
        this.battleService.startTypingGame(this.roomId)
    }

    ngOnDestroy() {
        this.subscription.unsubscribe()
    }

    onInput() {
        if (!this.isGameStarted) return

        const targetText = this.currentPhrase.text
        const currentInput = this.userInput

        if (!targetText.startsWith(currentInput)) {
            this.hasError = true
            return
        }

        this.hasError = false

        if (currentInput === targetText) {
            this.isGameComplete = true
            this.onComplete.emit()
        }
    }
}
