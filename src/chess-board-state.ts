import { ChessPiece } from "./pieces/chess-piece";
import { ChessPosition } from "./chess-position";
import { ChessPlayer } from "./enums";
import { BishopPiece } from "./pieces/bishop";
import { KingPiece } from "./pieces/king";
import { KnightPiece } from "./pieces/knight";
import { PawnPiece } from "./pieces/pawn";
import { QueenPiece } from "./pieces/queen";
import { RookPiece } from "./pieces/rook";

/**
 * Mutable Representation of a chess board with pieces
 */
export class ChessBoardState {
    // TODO: Add list of pieces captured / uncaptured, can be determined at each set point

    private turnNumber: number = 0;

    private constructor(private positions: Map<ChessPosition, ChessPiece>) {}

    hasPieceAtPosition(pos: ChessPosition): boolean {
        return this.getPieceAtPosition(pos) !== null;
    }

    getTurnNumber(): number {
        return this.turnNumber;
    }

    /**
     * Get the piece at a position, or return null if none there
     */
    getPieceAtPosition(pos: ChessPosition): ChessPiece | null {
        return this.positions.get(pos) || null;
    }

    /**
     * Set a position to have a piece, or null for no piece
     */
    setPieceAtPosition(pos: ChessPosition, piece: ChessPiece | null, turnNumber: number) {
        if (!piece) {
            this.positions.delete(pos);
        } else {
            this.positions.set(pos, piece);
            piece.setPosition(pos, turnNumber);
        }
        this.turnNumber = turnNumber;
    }

    /**
     * Deep clone the state of this board and its pieces
     */
    clone(): ChessBoardState {
        const clonedPositions = new Map<ChessPosition, ChessPiece>();
        for (const [pos, piece] of this.positions) {
            clonedPositions.set(pos, piece.clone());
        }
        const state = new ChessBoardState(clonedPositions);
        state.turnNumber = this.turnNumber;
        return state;
    }

    /**
     * Make a human readable string representation of the board
     */
    toString(): string {
        let board = "";
        for (let row = 8; row > 0; row--) {
            for (let col = 1; col < 9; col++) {
                const piece = this.getPieceAtPosition(
                    ChessPosition.get(col, row)
                );
                let pieceStr = piece ? piece.letter : "-";
                if (piece?.player === ChessPlayer.black) {
                    pieceStr = pieceStr.toLocaleLowerCase();
                }
                board += pieceStr;
            }
            board += "\n";
        }
        return board;
    }

    /**
     * Get a board state object of the beginning of a game
     */
    public static getStartBoard(): ChessBoardState {
        const positions = new Map<ChessPosition, ChessPiece>();

        // temp variable to store positions for insertion
        let pos: ChessPosition;

        // add pawns
        for (let col = 1; col < 9; col++) {
            pos = ChessPosition.get(col, 2);
            // white pawn
            positions.set(pos, new PawnPiece(ChessPlayer.white, pos));

            // black pawn
            pos = ChessPosition.get(col, 7);
            positions.set(pos, new PawnPiece(ChessPlayer.black, pos));
        }

        // add rooks
        pos = ChessPosition.get(1, 1);
        positions.set(pos, new RookPiece(ChessPlayer.white, pos));
        pos = ChessPosition.get(1, 8);
        positions.set(pos, new RookPiece(ChessPlayer.black, pos));
        pos = ChessPosition.get(8, 1);
        positions.set(pos, new RookPiece(ChessPlayer.white, pos));
        pos = ChessPosition.get(8, 8);
        positions.set(pos, new RookPiece(ChessPlayer.black, pos));

        // add knights
        pos = ChessPosition.get(2, 1);
        positions.set(pos, new KnightPiece(ChessPlayer.white, pos));
        pos = ChessPosition.get(2, 8);
        positions.set(pos, new KnightPiece(ChessPlayer.black, pos));
        pos = ChessPosition.get(7, 1);
        positions.set(pos, new KnightPiece(ChessPlayer.white, pos));
        pos = ChessPosition.get(7, 8);
        positions.set(pos, new KnightPiece(ChessPlayer.black, pos));

        // add bishops
        pos = ChessPosition.get(3, 1);
        positions.set(pos, new BishopPiece(ChessPlayer.white, pos));
        pos = ChessPosition.get(3, 8);
        positions.set(pos, new BishopPiece(ChessPlayer.black, pos));
        pos = ChessPosition.get(6, 1);
        positions.set(pos, new BishopPiece(ChessPlayer.white, pos));
        pos = ChessPosition.get(6, 8);
        positions.set(pos, new BishopPiece(ChessPlayer.black, pos));

        // add queens
        pos = ChessPosition.get(4, 1);
        positions.set(pos, new QueenPiece(ChessPlayer.white, pos));
        pos = ChessPosition.get(4, 8);
        positions.set(pos, new QueenPiece(ChessPlayer.black, pos));

        // add kings
        pos = ChessPosition.get(5, 1);
        positions.set(pos, new KingPiece(ChessPlayer.white, pos));
        pos = ChessPosition.get(5, 8);
        positions.set(pos, new KingPiece(ChessPlayer.black, pos));

        return new ChessBoardState(positions);
    }
}
