import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { BattleService, BattleState } from '../../services/battle.service'
import { Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
@Component({
    selector: 'app-lobby',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule],
    templateUrl: './lobby.component.html',
    styleUrl: './lobby.component.css',
})
export class LobbyComponent implements OnInit {
    battleState!: BattleState
    newRoomName: string = ''
    playerName: string = ''
    hasSetName: boolean = false

    constructor(private battleService: BattleService, private router: Router) {}

    ngOnInit(): void {
        // Récupérer le nom du joueur du localStorage s'il existe
        const savedName = localStorage.getItem('playerName')
        if (savedName) {
            this.playerName = savedName
            this.hasSetName = true
            this.battleService.setPlayerName(savedName)
        }

        this.battleService.getBattleState().subscribe((state) => {
            this.battleState = state
            if (state.roomId) {
                this.router.navigate(['/battle', state.roomId])
            }
        })

        this.battleService.getRoomsList()
    }

    setPlayerName(): void {
        if (this.playerName.trim()) {
            localStorage.setItem('playerName', this.playerName)
            this.battleService.setPlayerName(this.playerName)
            this.hasSetName = true
        }
    }

    createRoom(): void {
        if (this.newRoomName.trim()) {
            this.battleService.createRoom(this.newRoomName)
            this.newRoomName = ''
        }
    }

    joinRoom(roomId: string): void {
        this.battleService.joinRoom(roomId)
    }
}
