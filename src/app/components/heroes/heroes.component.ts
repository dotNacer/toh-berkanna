import { HeroService } from './../../services/hero.service'
import { HeroInterface } from './../../data/heroInterface'
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core'
import { NgFor, NgIf, UpperCasePipe, TitleCasePipe } from '@angular/common'
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
    FormControl,
} from '@angular/forms'
import { HeroDetailComponent } from '../hero-detail/hero-detail.component'
import { MessageService } from '../../services/message.service'
import { RouterLink, Router } from '@angular/router'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { TranslateModule } from '@ngx-translate/core'

@Component({
    selector: 'app-heroes',
    standalone: true,
    imports: [
        UpperCasePipe,
        FormsModule,
        NgFor,
        NgIf,
        HeroDetailComponent,
        RouterLink,
        ReactiveFormsModule,
        TranslateModule,
    ],
    templateUrl: './heroes.component.html',
    styleUrl: './heroes.component.css',
})
export class HeroesComponent implements OnInit, OnDestroy {
    heroForm: FormGroup

    readonly MAX_TOTAL_POINTS = 40

    searchControl = new FormControl('')
    filteredHeroes: HeroInterface[] = []
    displayedHeroes: HeroInterface[] = []
    showSuggestions = false
    currentSortKey: string = ''
    sortDirection: 'asc' | 'desc' = 'asc'
    isSortDropdownOpen = false

    constructor(
        private heroService: HeroService,
        private messageService: MessageService,
        private fb: FormBuilder,
        private router: Router
    ) {
        this.heroForm = this.fb.group({
            name: ['', Validators.required],
            surname: ['', Validators.required],
            attackDamage: [1, [Validators.required, Validators.min(1)]],
            criticalChance: [1, [Validators.required, Validators.min(1)]],
            dodge: [1, [Validators.required, Validators.min(1)]],
            hp: [1, [Validators.required, Validators.min(1)]],
        })

        const statControls = ['attackDamage', 'criticalChance', 'dodge', 'hp']
        statControls.forEach((stat) => {
            this.heroForm.get(stat)?.valueChanges.subscribe((value) => {
                this.updateStatLimits(stat, value)
            })
        })

        this.searchControl.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((searchTerm) => {
                this.filterHeroes(searchTerm || '')
            })
    }

    addMenuOpened: boolean = false

    heroes: HeroInterface[] = []
    selectedHero?: HeroInterface
    private heroesSubscription: any

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        if (!(event.target as HTMLElement).closest('.relative')) {
            this.showSuggestions = false
            this.isSortDropdownOpen = false
        }
    }

    filterHeroes(searchTerm: string) {
        searchTerm = searchTerm.toLowerCase()
        this.filteredHeroes = this.heroes.filter(
            (hero) =>
                hero.name.toLowerCase().includes(searchTerm) ||
                hero.surname.toLowerCase().includes(searchTerm)
        )
        this.displayedHeroes = searchTerm ? this.filteredHeroes : this.heroes

        if (this.currentSortKey) {
            this.sortHeroes(this.currentSortKey)
        }
    }

    selectHero(hero: HeroInterface) {
        this.router.navigate(['/heroes', hero.id])
        this.showSuggestions = false
    }

    toggleSortDropdown(): void {
        this.isSortDropdownOpen = !this.isSortDropdownOpen
    }

    getSortLabel(key: string): string {
        const labels: { [key: string]: string } = {
            name: 'Name',
            surname: 'Nickname',
            attackDamage: 'Attack Damage',
            criticalChance: 'Critical Chance',
            dodge: 'Dodge',
            hp: 'HP',
        }
        return labels[key] || key
    }

    sortHeroes(sortKey: string): void {
        if (this.currentSortKey === sortKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
        } else {
            this.currentSortKey = sortKey
            this.sortDirection = 'asc'
        }

        this.displayedHeroes.sort((a, b) => {
            let comparison = 0

            if (sortKey === 'name' || sortKey === 'surname') {
                comparison = a[sortKey].localeCompare(b[sortKey])
            } else {
                comparison =
                    (a[sortKey as keyof HeroInterface] as number) -
                    (b[sortKey as keyof HeroInterface] as number)
            }

            return this.sortDirection === 'asc' ? comparison : -comparison
        })

        this.isSortDropdownOpen = false
    }

    ngOnInit(): void {
        this.heroesSubscription = this.heroService
            .getHeroes()
            .subscribe((heroes) => {
                this.heroes = heroes
                this.displayedHeroes = heroes
            })
    }

    ngOnDestroy(): void {
        if (this.heroesSubscription) {
            this.heroesSubscription.unsubscribe()
        }
    }

    updateStatLimits(changedStat: string, newValue: number): void {
        const otherStats = [
            'attackDamage',
            'criticalChance',
            'dodge',
            'hp',
        ].filter((stat) => stat !== changedStat)
        const otherStatsTotal = otherStats.reduce(
            (total, stat) => total + (this.heroForm.get(stat)?.value || 0),
            0
        )

        const maxAllowedForChangedStat = this.MAX_TOTAL_POINTS - otherStatsTotal
        const adjustedValue = Math.min(
            Math.max(0, newValue),
            maxAllowedForChangedStat
        )

        this.heroForm
            .get(changedStat)
            ?.setValue(adjustedValue, { emitEvent: false })

        otherStats.forEach((stat) => {
            const control = this.heroForm.get(stat) as FormControl
            const currentValue = control.value || 0
            const remainingPoints =
                this.MAX_TOTAL_POINTS -
                this.calculateTotalPoints() +
                currentValue

            control.setValidators([
                Validators.required,
                Validators.min(0),
                Validators.max(remainingPoints),
            ])
            control.updateValueAndValidity({ emitEvent: false })
        })
    }

    calculateTotalPoints(): number {
        const { attackDamage, criticalChance, dodge, hp } = this.heroForm.value
        return (
            (attackDamage || 0) +
            (criticalChance || 0) +
            (dodge || 0) +
            (hp || 0)
        )
    }

    getHeroes(): void {
        this.heroService
            .getHeroes()
            .subscribe((heroes) => (this.heroes = heroes))
    }

    deleteHero(hero: HeroInterface): void {
        this.heroes = this.heroes.filter((h) => h.id !== hero.id)
        this.heroService.deleteHero(hero.id).subscribe()
    }

    addHero(): void {
        if (this.heroForm.valid) {
            const newHero = this.heroForm.value

            this.heroService.addHero(newHero).subscribe(
                () => {
                    this.messageService.add(`Added new hero`)
                    this.getHeroes() // Refresh the hero list
                    this.heroForm.reset()
                    this.addMenuOpened = false
                },
                (error) => {
                    this.messageService.add(`Error adding hero: ${error}`)
                }
            )
        }
    }
}
