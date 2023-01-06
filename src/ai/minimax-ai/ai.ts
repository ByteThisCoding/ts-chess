import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move";
import { ChessMoveValidator } from "../../game-logic/moves/chess-move-validator";
import { iChessAiPlayer } from "../models/chess-ai";
import { iChessAiHeuristic } from "../models/heuristic";

export class ChessMinimaxAiPlayer implements iChessAiPlayer {
    // TODO: make configurable
    // depth is actually this + 1
    private MAX_DEPTH = 2;

    constructor(private heuristic: iChessAiHeuristic) { }

    /**
     * Assumes this player is the opposite of the player that just went
     */
    determineNextMove(boardState: ChessBoardState): ChessBoardSingleMove {
        const start = +new Date();
        const player =
            boardState.getLastMove()?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;
        const enemy =
            player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        let bestMoveScore: number;
        let bestMove: ChessBoardSingleMove | null = null;

        // clone once for mutation safety of the original board
        const cloneBoard = boardState.clone();
        const possibleMoves = cloneBoard.getPossibleMovesForPlayer(player);

        for (const move of possibleMoves.getMoves()) {

            const moveIsGood = this.tryMakeMove(cloneBoard, move);
            if (moveIsGood) {

                const thisMoveScore = this.lookAheadAtMove(cloneBoard, enemy, this.MAX_DEPTH, -Infinity, Infinity);
                cloneBoard.undoLastMove();
                
                if (player === ChessPlayer.white) {
                    if (!bestMove || thisMoveScore > bestMoveScore!) {
                        bestMove = move;
                        bestMoveScore = thisMoveScore;
                    }
                } else {
                    if (!bestMove || thisMoveScore < bestMoveScore!) {
                        bestMove = move;
                        bestMoveScore = thisMoveScore;
                    }
                }
            }
        }

        console.log("AI move determined in " + ((+new Date() - start)/1000) + " seconds");
        return bestMove!;
    }

    /**
     * Depth first search: minimax with a/b pruning
     * @param boardState 
     * @param player 
     * @param depthRemaining 
     * @param alphaPruneValue 
     * @param betaPruneValue 
     * @returns 
     */
    private lookAheadAtMove(
        boardState: ChessBoardState,
        player: ChessPlayer,
        depthRemaining: number,
        alphaPruneValue: number,
        betaPruneValue: number
    ): number {
        // base case, depth is 0
        if (depthRemaining === 0) {
            return this.heuristic.getScore(boardState);
        }

        // default, keep looking
        const enemy =
            player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        let moveEvaluated = false;
        let bestMoveScore = 0;

        const possibleMoves = boardState.getPossibleMovesForPlayer(player);
        for (const move of possibleMoves.getMoves()) {

            const moveIsGood = this.tryMakeMove(boardState, move);
            if (moveIsGood) {
                const thisMoveScore = this.lookAheadAtMove(boardState, enemy, depthRemaining - 1, alphaPruneValue, betaPruneValue);
                boardState.undoLastMove();

                if (player === ChessPlayer.white) {
                    if (moveEvaluated) {
                        bestMoveScore = Math.max(bestMoveScore, thisMoveScore);
                    } else {
                        bestMoveScore = thisMoveScore;
                        moveEvaluated = true;
                    }

                    // beta pruning
                    if (bestMoveScore >= betaPruneValue) {
                        break;
                    }

                    alphaPruneValue = Math.max(alphaPruneValue, bestMoveScore);
                } else {
                    if (moveEvaluated) {
                        bestMoveScore = Math.min(bestMoveScore, thisMoveScore);
                    } else {
                        bestMoveScore = thisMoveScore;
                        moveEvaluated = true;
                    }

                    // alpha pruning
                    if (bestMoveScore <= alphaPruneValue) {
                        break;
                    }

                    betaPruneValue = Math.min(betaPruneValue, bestMoveScore);
                }
            }
        }

        if (!moveEvaluated) {
            return this.heuristic.getScore(boardState);
        }

        return bestMoveScore!;
    }

    /**
     * Try to make a move, return false if invalid
     */
    private tryMakeMove(boardState: ChessBoardState, move: ChessBoardSingleMove): boolean {
        const response = ChessMoveValidator.isMoveValid(boardState, move);
        if (response.success) {
            boardState.setPiecesFromMove(move, "");
        }
        return response.success;
    }
}
