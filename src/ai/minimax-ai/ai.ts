import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move";
import { ChessMoveValidator } from "../../game-logic/moves/chess-move-validator";
import { iChessAiPlayer } from "../models/chess-ai";
import {
    iChessAiHeuristic,
    iChessAiHeuristicEvaluation,
} from "../models/heuristic";

interface iLookahedResponse {
    hScore: iChessAiHeuristicEvaluation;
    move: ChessBoardSingleMove;
}

interface iTranspositionTableEntry extends iLookahedResponse {
    depthRemaining: number;
    type: 'exact' | 'lowerbound' | 'upperbound';
}

/**
 * Negamax with alpha beta pruning
 */
export class ChessMinimaxAiPlayer implements iChessAiPlayer {
    // TODO: make configurable
    private MAX_DEPTH = 4;

    constructor(
        // the main heuristic to evaluate leaf nodes in the negamax traversal
        private heuristic: iChessAiHeuristic,
        // a less-expensive heuristic to order moves to potentially save time
        private sortHeuristic: iChessAiHeuristic
    ) { }

    // TODO: add a node to record previous traversals from previous moves to save time (we restart at each node)

    /**
     * Assumes this player is the opposite of the player that just went
     */
    determineNextMove(
        boardState: ChessBoardState
    ): ChessBoardSingleMove | null {
        const start = +new Date();
        const player =
            boardState.getLastMove()?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        const enemy =
            player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        // clone once for mutation safety of the original board
        const cloneBoard = boardState.clone();
        const negateMult = player === ChessPlayer.white ? 1 : -1;

        const depth = this.MAX_DEPTH;

        const transpositionTable = new Map<string, iTranspositionTableEntry>();
        const { hScore, move } = this.lookAheadAtMove(
            cloneBoard,
            player,
            enemy,
            depth,
            -Infinity,
            Infinity,
            negateMult,
            //[],
            transpositionTable
        ) as iLookahedResponse;

        // find the uncloned version of the move, we need object referential equality
        let bestMoveOriginal!: ChessBoardSingleMove;
        if (move) {
            for (const findMove of boardState
                .getPossibleMovesForPlayer(player)
                .getMoves()) {
                // TODO: comparing strings is done to validate if a bug exists, remove when done
                //if (findMove.equals(move)) {
                if (findMove.toString() === move.toString()) {
                    bestMoveOriginal = findMove;
                    break;
                }
            }
        }

        console.log(
            "AI move determined in " +
            (+new Date() - start) / 1000 +
            " seconds and depth of " +
            depth +
            " (" +
            hScore?.score +
            ") " +
            bestMoveOriginal?.toString() || ":resign:",
            hScore?.data
        );
        return bestMoveOriginal || null;
    }

    /**
     * Depth first search: negamax with a/b pruning
     */
    private lookAheadAtMove(
        boardState: ChessBoardState,
        player: ChessPlayer,
        enemy: ChessPlayer,
        depthRemaining: number,
        alphaPrune: number,
        betaPrune: number,
        negateMult: number,
        //pathMoves: ChessBoardSingleMove[],
        transpositionTable: Map<string, iTranspositionTableEntry>
    ): iLookahedResponse {
        let bestMoveH: iChessAiHeuristicEvaluation = {
            score: -Infinity,
            data: {},
        };
        //let bestMovePath = pathMoves;
        let bestMove!: ChessBoardSingleMove;

        //const transpositionTableKey = boardState.toString();

        if (depthRemaining === 0) {
            // base case, depth is 0
            bestMoveH = this.heuristic.getScore(boardState);
            bestMoveH.score *= negateMult;
        } else {
            // default, keep looking
            const possibleMoves: {
                move: ChessBoardSingleMove;
                score: number;
            }[] = [];
            // sort based on initial board state analysis
            for (const move of boardState
                .getPossibleMovesForPlayer(player)
                .getMoves()) {
                const moveIsGood = this.tryMakeMove(boardState, move);
                if (moveIsGood) {
                    const score =
                        this.sortHeuristic.getScore(boardState).score *
                        negateMult;

                    possibleMoves.push({
                        move,
                        score,
                    });
                    boardState.undoLastMove();
                }
            }

            // sort the moves based on initial heuristic estimate
            possibleMoves.sort((a, b) => b.score - a.score);

            let alphaOriginal = alphaPrune;

            for (const { move } of possibleMoves) {
                let thisMoveH!: iLookahedResponse;
                // commented out until bug resolution is found
                /*if (transpositionTable.has(transpositionTableKey)) {
                    const tableResult = transpositionTable.get(transpositionTableKey)!;
                    if (tableResult.depthRemaining <= depthRemaining) {
                        switch (tableResult.type) {
                            case 'exact':
                                thisMoveH = {...tableResult};
                                thisMoveH.hScore.score *= negateMult;
                                break;
                            case 'upperbound':
                                alphaPrune = Math.max(alphaPrune, tableResult.hScore.score * negateMult);
                                break;
                            case 'lowerbound':
                                betaPrune = Math.min(betaPrune, tableResult.hScore.score * negateMult);
                                break;
                        }
                    }
                }*/

                // if we didn't grab from the transposition table, make the move now
                if (!thisMoveH) {
                    boardState.setPiecesFromMove(move, "");
                    thisMoveH = this.lookAheadAtMove(
                        boardState,
                        enemy,
                        player,
                        depthRemaining - 1,
                        -betaPrune,
                        -alphaPrune,
                        -negateMult,
                        transpositionTable
                    );
                    // cleanup for next iteration
                    boardState.undoLastMove();
                    thisMoveH.hScore.score *= -1;
                }


                // compare scores
                if (thisMoveH.hScore.score >= bestMoveH.score) {
                    bestMoveH = thisMoveH.hScore;
                }

                // commented out until bug resolution is found
                // add to transposition table
                /*let type: 'exact' | 'lowerbound' | 'upperbound';
                if (bestMoveH.score <= alphaOriginal) {
                    type = 'upperbound';
                } else if (bestMoveH.score >= betaPrune) {
                    type = 'lowerbound';
                } else {
                    type = 'exact';
                }
                // multiply back by negate multi to put the score to to absolute value
                const tableScore = { ...thisMoveH.hScore };
                tableScore.score *= negateMult;
                transpositionTable.set(transpositionTableKey, {
                    depthRemaining,
                    move,
                    hScore: tableScore,
                    type
                });*/

                if (bestMoveH.score > alphaPrune) {
                    alphaPrune = bestMoveH.score;
                    bestMove = move;

                }

                if (alphaPrune >= betaPrune) {
                    break;
                }
            }
        }

        const returnValue = { hScore: bestMoveH, move: bestMove };

        return returnValue;
    }

    /**
     * Try to make a move, return false if invalid
     */
    private tryMakeMove(
        boardState: ChessBoardState,
        move: ChessBoardSingleMove
    ): boolean {
        const response = ChessMoveValidator.isMoveValid(boardState, move);
        if (response.success) {
            boardState.setPiecesFromMove(move, "");
        }
        return response.success;
    }
}
