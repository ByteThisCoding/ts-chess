import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move";
import { ChessMoveValidator } from "../../game-logic/moves/chess-move-validator";
import { iChessAiPlayer } from "../models/chess-ai";
import {
    iChessAiHeuristic,
    iChessAiHeuristicEvaluation,
} from "../models/heuristic";

interface iLookaheadResponse {
    hScore: iChessAiHeuristicEvaluation;
    move: ChessBoardSingleMove;
}

enum TranspositionTableType {
    exact,
    lowerbound,
    upperbound,
}

interface iTranspositionTableEntry extends iLookaheadResponse {
    depthRemaining: number;
    type: TranspositionTableType;
}

export enum ChessAiDifficultyMode {
    easy = "Easy",
    medium = "Medium",
    hard = "Challenging",
    ultra = "Difficult",
}

/**
 * Negamax with alpha beta pruning
 */
export class ChessNegamaxAiPlayer implements iChessAiPlayer {
    private maxDepth: number;
    private maxSearchTimeMs: number;

    // TODO: need to properly store top level move!!!
    private transpositionTable = new Map<string, iTranspositionTableEntry>();

    constructor(
        // the main heuristic to evaluate leaf nodes in the negamax traversal
        private heuristic: iChessAiHeuristic,
        // a less-expensive heuristic to order moves to potentially save time
        private sortHeuristic: iChessAiHeuristic,
        difficultyMode: ChessAiDifficultyMode = ChessAiDifficultyMode.hard
    ) {
        switch (difficultyMode) {
            case ChessAiDifficultyMode.easy:
                this.maxDepth = 1;
                this.maxSearchTimeMs = Infinity;
                break;
            case ChessAiDifficultyMode.medium:
                this.maxDepth = 4;
                this.maxSearchTimeMs = 8_000;
                break;
            case ChessAiDifficultyMode.hard:
                this.maxDepth = 6;
                this.maxSearchTimeMs = 16_000;
                break;
            case ChessAiDifficultyMode.ultra:
                this.maxDepth = 20;
                this.maxSearchTimeMs = 22_000;
        }
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
        console.log("AI starting search of depth " + this.maxDepth);

        // TODO: update transposition table so we don't have to clear each time
        this.transpositionTable.clear();
        const { move, hScore } = this.iterativeDeepeningNegamax(
            boardState,
            player,
            enemy,
            negateMult,
            this.transpositionTable
        );

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
                    break;
                }
            }
        }

        console.log(
            "AI move determined in " +
                (+new Date() - start) / 1000 +
                " seconds and depth of " +
                this.maxDepth +
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
    private iterativeDeepeningNegamax(
        boardState: ChessBoardState,
        player: ChessPlayer,
        enemy: ChessPlayer,
        negateMult: number,
        //pathMoves: ChessBoardSingleMove[],
        transpositionTable: Map<string, iTranspositionTableEntry>
    ): iLookaheadResponse {
        let response!: iLookaheadResponse;

        const cutoffTimeMs = +new Date() + this.maxSearchTimeMs;

        for (let i = 0; i < this.maxDepth; i++) {
            console.log(
                "Starting iterative deepening search of depth: " + (i + 1)
            );

            const thisResponse: iLookaheadResponse & {
                timeLimitReached: boolean;
            } = this.negamax(
                //cloneBoard,
                boardState,
                player,
                enemy,
                i + 1,
                -Infinity,
                Infinity,
                negateMult,
                //[],
                transpositionTable,
                //possibleMoves,
                cutoffTimeMs
            );

            if (
                !response ||
                !thisResponse.timeLimitReached ||
                (negateMult * thisResponse.hScore.score >=
                    negateMult * response.hScore.score)
            ) {
                console.log("Updating response:", { response, thisResponse });
                response = thisResponse;
            }

            if (+new Date() >= cutoffTimeMs) {
                break;
            }
        }

        // TEMP FIX: in case move ref is invalid, use toString to find equal move
        if (response && response.move) {
            for (const move of boardState
                .getPossibleMovesForPlayer(player)
                .getMoves()) {
                if (move.toString() === response.move.toString()) {
                    response.move = move;
                    break;
                }
            }
        }

        return response;
    }

    /**
     * Depth first search: negamax with a/b pruning
     */
    private negamax(
        boardState: ChessBoardState,
        player: ChessPlayer,
        enemy: ChessPlayer,
        depthRemaining: number,
        alphaPrune: number,
        betaPrune: number,
        negateMult: number,
        //pathMoves: ChessBoardSingleMove[],
        transpositionTable: Map<string, iTranspositionTableEntry>,
        //possibleMoves: { move: ChessBoardSingleMove; score: number }[],
        cutoffTimeMs: number
    ): iLookaheadResponse & { timeLimitReached: boolean } {
        let alphaOriginal = alphaPrune;
        let timeLimitReached = false;

        let bestMoveH: iChessAiHeuristicEvaluation = {
            score: -Infinity,
            data: {},
        };
        //let bestMovePath = pathMoves;
        let bestMove!: ChessBoardSingleMove;

        const transpositionTableKey = boardState.toString();

        if (transpositionTable.has(transpositionTableKey)) {
            const tableResult = transpositionTable.get(transpositionTableKey)!;
            if (tableResult.depthRemaining >= depthRemaining) {
                switch (tableResult.type) {
                    case TranspositionTableType.exact:
                        bestMove = tableResult.move;
                        bestMoveH = tableResult.hScore;
                        bestMoveH.score *= negateMult;
                        break;
                    case TranspositionTableType.lowerbound:
                        alphaPrune = Math.max(
                            alphaPrune,
                            tableResult.hScore.score * negateMult
                        );
                        break;
                    case TranspositionTableType.upperbound:
                        betaPrune = Math.min(
                            betaPrune,
                            tableResult.hScore.score * negateMult
                        );
                        break;
                }

                if (alphaPrune >= betaPrune) {
                    bestMove = tableResult.move;
                    bestMoveH = tableResult.hScore;
                    bestMoveH.score *= negateMult;
                }
            }
        }

        if (!bestMove && depthRemaining === 0) {
            // base case, depth is 0
            bestMoveH = this.heuristic.getScore(boardState);
            bestMoveH.score *= negateMult;
        } else if (!bestMove) {
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

            // check each move recursively
            for (const { move } of possibleMoves) {
                boardState.setPiecesFromMove(move, "");
                const thisMoveH = this.negamax(
                    boardState,
                    enemy,
                    player,
                    depthRemaining - 1,
                    -betaPrune,
                    -alphaPrune,
                    -negateMult,
                    transpositionTable,
                    //possibleMoves,
                    cutoffTimeMs,
                );
                boardState.undoLastMove();

                // if black, flip score to negative
                thisMoveH.hScore.score *= -1;
                thisMoveH.move = move;

                // compare scores
                if (thisMoveH.hScore.score >= bestMoveH.score) {
                    bestMoveH = thisMoveH.hScore;
                    bestMove = thisMoveH.move;
                }

                if (bestMoveH.score > alphaPrune) {
                    alphaPrune = bestMoveH.score;
                }

                if (alphaPrune >= betaPrune) {
                    break;
                }

                if (+new Date() >= cutoffTimeMs) {
                    timeLimitReached = true;
                    break;
                }
            }

            if (!timeLimitReached) {
                // add to transposition table
                let type: TranspositionTableType;
                if (bestMoveH.score <= alphaOriginal) {
                    type = TranspositionTableType.upperbound;
                } else if (bestMoveH.score >= betaPrune) {
                    type = TranspositionTableType.lowerbound;
                } else {
                    type = TranspositionTableType.exact;
                }

                // multiply it by negateMulti to ensure it stays in absolute value
                const tableScore = { ...bestMoveH };
                tableScore.score *= negateMult;
                //tableScore.score *= negateMult;
                transpositionTable.set(transpositionTableKey, {
                    type,
                    depthRemaining,
                    hScore: tableScore,
                    move: bestMove,
                });
            }
        }

        return { hScore: bestMoveH, move: bestMove, timeLimitReached };
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
