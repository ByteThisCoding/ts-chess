import { ChessPlayer } from "../enums";
import { ChessPiece } from "../pieces/chess-piece.model";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessBoardSingleMoveImpl } from "./chess-board-move-impl";
import { ChessBoardSingleMoveShadow } from "./chess-board-shadow-move.model";

/**
 * Attaches another property "blockingPiece"
 */
export class ChessBoardSingleMoveShadowImpl extends ChessBoardSingleMoveImpl implements ChessBoardSingleMoveShadow {
    constructor(
        player: ChessPlayer,
        pieceMoved: ChessPiece,
        fromPosition: ChessCell,
        toPosition: ChessCell,
        public blockingPiece: ChessPiece
    ) {
        if (!blockingPiece) {
            throw new Error(`Blocking piece is empty!`);
        }
        super(player, pieceMoved, fromPosition, toPosition);
    }

    toString(): string {
        return `[${this.player}:${
            this.pieceMoved.letter
        }:${ChessPosition.toString(this.fromPosition)}:${ChessPosition.toString(
            this.toPosition
        )} - Blocked By: ${this.blockingPiece?.toString()}]`;
    }
}
