import { WeaponInterface } from './data/weaponInterface'

// Max 5 et min -5
export const WEAPONS: WeaponInterface[] = [
    {
        id: 1,
        name: 'Infinity Edge',
        stats: {
            attackDamage: 5,
            attackSpeed: 0,
            dodge: 0,
            hp: 0,
        },
        type: 'Melee',
    },
    {
        id: 2,
        name: 'Bow',
        stats: {
            attackDamage: 5,
            attackSpeed: -5,
            dodge: 5,
            hp: -5,
        },
        type: 'Ranged',
    },
    {
        id: 3,
        name: 'Axe',
        stats: {
            attackDamage: 5,
            attackSpeed: -5,
            dodge: 5,
            hp: -5,
        },
        type: 'Melee',
    },
    {
        id: 4,
        name: 'Crossbow',
        stats: {
            attackDamage: 5,
            attackSpeed: -5,
            dodge: 5,
            hp: -5,
        },
        type: 'Ranged',
    },
]
