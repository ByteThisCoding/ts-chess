import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a knight
 */
export class KnightPiece extends ChessPiece {
    name: string = "Knight";
    letter: string = "N";
    pointsValue: number = 3;

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 8);
    }

    protected doClone(): KnightPiece {
        return new KnightPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);
        const [posCol, posRow] = ChessPosition.cellToColRow(this.getPosition());

        // <->
        //  ^
        //  ^
        //  B
        if (posCol < 8 && posRow < 7) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol + 1,
                        posRow + 2
                    )
                )
            );
        }

        if (posCol > 1 && posRow < 7) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol - 1,
                        posRow + 2
                    )
                )
            );
        }

        if (posCol < 8 && posRow > 2) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol + 1,
                        posRow - 2
                    )
                )
            );
        }

        if (posCol > 1 && posRow > 2) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol - 1,
                        posRow - 2
                    )
                )
            );
        }

        // <-<->->
        //    ^
        //    B
        if (posCol < 7 && posRow < 7) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol + 2,
                        posRow + 1
                    )
                )
            );
        }

        if (posCol < 7 && posRow > 1) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol + 2,
                        posRow - 1
                    )
                )
            );
        }

        if (posCol > 2 && posRow < 7) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol - 2,
                        posRow + 1
                    )
                )
            );
        }

        if (posCol > 2 && posRow > 1) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol - 2,
                        posRow - 1
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
