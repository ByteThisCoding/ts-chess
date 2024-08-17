import { ChessPlayer } from "../enums";
import { ChessBoardSingleMove } from "../moves/chess-board-move.model";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set.model";
import { ChessPiece } from "../pieces/chess-piece.model";
import { ChessPieceStatic } from "../pieces/chess-piece-factory";
import { KingPiece } from "../pieces/king";
import { ChessCell } from "../position/chess-position";

export interface ChessBoardState {

    getBlackPiecesValue(): number;

    getWhitePiecesValue(): number;

    getScore(): number;

    getBlackPieceTypeCounts(): Map<ChessPieceStatic, number>;

    getWhitePieceTypeCounts(): Map<ChessPieceStatic, number>;

    getPossibleMovementsForPiece(
        piece: ChessPiece
    ): ChessPieceAvailableMoveSet;

    isPlayerInCheck(player: ChessPlayer): boolean;

    isGameInCheck(): boolean;

    isPlayerInCheckmate(player: ChessPlayer): boolean;

    isGameInCheckmate(): boolean;

    isGameInStalemate(): boolean;

    hasPieceAtPosition(pos: ChessCell): boolean;

    getMoveNumber(): number;

    getLastMove(): ChessBoardSingleMove | null;

    getLastMoveNotation(): string;

    getPlayerKingPiece(player: ChessPlayer): KingPiece;

    /**
     * Get the piece at a position, or return null if none there
     */
    getPieceAtPosition(pos: ChessCell): ChessPiece | null;

    getAllPieces(): Iterable<ChessPiece>;

    setPiecesFromMove(
        move: ChessBoardSingleMove | null,
        notation: string
    ): boolean;

    getPossibleMovesForPlayer(player: ChessPlayer): ChessPieceAvailableMoveSet;

    doesMovePutPlayerInIllegalCheck(move: ChessBoardSingleMove): {
        inCheck: boolean;
        piece: ChessPiece | null;
    };

    undoLastMove(): void;

    clone(): ChessBoardState;

    toString(): string;

    toHash(): number;

    toStringDetailed(): string;

    serialize(): string;
}