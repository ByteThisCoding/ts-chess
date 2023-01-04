import { ChessPiece } from "../pieces/chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { BishopPiece } from "../pieces/bishop";
import { KingPiece } from "../pieces/king";
import { KnightPiece } from "../pieces/knight";
import { PawnPiece } from "../pieces/pawn";
import { QueenPiece } from "../pieces/queen";
import { RookPiece } from "../pieces/rook";
import { ChessBoardSingleMove } from "../moves/chess-board-move";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Mutable Representation of a chess board with pieces
 */
export class ChessBoardState {
    // TODO: Add list of pieces captured / uncaptured, can be determined at each set point

    private lastMove: ChessBoardSingleMove | null = null;

    // this is move, not turn, and 0 based, so white's first is 0 and black's first is 1
    private moveNumber = 0;

    private isBlackInCheck = false;
    private isWhiteInCheck = false;
    private isBlackInCheckmate = false;
    private isWhiteInCheckmate = false;
    private isStalemate = false;

    // store here so we don't have to search on each move
    private whiteKingPiece!: KingPiece;
    private blackKingPiece!: KingPiece;

    private constructor(private positions: Map<ChessPosition, ChessPiece>) {
        for (const [pos, piece] of positions) {
            if (piece instanceof KingPiece) {
                if (piece.player === ChessPlayer.white) {
                    this.whiteKingPiece = piece;
                } else {
                    this.blackKingPiece = piece;
                }
            }
        }
    }

    isPlayerInCheck(player: ChessPlayer): boolean {
        return player === ChessPlayer.white ? this.isWhiteInCheck : this.isBlackInCheck;
    }

    isPlayerInCheckmate(player: ChessPlayer): boolean {
        return player === ChessPlayer.white ? this.isWhiteInCheckmate : this.isBlackInCheckmate;
    }

    isGameInStalemate(): boolean {
        return this.isStalemate;
    }

    hasPieceAtPosition(pos: ChessPosition): boolean {
        return this.getPieceAtPosition(pos) !== null;
    }

    getMoveNumber(): number {
        return this.moveNumber;
    }

    getLastMove(): ChessBoardSingleMove | null {
        return this.lastMove;
    }

    getPlayerKingPiece(player: ChessPlayer): KingPiece {
        return player === ChessPlayer.white ? this.whiteKingPiece : this.blackKingPiece;
    }

    /**
     * Get the piece at a position, or return null if none there
     */
    getPieceAtPosition(pos: ChessPosition): ChessPiece | null {
        return this.positions.get(pos) || null;
    }

    /**
     * Indicate that a move has occured
     */
    setPiecesFromMove(move: ChessBoardSingleMove, moveNumber: number): void {
        // clear current position
        this.updateSinglePiece(move.fromPosition, null, moveNumber);
    
        // handle special cases
        if (move.isEnPassant) {
            // the to-position indicates above or below the pawn to delete
            const existingPawnRow = move.player === ChessPlayer.white ? move.toPosition.row - 1 : move.toPosition.row + 1;
            const existingPawnPos = ChessPosition.get(move.toPosition.col, existingPawnRow);
            
            this.updateSinglePiece(existingPawnPos, null, moveNumber);
            this.updateSinglePiece(move.toPosition, move.pieceMoved, moveNumber);

        } else if (move.isCastle) {
            const rowNumber = move.player === ChessPlayer.white ? 1 : 8;
            // the to-position indicates the rook to castle with
            const rook = this.getPieceAtPosition(move.toPosition)!;
            // also clear rook's position
            this.updateSinglePiece(move.toPosition, null, moveNumber);

            if (rook.getPosition().col === 1) {
                // queenside
                this.updateSinglePiece(
                    ChessPosition.get(3, rowNumber),
                    move.pieceMoved,
                    moveNumber
                );

                this.updateSinglePiece(
                    ChessPosition.get(4, rowNumber),
                    rook,
                    moveNumber
                );
            } else {
                // kingside
                this.updateSinglePiece(
                    ChessPosition.get(6, rowNumber),
                    rook,
                    moveNumber
                );
                this.updateSinglePiece(
                    ChessPosition.get(7, rowNumber),
                    move.pieceMoved,
                    moveNumber
                );
            }

        } else {
            // default case
            this.updateSinglePiece(move.toPosition, move.pieceMoved, moveNumber);
        }

        // update move + number
        this.lastMove = move;
        this.moveNumber = moveNumber;

        // check if anybody is in check, checkmate, or stalemate
        this.updateCheckStalemateStatus();
    }

    /**
     * Given a player, see what moves they can make next (even if it's not their turn)
     */
    getPossibleMovesForPlayer(player: ChessPlayer): ChessPieceAvailableMoveSet {
        const allPlayerMoves = new ChessPieceAvailableMoveSet(player, this);

        for (const [pos, piece] of this.positions) {
            if (piece.player === player) {
                const possibleMoves = piece.getPossibleMovements(this);
                allPlayerMoves.merge(possibleMoves);
            }
        }

        return allPlayerMoves;
    }

    /**
     * After a move is made, this is called to check if the reverse player is in check
     * This checks by seeing if the player that just went has a line of sight of the king for possible moves
     */
    private updateCheckStalemateStatus(): void {
        // reset, update later if needed
        this.isBlackInCheck = false;
        this.isWhiteInCheck = false;

        // search through possible moves
        const lastPlayerPossibleMoves = this.getPossibleMovesForPlayer(this.lastMove!.player);   
        const enemy = this.lastMove?.player === ChessPlayer.white ? ChessPlayer.black : ChessPlayer.white;
        const enemyPossibleMoves = this.getPossibleMovesForPlayer(enemy);

        // check if enemy's king's position is included
        const enemyKing = this.getPlayerKingPiece(enemy);
        const enemyKingPos = enemyKing.getPosition();

        for (const move of lastPlayerPossibleMoves.getMoves()) {
            if (move.toPosition === enemyKingPos) {
                if (enemy === ChessPlayer.white) {
                    this.isWhiteInCheck = true;
                } else {
                    this.isBlackInCheck = true;
                }
                break;
            }
        }

        // if in check, see if it's a checkmate
        if (this.isBlackInCheck || this.isWhiteInCheck) {
            // assume true until we find counter example
            let isCheckmate = true;
            // check by iterating through possible enemy moves, then re-checking check status
            for (const move of enemyPossibleMoves.getMoves()) {
                const freshBoard = this.clone();
                freshBoard.setPiecesFromMove(move.clone(), this.moveNumber + 1);

                // if no longer in mate, we've found a viable move
                if (!freshBoard.isPlayerInCheck(enemy)) {
                    isCheckmate = false;
                    break;
                }
            }

            if (this.isBlackInCheck) {
                this.isBlackInCheckmate = isCheckmate;
            } else {
                this.isWhiteInCheckmate = isCheckmate;
            }
        } else {
            // if not in check, check if stalemate by seeing if enemy has any possible moves
            this.isStalemate = enemyPossibleMoves.getNumMoves() === 0;
        }
    }

    private updateSinglePiece(pos: ChessPosition, piece: ChessPiece | null, moveNumber: number): void {
        if (!piece) {
            this.positions.delete(pos);
        } else {
            this.positions.set(pos, piece);
            piece.setPosition(pos, moveNumber);
        }
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
        state.lastMove = this.lastMove;
        state.isBlackInCheck = this.isBlackInCheck;
        state.isWhiteInCheck = this.isWhiteInCheck;
        state.isBlackInCheckmate = this.isBlackInCheckmate;
        state.isWhiteInCheckmate = this.isWhiteInCheckmate;
        state.isStalemate = this.isStalemate;
        state.whiteKingPiece = this.whiteKingPiece;
        state.blackKingPiece = this.blackKingPiece;
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

        board += "\n\n";
        board += `White check: ${this.isWhiteInCheck} | White checkmate: ${this.isWhiteInCheckmate} | White King: ${this.whiteKingPiece.getPosition().toString()}\n`;
        board += `Black check: ${this.isBlackInCheck} | Black checkmate: ${this.isBlackInCheckmate} | Black King: ${this.blackKingPiece.getPosition().toString()}\n`;
        board += `Stalemate: ${this.isStalemate}\n`;
        board += `Move Number: ${this.getMoveNumber()}\n`;

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
