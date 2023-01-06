import { ChessBoardSingleMove } from "./chess-board-move";
import {
    ChessBoardMoveValidationFailure,
    ChessBoardMoveValidationStatus,
} from "./chess-board-move-validation-status";
import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPlayer } from "../enums";
import { KingPiece } from "../pieces/king";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { QueenPiece } from "../pieces/queen";

/**
 * Utility responsible for checking if a move is valid
 */
export class ChessMoveValidator {

    public static isMoveValid(
        boardState: ChessBoardState,
        move: ChessBoardSingleMove
    ): ChessBoardMoveValidationStatus {
        const piece = move.pieceMoved;

        // validate player owns piece
        if (move.player !== move.pieceMoved.player) {
            return new ChessBoardMoveValidationStatus(
                false,
                ChessBoardMoveValidationFailure.playerDoesNotOwn,
                {
                    piece: piece.toString(),
                }
            );
        }

        // validate from position is correct
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
                    board: boardState.toString(),
                    move: move.toString()
                }
            );
        }

        // validate piece can move to this position
        const toPos = move.toPosition;

        const validMoves = boardState.getPossibleMovementsForPiece(piece);
        if (!validMoves.hasMoveToPosition(toPos)) {
            return new ChessBoardMoveValidationStatus(
                false,
                ChessBoardMoveValidationFailure.pieceCannotAccessPosition,
                {
                    availableMoves: [...validMoves.getMoves()].map((mv) =>
                        mv.toPosition.toString()
                    ),
                }
            );
        }

        // validate player won't put themselves in illegal check
        const enemy =
            move.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;
        const enemyPossibleMoves = boardState.getPossibleMovesForPlayer(enemy);

        // check if enemy's king's position is included
        // if the king was moved, use that, otherwise, use last recorded king position
        let playerKingPos: ChessCell = -1;
        
        if (move.pieceMoved instanceof KingPiece) {
            playerKingPos = move.toPosition;
        } else {
            const playerKing = boardState.getPlayerKingPiece(move.player);
            playerKingPos = playerKing.getPosition();
        }

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
