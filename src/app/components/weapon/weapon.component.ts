import { Component, OnInit, HostListener } from '@angular/core'
import { WeaponInterface } from '../../data/weaponInterface'
import { RouterLink, Router } from '@angular/router'
import { NgFor, NgIf } from '@angular/common'
import { WeaponService } from '../../services/weapon.service'
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
    FormControl,
} from '@angular/forms'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { TranslateModule } from '@ngx-translate/core'

@Component({
    selector: 'app-weapon',
    standalone: true,
    imports: [
        RouterLink,
        NgFor,
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
    ],
    templateUrl: './weapon.component.html',
    styleUrl: './weapon.component.css',
})
export class WeaponComponent implements OnInit {
    weaponForm: FormGroup
    readonly TOTAL_POINTS = 0
    readonly MIN_STAT_VALUE = -5
    readonly MAX_STAT_VALUE = 5
    isModalOpen = false
    searchControl = new FormControl('')
    filteredWeapons: WeaponInterface[] = []
    displayedWeapons: WeaponInterface[] = []
    showSuggestions = false
    currentSortKey: string = ''
    sortDirection: 'asc' | 'desc' = 'asc'
    isSortDropdownOpen = false

    constructor(
        private weaponService: WeaponService,
        private fb: FormBuilder,
        private router: Router
    ) {
        this.weaponForm = this.fb.group({
            name: ['', Validators.required],
            attackDamage: [
                0,
                [
                    Validators.required,
                    Validators.min(this.MIN_STAT_VALUE),
                    Validators.max(this.MAX_STAT_VALUE),
                ],
            ],
            criticalChance: [
                0,
                [
                    Validators.required,
                    Validators.min(this.MIN_STAT_VALUE),
                    Validators.max(this.MAX_STAT_VALUE),
                ],
            ],
            dodge: [
                0,
                [
                    Validators.required,
                    Validators.min(this.MIN_STAT_VALUE),
                    Validators.max(this.MAX_STAT_VALUE),
                ],
            ],
            hp: [
                0,
                [
                    Validators.required,
                    Validators.min(this.MIN_STAT_VALUE),
                    Validators.max(this.MAX_STAT_VALUE),
                ],
            ],
        })

        const statControls = ['attackDamage', 'criticalChance', 'dodge', 'hp']
        statControls.forEach((stat) => {
            this.weaponForm.get(stat)?.valueChanges.subscribe(() => {
                this.updateStatLimits()
            })
        })

        this.searchControl.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((searchTerm) => {
                this.filterWeapons(searchTerm || '')
            })
    }
    weapons: WeaponInterface[] = []

    ngOnInit(): void {
        this.getWeapons()
    }

    getWeapons(): void {
        this.weaponService.getWeapons().subscribe((weapons) => {
            this.weapons = weapons
            this.displayedWeapons = weapons
        })
    }

    openModal() {
        this.isModalOpen = true
    }

    closeModal() {
        this.isModalOpen = false
    }

    addWeapon(): void {
        if (this.weaponForm.valid) {
            const newWeapon = this.weaponForm.value
            this.weaponService.addWeapon(newWeapon).subscribe()
            this.closeModal() // Close the modal after adding the weapon
        }
    }

    calculateTotalPoints(): number {
        const { attackDamage, criticalChance, dodge, hp } =
            this.weaponForm.value
        return attackDamage + criticalChance + dodge + hp
    }

    updateStatLimits(): void {
        const currentTotal = this.calculateTotalPoints()
        const remainingPoints =
            this.TOTAL_POINTS -
            Object.values(currentTotal).reduce((sum, value) => sum + value, 0)
        const statControls = ['attackDamage', 'criticalChance', 'dodge', 'hp']
        statControls.forEach((stat) => {
            const control = this.weaponForm.get(stat) as FormControl
            const currentValue = control.value
            const minValue = Math.max(
                this.MIN_STAT_VALUE,
                currentValue - remainingPoints
            )
            const maxValue = Math.min(
                this.MAX_STAT_VALUE,
                currentValue + remainingPoints
            )

            control.setValidators([
                Validators.required,
                Validators.min(minValue),
                Validators.max(maxValue),
            ])
            control.updateValueAndValidity({ emitEvent: false })
        })
    }

    getRemainingPoints(): number {
        return this.TOTAL_POINTS - this.calculateTotalPoints()
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        if (!(event.target as HTMLElement).closest('.relative')) {
            this.showSuggestions = false
        }

        if (!(event.target as HTMLElement).closest('.relative')) {
            this.isSortDropdownOpen = false
        }
    }

    filterWeapons(searchTerm: string) {
        searchTerm = searchTerm.toLowerCase()
        this.filteredWeapons = this.weapons.filter((weapon) =>
            weapon.name.toLowerCase().includes(searchTerm)
        )
        this.displayedWeapons = searchTerm ? this.filteredWeapons : this.weapons

        if (this.currentSortKey) {
            this.sortWeapons({ target: { value: this.currentSortKey } } as any)
        }
    }

    selectWeapon(weapon: WeaponInterface) {
        this.router.navigate(['/weapons', weapon.id])
        this.showSuggestions = false
    }

    toggleSortDropdown(): void {
        this.isSortDropdownOpen = !this.isSortDropdownOpen
    }

    getSortLabel(key: string): string {
        const labels: { [key: string]: string } = {
            name: 'Name',
            attackDamage: 'Attack Damage',
            criticalChance: 'Critical Chance',
            dodge: 'Dodge',
            hp: 'HP',
        }
        return labels[key] || key
    }

    sortWeapons(sortKey: string): void {
        if (this.currentSortKey === sortKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
        } else {
            this.currentSortKey = sortKey
            this.sortDirection = 'asc'
        }

        this.displayedWeapons.sort((a, b) => {
            let comparison = 0

            if (sortKey === 'name') {
                comparison = a.name.localeCompare(b.name)
            } else {
                comparison =
                    (a[sortKey as keyof WeaponInterface] as number) -
                    (b[sortKey as keyof WeaponInterface] as number)
            }

            return this.sortDirection === 'asc' ? comparison : -comparison
        })

        this.isSortDropdownOpen = false
    }
}
