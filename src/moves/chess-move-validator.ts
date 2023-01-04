import { ChessBoardSingleMove } from "./chess-board-move";
import {
    ChessBoardMoveValidationFailure,
    ChessBoardMoveValidationStatus,
} from "./chess-board-move-validation-status";
import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPlayer } from "../enums";

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

        // validate player won't put themselves in illegal check 
        const enemy = move.player === ChessPlayer.white ? ChessPlayer.black : ChessPlayer.white;
        const enemyPossibleMoves = boardState.getPossibleMovesForPlayer(enemy);

        // check if enemy's king's position is included
        const playerKing = boardState.getPlayerKingPiece(move.player);
        const playerKingPos = playerKing.getPosition();

        for (const move of enemyPossibleMoves.getMoves()) {
            if (move.toPosition === playerKingPos) {
                return new ChessBoardMoveValidationStatus(
                    false,
                    ChessBoardMoveValidationFailure.invalidCheck
                );
            }
        }

        return new ChessBoardMoveValidationStatus(true, null);
    }
}
