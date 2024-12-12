import { HeroesComponent } from './components/heroes/heroes.component'
import { DashboardComponent } from './components/dashboard/dashboard.component'
import { Routes } from '@angular/router'
import { HeroDetailComponent } from './components/hero-detail/hero-detail.component'
import { WeaponComponent } from './components/weapon/weapon.component'
import { WeaponDetailComponent } from './components/weapon-detail/weapon-detail.component'
import { BattleComponent } from './components/battle/battle.component'
import { LobbyComponent } from './components/lobby/lobby.component'

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'heroes', component: HeroesComponent },
    { path: 'heroes/:id', component: HeroDetailComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'weapons', component: WeaponComponent },
    { path: 'weapons/:id', component: WeaponDetailComponent },
    { path: 'battle/:id', component: BattleComponent },
    { path: 'lobby', component: LobbyComponent },
]
