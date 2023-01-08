import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move";
import { ChessBoardMoveValidationFailure } from "../../game-logic/moves/chess-board-move-validation-status";
import { ChessMoveValidator } from "../../game-logic/moves/chess-move-validator";
import { KnightPiece } from "../../game-logic/pieces/knight";
import { QueenPiece } from "../../game-logic/pieces/queen";
import { ChessPosition } from "../../game-logic/position/chess-position";
import { iChessAiPlayer } from "../models/chess-ai";
import {
    iChessAiHeuristic,
    iChessAiHeuristicEvaluation,
} from "../models/heuristic";

/**
 * Negamax with alpha beta pruning
 */
export class ChessMinimaxAiPlayer implements iChessAiPlayer {
    // TODO: make configurable
    private BASE_DEPTH = 4;

    constructor(private heuristic: iChessAiHeuristic) {}

    // TODO: add a node to record previous traversals to save time (we restart at each node)

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

        const numPieces = [...boardState.getAllPieces()].length;

        const depth = this.BASE_DEPTH + Math.round(32 / numPieces) - 1;

        const { hScore, moves } = this.lookAheadAtMove(
            cloneBoard,
            player,
            enemy,
            this.BASE_DEPTH,
            depth,
            -Infinity,
            Infinity,
            negateMult,
            [],
            new Map()
        ) as any;

        // find the uncloned version of the move, we need object referential equality
        let bestMoveOriginal!: ChessBoardSingleMove;
        if (moves.length > 0) {
            const move = moves[0];
            for (const findMove of boardState
                .getPossibleMovesForPlayer(player)
                .getMoves()) {
                if (move.equals(findMove)) {
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
        console.log(moves.map((mv: ChessBoardSingleMove) => mv.toString()));
        return bestMoveOriginal || null;
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
        enemy: ChessPlayer,
        totalDepth: number,
        depthRemaining: number,
        alphaPrune: number,
        betaPrune: number,
        negateMult: number,
        pathMoves: ChessBoardSingleMove[],
        transpositionTable: Map<
            string,
            {
                hScore: iChessAiHeuristicEvaluation;
                move: ChessBoardSingleMove;
                depth: number;
            }
        >
    ): { hScore: iChessAiHeuristicEvaluation; moves: ChessBoardSingleMove[] } {
        let bestMoveH: iChessAiHeuristicEvaluation = {
            score: -Infinity,
            data: {},
        };
        let bestMove: ChessBoardSingleMove;
        let bestMovePath = pathMoves;

        const stateKey = boardState.toString();

        let transpositionTableValueUsed = false;

        // TODO: this seems to produce bad moves, fix or delete optimization
        /*if (transpositionTable.has(stateKey)) {
            const tableResult = transpositionTable.get(stateKey)!;
            if (tableResult.depth >= depthRemaining) {
                bestMoveH = tableResult.hScore;
                bestMoveH.score *= negateMult;
                bestMove = tableResult.move;
                pathMoves.push(bestMove);
                transpositionTableValueUsed = true;
            }
        }*/

        if (!transpositionTableValueUsed) {
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
                for (const move of boardState
                    .getPossibleMovesForPlayer(player)
                    .getMoves()) {
                    const moveIsGood = this.tryMakeMove(boardState, move);
                    if (moveIsGood) {
                        possibleMoves.push({
                            move,
                            score: this.heuristic.getScore(boardState).score,
                        });
                        boardState.undoLastMove();
                    }
                }

                // sort the moves based on initial heuristic estimate
                possibleMoves.sort((a, b) => b.score - a.score);

                // TODO: the below was for debugging that the move (Nf6xQh5) exists, since it does we need to find why it is not being occupied
                if (depthRemaining === totalDepth - 1 && boardState.getPieceAtPosition(ChessPosition.get(6, 6))?.letter === KnightPiece.letter) {
                    if (possibleMoves.find(item => item.move.fromPosition === ChessPosition.get(6, 6) && item.move.toPosition === ChessPosition.get(8, 5))) {
                        console.log(possibleMoves.map(pm => pm.move.toString()));
                    }
                }

                for (const { move } of possibleMoves) {
                    const moveIsGood = this.tryMakeMove(boardState, move);
                    if (moveIsGood) {
                        const thisMoveH = this.lookAheadAtMove(
                            boardState,
                            enemy,
                            player,
                            totalDepth,
                            depthRemaining - 1,
                            -betaPrune,
                            -alphaPrune,
                            -negateMult,
                            [...pathMoves, move],
                            transpositionTable
                        );

                        // cleanup for next iteration
                        boardState.undoLastMove();

                        // compare scores
                        thisMoveH.hScore.score *= -1;

                        if (thisMoveH.hScore.score >= bestMoveH.score) {
                            bestMoveH = thisMoveH.hScore;
                        }

                        if (bestMoveH.score > alphaPrune) {
                            alphaPrune = bestMoveH.score;
                            bestMove = move;
                            bestMovePath = thisMoveH.moves;
                        }

                        if (alphaPrune >= betaPrune) {
                            break;
                        }
                    }
                }
            }
        }

        const returnValue = { hScore: bestMoveH, moves: bestMovePath };

        if (depthRemaining > 0) {
            transpositionTable.set(stateKey, {
                hScore: bestMoveH,
                move: bestMove!,
                depth: depthRemaining,
            });
        }
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

        /*if (
            move.toPosition === ChessPosition.get(8, 5) &&
            boardState.getPieceAtPosition(ChessPosition.get(8, 5))?.letter ===
                QueenPiece.letter &&
            move.pieceMoved.letter === KnightPiece.letter
        ) {
            console.log(move.toString(), response);
            console.log(boardState.toStringDetailed());
        }*/
        return response.success;
    }
}
