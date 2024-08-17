import { ChessBoardState } from "../../game-logic/board-state/chess-board-state.model";
import { ChessPlayer } from "../../game-logic/enums";
import { BishopPiece } from "../../game-logic/pieces/bishop";
import { KnightPiece } from "../../game-logic/pieces/knight";
import { PawnPiece } from "../../game-logic/pieces/pawn";
import { QueenPiece } from "../../game-logic/pieces/queen";
import { RookPiece } from "../../game-logic/pieces/rook";
import { ProfileAllMethods } from "../../util/profile-all-methods";
import {
    iChessAiHeuristic,
    iChessAiHeuristicEvaluation,
} from "../models/heuristic.model";

/**
 * This is a simpler heuristic used to order moves for the AI before using the real one
 */
@ProfileAllMethods
export class ChessAiSortHeuristic implements iChessAiHeuristic {
    private maxPiecePoints =
        PawnPiece.pointsValue * 8 +
        BishopPiece.pointsValue * 2 +
        KnightPiece.pointsValue * 2 +
        RookPiece.pointsValue * 2 +
        QueenPiece.pointsValue;

    getScore(boardState: ChessBoardState): iChessAiHeuristicEvaluation {
        if (boardState.isGameInCheckmate()) {
            return {
                score: boardState.isPlayerInCheckmate(ChessPlayer.white)
                    ? -Number.MAX_SAFE_INTEGER
                    : Number.MAX_SAFE_INTEGER,
                data: {},
            };
        }

        if (boardState.isGameInStalemate()) {
            return {
                score: 0,
                data: {},
            };
        }

        return {
            score: boardState.getScore(),
            data: {},
        };
    }
}
