import { ChessBoardState } from "../../game-logic/board-state/chess-board-state.model";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move.model";

export interface iChessAiPlayer {
    /**
     * Assumes this player is the opposite of the player that just went
     */
    determineNextMove(boardState: ChessBoardState): Promise<{
        move: ChessBoardSingleMove | null;
        score: number;
    }>;
}
