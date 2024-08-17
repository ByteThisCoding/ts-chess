import { ChessBoardState } from "../../game-logic/board-state/chess-board-state.model";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move.model";
import { ChessMoveValidator } from "../../game-logic/moves/chess-move-validator";
import { ProfileAllMethods } from "../../util/profile-all-methods";
import { iChessAiPlayer } from "../models/chess-ai.model";
import { iChessAiHeuristic, iChessAiHeuristicEvaluation } from "../models/heuristic.model";

interface iLookaheadResponse {
    hScore: iChessAiHeuristicEvaluation;
    move: ChessBoardSingleMove | null;
    movePath: (ChessBoardSingleMove | null)[];
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

@ProfileAllMethods
export class ChessNegamaxAiAlgorithm implements iChessAiPlayer {

    private settings = {
        transpositionEnabled: true,
        nullPruneEnabled: true,
        iterativeDeepeningEnabled: true,
        preemptiveDepthReductionEnabled: false,
        alphaBetaPruneEnabled: true,
        moveSortingEnabled: true,
        workersEnabled: false
    };

    private maxDepth: number;
    private maxSearchTimeMs: number;
    private transpositionTable = new Map<number, iTranspositionTableEntry>();
    private moveEvaluations: { move: ChessBoardSingleMove; evaluation: iChessAiHeuristicEvaluation }[] = [];

    constructor(
        private heuristic: iChessAiHeuristic,
        private sortHeuristic: iChessAiHeuristic,
        difficultyMode: ChessAiDifficultyMode = ChessAiDifficultyMode.ultra,
        private onlyEvaluateNthMove?: number,
        private numWorkers?: number
    ) {
        this.numWorkers = this.numWorkers || 1;

        switch (difficultyMode) {
            case ChessAiDifficultyMode.easy:
                this.maxDepth = 2;
                this.maxSearchTimeMs = Infinity;
                break;
            case ChessAiDifficultyMode.medium:
                this.maxDepth = 8;
                this.maxSearchTimeMs = 8_000;
                break;
            case ChessAiDifficultyMode.hard:
                this.maxDepth = 12;
                this.maxSearchTimeMs = 16_000;
                break;
            case ChessAiDifficultyMode.ultra:
                this.maxDepth = 100;
                this.maxSearchTimeMs = 25_000;
                break;
        }
    }

    async determineNextMove(
        boardState: ChessBoardState
    ): Promise<{
        move: ChessBoardSingleMove | null,
        score: number
    }> {
        const start = +new Date();
        const player = boardState.getLastMove()?.player === ChessPlayer.white ? ChessPlayer.black : ChessPlayer.white;
        //console.log("Available moves", [...boardState.getPossibleMovesForPlayer(player).getMoves()].map(m => m.toString()))

        const negateMult = player === ChessPlayer.white ? 1 : -1;

        this.moveEvaluations = []; // Reset move evaluations before starting

        const bestMoves = this.settings.iterativeDeepeningEnabled
            ? this.iterativeDeepeningNegamax(
                    boardState,
                    player,
                    negateMult
            ) : this.negamax(
                boardState,
                player,
                this.maxDepth,
                -Infinity,
                Infinity,
                negateMult,
                +new Date() + this.maxSearchTimeMs,
                [],
                null
            );

        if (bestMoves.response.length === 0) {
            console.log("AI found no moves!");
            return {
                move: null,
                score: -Infinity
            };
        }

        const { move, hScore, movePath } = bestMoves.response[
            Math.floor(Math.random() * bestMoves.response.length)
        ];

        // Log the move evaluations after the search is complete
        /*console.log("Move Evaluations:", this.moveEvaluations.map(ev => ({
            move: ev.move.toString(),
            evaluation: ev.evaluation.score
        })));*/

        // Log the final best path
        console.log("AI found " + bestMoves.response.length + " viable moves.");
        console.log("Best Path:", movePath.map(m => m?.toString()).join(" -> "));

        console.log(
            "AI move determined in " +
            (+new Date() - start) / 1000 +
            " seconds and depth of " +
            this.maxDepth +
            " (" +
            hScore?.score +
            ") " +
            move?.toString() || ":resign:"
        );

        return {
            move: move || null,
            score: hScore.score
        };
    }

    private iterativeDeepeningNegamax(
        boardState: ChessBoardState,
        player: ChessPlayer,
        negateMult: number
    ): {
        response: iLookaheadResponse[];
        timeLimitReached: boolean;
    } {
        let response: iLookaheadResponse[] = [{ hScore: { score: -Infinity, data: {} }, move: null, movePath: [] }];
        let timeLimitReached = false;
        const cutoffTimeMs = +new Date() + this.maxSearchTimeMs;

        for (let depth = 2; depth <= this.maxDepth; depth++) {
            console.log("Starting iterative deepening search of depth: " + depth);

            const thisResponse = this.negamax(
                boardState,
                player,
                depth,
                -Infinity,
                Infinity,
                negateMult,
                cutoffTimeMs,
                [],
                response[0].move
            );

            if (!response[0].move || !thisResponse.timeLimitReached || thisResponse.response[0].hScore.score > response[0].hScore.score) {
                console.log("Updating best move at depth", depth, ": ", thisResponse.response[0].move?.toString());
                console.log("Current Path:", thisResponse.response[0].movePath.map(m => m?.toString()).join(" -> "), thisResponse.response[0].hScore);

                // make the move and get opponent player moves
                //boardState.setPiecesFromMove(thisResponse.move, "");
                //console.log("All opponent player moves", [...boardState.getPossibleMovesForPlayer(player === ChessPlayer.white ? ChessPlayer.black : ChessPlayer.white).getMoves()].map(m => m.toString()))
                //boardState.undoLastMove();
                response = thisResponse.response;
            }

            if (+new Date() >= cutoffTimeMs) {
                timeLimitReached = true;
                break;
            }
        }

        return {
            response,
            timeLimitReached: timeLimitReached
        };
    }

    private negamax(
        boardState: ChessBoardState,
        player: ChessPlayer,
        depthRemaining: number,
        alphaPrune: number,
        betaPrune: number,
        negateMult: number,
        cutoffTimeMs: number,
        movePath: (ChessBoardSingleMove | null)[],
        // for iterative deepening, start with the best move we found before
        firstMove: ChessBoardSingleMove | null
    ): {
        response: iLookaheadResponse[];
        timeLimitReached: boolean;
    } {
        let timeLimitReached = false;
    
        let bestMoves: iLookaheadResponse[] = [{
            hScore: {
                score: -Infinity,
                data: {}
            },
            move: null,
            movePath: [...movePath]
        }];

        const transpositionTableKey = boardState.toHash();
    
        if (this.settings.transpositionEnabled && this.transpositionTable.has(transpositionTableKey)) {
            const tableResult = this.transpositionTable.get(transpositionTableKey)!;
            
            if (tableResult.depthRemaining >= depthRemaining) {
                return {
                    timeLimitReached: false,
                    response: [{
                        hScore: { ...tableResult.hScore, score: tableResult.hScore.score * negateMult },
                        move: tableResult.move,
                        movePath: [...movePath, tableResult.move]
                    }]
                };
            }
        }
    
        // Null Move Pruning
        if (this.settings.nullPruneEnabled) {
            const R = 2; // Reduction factor for null move pruning
            if (depthRemaining > R && !boardState.isPlayerInCheck(player)) {
                boardState.setPiecesFromMove(null, ""); // Perform a null move
                const nullMoveH = this.negamax(
                    boardState,
                    player === ChessPlayer.white ? ChessPlayer.black : ChessPlayer.white,
                    depthRemaining - 1 - R,
                    -betaPrune,
                    -alphaPrune,
                    -negateMult,
                    cutoffTimeMs,
                    movePath,
                    null
                );
                boardState.undoLastMove();
    
                if (-nullMoveH.response[0].hScore.score >= betaPrune) {
                    return {
                        response: [{
                            hScore: { score: betaPrune, data: {} },
                            move: null!,
                            movePath: [...movePath]
                        }],
                        timeLimitReached: false
                    }
                }
            }
        }
    
        // Base case: if depth is 0, evaluate the board
        if (depthRemaining <= 0) {
            const bestMoveH = this.heuristic.getScore(boardState, bestMoves[0].hScore.score, player === ChessPlayer.white);
            bestMoveH.score *= negateMult; // Flip the score for negamax
            //console.log(negateMult, "Low depth:", movePath.map(mv => mv?.toString()), bestMoveH.score);
            return {
                response: [{ hScore: bestMoveH, move: null!, movePath: [...movePath]}],
                timeLimitReached: false,
            };
        }
    
        // Generate and evaluate moves
        const possibleMoves: { move: ChessBoardSingleMove; score: number }[] = [];
        if (firstMove) {
            possibleMoves.push({
                move: firstMove,
                score: this.sortHeuristic.getScore(boardState, bestMoves[0].hScore.score, player === ChessPlayer.white).score *= negateMult
            });
        }

        let i = 0;
        for (const move of boardState.getPossibleMovesForPlayer(player).getMoves()) {
            if (move === firstMove) {
                continue;
            }

            if (this.onlyEvaluateNthMove !== undefined && (i % this.numWorkers! !== this.onlyEvaluateNthMove)) {
                continue;
            }

            const moveIsGood = this.tryMakeMove(boardState, move);
            if (moveIsGood) {
                const score = this.sortHeuristic.getScore(boardState, bestMoves[0].hScore.score, player === ChessPlayer.white);
                score.score *= negateMult;
                possibleMoves.push({ move, score: score.score });
                boardState.undoLastMove();
            }
        }
    
        // Sort moves based on heuristic score
        if (this.settings.moveSortingEnabled) {
            possibleMoves.sort((a, b) => b.score - a.score);
        }
    
        // Evaluate each move
        for (const { move } of possibleMoves) {
            const isCapture = boardState.setPiecesFromMove(move, "");
    
            // Apply Late Move Reductions (LMR) with heuristic filtering and depth adjustments
            let depthAdjustment = 0;
            const adjustmentFactor = 0.3; // A more conservative adjustment
    
            const moveScorePreemptive = this.heuristic.getScore(boardState);

            if (
                this.settings.preemptiveDepthReductionEnabled && 
                !isCapture &&
                ((move.player == ChessPlayer.white && moveScorePreemptive.score < alphaPrune + adjustmentFactor) ||
                    (move.player == ChessPlayer.black && moveScorePreemptive.score > alphaPrune - adjustmentFactor))
            ) {
                depthAdjustment = -1; // Conservative depth reduction
            }
    
            const newDepth = depthRemaining - 1 + depthAdjustment;
            const thisMoveH = this.negamax(
                boardState,
                player === ChessPlayer.white ? ChessPlayer.black : ChessPlayer.white,
                newDepth,
                -betaPrune,
                -alphaPrune,
                -negateMult,
                cutoffTimeMs,
                [...movePath, move],
                null
            );
            boardState.undoLastMove();
    
            // Flip the score for negamax calculation
            const currentScore = -1 * thisMoveH.response[0].hScore.score;
    
            if (currentScore > bestMoves[0].hScore.score) {
                bestMoves = thisMoveH.response.map(moveScore => ({
                    hScore: { ...moveScore.hScore, score: currentScore },
                    move,
                    movePath: moveScore.movePath
                }));

                if (this.settings.alphaBetaPruneEnabled) {
                    //alphaPrune = Math.max(alphaPrune, currentScore);
                    alphaPrune = Math.max(alphaPrune, bestMoves[0].hScore.score);
        
                    if (alphaPrune >= betaPrune) {
                        break; // Beta cutoff
                    }
                }
            } else if (currentScore === bestMoves[0].hScore.score) {
                bestMoves = [
                    ...bestMoves,
                    ...thisMoveH.response.map(moveScore => ({
                        hScore: { ...moveScore.hScore, score: currentScore },
                        move,
                        movePath: moveScore.movePath
                    }))
                ];
            }
    
            if (+new Date() >= cutoffTimeMs) {
                timeLimitReached = true;
                break;
            }
        }
    
        // Store in Transposition Table
        if (!timeLimitReached && this.settings.transpositionEnabled) {
            let type: TranspositionTableType;
            if (this.settings.alphaBetaPruneEnabled && bestMoves[0].hScore.score <= alphaPrune) {
                type = TranspositionTableType.upperbound;
            } else if (this.settings.alphaBetaPruneEnabled && bestMoves[0].hScore.score >= betaPrune) {
                type = TranspositionTableType.lowerbound;
            } else {
                type = TranspositionTableType.exact;
            }
    

            for (const move of bestMoves) {
                this.transpositionTable.set(transpositionTableKey, {
                    type,
                    depthRemaining,
                    // TODO: should this be negated?
                    hScore: { ...move.hScore, score: move.hScore.score * negateMult },
                    move: move.move!,
                    movePath: move.movePath
                });
            }
        }
    
        // Log the best move found at this depth
        for (const move of bestMoves) {
            this.moveEvaluations.push({ move: move.move!, evaluation: move.hScore });
        }
    
        return {
            response: bestMoves,
            timeLimitReached: false,
        };
    }
    

    private tryMakeMove(
        boardState: ChessBoardState,
        move: ChessBoardSingleMove
    ): boolean {
        /*boardState.setPiecesFromMove(move, "");
        if (boardState.isPlayerInCheck(move.player)) {
            boardState.undoLastMove();
            return false;
        }
        return true;*/
        const response = ChessMoveValidator.isMoveValid(boardState, move);
        if (response.success) {
            boardState.setPiecesFromMove(move, "");
        }
        return response.success;
    }
}
