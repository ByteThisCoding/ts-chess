import { ChessPosition } from "../chess-position";

export interface ChessPieceAvailableMoveOpts {
    toPosition: ChessPosition;
    isCastle?: boolean;
    isEnPassant?: boolean;
}

/**
 * Encapsulation of a single possible move a piece could make
 */
export class ChessPieceAvailableMove {
    private opts: ChessPieceAvailableMoveOpts;

    constructor(opts: ChessPieceAvailableMoveOpts | ChessPosition) {
        if (opts instanceof ChessPosition) {
            opts = {
                toPosition: opts,
                isCastle: false,
                isEnPassant: false,
            };
        }

        this.opts = opts;
    }

    getToPosition(): ChessPosition {
        return this.opts.toPosition;
    }

    getIsCastle(): boolean {
        return !!this.opts.isCastle;
    }

    getIsEnPassant(): boolean {
        return !this.opts.isEnPassant;
    }

    toString(): string {
        return `${this.opts.toPosition.toString()},${this.getIsCastle()},${
            this.getIsEnPassant
        }`;
    }
}
