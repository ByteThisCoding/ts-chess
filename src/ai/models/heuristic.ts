import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";

export interface iChessAiHeuristicEvaluation {
    score: number;
    data: any;
}

/**
 * Model for something that will assign a score to the state of a board
 */
export interface iChessAiHeuristic {
    getScore(boardState: ChessBoardState): iChessAiHeuristicEvaluation;
}