import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { BishopPiece } from "./bishop";
import { ChessPiece } from "./chess-piece";
import { KingPiece } from "./king";
import { KnightPiece } from "./knight";
import { PawnPiece } from "./pawn";
import { QueenPiece } from "./queen";
import { RookPiece } from "./rook";

export type ChessPieceStatic =
    | typeof PawnPiece
    | typeof RookPiece
    | typeof KnightPiece
    | typeof BishopPiece
    | typeof QueenPiece
    | typeof KingPiece;

export class ChessPieceFactory {
    public static createPiece(
        pieceLetter: string,
        player: ChessPlayer,
        pos: ChessCell
    ): ChessPiece {
        switch (pieceLetter) {
            case PawnPiece.letter:
                return new PawnPiece(player, pos);
            case RookPiece.letter:
                return new RookPiece(player, pos);
            case KnightPiece.letter:
                return new KnightPiece(player, pos);
            case BishopPiece.letter:
                return new BishopPiece(player, pos);
            case QueenPiece.letter:
                return new QueenPiece(player, pos);
            case KingPiece.letter:
                return new KingPiece(player, pos);
        }

        throw new Error(`Invalid piece code: ${pieceLetter}`);
    }

    /**
     * Get a class reference to a piece given its letter; useful for static properties
     */
    public static getPieceClass(pieceLetter: string): ChessPieceStatic {
        switch (pieceLetter) {
            case PawnPiece.letter:
                return PawnPiece;
            case RookPiece.letter:
                return RookPiece;
            case KnightPiece.letter:
                return KnightPiece;
            case BishopPiece.letter:
                return BishopPiece;
            case QueenPiece.letter:
                return QueenPiece;
            case KingPiece.letter:
                return KingPiece;
        }

        throw new Error(`Invalid piece code: ${pieceLetter}`);
    }
}
