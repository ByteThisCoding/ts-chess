import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPiece } from "../pieces/chess-piece";
import { ChessBoardSingleMove } from "./chess-board-move";

/**
 * Encapsulation of a set of possible moves
 */
export class ChessPieceAvailableMoveSet {
    private availableMoves = new Map<ChessPosition, ChessBoardSingleMove[]>();

    constructor(
        private player: ChessPlayer,
        private boardState: ChessBoardState
    ) {}

    /**
     * Add a potential move, wrapping move if it's a chess position
     */
    add(move: ChessBoardSingleMove | null): void {
        // if trying to add an empty move (probably item out of bounds), return
        if (!move) {
            return;
        }

        // if not castle, don't add if piece of same color is there
        if (!move.isCastle) {
            const existing = this.boardState.getPieceAtPosition(
                move.toPosition
            );
            if (existing?.player === this.player) {
                return;
            }
        }

        if (!this.availableMoves.has(move.toPosition)) {
            this.availableMoves.set(move.toPosition, []);
        }

        this.availableMoves.get(move.toPosition)!.push(move);
    }

    /**
     * Remove a move from this set
     */
    remove(move: ChessBoardSingleMove): void {
        const moves = this.availableMoves.get(move!.toPosition);
        if (!moves || moves.length === 0) {
            return;
        }

        const moveIndex = moves.findIndex((mv) => mv.equals(move));
        if (moveIndex === -1) {
            return;
        }

        moves.splice(moveIndex, 1);
    }

    /**
     * Combine the moves of another instance of this class into this
     */
    merge(movesSet: ChessPieceAvailableMoveSet): void {
        for (const [pos, moves] of movesSet.availableMoves) {
            for (const move of moves) {
                this.add(move);
            }
        }
    }

    *getMoves(): Iterable<ChessBoardSingleMove> {
        for (const [pos, moves] of this.availableMoves) {
            for (const move of moves) {
                yield move;
            }
        }
    }

    *getMovesForPieceType(
        pieceType: ChessPiece
    ): Iterable<ChessBoardSingleMove> {
        for (const [pos, moves] of this.availableMoves) {
            for (const move of moves) {
                if (move.pieceMoved.letter === pieceType.letter) {
                    yield move;
                }
            }
        }
    }

    getNumMoves(): number {
        return this.availableMoves.size;
    }

    /**
     * Check if we have an available move to a certain position
     */
    hasMoveToPosition(pos: ChessPosition): boolean {
        return this.getMovesToPosition(pos).length > 0;
    }

    /**
     * Get a move to a position if it exists, or null if none exists
     */
    getMovesToPosition(pos: ChessPosition): ChessBoardSingleMove[] {
        const moves = this.availableMoves.get(pos);
        return moves || [];
    }
}
