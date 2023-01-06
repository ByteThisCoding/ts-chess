import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { BishopPiece } from "./bishop";
import { ChessPiece } from "./chess-piece";
import { KingPiece } from "./king";
import { KnightPiece } from "./knight";
import { PawnPiece } from "./pawn";
import { QueenPiece } from "./queen";
import { RookPiece } from "./rook";

export class ChessPieceFactory {
    public static createPiece(
        pieceLetter: string,
        player: ChessPlayer,
        pos: ChessCell
    ): ChessPiece {
        switch (pieceLetter.toLowerCase()) {
            case "p":
                return new PawnPiece(player, pos);
            case "r":
                return new RookPiece(player, pos);
            case "n":
                return new KnightPiece(player, pos);
            case "b":
                return new BishopPiece(player, pos);
            case "q":
                return new QueenPiece(player, pos);
            case "k":
                return new KingPiece(player, pos);
        }

        throw new Error(`Invalid piece code: ${pieceLetter}`);
    }
}
