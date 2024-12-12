import { Component, Input, OnInit } from '@angular/core'
import { WeaponInterface } from '../../data/weaponInterface'
import { WeaponService } from '../../services/weapon.service'
import { NgIf, NgFor, UpperCasePipe, Location } from '@angular/common'
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
    FormControl,
} from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { HeroService } from '../../services/hero.service'
import { HeroInterface } from '../../data/heroInterface'
import { RouterLink } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

@Component({
    selector: 'app-weapon-detail',
    standalone: true,
    imports: [
        NgIf,
        NgFor,
        UpperCasePipe,
        FormsModule,
        ReactiveFormsModule,
        RouterLink,
        TranslateModule,
    ],
    templateUrl: './weapon-detail.component.html',
    styleUrl: './weapon-detail.component.css',
})
export class WeaponDetailComponent implements OnInit {
    weaponForm: FormGroup
    @Input() weapon?: WeaponInterface
    editMenuOpened: boolean = false
    readonly TOTAL_POINTS = 0
    readonly MIN_STAT_VALUE = -5
    readonly MAX_STAT_VALUE = 5
    heroesUsingWeapon: HeroInterface[] = []

    constructor(
        private route: ActivatedRoute,
        private weaponService: WeaponService,
        private heroService: HeroService,
        private location: Location,
        private fb: FormBuilder
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
    }

    ngOnInit(): void {
        this.getWeapon()
        this.getHeroesUsingWeapon()
        const statControls = ['attackDamage', 'criticalChance', 'dodge', 'hp']
        statControls.forEach((stat) => {
            this.weaponForm.get(stat)?.valueChanges.subscribe(() => {
                this.updateStatLimits()
            })
        })
    }

    getWeapon(): void {
        const id = String(this.route.snapshot.paramMap.get('id'))
        this.weaponService.getWeapon(id).subscribe((weapon) => {
            this.weapon = weapon
            if (weapon) {
                this.weaponForm.patchValue(weapon)
                this.updateStatLimits()
            }
        })
    }

    goBack(): void {
        this.location.back()
    }

    deleteWeapon(): void {
        const id = String(this.route.snapshot.paramMap.get('id'))
        this.weaponService.deleteWeapon(id).subscribe(() => {
            this.goBack()
        })
    }

    editWeapon(): void {
        if (
            !this.weapon ||
            !this.weaponForm.valid ||
            this.getRemainingPoints() !== 0
        )
            return
        const id = String(this.route.snapshot.paramMap.get('id'))
        const updatedWeapon: WeaponInterface = {
            ...this.weaponForm.value,
            id: id,
        }

        this.weaponService.updateWeapon(updatedWeapon).subscribe(() => {
            this.editMenuOpened = false
            this.getWeapon() // Refresh weapon data
        })
    }

    updateStatLimits(): void {
        const currentTotal = this.calculateTotalPoints()
        const remainingPoints = this.TOTAL_POINTS - currentTotal
        const statControls = ['attackDamage', 'criticalChance', 'dodge', 'hp']

        statControls.forEach((stat) => {
            const control = this.weaponForm.get(stat) as FormControl
            const currentValue = control.value || 0

            const minValue = Math.max(
                this.MIN_STAT_VALUE,
                currentValue - Math.abs(remainingPoints)
            )
            const maxValue = Math.min(
                this.MAX_STAT_VALUE,
                currentValue + Math.abs(remainingPoints)
            )

            control.setValidators([
                Validators.required,
                Validators.min(minValue),
                Validators.max(maxValue),
            ])
            control.updateValueAndValidity({ emitEvent: false })
        })
    }

    calculateTotalPoints(): number {
        const { attackDamage, criticalChance, dodge, hp } =
            this.weaponForm.value
        return attackDamage + criticalChance + dodge + hp
    }

    getRemainingPoints(): number {
        return this.TOTAL_POINTS - this.calculateTotalPoints()
    }

    getHeroesUsingWeapon(): void {
        const weaponId = String(this.route.snapshot.paramMap.get('id'))
        this.heroService.getHeroes().subscribe((heroes) => {
            this.heroesUsingWeapon = heroes.filter(
                (hero) => hero.weaponId === weaponId
            )
        })
    }
}
