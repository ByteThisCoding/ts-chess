import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move";
import { ChessMoveValidator } from "../../game-logic/moves/chess-move-validator";
import { iChessAiPlayer } from "../models/chess-ai";
import {
    iChessAiHeuristic,
    iChessAiHeuristicEvaluation,
} from "../models/heuristic";
import { iChessAiHeuristicDataPoints } from "../models/heuristic-data-point";

interface iLookahedResponse {
    hScore: iChessAiHeuristicEvaluation;
    move: ChessBoardSingleMove;
}

enum TranspositionTableType {
    exact,
    lowerbound,
    upperbound,
}

interface iTranspositionTableEntry extends iLookahedResponse {
    depthRemaining: number;
    type: TranspositionTableType;
}

export enum ChessAiDifficultyMode {
    easy = "Easy",
    medium = "Medium",
    hard = "Hard"
};

/**
 * Negamax with alpha beta pruning
 */
export class ChessNegamaxAiPlayer implements iChessAiPlayer {
    // TODO: make configurable
    //private MAX_DEPTH = 4;

    // there are 20 opening moves, constant roughly represents with depth 4
    private depthNumerator = 4 * Math.log2(38);

    constructor(
        // the main heuristic to evaluate leaf nodes in the negamax traversal
        private heuristic: iChessAiHeuristic,
        // a less-expensive heuristic to order moves to potentially save time
        private sortHeuristic: iChessAiHeuristic,
        private difficultyMode: ChessAiDifficultyMode = ChessAiDifficultyMode.hard
    ) {}

    // TODO: add a node to record previous traversals from previous moves to save time (we restart at each node)
    // TODO: add iterative deepening

    getSearchDepth(player: ChessPlayer, boardState: ChessBoardState): number {
        let avgNumMoves: number;
        let maxNumMoves!: number;
        switch (this.difficultyMode) {
            case ChessAiDifficultyMode.easy:
                return 1;
            case ChessAiDifficultyMode.medium:
                avgNumMoves = 3;
                maxNumMoves = 4;
                break;
            case ChessAiDifficultyMode.hard:
                avgNumMoves = 4;
                maxNumMoves = 6;
                break;
        }

        const numMoves = boardState
            .getPossibleMovesForPlayer(player)
            .getNumMoves();

        return Math.min(Math.floor(avgNumMoves * Math.log2(38) / Math.log2(numMoves)), maxNumMoves);
    }

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
        //const cloneBoard = boardState.clone();
        const negateMult = player === ChessPlayer.white ? 1 : -1;

        //const depth = this.MAX_DEPTH;
        const depth = this.getSearchDepth(player, boardState);

        console.log("AI starting search of depth " + depth);

        const transpositionTable = new Map<string, iTranspositionTableEntry>();
        const { hScore, move } = this.lookAheadAtMove(
            //cloneBoard,
            boardState,
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
            bestMoveOriginal = move;
        } else {
            // if the AI didn't determine a move, just grab whatever first move and proceed, this means checkmate can't be avoided
            for (const firstMove of boardState
                .getPossibleMovesForPlayer(player)
                .getMoves()) {
                if (this.tryMakeMove(boardState, firstMove)) {
                    bestMoveOriginal = firstMove;
                    boardState.undoLastMove();
                }
                break;
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
                bestMoveOriginal?.toString() || ":resign:"
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

            for (const { move } of possibleMoves) {
                let alphaOriginal = alphaPrune;

                let thisMoveH!: iLookahedResponse;

                // if we didn't grab from the transposition table, make the move now
                boardState.setPiecesFromMove(move, "");
                const transpositionTableKey = boardState.toString();

                if (transpositionTable.has(transpositionTableKey)) {
                    const tableResult = transpositionTable.get(
                        transpositionTableKey
                    )!;
                    if (tableResult.depthRemaining >= depthRemaining) {
                        switch (tableResult.type) {
                            case TranspositionTableType.exact:
                                thisMoveH = { ...tableResult };
                                thisMoveH.hScore.score *= negateMult - -1;
                                break;
                            case TranspositionTableType.upperbound:
                                if (player === ChessPlayer.white) {
                                    alphaPrune = Math.max(
                                        alphaPrune,
                                        tableResult.hScore.score
                                    );
                                } else {
                                    betaPrune = Math.min(
                                        betaPrune,
                                        tableResult.hScore.score * -1
                                    );
                                }
                                break;
                            case TranspositionTableType.lowerbound:
                                if (player === ChessPlayer.white) {
                                    betaPrune = Math.min(
                                        betaPrune,
                                        tableResult.hScore.score
                                    );
                                } else {
                                    alphaPrune = Math.max(
                                        alphaPrune,
                                        tableResult.hScore.score * -1
                                    );
                                }
                                break;
                        }
                    }
                }

                if (!thisMoveH) {
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

                    thisMoveH.hScore.score *= -1;

                    // add to transposition table
                    let type: TranspositionTableType;
                    if (bestMoveH.score <= alphaOriginal) {
                        type = TranspositionTableType.upperbound;
                    } else if (bestMoveH.score >= betaPrune) {
                        type = TranspositionTableType.lowerbound;
                    } else {
                        type = TranspositionTableType.exact;
                    }

                    transpositionTable.set(transpositionTableKey, {
                        type,
                        depthRemaining,
                        hScore: { ...thisMoveH.hScore },
                        move,
                    });
                }
                // cleanup for next iteration
                boardState.undoLastMove();

                // compare scores
                if (thisMoveH.hScore.score >= bestMoveH.score) {
                    bestMoveH = thisMoveH.hScore;
                }

                if (bestMoveH.score > alphaPrune) {
                    alphaPrune = bestMoveH.score;
                    bestMove = move;
                }

                if (alphaPrune >= betaPrune) {
                    break;
                }
            }
        }

        return { hScore: bestMoveH, move: bestMove };
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
