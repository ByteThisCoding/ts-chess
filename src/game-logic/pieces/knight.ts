import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a knight
 */
export class KnightPiece extends ChessPiece {
    name: string = "Knight";
    letter: string = "N";
    pointsValue: number = 3;

    constructor(public player: ChessPlayer, position: ChessPosition) {
        super(position);
    }

    protected doClone(): KnightPiece {
        return new KnightPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);

        // <->
        //  ^
        //  ^
        //  B
        if (this.getPosition().col < 8 && this.getPosition().row < 7) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        this.getPosition().col + 1,
                        this.getPosition().row + 2
                    )
                )
            );
        }

        if (this.getPosition().col > 1 && this.getPosition().row < 7) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        this.getPosition().col - 1,
                        this.getPosition().row + 2
                    )
                )
            );
        }

        if (this.getPosition().col < 8 && this.getPosition().row > 2) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        this.getPosition().col + 1,
                        this.getPosition().row - 2
                    )
                )
            );
        }

        if (this.getPosition().col > 1 && this.getPosition().row > 2) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        this.getPosition().col - 1,
                        this.getPosition().row - 2
                    )
                )
            );
        }

        // <-<->->
        //    ^
        //    B
        if (this.getPosition().col < 7 && this.getPosition().row < 7) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        this.getPosition().col + 2,
                        this.getPosition().row + 1
                    )
                )
            );
        }

        if (this.getPosition().col < 7 && this.getPosition().row > 1) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        this.getPosition().col + 2,
                        this.getPosition().row - 1
                    )
                )
            );
        }

        if (this.getPosition().col > 2 && this.getPosition().row < 7) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        this.getPosition().col - 2,
                        this.getPosition().row + 1
                    )
                )
            );
        }

        if (this.getPosition().col > 2 && this.getPosition().row > 1) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        this.getPosition().col - 2,
                        this.getPosition().row - 1
                    )
                )
            );
        }

        return moves;
    }

    // movements are the same for black or white
    protected getPossibleMovementsBlack(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        return this.getPossibleMovementsWhite(boardState);
    }
}
