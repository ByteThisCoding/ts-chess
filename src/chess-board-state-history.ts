import { ChessBoardSingleMove } from "./moves/chess-board-move";
import { ChessBoardState } from "./chess-board-state";
import { ChessPosition } from "./chess-position";
import { ChessPlayer } from "./enums";

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

    /**
     * Register that a move has taken place
     */
    registerMove(move: ChessBoardSingleMove): void {
        this.movesHistory.push(move);
        const moveNumber = this.movesHistory.length % 2 + 1;

        // clear current position
        this.latestBoardState.setPieceAtPosition(move.fromPosition, null, moveNumber);
    
        // handle special cases
        if (move.isEnPassant) {
            // the to-position indicates above or below the pawn to delete
            const existingPawnRow = move.player === ChessPlayer.white ? move.toPosition.row - 1 : move.toPosition.row + 1;
            const existingPawnPos = ChessPosition.get(move.toPosition.col, existingPawnRow);
            
            this.latestBoardState.setPieceAtPosition(existingPawnPos, null, moveNumber);
            this.latestBoardState.setPieceAtPosition(move.toPosition, move.pieceMoved, moveNumber);
        } else if (move.isCastle) {
            const rowNumber = move.player === ChessPlayer.white ? 1 : 8;
            // the to-position indicates the rook to castle with
            const rook = this.latestBoardState.getPieceAtPosition(move.toPosition)!;
            // also clear rook's position
            this.latestBoardState.setPieceAtPosition(move.toPosition, null, moveNumber);

            if (rook.getPosition().col === 1) {
                // queenside
                this.latestBoardState.setPieceAtPosition(
                    ChessPosition.get(3, rowNumber),
                    move.pieceMoved,
                    moveNumber
                );
                this.latestBoardState.setPieceAtPosition(
                    ChessPosition.get(4, rowNumber),
                    rook,
                    moveNumber
                );
            } else {
                // kingside
                this.latestBoardState.setPieceAtPosition(
                    ChessPosition.get(6, rowNumber),
                    rook,
                    moveNumber
                );
                this.latestBoardState.setPieceAtPosition(
                    ChessPosition.get(7, rowNumber),
                    move.pieceMoved,
                    moveNumber
                );
            }

        } else {
            // default case
            this.latestBoardState.setPieceAtPosition(move.toPosition, move.pieceMoved, moveNumber);
        }
    }

    /**
     * Undo the last move and return the last move object
     */
    undoMove(): ChessBoardSingleMove {
        const lastMove = this.movesHistory.pop()!;
        const moveNumber = this.movesHistory.length % 2 + 1;

        // undo erasure of previous toPosition
        const prevPiece = lastMove.toPositionPrevPiece;
        this.latestBoardState.setPieceAtPosition(
            lastMove.toPosition,
            prevPiece,
            moveNumber
        );
        this.latestBoardState.setPieceAtPosition(
            lastMove.fromPosition,
            lastMove.pieceMoved,
            moveNumber
        );

        return lastMove;
    }

    getCurrentBoardState(): ChessBoardState {
        return this.latestBoardState;
    }
}
