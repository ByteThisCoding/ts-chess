import { ChessBoardState } from "../chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a queen
 */
export class QueenPiece extends ChessPiece {
    name: string = "Queen";
    letter: string = "Q";
    pointsValue: number = 9;

    constructor(public player: ChessPlayer, position: ChessPosition) {
        super(position);
    }

    protected doClone(): QueenPiece {
        return new QueenPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);

        // add for bishop like movements
        // add for higher columns
        for (let col = this.getPosition().col - 1; col > 0; col--) {
            const rowOffset = this.getPosition().col - col;
            const newPos = ChessPosition.get(
                col,
                this.getPosition().row + rowOffset
            );

            // stop if out of bounds
            if (this.getPosition().row + rowOffset > 8) {
                break;
            }

            moves.add(newPos);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                break;
            }
        }

        for (let col = this.getPosition().col - 1; col > 0; col--) {
            const rowOffset = this.getPosition().col - col;
            const newPos = ChessPosition.get(
                col,
                this.getPosition().row - rowOffset
            );

            // stop if out of bounds
            if (this.getPosition().row - rowOffset < 1) {
                break;
            }

            moves.add(newPos);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                break;
            }
        }

        // add for lower columns
        for (let col = this.getPosition().col + 1; col < 9; col++) {
            const rowOffset = col - this.getPosition().col;
            const newPos = ChessPosition.get(
                col,
                this.getPosition().row + rowOffset
            );

            if (this.getPosition().row + rowOffset > 8) {
                break;
            }

            moves.add(newPos);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                break;
            }
        }

        for (let col = this.getPosition().col + 1; col < 9; col++) {
            const rowOffset = col - this.getPosition().col;
            const newPos = ChessPosition.get(
                col,
                this.getPosition().row - rowOffset
            );

            if (this.getPosition().row - rowOffset < 1) {
                break;
            }

            moves.add(newPos);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                break;
            }
        }

        // add for rook like movements
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
