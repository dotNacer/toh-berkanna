import { Component, Input, Output, EventEmitter } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HeroInterface } from '../../data/heroInterface'

@Component({
    selector: 'app-hero-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './hero-card.component.html',
})
export class HeroCardComponent {
    @Input() hero!: HeroInterface
    @Input() isSelectable: boolean = true
    @Output() onSelect = new EventEmitter<HeroInterface>()
}
