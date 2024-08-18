import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessBoardSingleMove } from "./chess-board-move.model";
import { ChessPiece } from "../pieces/chess-piece.model";

/**
 * This represents a single player's move (not a grouping of white and black)
 * This object is mutable but should not be mutated outside of the chess piece class
 */
export class ChessBoardSingleMoveImpl implements ChessBoardSingleMove {
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
    ) { }

    /**
     * Returns a deep clone of this and downstream objects
     */
    clone(): ChessBoardSingleMove {
        return new ChessBoardSingleMoveImpl(
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
        return `[${this.player}:${this.pieceMoved.letter
            }:${ChessPosition.toString(this.fromPosition)}:${ChessPosition.toString(
                this.toPosition
            )}]`;
    }

    /**
     * Serializes this move to a JSON-friendly format
     */
    serialize(): any {
        return {
            player: this.player,
            pieceMoved: this.pieceMoved.serialize(),
            fromPosition: this.fromPosition,
            toPosition: this.toPosition,
            isCastle: this.isCastle,
            isEnPassant: this.isEnPassant,
            isPromotion: this.isPromotion,
            promoteToPieceLetter: this.promoteToPieceLetter,
        };
    }

    public static notationToMove(cmd: string): ChessBoardSingleMove {
        throw new Error("not implemented");
    }
}
