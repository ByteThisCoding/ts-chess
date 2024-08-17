import { ChessBoardSingleMove } from "../moves/chess-board-move.model";
import { ChessNotation } from "../notation/chess-notation-parser";
import { ChessBoardStateImpl } from "./chess-board-state-impl";

/**
 * This will encapsulate a chess board's current state
 * and previous moves made
 *
 * Each move will contain instructions for rewind to aid
 * in visualization
 */
export class ChessBoardStateHistory {
    // initialize with the start board
    private latestBoardState = ChessBoardStateImpl.getStartBoard();

    private movesHistory: ChessBoardSingleMove[] = [];

    // TODO: can we make more efficient by chaining instead of cloning?
    // we'd need to handle how to store captured pieces
    private boardHistory: ChessBoardStateImpl[] = [];

    getListOfMovesNotation(): string[] {
        const moves = this.boardHistory
            .map((bh) => bh.getLastMoveNotation())
            .filter((mv) => mv.trim());
        moves.push(this.latestBoardState.getLastMoveNotation());
        return moves;
    }

    /**
     * Register that a move has taken place
     */
    registerMove(move: ChessBoardSingleMove): void {
        this.boardHistory.push(this.getBoardState().clone());
        this.movesHistory.push(move);
        const notation = ChessNotation.convertMoveToNotation(
            this.getBoardState(),
            move
        );

        this.getBoardState().setPiecesFromMove(move, notation);
    }

    /**
     * Undo the last move and return the last move object
     * TODO: can we make more efficient by not cloning
     */
    undoMove(): ChessBoardSingleMove {
        const lastMove = this.movesHistory.pop()!;
        const lastBoard = this.boardHistory.pop()!;

        this.latestBoardState = lastBoard;

        return lastMove;
    }

    getBoardState(): ChessBoardStateImpl {
        return this.latestBoardState;
    }
}
