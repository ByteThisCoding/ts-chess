import { ChessBoardState } from "../board-state/chess-board-state.model";
import { ChessPiece } from "../pieces/chess-piece.model";
import { ChessCell } from "../position/chess-position";
import { ChessBoardSingleMove } from "./chess-board-move.model";

export interface ChessPieceAvailableMoveSet {

    // TODO: shouldn't be public
    availableMoves: Map<ChessCell, ChessBoardSingleMove[]>;
    shadowMoves: Map<ChessCell, ChessBoardSingleMove[]>;
    blockedPositions: Set<ChessCell>;

    clear(): void;

    getNumMoves(): number;

    addBlockedPosition(pos: ChessCell): void;

    /**
     * Add a potential move, wrapping move if it's a chess position
     */
    addMove(
        move: ChessBoardSingleMove | null,
        boardState: ChessBoardState
    ): void;

    /**
     * A shadow move is a move which is blocked by a single piece which is owned by the enemy
     */
    addShadowMove(move: ChessBoardSingleMove | null): void;

    /**
     * Remove a move from this set
     */
    remove(move: ChessBoardSingleMove): void;

    removeBlockedPosition(pos: ChessCell): void;

    /**
     * Combine the moves of another instance of this class into this
     */
    merge(
        movesSet: ChessPieceAvailableMoveSet,
        boardState: ChessBoardState
    ): void;

    getMoves(): Iterable<ChessBoardSingleMove>;

    getShadowMoves(): Iterable<ChessBoardSingleMove>;

    getBlockedPositions(): Iterable<ChessCell>;

    hasBlockedPosition(pos: ChessCell): boolean;

    getMovesForPieceType(
        pieceType: ChessPiece
    ): Iterable<ChessBoardSingleMove>;

    hasMoves(): boolean;

    /**
     * Check if we have an available move to a certain position
     */
    hasMoveToPosition(pos: ChessCell): boolean;

    hasShadowMoveToPosition(pos: ChessCell): boolean;

    /**
     * Get a move to a position if it exists, or null if none exists
     */
    getMovesToPosition(pos: ChessCell): ChessBoardSingleMove[];

    getShadowMovesToPosition(pos: ChessCell): ChessBoardSingleMove[];
}