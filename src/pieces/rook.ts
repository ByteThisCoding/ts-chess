import { ChessBoardState } from "../chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a rook
 */
export class RookPiece extends ChessPiece {
    name: string = "Rook";
    letter: string = "R";
    pointsValue: number = 5;

    constructor(public player: ChessPlayer, position: ChessPosition) {
        super(position);
    }

    protected doClone(): RookPiece {
        return new RookPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);

        // add all in current col
        for (let i = 1; i < 9; i++) {
            const newPos = ChessPosition.get(i, this.getPosition().row);

            if (this.getPosition().col !== i) {
                moves.add(newPos);

                const existingPiece = boardState.getPieceAtPosition(newPos);
                if (existingPiece) {
                    break;
                }
            }
        }

        // add all in current row
        for (let i = 1; i < 9; i++) {
            const newPos = ChessPosition.get(this.getPosition().row, i);

            if (this.getPosition().row !== i) {
                moves.add(newPos);

                const existingPiece = boardState.getPieceAtPosition(newPos);
                if (existingPiece) {
                    break;
                }
            }
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
