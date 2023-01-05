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
import { ChessPieceFactory } from "../pieces/chess-piece-factory";

/**
 * Mutable Representation of a chess board with pieces
 */
export class ChessBoardState {
    // TODO: Add list of pieces captured / uncaptured, can be determined at each set point

    private lastMove: ChessBoardSingleMove | null = null;
    private lastMoveNotation: string = "";

    // this is move, not turn, and 0 based, so white's first is 0 and black's first is 1
    private moveNumber = 0;

    private isBlackInCheck = false;
    private isWhiteInCheck = false;
    private isBlackInCheckmate = false;
    private isWhiteInCheckmate = false;
    private isStalemate = false;

    private blackPiecesValue = 0;
    private whitePiecesValue = 0;

    // internal, used to prevent infinite recursion when evaluating checkmate
    private _performCheckmateEvaluation = true;
    private _possiblePieceCache = new Map<ChessPiece, ChessPieceAvailableMoveSet>();

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

    getBlackPiecesValue(): number {
        return this.blackPiecesValue;
    }

    getWhitePiecesValue(): number {
        return this.whitePiecesValue;
    }

    getScore(): number {
        return this.whitePiecesValue - this.blackPiecesValue;
    }

    getPossibleMovementsForPiece(piece: ChessPiece): ChessPieceAvailableMoveSet {
        if (!this._possiblePieceCache.has(piece)) {
            this._possiblePieceCache.set(piece, piece.getPossibleMovements(this));
        }
        return this._possiblePieceCache.get(piece)!;
    }

    isPlayerInCheck(player: ChessPlayer): boolean {
        return player === ChessPlayer.white
            ? this.isWhiteInCheck
            : this.isBlackInCheck;
    }

    isGameInCheck(): boolean {
        return this.isWhiteInCheck || this.isBlackInCheck;
    }

    isPlayerInCheckmate(player: ChessPlayer): boolean {
        return player === ChessPlayer.white
            ? this.isWhiteInCheckmate
            : this.isBlackInCheckmate;
    }

    isGameInCheckmate(): boolean {
        return this.isWhiteInCheckmate || this.isBlackInCheckmate;
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
        return player === ChessPlayer.white
            ? this.whiteKingPiece
            : this.blackKingPiece;
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
    setPiecesFromMove(move: ChessBoardSingleMove, notation: string): void {
        this.lastMoveNotation = notation;

        this.moveNumber++;

        // clear current position
        this.updateSinglePiece(move.fromPosition, null, this.moveNumber);

        // handle special cases
        if (move.isPromotion) {
            const newPiece = ChessPieceFactory.createPiece(
                move.promoteToPieceLetter,
                move.player,
                move.toPosition
            );
            this.updateSinglePiece(move.toPosition, newPiece, this.moveNumber);
        } else if (move.isEnPassant) {
            // the to-position indicates above or below the pawn to delete
            const existingPawnRow =
                move.player === ChessPlayer.white
                    ? move.toPosition.row - 1
                    : move.toPosition.row + 1;
            const existingPawnPos = ChessPosition.get(
                move.toPosition.col,
                existingPawnRow
            );

            this.updateSinglePiece(existingPawnPos, null, this.moveNumber);
            this.updateSinglePiece(
                move.toPosition,
                move.pieceMoved,
                this.moveNumber
            );
        } else if (move.isCastle) {
            const rowNumber = move.player === ChessPlayer.white ? 1 : 8;
            // the to-position indicates the rook to castle with
            const rook = this.getPieceAtPosition(move.toPosition)!;
            // also clear rook's position
            this.updateSinglePiece(move.toPosition, null, this.moveNumber);

            if (rook.getPosition().col === 1) {
                // queenside
                this.updateSinglePiece(
                    ChessPosition.get(3, rowNumber),
                    move.pieceMoved,
                    this.moveNumber
                );

                this.updateSinglePiece(
                    ChessPosition.get(4, rowNumber),
                    rook,
                    this.moveNumber
                );
            } else {
                // kingside
                this.updateSinglePiece(
                    ChessPosition.get(6, rowNumber),
                    rook,
                    this.moveNumber
                );
                this.updateSinglePiece(
                    ChessPosition.get(7, rowNumber),
                    move.pieceMoved,
                    this.moveNumber
                );
            }
        } else {
            // default case
            this.updateSinglePiece(
                move.toPosition,
                move.pieceMoved,
                this.moveNumber
            );
        }

        // update move + number
        this.lastMove = move;

        this._possiblePieceCache.clear();

        // check if anybody is in check, checkmate, or stalemate
        this.updateCheckStalemateStatus();
        this.updatePieceValues();
    }

    /**
     * Given a player, see what moves they can make next (even if it's not their turn)
     */
    getPossibleMovesForPlayer(player: ChessPlayer): ChessPieceAvailableMoveSet {
        const allPlayerMoves = new ChessPieceAvailableMoveSet(player, this);

        for (const [pos, piece] of this.positions) {
            if (piece.player === player) {
                const possibleMoves = this.getPossibleMovementsForPiece(piece);
                allPlayerMoves.merge(possibleMoves);
            }
        }

        return allPlayerMoves;
    }

    private updatePieceValues(): void {
        this.whitePiecesValue = 0;
        this.blackPiecesValue = 0;

        for (const [pos, piece] of this.positions) {
            if (piece.player === ChessPlayer.white) {
                this.whitePiecesValue += piece.pointsValue;
            } else {
                this.blackPiecesValue += piece.pointsValue;
            }
        }
    }

    /**
     * After a move is made, this is called to check if the reverse player is in check
     * This checks by seeing if the player that just went has a line of sight of the king for possible moves
     *
     * TODO: fix stack overflow when in checkmate (??)
     */
    private updateCheckStalemateStatus(): void {
        // reset, update later if needed

        // search through possible moves
        const lastPlayerPossibleMoves = this.getPossibleMovesForPlayer(
            this.lastMove!.player
        );
        const enemy =
            this.lastMove?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        const enemyPossibleMoves = this.getPossibleMovesForPlayer(enemy);

        // check if enemy's king's position is included
        const enemyKing = this.getPlayerKingPiece(enemy);
        const enemyKingPos = enemyKing.getPosition();

        let enemyInCheck = this.isPlayerInCheck(this.lastMove!.player);

        if (!enemyInCheck) {
            for (const move of lastPlayerPossibleMoves.getMoves()) {
                if (move.toPosition === enemyKingPos) {
                    enemyInCheck = true;
                    break;
                }
            }
        }

        // if in check, see if it's a checkmate
        if (enemyInCheck) {
            if (enemy === ChessPlayer.white) {
                this.isWhiteInCheck = true;
            } else {
                this.isBlackInCheck = true;
            }

            // assume true until we find counter example
            if (this._performCheckmateEvaluation) {
                let isCheckmate = true;
                // check by iterating through possible enemy moves, then re-checking check status
                for (const move of enemyPossibleMoves.getMoves()) {
                    const freshBoard = this.clone();
                    freshBoard._performCheckmateEvaluation = false;
                    const freshMove = move.clone();
                    freshBoard.setPiecesFromMove(freshMove, "");

                    // if no longer in mate, we've found a viable move
                    if (!freshBoard.isPlayerInCheck(this.lastMove!.player)) {
                        isCheckmate = false;
                        break;
                    }
                }

                if (enemy === ChessPlayer.white) {
                    this.isWhiteInCheckmate = isCheckmate;
                } else {
                    this.isBlackInCheckmate = isCheckmate;
                }
            }
        } else {
            if (enemy === ChessPlayer.white) {
                this.isWhiteInCheck = false;
                this.isWhiteInCheckmate = false;
            } else {
                this.isBlackInCheck = false;
                this.isBlackInCheckmate = false;
            }

            // if not in check, check if stalemate by seeing if enemy has any possible moves
            this.isStalemate = !enemyPossibleMoves.hasMoves();
        }
    }

    private updateSinglePiece(
        pos: ChessPosition,
        piece: ChessPiece | null,
        moveNumber: number
    ): void {
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
        state.lastMove = this.lastMove?.clone() || null;
        state.isBlackInCheck = this.isBlackInCheck;
        state.isWhiteInCheck = this.isWhiteInCheck;
        state.isBlackInCheckmate = this.isBlackInCheckmate;
        state.isWhiteInCheckmate = this.isWhiteInCheckmate;
        state.isStalemate = this.isStalemate;
        state.whiteKingPiece = this.whiteKingPiece.clone() as KingPiece;
        state.blackKingPiece = this.blackKingPiece.clone() as KingPiece;
        state.blackPiecesValue = this.blackPiecesValue;
        state.whitePiecesValue = this.whitePiecesValue;
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
        board += `Last move: ${this.lastMoveNotation}\n`;
        board += `White in check: ${
            this.isWhiteInCheck
        } | White in checkmate: ${
            this.isWhiteInCheckmate
        } | White King: ${this.whiteKingPiece.getPosition().toString()}\n`;
        board += `Black in check: ${
            this.isBlackInCheck
        } | Black in checkmate: ${
            this.isBlackInCheckmate
        } | Black King: ${this.blackKingPiece.getPosition().toString()}\n`;
        board += `Stalemate: ${this.isStalemate}\n`;
        board += `Move Number: ${this.getMoveNumber()}\n`;
        board += `Last Move By: ${
            this.lastMove?.player
        } -> ${this.lastMove?.toPosition.toString()}\n`;
        board += `Board Value: ${this.getScore()}\n`;

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
