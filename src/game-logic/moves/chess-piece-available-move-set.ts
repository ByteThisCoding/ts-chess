import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPiece } from "../pieces/chess-piece";
import { ChessBoardSingleMove } from "./chess-board-move";
import { ChessBoardSingleMoveShadow } from "./chess-board-shadow-move";
import { ProfileAllMethods } from "../../util/profile-all-methods";

/**
 * Encapsulation of a set of possible moves
 */
@ProfileAllMethods
export class ChessPieceAvailableMoveSet {
    private availableMoves = new Map<ChessCell, ChessBoardSingleMove[]>();
    private shadowMoves = new Map<ChessCell, ChessBoardSingleMoveShadow[]>();
    private blockedPositions = new Set<ChessCell>();

    private numMoves = 0;

    constructor(private player: ChessPlayer) {}

    clear(): void {
        this.numMoves = 0;
        this.availableMoves.clear();
        this.shadowMoves.clear();
        this.blockedPositions.clear();
    }

    getNumMoves(): number {
        return this.numMoves;
    }

    addBlockedPosition(pos: ChessCell): void {
        //if (pos > -1 && pos < 64) {
            this.blockedPositions.add(pos);
        //}
    }

    /**
     * Add a potential move, wrapping move if it's a chess position
     */
    addMove(
        move: ChessBoardSingleMove | null,
        boardState: ChessBoardState
    ): void {
        // if trying to add an empty move (probably item out of bounds), return
        if (!move) {
            return;
        }

        // if not castle, don't add if piece of same color is there
        if (!move.isCastle) {
            const existing = boardState.getPieceAtPosition(move.toPosition);
            if (existing?.player === this.player) {
                return;
            }
        }

        if (!this.availableMoves.has(move.toPosition)) {
            this.availableMoves.set(move.toPosition, []);
        }

        this.availableMoves.get(move.toPosition)!.push(move);
        this.numMoves++;
    }

    /**
     * A shadow move is a move which is blocked by a single piece which is owned by the enemy
     */
    addShadowMove(move: ChessBoardSingleMoveShadow | null): void {
        // if trying to add an empty move (probably item out of bounds), return
        if (!move) {
            return;
        }

        if (!this.shadowMoves.has(move.toPosition)) {
            this.shadowMoves.set(move.toPosition, []);
        }

        this.shadowMoves.get(move.toPosition)!.push(move);
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

        this.numMoves--;
        moves.splice(moveIndex, 1);
        if (moves.length === 0) {
            this.availableMoves.delete(move!.toPosition);
        }
    }

    removeBlockedPosition(pos: ChessCell): void {
        this.blockedPositions.delete(pos);
    }

    /**
     * Combine the moves of another instance of this class into this
     */
    merge(
        movesSet: ChessPieceAvailableMoveSet,
        boardState: ChessBoardState
    ): void {
        for (const [pos, moves] of movesSet.availableMoves) {
            for (const move of moves) {
                this.addMove(move, boardState);
            }
        }

        for (const [pos, moves] of movesSet.shadowMoves) {
            for (const move of moves) {
                this.addShadowMove(move);
            }
        }

        for (const pos of movesSet.blockedPositions) {
            this.addBlockedPosition(pos);
        }
    }

    *getMoves(): Iterable<ChessBoardSingleMove> {
        for (const [pos, moves] of this.availableMoves) {
            for (const move of moves) {
                yield move;
            }
        }
    }

    *getShadowMoves(): Iterable<ChessBoardSingleMoveShadow> {
        for (const [pos, moves] of this.shadowMoves) {
            for (const move of moves) {
                yield move;
            }
        }
    }

    *getBlockedPositions(): Iterable<ChessCell> {
        for (const pos of this.blockedPositions) {
            yield pos;
        }
    }

    hasBlockedPosition(pos: ChessCell): boolean {
        return this.blockedPositions.has(pos);
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

    hasMoves(): boolean {
        return this.numMoves > 0;
    }

    /**
     * Check if we have an available move to a certain position
     */
    hasMoveToPosition(pos: ChessCell): boolean {
        return this.getMovesToPosition(pos).length > 0;
    }

    hasShadowMoveToPosition(pos: ChessCell): boolean {
        return this.getShadowMovesToPosition(pos).length > 0;
    }

    /**
     * Get a move to a position if it exists, or null if none exists
     */
    getMovesToPosition(pos: ChessCell): ChessBoardSingleMove[] {
        const moves = this.availableMoves.get(pos);
        return moves || [];
    }

    getShadowMovesToPosition(pos: ChessCell): ChessBoardSingleMoveShadow[] {
        const moves = this.shadowMoves.get(pos);
        return moves || [];
    }
}
