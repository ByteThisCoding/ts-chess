import {
    ChessBoardMoveValidationFailure,
    ChessBoardMoveValidationStatus,
} from "./chess-board-move-validation-status";
import { ChessPosition } from "../position/chess-position";
import { MethodProfiler } from "../../util/method-profiler";
import { ChessBoardState } from "../board-state/chess-board-state.model";
import { ChessBoardSingleMove } from "./chess-board-move.model";

/**
 * Utility responsible for checking if a move is valid
 */
export class ChessMoveValidator {

    @MethodProfiler
    public static isMoveValid(
        boardState: ChessBoardState,
        move: ChessBoardSingleMove
    ): ChessBoardMoveValidationStatus {
        const piece = move.pieceMoved;
    
        // Validate player owns piece
        if (move.player !== piece.player) {
            return new ChessBoardMoveValidationStatus(
                false,
                ChessBoardMoveValidationFailure.playerDoesNotOwn,
                { piece: piece.toString() }
            );
        }
    
        // Validate from position is correct
        const fromPos = move.fromPosition;
        const fromPiece = boardState.getPieceAtPosition(fromPos);
        if (!fromPiece?.equals(piece)) {
            return new ChessBoardMoveValidationStatus(
                false,
                ChessBoardMoveValidationFailure.fromPositionMismatch,
                {
                    fromPos: ChessPosition.toString(fromPos),
                    piece: piece.toString(),
                    fromPiece: fromPiece?.toString(),
                    // Removed unnecessary board state string conversion for performance
                    move: move.toString(),
                }
            );
        }
    
        // Validate piece can move to this position
        const toPos = move.toPosition;
        const validMoves = boardState.getPossibleMovementsForPiece(piece);
        if (!validMoves.hasMoveToPosition(toPos)) {
            return new ChessBoardMoveValidationStatus(
                false,
                ChessBoardMoveValidationFailure.pieceCannotAccessPosition,
                {
                    move: move.toString(),
                    /*availableMoves: [...validMoves.getMoves()].map((mv) =>
                        ChessPosition.toString(mv.toPosition)
                    ),*/
                }
            );
        }
    
        // Tentatively make move to detect if player would be in invalid check
        const { inCheck, piece: checkPiece } = boardState.doesMovePutPlayerInIllegalCheck(move);
        if (inCheck) {
            return new ChessBoardMoveValidationStatus(
                false,
                ChessBoardMoveValidationFailure.invalidCheck,
                {
                    piece: checkPiece!.toString(),
                    move: move.toString(),
                }
            );
        }
    
        return new ChessBoardMoveValidationStatus(true, null);
    }
}
