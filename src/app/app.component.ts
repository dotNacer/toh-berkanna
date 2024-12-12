import { Component, HostListener } from '@angular/core'
import { RouterOutlet, RouterLink, Router } from '@angular/router'
import { HeroesComponent } from './components/heroes/heroes.component'
import { MessagesComponent } from './components/messages/messages.component'
import { NgIf, NgFor, UpperCasePipe } from '@angular/common'
import { NavigationEnd } from '@angular/router'
import { TranslateService, TranslateModule } from '@ngx-translate/core'

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
        MessagesComponent,
        NgIf,
        TranslateModule,
        NgFor,
        UpperCasePipe,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
})
export class AppComponent {
    enableMessages = false
    currentRoute: string = ''
    isMenuOpen = false
    isDesktop = window.innerWidth >= 768 // md breakpoint
    currentLang = 'fr'
    isLanguageDropdownOpen = false
    availableLanguages = [
        { code: 'fr', name: 'Français' },
        { code: 'en', name: 'English' },
        { code: 'cn', name: '中文' },
        { code: 'ru', name: 'Русский' },
    ]

    constructor(private router: Router, private translate: TranslateService) {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.currentRoute = event.url.split('/')[1] || ''
                this.isMenuOpen = false
            }
        })

        // Initialisation de la traduction
        translate.setDefaultLang('fr')
        translate.use('fr')

        // Initialisation de la langue
        this.currentLang = translate.currentLang || 'fr'
    }

    toggleLanguageDropdown() {
        this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen
    }

    switchLanguage(lang: string) {
        this.currentLang = lang
        this.translate.use(lang)
        this.isLanguageDropdownOpen = false
    }

    // Ajoutez un gestionnaire de clic pour fermer le dropdown quand on clique ailleurs
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        // Vérifier si le clic est sur le bouton de langue ou dans le dropdown
        const target = event.target as HTMLElement

        // Si le clic est sur le bouton de langue, ne rien faire (toggleLanguageDropdown s'en occupe)
        if (
            target.closest('button') &&
            target.closest('button')?.contains(target)
        ) {
            return
        }

        // Si le clic est en dehors du dropdown, le fermer
        if (!target.closest('.language-dropdown')) {
            this.isLanguageDropdownOpen = false
        }
    }

    @HostListener('window:resize')
    onResize() {
        this.isDesktop = window.innerWidth >= 768
        if (this.isDesktop) {
            this.isMenuOpen = true
        }
    }

    toggleMessages() {
        this.enableMessages = !this.enableMessages
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen
    }

    closeMenuOnMobile() {
        if (!this.isDesktop) {
            this.isMenuOpen = false
        }
    }

    title = 'Nacer Berkane ToH2024'
}
