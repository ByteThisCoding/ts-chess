import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";
import { QueenPiece } from "./queen";

/**
 * Encapsulation of a rook
 */
export class RookPiece extends ChessPiece {
    static letter = "R";
    letter: string = RookPiece.letter;

    name: string = "Rook";

    static pointsValue = 5;
    pointsValue: number = RookPiece.pointsValue;

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 14);
    }

    protected doClone(): RookPiece {
        return new RookPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);
        const [posCol, posRow] = ChessPosition.cellToColRow(this.getPosition());

        // add all to the right in col
        for (let i = posCol + 1; i < 9; i++) {
            const newPos = ChessPosition.get(i, posRow);

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
        for (let i = posCol - 1; i > 0; i--) {
            const newPos = ChessPosition.get(i, posRow);

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
        for (let i = posRow + 1; i < 9; i++) {
            const newPos = ChessPosition.get(posCol, i);

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
        for (let i = posRow - 1; i > 0; i--) {
            const newPos = ChessPosition.get(posCol, i);

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
