/**
 * Position is represented by a number
 *
 * [8, 9, 10....]
 * [0, 1, 2, 3, 4, 5, 6, 7]
 */
export type ChessCell = number;

/**
 * Instance represents a single position
 * Static methods handle all board positions
 * Accessed by col, row to correspond to "a6" type notation
 *
 */
export class ChessPosition {
    /**
     * Get a particular position on the board
     */
    public static get(col: number, row: number): ChessCell {
        return (row - 1) * 8 + col - 1;
    }

    public static getCellCol(cell: ChessCell): number {
        return (cell % 8) + 1;
    }

    public static getCellRow(cell: ChessCell): number {
        return Math.floor(cell / 8) + 1;
    }

    /**
     * Convert a string such as "a8" to a position
     */
    public static fromString(str: string): ChessCell {
        const colLetter = str.substring(0, 1).toLowerCase();
        const col = colLetter.charCodeAt(0) - 97 /* "a".charCodeAt(0) */ + 1;
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

    /**
     * Return a readable string, such as "a6"
     */
    static toString(pos: ChessCell): string {
        const colNum = this.getCellCol(pos);
        const rowNum = this.getCellRow(pos);

        const colLetter = String.fromCharCode(
            97 /* "a".charCodeAt(0) */ + colNum - 1
        );
        return `${colLetter}${rowNum}`;
    }
}
