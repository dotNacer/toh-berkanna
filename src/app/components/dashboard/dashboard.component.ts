import { NgFor } from '@angular/common'
import { HeroInterface } from './../../data/heroInterface'
import { HeroService } from './../../services/hero.service'
import { Component, OnInit } from '@angular/core'
import { WeaponService } from './../../services/weapon.service'
import { WeaponInterface } from './../../data/weaponInterface'
import { RouterLink } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [RouterLink, NgFor, TranslateModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
    heroes: HeroInterface[] = []
    weapons: WeaponInterface[] = []
    weaponUsageCounts: { [key: string]: number } = {}

    constructor(
        private heroService: HeroService,
        private weaponService: WeaponService
    ) {}

    ngOnInit(): void {
        this.getHeroes()
        this.getWeapons()
    }

    getHeroes(): void {
        this.heroService.getHeroes().subscribe((heroes) => {
            this.heroes = this.sortByPower(heroes).slice(0, 4)
            this.calculateWeaponUsage(heroes)
        })
    }

    getWeapons(): void {
        this.weaponService.getWeapons().subscribe((weapons) => {
            this.weapons = this.sortByUsage(weapons).slice(0, 4)
        })
    }

    calculateHeroPower(hero: HeroInterface): number {
        return hero.attackDamage + hero.criticalChance + hero.dodge + hero.hp
    }

    calculateWeaponPower(weapon: WeaponInterface): number {
        return (
            weapon.attackDamage +
            weapon.criticalChance +
            weapon.dodge +
            weapon.hp
        )
    }

    calculateTotalPower(): number {
        const heroesPower = this.heroes.reduce(
            (total, hero) => total + this.calculateHeroPower(hero),
            0
        )
        const weaponsPower = this.weapons.reduce(
            (total, weapon) => total + this.calculateWeaponPower(weapon),
            0
        )
        return heroesPower + weaponsPower
    }

    calculateWeaponUsage(heroes: HeroInterface[]): void {
        this.weaponUsageCounts = {}
        heroes.forEach((hero) => {
            if (hero.weaponId) {
                this.weaponUsageCounts[hero.weaponId] =
                    (this.weaponUsageCounts[hero.weaponId] || 0) + 1
            }
        })
    }

    getWeaponUsageCount(weaponId: string): number {
        return this.weaponUsageCounts[weaponId] || 0
    }

    private sortByPower<T extends HeroInterface | WeaponInterface>(
        items: T[]
    ): T[] {
        return [...items].sort((a, b) => {
            const powerA = a.attackDamage + a.criticalChance + a.dodge + a.hp
            const powerB = b.attackDamage + b.criticalChance + b.dodge + b.hp
            return powerB - powerA
        })
    }

    private sortByUsage(weapons: WeaponInterface[]): WeaponInterface[] {
        return [...weapons].sort((a, b) => {
            const usageA = this.getWeaponUsageCount(a.id!)
            const usageB = this.getWeaponUsageCount(b.id!)
            return usageB - usageA
        })
    }

    getHighestStat(hero: HeroInterface): string {
        const stats = {
            Attack: hero.attackDamage,
            Critical: hero.criticalChance,
            Dodge: hero.dodge,
            HP: hero.hp,
        }

        const highestStat = Object.entries(stats).reduce((a, b) =>
            b[1] > a[1] ? b : a
        )

        return `${highestStat[0]} (${highestStat[1]})`
    }
}
