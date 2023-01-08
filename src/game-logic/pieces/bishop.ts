import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a bishop
 */
export class BishopPiece extends ChessPiece {
    static letter = "B";
    letter: string = BishopPiece.letter;

    name: string = "Bishop";

    static pointsValue = 3;
    pointsValue: number = BishopPiece.pointsValue;

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 14);
    }

    protected doClone(): BishopPiece {
        return new BishopPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);

        // add for higher columns
        const [posCol, posRow] = ChessPosition.cellToColRow(this.getPosition());
        for (let col = posCol - 1; col > 0; col--) {
            const rowOffset = posCol - col;
            const toPosition = ChessPosition.get(col, posRow + rowOffset);

            // stop if out of bounds
            if (posRow + rowOffset > 8) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, toPosition));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, toPosition));
            }
        }

        for (let col = posCol - 1; col > 0; col--) {
            const rowOffset = posCol - col;
            const toPosition = ChessPosition.get(col, posRow - rowOffset);

            // stop if out of bounds
            if (posRow - rowOffset < 1) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, toPosition));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, toPosition));
            }
        }

        // add for lower columns
        for (let col = posCol + 1; col < 9; col++) {
            const rowOffset = col - posCol;
            const toPosition = ChessPosition.get(col, posRow + rowOffset);

            if (posRow + rowOffset > 8) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, toPosition));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, toPosition));
            }
        }

        for (let col = posCol + 1; col < 9; col++) {
            const rowOffset = col - posCol;
            const toPosition = ChessPosition.get(col, posRow - rowOffset);

            if (posRow - rowOffset < 1) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, toPosition));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, toPosition));
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
