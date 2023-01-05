import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move";
import { iChessAiPlayer } from "../models/chess-ai";
import { iChessAiHeuristic } from "../models/heuristic";

// internal class used to faciliate depth traversal
class DepthTraversalRecord {
    constructor(
        public readonly score: number,
        public move?: ChessBoardSingleMove
    ) {}
}

export class ChessMinimaxAiPlayer implements iChessAiPlayer {
    // TODO: make configurable
    private MAX_DEPTH = 4;

    constructor(private heuristic: iChessAiHeuristic) {}

    /**
     * Assumes this player is the opposite of the player that just went
     */
    determineNextMove(boardState: ChessBoardState): ChessBoardSingleMove {
        const player =
            boardState.getLastMove()?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;
        const searchResult = this.depthSearchForMove(
            boardState,
            player,
            this.MAX_DEPTH,
            -Infinity,
            Infinity
        );

        if (!searchResult?.move) {
            throw new Error(`The AI couldn't find a move.`);
        }
        console.log(player, searchResult.move.toString(), searchResult.score);
        return searchResult.move;
    }

    private depthSearchForMove(
        boardState: ChessBoardState,
        thisPlayer: ChessPlayer,
        depthRemaining: number,
        alphaPruneValue: number,
        betaPruneValue: number,
        lastRecord?: DepthTraversalRecord
    ): DepthTraversalRecord {
        // base case, return current evaluation
        if (depthRemaining === 0) {
            const score = this.heuristic.getScore(boardState);
            return new DepthTraversalRecord(score);
        }

        // recursive case, search through moves, prune, and return
        const possibleMoves = boardState.getPossibleMovesForPlayer(thisPlayer);
        let record = lastRecord;

        // put in a list so we can start it at a random position

        for (const move of possibleMoves.getMoves()) {
            const newBoard = boardState.clone();
            const newMove = move.clone();
            newBoard.setPiecesFromMove(newMove, "");

            const enemy =
                thisPlayer === ChessPlayer.white
                    ? ChessPlayer.black
                    : ChessPlayer.white;
            const newRecord = this.depthSearchForMove(
                newBoard,
                enemy,
                depthRemaining - 1,
                alphaPruneValue,
                betaPruneValue,
                lastRecord
            );

            // update if this is a better match
            if (!record) {
                record = newRecord;
                record.move = move;
            } else if (thisPlayer === ChessPlayer.white) {
                if (newRecord.score > record.score) {
                    record = newRecord;
                    record.move = move;
                }

                // beta pruning
                if (record.score > betaPruneValue) {
                    break;
                }

                alphaPruneValue = Math.max(alphaPruneValue, record.score);
            } else {
                if (newRecord.score < record.score) {
                    record = newRecord;
                    record.move = move;
                }

                // alpha pruning
                if (record.score < alphaPruneValue) {
                    break;
                }

                betaPruneValue = Math.min(betaPruneValue, record.score);
            }
        }

        return record!;
    }
}
