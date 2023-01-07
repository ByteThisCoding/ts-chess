import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move";
import { ChessMoveValidator } from "../../game-logic/moves/chess-move-validator";
import { iChessAiPlayer } from "../models/chess-ai";
import { iChessAiHeuristic } from "../models/heuristic";

/**
 * Negamax with alpha beta pruning
 */
export class ChessMinimaxAiPlayer implements iChessAiPlayer {
    // TODO: make configurable
    private MAX_DEPTH = 4;

    constructor(private heuristic: iChessAiHeuristic) { }

    // TODO: add a node to record previous traversals to save time (we restart at each node)

    /**
     * Assumes this player is the opposite of the player that just went
     */
    determineNextMove(boardState: ChessBoardState): ChessBoardSingleMove | null {
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

        const { score, move } = this.lookAheadAtMove(true, cloneBoard, player, enemy, this.MAX_DEPTH, -Infinity, Infinity, negateMult) as any;

        // find the uncloned version of the move, we need object referential equality
        let bestMoveOriginal!: ChessBoardSingleMove;
        if (move) {
            for (const findMove of boardState.getPossibleMovesForPlayer(player).getMoves()) {
                if (move.equals(findMove)) {
                    bestMoveOriginal = findMove;
                    break;
                }
            }
        }

        console.log("AI move determined in " + ((+new Date() - start) / 1000) + " seconds: (" + score + ") " + bestMoveOriginal?.toString() || ":resign:");
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
        isRoot: boolean,
        boardState: ChessBoardState,
        player: ChessPlayer,
        enemy: ChessPlayer,
        depthRemaining: number,
        alphaPrune: number,
        betaPrune: number,
        negateMult: number
    ): number | { score: number, move: ChessBoardSingleMove } {
        let bestMoveScore = -Infinity;
        let bestMove: ChessBoardSingleMove;

        // base case, depth is 0
        if (depthRemaining === 0) {
            bestMoveScore = this.heuristic.getScore(boardState) * negateMult;
        } else {

            // default, keep looking
            const possibleMoves = boardState.getPossibleMovesForPlayer(player);
            for (const move of possibleMoves.getMoves()) {

                // only proceed if the move is legal
                const moveIsGood = this.tryMakeMove(boardState, move);
                if (moveIsGood) {

                    const thisMoveScore = -this.lookAheadAtMove(false, boardState, enemy, player, depthRemaining - 1, -betaPrune, -alphaPrune, -negateMult);
                    boardState.undoLastMove();

                    if (thisMoveScore >= bestMoveScore) {
                        bestMoveScore = thisMoveScore;
                        //bestMove = move;
                    }

                    if (bestMoveScore > alphaPrune) {
                        alphaPrune = bestMoveScore;
                        bestMove = move;
                    }

                    if (alphaPrune >= betaPrune) {
                        //bestMoveScore = alphaPrune;
                        break;
                    }

                }
            }
        }

        const returnValue = isRoot ? { score: bestMoveScore, move: bestMove! } : bestMoveScore!;
        return returnValue;
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
