import { ChessBoardState } from "../chess-board-state";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMove } from "./chess-piece-available-move";

/**
 * Encapsulation of a set of possible moves
 */
export class ChessPieceAvailableMoveSet {
    private availableMoves = new Map<ChessPosition, ChessPieceAvailableMove>();

    constructor(
        private player: ChessPlayer,
        private boardState: ChessBoardState
    ) {}

    /**
     * Add a potential move, wrapping move if it's a chess position
     */
    add(move: ChessPieceAvailableMove | ChessPosition | null): void {
        // if trying to add an empty move (probably item out of bounds), return
        if (!move) {
            return;
        }

        if (move instanceof ChessPosition) {
            move = new ChessPieceAvailableMove(move);
        }

        // if not castle, don't add if piece of same color is there
        if (!move.getIsCastle()) {
            const existing = this.boardState.getPieceAtPosition(move.getToPosition());
            if (existing?.player === this.player) {
                return;
            }
        }

        this.availableMoves.set(move.getToPosition(), move);
    }

    getMoves(): Iterable<ChessPieceAvailableMove> {
        return this.availableMoves.values();
    }

    /**
     * Check if we have an available move to a certain position
     */
    hasMoveToPosition(pos: ChessPosition): boolean {
        return this.getMoveToPosition(pos) !== null;
    }

    /**
     * Get a move to a position if it exists, or null if none exists
     */
    getMoveToPosition(pos: ChessPosition): ChessPieceAvailableMove | null {
        return this.availableMoves.get(pos) || null;
    }
}
