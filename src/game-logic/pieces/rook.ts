import { ChessBoardState } from "../board-state/chess-board-state";
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

        // add all to the right in col
        for (let i = this.getPosition().col + 1; i < 9; i++) {
            const newPos = ChessPosition.get(i, this.getPosition().row);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, newPos));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, newPos));
            }
        }

        // add all to the left in col
        for (let i = this.getPosition().col - 1; i > 0; i--) {
            const newPos = ChessPosition.get(i, this.getPosition().row);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, newPos));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, newPos));
            }
        }

        // add all above in row
        for (let i = this.getPosition().row + 1; i < 9; i++) {
            const newPos = ChessPosition.get(this.getPosition().col, i);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, newPos));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, newPos));
            }
        }

        // add all below in row
        for (let i = this.getPosition().row - 1; i > 0; i--) {
            const newPos = ChessPosition.get(this.getPosition().col, i);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, newPos));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, newPos));
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
