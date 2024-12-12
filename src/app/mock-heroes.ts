import { HeroInterface } from './data/heroInterface'
import { WEAPONS } from './mock-weapons'
export const HEROES: HeroInterface[] = [
    {
        id: 12,
        name: 'Draven',
        surname: 'The Glorious Executioner',
        stats: {
            attackDamage: 1,
            attackSpeed: 1,
            dodge: 1,
            hp: 1,
        },
        weapon: WEAPONS[0],
    },
    {
        id: 13,
        name: 'Lee Sin',
        surname: 'The Blind Monk',
        stats: {
            attackDamage: 10,
            attackSpeed: 10,
            dodge: 10,
            hp: 10,
        },
        weapon: WEAPONS[1],
    },
    {
        id: 14,
        name: 'Yasuo',
        surname: 'The Unforgiven',
        stats: {
            attackDamage: 10,
            attackSpeed: 10,
            dodge: 10,
            hp: 10,
        },
        weapon: WEAPONS[2],
    },
    {
        id: 18,
        name: 'Malphite',
        surname: 'Rock solid',
        stats: {
            attackDamage: 10,
            attackSpeed: 10,
            dodge: 10,
            hp: 10,
        },
        weapon: WEAPONS[3],
    },
]
