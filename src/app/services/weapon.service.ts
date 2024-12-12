import { Injectable } from '@angular/core'
import { WeaponInterface } from '../data/weaponInterface'
import { from, map, Observable } from 'rxjs'
import { MessageService } from './message.service'
import {
    collection,
    collectionData,
    Firestore,
    doc,
    docData,
    deleteDoc,
    addDoc,
    updateDoc,
} from '@angular/fire/firestore'

@Injectable({
    providedIn: 'root',
})
export class WeaponService {
    private static url = 'weapons'
    constructor(
        private messageService: MessageService,
        private firestore: Firestore
    ) {}

    getWeapons(): Observable<WeaponInterface[]> {
        const weaponCollection = collection(this.firestore, WeaponService.url)
        return collectionData(weaponCollection, {
            idField: 'id',
        }) as Observable<WeaponInterface[]>
    }

    getWeapon(id: string): Observable<WeaponInterface> {
        const weaponDocRef = doc(this.firestore, `${WeaponService.url}/${id}`)
        return docData(weaponDocRef) as Observable<WeaponInterface>
    }

    deleteWeapon(id: string): Observable<void> {
        const weaponDocRef = doc(this.firestore, `${WeaponService.url}/${id}`)
        return from(deleteDoc(weaponDocRef))
    }

    addWeapon(weapon: WeaponInterface): Observable<void> {
        const weaponCollection = collection(this.firestore, WeaponService.url)
        return from(addDoc(weaponCollection, weapon)).pipe(
            map((docRef) => docRef.id),
            map(() => undefined)
        )
    }

    updateWeapon(weapon: WeaponInterface): Observable<void> {
        const weaponDocRef = doc(
            this.firestore,
            `${WeaponService.url}/${weapon.id}`
        )
        const { id, ...updateData } = weapon
        return from(updateDoc(weaponDocRef, updateData))
    }
}
