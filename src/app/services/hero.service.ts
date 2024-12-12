import { Injectable } from '@angular/core'
import { HeroInterface } from '../data/heroInterface'
import { Observable, from } from 'rxjs'
import { MessageService } from './message.service'
import { map, mergeMap } from 'rxjs/operators'
import {
    Firestore,
    collection,
    collectionData,
    doc,
    docData,
    deleteDoc,
    addDoc,
    updateDoc,
} from '@angular/fire/firestore'
@Injectable({
    providedIn: 'root',
})
export class HeroService {
    private static url = 'heroes'
    constructor(
        private messageService: MessageService,
        private firestore: Firestore
    ) {}

    getHeroes(): Observable<HeroInterface[]> {
        const heroCollection = collection(this.firestore, HeroService.url)
        return collectionData(heroCollection, { idField: 'id' }) as Observable<
            HeroInterface[]
        >
    }

    getHero(id: string): Observable<HeroInterface | undefined> {
        const heroDocRef = doc(this.firestore, `${HeroService.url}/${id}`)
        return docData(heroDocRef) as Observable<HeroInterface | undefined>
    }

    addHero(hero: Omit<HeroInterface, 'id'>): Observable<void> {
        const heroCollection = collection(this.firestore, HeroService.url)
        return from(addDoc(heroCollection, hero)).pipe(
            map((docRef) => {
                const heroWithId = { ...hero, id: docRef.id }
                return from(updateDoc(docRef, heroWithId))
            }),
            mergeMap((observable) => observable)
        )
    }

    deleteHero(id: string): Observable<void> {
        const heroDocRef = doc(this.firestore, `${HeroService.url}/${id}`)
        return from(deleteDoc(heroDocRef))
    }

    editHero(id: string, hero: Omit<HeroInterface, 'id'>): Observable<void> {
        const heroDocRef = doc(this.firestore, `${HeroService.url}/${id}`)
        const sanitizedHero = Object.fromEntries(
            Object.entries(hero).map(([key, value]) => [key, value ?? null])
        )
        return from(updateDoc(heroDocRef, sanitizedHero))
    }
}
