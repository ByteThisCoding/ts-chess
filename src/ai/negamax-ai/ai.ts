import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move";
import { ChessMoveValidator } from "../../game-logic/moves/chess-move-validator";
import { ProfileAllMethods } from "../../util/profile-all-methods";
import { iChessAiPlayer } from "../models/chess-ai";
import { iChessAiHeuristic, iChessAiHeuristicEvaluation } from "../models/heuristic";

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
export class ChessNegamaxAiPlayer implements iChessAiPlayer {

    private settings = {
        transpositionEnabled: true,
        nullPruneEnabled: false,
        iterativeDeepeningEnabled: true,
        preemptiveDepthReductionEnabled: false,
        alphaBetaPruneEnabled: true,
        moveSortingEnabled: true
    };

    private maxDepth: number;
    private maxSearchTimeMs: number;
    private transpositionTable = new Map<number, iTranspositionTableEntry>();
    private moveEvaluations: { move: ChessBoardSingleMove; evaluation: iChessAiHeuristicEvaluation }[] = [];

    constructor(
        private heuristic: iChessAiHeuristic,
        private sortHeuristic: iChessAiHeuristic,
        difficultyMode: ChessAiDifficultyMode = ChessAiDifficultyMode.ultra
    ) {
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
    ): Promise<ChessBoardSingleMove | null> {
        const start = +new Date();
        const player = boardState.getLastMove()?.player === ChessPlayer.white ? ChessPlayer.black : ChessPlayer.white;
        //console.log("Available moves", [...boardState.getPossibleMovesForPlayer(player).getMoves()].map(m => m.toString()))

        const negateMult = player === ChessPlayer.white ? 1 : -1;

        this.moveEvaluations = []; // Reset move evaluations before starting

        const { move, hScore, movePath } = this.settings.iterativeDeepeningEnabled
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
                []
            )

        // Log the move evaluations after the search is complete
        /*console.log("Move Evaluations:", this.moveEvaluations.map(ev => ({
            move: ev.move.toString(),
            evaluation: ev.evaluation.score
        })));*/

        // Log the final best path
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

        return move || null;
    }

    private iterativeDeepeningNegamax(
        boardState: ChessBoardState,
        player: ChessPlayer,
        negateMult: number
    ): iLookaheadResponse {
        let response: iLookaheadResponse = { hScore: { score: -Infinity, data: {} }, move: null, movePath: [] };

        const cutoffTimeMs = +new Date() + this.maxSearchTimeMs;

        for (let depth = 1; depth <= this.maxDepth; depth++) {
            console.log("Starting iterative deepening search of depth: " + depth);

            const thisResponse = this.negamax(
                boardState,
                player,
                depth,
                -Infinity,
                Infinity,
                negateMult,
                cutoffTimeMs,
                []
            );

            if (!response.move || !thisResponse.timeLimitReached) {
                console.log("Updating best move at depth", depth, ": ", thisResponse.move?.toString());
                console.log("Current Path:", thisResponse.movePath.map(m => m?.toString()).join(" -> "), thisResponse.hScore);

                // make the move and get opponent player moves
                //boardState.setPiecesFromMove(thisResponse.move, "");
                //console.log("All opponent player moves", [...boardState.getPossibleMovesForPlayer(player === ChessPlayer.white ? ChessPlayer.black : ChessPlayer.white).getMoves()].map(m => m.toString()))
                //boardState.undoLastMove();
                response = thisResponse;
            }

            if (+new Date() >= cutoffTimeMs) {
                break;
            }
        }

        return response;
    }

    private negamax(
        boardState: ChessBoardState,
        player: ChessPlayer,
        depthRemaining: number,
        alphaPrune: number,
        betaPrune: number,
        negateMult: number,
        cutoffTimeMs: number,
        movePath: (ChessBoardSingleMove | null)[]
    ): iLookaheadResponse & { timeLimitReached: boolean } {
        let timeLimitReached = false;
    
        let bestMoveH: iChessAiHeuristicEvaluation = { score: -Infinity, data: {} };
        let bestMove: ChessBoardSingleMove | null = null;
        let bestMovePath: (ChessBoardSingleMove | null)[] = [...movePath];
    
        const transpositionTableKey = boardState.toHash();
    
        if (this.settings.transpositionEnabled && this.transpositionTable.has(transpositionTableKey)) {
            const tableResult = this.transpositionTable.get(transpositionTableKey)!;
            
            if (tableResult.depthRemaining >= depthRemaining) {
                return {
                    hScore: { ...tableResult.hScore, score: tableResult.hScore.score * negateMult },
                    move: tableResult.move,
                    movePath: [...movePath, tableResult.move],
                    timeLimitReached: false
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
                    movePath
                );
                boardState.undoLastMove();
    
                if (-nullMoveH.hScore.score >= betaPrune) {
                    return {
                        hScore: { score: betaPrune, data: {} },
                        move: null!,
                        movePath: [...movePath],
                        timeLimitReached: false
                    };
                }
            }
        }
    
        // Base case: if depth is 0, evaluate the board
        if (depthRemaining <= 0) {
            bestMoveH = this.heuristic.getScore(boardState, bestMoveH.score, player === ChessPlayer.white);
            bestMoveH.score *= negateMult; // Flip the score for negamax
            //console.log(negateMult, "Low depth:", movePath.map(mv => mv?.toString()), bestMoveH.score);
            return { hScore: bestMoveH, move: null!, movePath: [...movePath], timeLimitReached: false };
        }
    
        // Generate and evaluate moves
        const possibleMoves: { move: ChessBoardSingleMove; score: number }[] = [];
        for (const move of boardState.getPossibleMovesForPlayer(player).getMoves()) {
            const moveIsGood = this.tryMakeMove(boardState, move);
            if (moveIsGood) {
                const score = this.sortHeuristic.getScore(boardState, bestMoveH.score, player === ChessPlayer.white);
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
                [...movePath, move]
            );
            boardState.undoLastMove();
    
            // Flip the score for negamax calculation
            const currentScore = -1 * thisMoveH.hScore.score;
    
            if (currentScore > bestMoveH.score) {
                bestMoveH = { ...thisMoveH.hScore, score: currentScore };
                bestMove = move;
                bestMovePath = [...thisMoveH.movePath];

                if (this.settings.alphaBetaPruneEnabled) {
                    //alphaPrune = Math.max(alphaPrune, currentScore);
                    alphaPrune = Math.max(alphaPrune, bestMoveH.score);
        
                    if (alphaPrune >= betaPrune) {
                        break; // Beta cutoff
                    }
                }
            }
    
            if (+new Date() >= cutoffTimeMs) {
                timeLimitReached = true;
                break;
            }
        }
    
        // Store in Transposition Table
        if (!timeLimitReached && this.settings.transpositionEnabled) {
            let type: TranspositionTableType;
            if (this.settings.alphaBetaPruneEnabled && bestMoveH.score <= alphaPrune) {
                type = TranspositionTableType.upperbound;
            } else if (this.settings.alphaBetaPruneEnabled && bestMoveH.score >= betaPrune) {
                type = TranspositionTableType.lowerbound;
            } else {
                type = TranspositionTableType.exact;
            }
    
            this.transpositionTable.set(transpositionTableKey, {
                type,
                depthRemaining,
                // TODO: should this be negated?
                hScore: { ...bestMoveH, score: bestMoveH.score * negateMult },
                move: bestMove!,
                movePath: bestMovePath
            });
        }
    
        // Log the best move found at this depth
        if (bestMove) {
            this.moveEvaluations.push({ move: bestMove, evaluation: bestMoveH });
        }
    
        return { hScore: bestMoveH, move: bestMove, movePath: bestMovePath, timeLimitReached };
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
