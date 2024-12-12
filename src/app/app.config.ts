import {
    ApplicationConfig,
    importProvidersFrom,
    provideZoneChangeDetection,
} from '@angular/core'
import { provideRouter } from '@angular/router'
import { routes } from './app-routing.module'
import {
    HttpClient,
    HttpClientModule,
    provideHttpClient,
} from '@angular/common/http'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { initializeApp, provideFirebaseApp } from '@angular/fire/app'
import { getFirestore, provideFirestore } from '@angular/fire/firestore'

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json')
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(),
        importProvidersFrom(
            HttpClientModule,
            TranslateModule.forRoot({
                defaultLanguage: 'fr',
                loader: {
                    provide: TranslateLoader,
                    useFactory: HttpLoaderFactory,
                    deps: [HttpClient],
                },
            })
        ),
        provideFirebaseApp(() =>
            initializeApp({
                projectId: 'toh-2024-berkane',
                appId: '1:773865526496:web:b2ac25c989a405f7f5ec85',
                storageBucket: 'toh-2024-berkane.appspot.com',
                apiKey: 'AIzaSyD10hMmFGPFGz4O1v1XjpjYaB01ebOLiqs',
                authDomain: 'toh-2024-berkane.firebaseapp.com',
                messagingSenderId: '773865526496',
            })
        ),
        provideFirestore(() => getFirestore()),
    ],
}
