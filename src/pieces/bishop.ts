import { ChessBoardState } from "../chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";
import { ChessPieceAvailableMove } from "../moves/chess-piece-available-move";

/**
 * Encapsulation of a bishop
 */
export class BishopPiece extends ChessPiece {
    name: string = "Bishop";
    letter: string = "B";
    pointsValue: number = 3;

    constructor(public player: ChessPlayer, position: ChessPosition) {
        super(position);
    }

    protected doClone(): BishopPiece {
        return new BishopPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);

        // add for higher columns
        for (let col = this.getPosition().col - 1; col > 0; col--) {
            const rowOffset = this.getPosition().col - col;
            const toPosition = ChessPosition.get(
                col,
                this.getPosition().row + rowOffset
            );

            // stop if out of bounds
            if (this.getPosition().row + rowOffset > 8) {
                break;
            }

            moves.add(new ChessPieceAvailableMove({ toPosition }));

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                break;
            }
        }

        for (let col = this.getPosition().col - 1; col > 0; col--) {
            const rowOffset = this.getPosition().col - col;
            const toPosition = ChessPosition.get(
                col,
                this.getPosition().row - rowOffset
            );

            // stop if out of bounds
            if (this.getPosition().row - rowOffset < 1) {
                break;
            }

            moves.add(new ChessPieceAvailableMove({ toPosition }));

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                break;
            }
        }

        // add for lower columns
        for (let col = this.getPosition().col + 1; col < 9; col++) {
            const rowOffset = col - this.getPosition().col;
            const toPosition = ChessPosition.get(
                col,
                this.getPosition().row + rowOffset
            );

            if (this.getPosition().row + rowOffset > 8) {
                break;
            }

            moves.add(new ChessPieceAvailableMove({ toPosition }));

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                break;
            }
        }

        for (let col = this.getPosition().col + 1; col < 9; col++) {
            const rowOffset = col - this.getPosition().col;
            const toPosition = ChessPosition.get(
                col,
                this.getPosition().row - rowOffset
            );

            if (this.getPosition().row - rowOffset < 1) {
                break;
            }

            moves.add(new ChessPieceAvailableMove({ toPosition }));

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                break;
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
