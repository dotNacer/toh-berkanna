import { Component, Input, OnInit } from '@angular/core'
import { HeroInterface } from '../../data/heroInterface'
import { HeroService } from '../../services/hero.service'
import { WeaponService } from '../../services/weapon.service'
import { WeaponInterface } from '../../data/weaponInterface'
import { NgIf, NgFor, UpperCasePipe } from '@angular/common'
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
    FormControl,
} from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { Location } from '@angular/common'
import { MessageService } from '../../services/message.service'
import { TranslateModule } from '@ngx-translate/core'

@Component({
    selector: 'app-hero-detail',
    standalone: true,
    imports: [
        NgIf,
        NgFor,
        UpperCasePipe,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
    ],
    templateUrl: './hero-detail.component.html',
    styleUrl: './hero-detail.component.css',
})
export class HeroDetailComponent implements OnInit {
    heroForm: FormGroup
    @Input() hero?: HeroInterface
    editMenuOpened: boolean = false
    readonly MAX_TOTAL_POINTS = 40
    weapons: WeaponInterface[] = []
    selectedWeapon?: WeaponInterface

    constructor(
        private route: ActivatedRoute,
        private heroService: HeroService,
        private weaponService: WeaponService,
        private location: Location,
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.heroForm = this.fb.group({
            name: ['', Validators.required],
            surname: ['', Validators.required],
            attackDamage: [0, [Validators.required, Validators.min(0)]],
            criticalChance: [0, [Validators.required, Validators.min(0)]],
            dodge: [0, [Validators.required, Validators.min(0)]],
            hp: [0, [Validators.required, Validators.min(0)]],
            weaponId: [''],
        })
    }

    ngOnInit(): void {
        this.getHero()
        this.loadWeapons()
        const statControls = ['attackDamage', 'criticalChance', 'dodge', 'hp']
        statControls.forEach((stat) => {
            this.heroForm.get(stat)?.valueChanges.subscribe((value) => {
                this.updateStatLimits(stat, value)
            })
        })
    }

    getHero(): void {
        const id = String(this.route.snapshot.paramMap.get('id'))
        this.heroService.getHero(id).subscribe((hero) => {
            if (hero) {
                this.hero = {
                    id,
                    name: hero.name,
                    surname: hero.surname,
                    attackDamage: hero.attackDamage,
                    criticalChance: hero.criticalChance,
                    dodge: hero.dodge,
                    hp: hero.hp,
                    weaponId: hero.weaponId,
                }
                console.log(this.hero)
                this.heroForm.patchValue(hero)
                if (hero.weaponId) {
                    this.loadSelectedWeapon(hero.weaponId)
                } else {
                    this.selectedWeapon = undefined
                }
                this.updateAllStatLimits()
            }
        })
    }

    loadSelectedWeapon(weaponId: string): void {
        this.weaponService.getWeapon(weaponId).subscribe((weapon) => {
            this.selectedWeapon = weapon
        })
    }

    goBack(): void {
        this.location.back()
    }

    deleteHero(): void {
        const id = String(this.route.snapshot.paramMap.get('id'))
        this.heroService.deleteHero(id).subscribe(() => {
            this.goBack()
        })
    }

    editHero(): void {
        if (!this.hero || !this.heroForm.valid) return

        if (this.calculateTotalPoints() !== this.MAX_TOTAL_POINTS) {
            this.messageService.add(
                'Le total des points doit être exactement ' +
                    this.MAX_TOTAL_POINTS
            )
            return
        }

        const id = String(this.route.snapshot.paramMap.get('id'))
        const updatedHero: Omit<HeroInterface, 'id'> = {
            ...this.heroForm.value,
            weaponId: this.hero.weaponId,
        }

        this.heroService.editHero(id, updatedHero).subscribe(() => {
            this.messageService.add('Hero updated successfully')
            this.editMenuOpened = false
            this.getHero()
        })
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

        this.updateAllStatLimits()
    }

    updateAllStatLimits(): void {
        const statControls = ['attackDamage', 'criticalChance', 'dodge', 'hp']
        const currentTotal = this.calculateTotalPoints()
        const remainingPoints = this.MAX_TOTAL_POINTS - currentTotal

        statControls.forEach((stat) => {
            const control = this.heroForm.get(stat) as FormControl
            const currentValue = control.value || 0
            const maxAllowed = currentValue + remainingPoints

            control.setValidators([
                Validators.required,
                Validators.min(0),
                Validators.max(maxAllowed),
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

    loadWeapons(): void {
        this.weaponService.getWeapons().subscribe((weapons) => {
            this.weapons = weapons
        })
    }

    calculateTotalStats(): {
        attackDamage: number
        criticalChance: number
        dodge: number
        hp: number
    } {
        if (!this.hero)
            return {
                attackDamage: 0,
                criticalChance: 0,
                dodge: 0,
                hp: 0,
            }

        const baseStats = {
            attackDamage: this.hero.attackDamage,
            criticalChance: this.hero.criticalChance,
            dodge: this.hero.dodge,
            hp: this.hero.hp,
        }

        if (this.selectedWeapon) {
            baseStats.attackDamage = Math.max(
                1,
                baseStats.attackDamage + this.selectedWeapon.attackDamage
            )
            baseStats.criticalChance = Math.max(
                1,
                baseStats.criticalChance + this.selectedWeapon.criticalChance
            )
            baseStats.dodge = Math.max(
                1,
                baseStats.dodge + this.selectedWeapon.dodge
            )
            baseStats.hp = Math.max(1, baseStats.hp + this.selectedWeapon.hp)
        }

        return baseStats
    }

    equipWeapon(weapon: WeaponInterface | null): void {
        if (!this.hero) return

        const wouldHaveNegativeStats =
            weapon &&
            Object.entries({
                attackDamage: this.hero.attackDamage + weapon.attackDamage,
                criticalChance:
                    this.hero.criticalChance + weapon.criticalChance,
                dodge: this.hero.dodge + weapon.dodge,
                hp: this.hero.hp + weapon.hp,
            }).some(([_, value]) => value < 1)

        if (wouldHaveNegativeStats) {
            console.log(
                'Cette arme ne peut pas être équipée car elle réduirait certaines statistiques en dessous de 1'
            )
            this.messageService.add(
                'Cette arme ne peut pas être équipée car elle réduirait certaines statistiques en dessous de 1'
            )
            return
        }

        const updatedHero = {
            ...this.heroForm.value,
            weaponId: weapon?.id || null,
        }

        const id = String(this.route.snapshot.paramMap.get('id'))
        this.heroService.editHero(id, updatedHero).subscribe(() => {
            this.selectedWeapon = weapon || undefined
            this.getHero()
        })
    }
}
