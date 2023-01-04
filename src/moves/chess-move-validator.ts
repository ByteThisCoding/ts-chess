import { ChessBoardSingleMove } from "./chess-board-move";
import {
    ChessBoardMoveValidationFailure,
    ChessBoardMoveValidationStatus,
} from "./chess-board-move-validation-status";
import { ChessBoardState } from "../chess-board-state";

/**
 * Utility responsible for checking if a move is valid
 */
export class ChessMoveValidator {
    // TODO: add check for if king is in check
    public static isMoveValid(
        boardState: ChessBoardState,
        move: ChessBoardSingleMove
    ): ChessBoardMoveValidationStatus {
        const piece = move.pieceMoved;

        // validate from position is correct
        const fromPos = move.fromPosition;
        if (boardState.getPieceAtPosition(fromPos) !== piece) {
            return new ChessBoardMoveValidationStatus(
                false,
                ChessBoardMoveValidationFailure.fromPositionMismatch
            );
        }

        // validate piece can move to this position
        const toPos = move.toPosition;
        const validMoves = piece.getPossibleMovements(boardState);
        if (!validMoves.hasMoveToPosition(toPos)) {
            return new ChessBoardMoveValidationStatus(
                false,
                ChessBoardMoveValidationFailure.pieceCannotAccessPosition
            );
        }

        return new ChessBoardMoveValidationStatus(true, null);
    }
}
