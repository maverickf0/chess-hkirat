import { WebSocket } from "ws";
import { INIT_GAME, JOIN_GAME, MOVE, OPPONENT_DISCONNECTED } from "./messages";
import { Game } from "./Game";
import { db } from "./db";
import { SocketManager, User } from "./SocketManager";



export class GameManager {
    private games: Game[];
    private pendingGameId:string | null;
    private users: User[];

    constructor() {
        this.games = [];
        this.pendingGameId = null;
        this.users = [];
    }

    addUser(user: User) {
        this.users.push(user);
        this.addHandler(user)
    }

    removeUser(user:User) {
        if(!user){
            console.error("User not found")
            return;
        }
        this.users = this.users.filter(user => user.socket !== user.socket);
        //1:32:38
        SocketManager.getInstance().removeUser(user)
        // const gameIndex = this.games.findIndex(game => game.player1.socket === socket || game.player2.socket === socket);
        // if (gameIndex !== -1) {
        //     const game = this.games[gameIndex];
        //     if (game.player1.socket === socket) {
        //         //game ends
        //         if (game.player2) {
        //             game.player2.socket.send(JSON.stringify({ type: OPPONENT_DISCONNECTED }));
        //         } else {
        //             this.games.splice(gameIndex, 1);
        //         }
        //     }

        //     else if (game.player2.socket === socket) {
        //         if (game.player1) {
        //             game.player1.socket.send(JSON.stringify({ type: OPPONENT_DISCONNECTED }));
        //         } else {
        //             this.games.splice(gameIndex, 1);
        //         }
        //     }
        // }
    }

    private addHandler(user: User) {
        user.socket.on("message", async (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === INIT_GAME) {

                if (this.pendingGameId) {
                    const game = this.games.find(x=>x.gameId ===this.pendingGameId);
                    if(!game){
                        console.error("No pending game found")
                        return;
                    }
                    await game?.updateSecondPlayer(user.userId);
                    this.pendingGameId = null;
                    SocketManager.getInstance().addUser(user,game?.gameId)
                } else {
                    const game= new Game(user.userId,null)
                    SocketManager.getInstance().addUser(user,game.gameId)
                    this.games.push(game);
                    this.pendingGameId = game.gameId;
                }
            }

            if (message.type === MOVE) {
                const gameId=message.payload.gameId

                const game = this.games.find(game=>game.gameId===gameId);
                if (game) {
                    game.makeMove(user, message.payload.move);
                }
            }

            // if (message.type === JOIN_GAME) {
            //     if (message.payload?.gameId) {
            //         const { payload: { gameId } } = message
            //         const availableGame = this.games.find(game => game.gameId === gameId)
            //         if (availableGame) {
            //             const { player1, player2, gameId, board } = availableGame
            //             if (player1 && player2) {
            //                 user.socket.send(JSON.stringify({ type: "GAME_FULL" }))
            //                 return;
            //             }
            //             if (!player1) {
            //                 availableGame.player1.socket = socket
            //                 player2?.socket.send(JSON.stringify({ type: "OPPONENT_JOINED" }))
            //             }
            //             else if (!player2) {
            //                 availableGame.player2.socket = socket
            //                 player1?.socket.send(JSON.stringify({ type: "OPPONENT_JOINED" }))
            //             }
            //             user.socket.send(JSON.stringify({
            //                 type: "GAME_JOINED",
            //                 payload: {
            //                     gameId,
            //                     board
            //                 }
            //             }))
            //             return
            //         } else {
            //             const gameFromDb = await db.game.findUnique({
            //                 where: { id: gameId, }, include: {
            //                     moves: {
            //                         orderBy: {
            //                             moveNumber: "asc"
            //                         }
            //                     },
            //                 }
            //             })
            //             const game = new Game(user.userId, null);
            //             gameFromDb?.moves.forEach((move) => {
            //                 game.board.move(move)
            //             })
            //             this.games.push(game);
            //             socket.send(JSON.stringify({
            //                 type: "GAME_JOINED",
            //                 payload: {
            //                     gameId,
            //                     board: game.board
            //                 }
            //             }))
            //         }
            //     }
            // }
        })
    }
}