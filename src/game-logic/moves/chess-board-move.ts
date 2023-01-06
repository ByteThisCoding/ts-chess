import { ChessPiece } from "../pieces/chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";

/**
 * This represents a single player's move (not a grouping of white and black)
 * This object is mutable but should not be mutated outside of the chess piece class
 */
export class ChessBoardSingleMove {
    get notation(): string {
        throw new Error("not implemented");
    }

    constructor(
        public player: ChessPlayer,
        public pieceMoved: ChessPiece,
        public fromPosition: ChessCell,
        public toPosition: ChessCell,
        public isCastle: boolean = false,
        public isEnPassant: boolean = false,
        public isPromotion: boolean = false,
        public promoteToPieceLetter: string = ""
    ) {}

    /**
     * Returns a deep clone of this and downstream objects
     */
    clone(): ChessBoardSingleMove {
        return new ChessBoardSingleMove(
            this.player,
            this.pieceMoved.clone(),
            this.fromPosition,
            this.toPosition,
            this.isCastle,
            this.isEnPassant,
            this.isPromotion,
            this.promoteToPieceLetter
        );
    }

    equals(move: ChessBoardSingleMove) {
        return (
            this.player === move.player &&
            this.pieceMoved.equals(move.pieceMoved) &&
            this.fromPosition === move.fromPosition &&
            this.toPosition === move.toPosition &&
            this.isCastle === move.isCastle &&
            this.isEnPassant === move.isEnPassant &&
            this.isPromotion === move.isPromotion &&
            this.promoteToPieceLetter === move.promoteToPieceLetter
        );
    }

    toString(): string {
        return `[${this.player}:${
            this.pieceMoved.letter
        }:${ChessPosition.toString(this.fromPosition)}:${ChessPosition.toString(this.toPosition)}]`;
    }

    public static notationToMove(cmd: string): ChessBoardSingleMove {
        throw new Error("not implemented");
    }
}
