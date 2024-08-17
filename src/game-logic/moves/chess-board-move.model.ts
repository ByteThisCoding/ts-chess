import { ChessPlayer } from "../enums";
import { ChessPiece } from "../pieces/chess-piece.model";
import { ChessCell } from "../position/chess-position";

export interface ChessBoardSingleMove {

    player: ChessPlayer;
    pieceMoved: ChessPiece;
    fromPosition: ChessCell;
    toPosition: ChessCell;
    isCastle: boolean;
    isEnPassant: boolean;
    isPromotion: boolean;
    promoteToPieceLetter: string;

    /**
     * Returns a deep clone of this and downstream objects
     */
    clone(): ChessBoardSingleMove;

    equals(move: ChessBoardSingleMove): boolean;

    toString(): string;

    serialize(): any;
}