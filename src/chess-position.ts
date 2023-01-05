import { ChessCellColor } from "./enums";

/**
 * Instance represents a single position
 * Static methods handle all board positions
 * Accessed by col, row to correspond to "a6" type notation
 */
export class ChessPosition {
    private static positions: ChessPosition[][] = [];

    /**
     * Get a particular position on the board
     */
    public static get(col: number, row: number): ChessPosition {
        // initialize positions objects if needed
        if (this.positions.length === 0) {
            for (let col = 1; col < 9; col++) {
                this.positions.push([]);
                for (let row = 1; row < 9; row++) {
                    this.positions[col - 1].push(new ChessPosition(col, row));
                }
            }
        }

        return this.positions[col - 1][row - 1];
    }

    /**
     * Convert a string such as "a8" to a position
     */
    public static fromString(str: string): ChessPosition {
        const colLetter = str.substring(0, 1).toLowerCase();
        const col = colLetter.charCodeAt(0) - "a".charCodeAt(0) + 1;
        if (col < 1 || col > 8) {
            throw new Error(`Invalid column!`);
        }

        const rowStr = str.substring(1);
        const row = parseInt(rowStr);
        if (isNaN(row) || row < 1 || row > 8) {
            throw new Error(`Invalid row!`);
        }

        return this.get(col, row);
    }

    // we'll use static instances
    private constructor(
        public readonly col: number,
        public readonly row: number
    ) {}

    /**
     * Get the color of the position
     * If row is odd, odd cols are dark
     * If even, even cols are dark
     */
    get color(): string {
        if (this.row % 2 === this.col % 2) {
            return ChessCellColor.dark;
        } else {
            return ChessCellColor.light;
        }
    }

    /**
     * Return a readable string, such as "a6"
     */
    toString(): string {
        const colLetter = String.fromCharCode("a".charCodeAt(0) + this.col - 1);
        return `${colLetter}${this.row}`;
    }
}
