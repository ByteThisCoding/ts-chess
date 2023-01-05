import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { iChessAiHeuristic } from "../models/heuristic";

export class ChessAiHeuristic implements iChessAiHeuristic {
    /**
     * TODO: add more criteria
     */
    getScore(boardState: ChessBoardState): number {
        if (boardState.isGameInCheckmate()) {
            return boardState.isPlayerInCheckmate(ChessPlayer.white)
                ? -Infinity
                : Infinity;
        }

        return boardState.getScore();
    }
}
