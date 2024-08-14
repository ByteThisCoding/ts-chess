import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move";

export interface iChessAiPlayer {
    /**
     * Assumes this player is the opposite of the player that just went
     */
    determineNextMove(boardState: ChessBoardState): Promise<ChessBoardSingleMove | null>;
}
