import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a queen
 */
export class QueenPiece extends ChessPiece {
    static letter = "Q";
    letter: string = QueenPiece.letter;

    name: string = "Queen";

    static pointsValue = 9;
    pointsValue: number = QueenPiece.pointsValue;

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 28);
    }

    protected doClone(): QueenPiece {
        return new QueenPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);
        const [posCol, posRow] = ChessPosition.cellToColRow(this.getPosition());

        // add for bishop like movements
        // add for higher columns
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

        // add for rook like movements
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
