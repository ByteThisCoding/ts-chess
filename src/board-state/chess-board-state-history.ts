import { ChessBoardSingleMove } from "../moves/chess-board-move";
import { ChessBoardState } from "./chess-board-state";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessNotation } from "../notation/chess-notation-parser";

/**
 * This will encapsulate a chess board's current state
 * and previous moves made
 *
 * Each move will contain instructions for rewind to aid
 * in visualization
 */
export class ChessBoardStateHistory {
    // initialize with the start board
    private latestBoardState = ChessBoardState.getStartBoard();

    private movesHistory: ChessBoardSingleMove[] = [];

    // TODO: can we make more efficient by chaining instead of cloning?
    // we'd need to handle how to store captured pieces
    private boardHistory: ChessBoardState[] = [];

    /**
     * Register that a move has taken place
     */
    registerMove(move: ChessBoardSingleMove): void {
        this.boardHistory.push(this.latestBoardState.clone());
        this.movesHistory.push(move);
        const notation = ChessNotation.convertMoveToNotation(
            this.getCurrentBoardState(),
            move
        );
        this.getCurrentBoardState().setPiecesFromMove(move, notation);
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

    getCurrentBoardState(): ChessBoardState {
        return this.latestBoardState;
    }
}
