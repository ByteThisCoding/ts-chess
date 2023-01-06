import { ChessPiece } from "../pieces/chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
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

interface BoardMoveStats {
    isBlackInCheck: boolean;
    isWhiteInCheck: boolean;
    isBlackInCheckmate: boolean;
    isWhiteInCheckmate: boolean;
    isStalemate: boolean;
    blackPiecesValue: number;
    whitePiecesValue: number;
    lastNotation: string;
    lastMove: ChessBoardSingleMove | null;
    lastMoveReverseUpdates: Map<ChessCell, { piece: ChessPiece | null, turnNumber: number }>;
    prevStats: BoardMoveStats | null;
    // this is move, not turn, and 0 based, so white's first is 0 and black's first is 1
    moveNumber: number;
}

/**
 * Mutable Representation of a chess board with pieces
 */
export class ChessBoardState {

    private boardStats: BoardMoveStats = {
        isBlackInCheck: false,
        isBlackInCheckmate: false,
        isWhiteInCheck: false,
        isWhiteInCheckmate: false,
        isStalemate: false,
        blackPiecesValue: 0,
        whitePiecesValue: 0,
        lastNotation: "",
        lastMove: null,
        lastMoveReverseUpdates: new Map(),
        prevStats: null,
        moveNumber: 0
    }

    // internal, used to prevent infinite recursion when evaluating checkmate
    private _performCheckmateEvaluation = true;
    private _possiblePieceCache = new Map<ChessPiece, ChessPieceAvailableMoveSet>();

    // store here so we don't have to search on each move
    private whiteKingPiece!: KingPiece;
    private blackKingPiece!: KingPiece;

    // store information about the last move


    private constructor(private positions: Map<ChessPosition, ChessPiece>) { }

    getBlackPiecesValue(): number {
        return this.boardStats.blackPiecesValue;
    }

    getWhitePiecesValue(): number {
        return this.boardStats.whitePiecesValue;
    }

    getScore(): number {
        return this.boardStats.whitePiecesValue - this.boardStats.blackPiecesValue;
    }

    getPossibleMovementsForPiece(piece: ChessPiece): ChessPieceAvailableMoveSet {
        if (!this._possiblePieceCache.has(piece)) {
            this._possiblePieceCache.set(piece, piece.getPossibleMovements(this));
        }
        return this._possiblePieceCache.get(piece)!;
    }

    isPlayerInCheck(player: ChessPlayer): boolean {
        return player === ChessPlayer.white
            ? this.boardStats.isWhiteInCheck
            : this.boardStats.isBlackInCheck;
    }

    isGameInCheck(): boolean {
        return this.boardStats.isWhiteInCheck || this.boardStats.isBlackInCheck;
    }

    isPlayerInCheckmate(player: ChessPlayer): boolean {
        return player === ChessPlayer.white
            ? this.boardStats.isWhiteInCheckmate
            : this.boardStats.isBlackInCheckmate;
    }

    isGameInCheckmate(): boolean {
        return this.boardStats.isWhiteInCheckmate || this.boardStats.isBlackInCheckmate;
    }

    isGameInStalemate(): boolean {
        return this.boardStats.isStalemate;
    }

    hasPieceAtPosition(pos: ChessPosition): boolean {
        return this.getPieceAtPosition(pos) !== null;
    }

    getMoveNumber(): number {
        return this.boardStats.moveNumber;
    }

    getLastMove(): ChessBoardSingleMove | null {
        return this.boardStats.lastMove;
    }

    getLastMoveNotation(): string {
        return this.boardStats.lastNotation;
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

    getAllPieces(): Iterable<ChessPiece> {
        return this.positions.values();
    }

    /**
     * Indicate that a move has occured
     */
    setPiecesFromMove(move: ChessBoardSingleMove, notation: string): void {
        this.boardStats.prevStats = { ...this.boardStats };

        this.boardStats.lastNotation = notation;
        this.boardStats.moveNumber++;
        this.boardStats.lastMoveReverseUpdates = new Map();

        // handle special cases
        if (move.isPromotion) {
            const newPiece = ChessPieceFactory.createPiece(
                move.promoteToPieceLetter,
                move.player,
                move.toPosition
            );
            this.updateSinglePiece(move.toPosition, newPiece, this.boardStats.moveNumber);
        } else if (move.isEnPassant) {
            // the to-position indicates above or below the pawn to delete
            const [col, row] = ChessPosition.cellToColRow(move.toPosition);
            const existingPawnRow =
                move.player === ChessPlayer.white
                    ? row - 1
                    : col + 1;
            const existingPawnPos = ChessPosition.get(
                col,
                existingPawnRow
            );

            //this.updateSinglePiece(existingPawnPos, null, this.boardStats.moveNumber);
            this.updateSinglePiece(
                move.toPosition,
                move.pieceMoved,
                this.boardStats.moveNumber
            );
        } else if (move.isCastle) {
            const rowNumber = move.player === ChessPlayer.white ? 1 : 8;
            // the to-position indicates the rook to castle with
            const rook = this.getPieceAtPosition(move.toPosition)!;
            // also clear rook's position
            //this.updateSinglePiece(move.toPosition, null, this.boardStats.moveNumber);
            const [col, row] = ChessPosition.cellToColRow(rook.getPosition());

            if (col === 1) {
                // queenside
                this.updateSinglePiece(
                    ChessPosition.get(3, rowNumber),
                    move.pieceMoved,
                    this.boardStats.moveNumber
                );

                this.updateSinglePiece(
                    ChessPosition.get(4, rowNumber),
                    rook,
                    this.boardStats.moveNumber
                );
            } else {
                // kingside
                this.updateSinglePiece(
                    ChessPosition.get(6, rowNumber),
                    rook,
                    this.boardStats.moveNumber
                );
                this.updateSinglePiece(
                    ChessPosition.get(7, rowNumber),
                    move.pieceMoved,
                    this.boardStats.moveNumber
                );
            }
        } else {
            // default case
            this.updateSinglePiece(
                move.toPosition,
                move.pieceMoved,
                this.boardStats.moveNumber
            );
        }

        // update move + number
        this.boardStats.lastMove = move;

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
        this.boardStats.whitePiecesValue = 0;
        this.boardStats.blackPiecesValue = 0;

        for (const [pos, piece] of this.positions) {
            if (piece.player === ChessPlayer.white) {
                this.boardStats.whitePiecesValue += piece.pointsValue;
            } else {
                this.boardStats.blackPiecesValue += piece.pointsValue;
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
            this.boardStats.lastMove!.player
        );

        const enemy =
            this.boardStats.lastMove?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        const enemyPossibleMoves = this.getPossibleMovesForPlayer(enemy);

        // check if enemy's king's position is included
        const enemyKing = this.getPlayerKingPiece(enemy);
        const enemyKingPos = enemyKing.getPosition();

        let enemyInCheck = this.isPlayerInCheck(this.boardStats.lastMove!.player);

        if (!enemyInCheck) {
            for (const move of lastPlayerPossibleMoves.getMoves()) {
                if (move.toPosition === enemyKingPos) {
                    if (enemy === ChessPlayer.white) {
                        console.log(ChessPosition.toString(move.toPosition), ChessPosition.toString(enemyKingPos), this.getPieceAtPosition(enemyKingPos)?.toString());
                    }
                    enemyInCheck = true;
                    break;
                }
            }
        }

        // if in check, see if it's a checkmate
        if (enemyInCheck) {
            if (enemy === ChessPlayer.white) {
                this.boardStats.isWhiteInCheck = true;
            } else {
                this.boardStats.isBlackInCheck = true;
            }

            // assume true until we find counter example
            if (this._performCheckmateEvaluation) {
                let isCheckmate = true;
                // check by iterating through possible enemy moves, then re-checking check status
                const freshBoard = this.clone();
                for (const move of enemyPossibleMoves.getMoves()) {
                    freshBoard._performCheckmateEvaluation = false;
                    freshBoard.setPiecesFromMove(move, "");

                    // if no longer in mate, we've found a viable move
                    if (!freshBoard.isPlayerInCheck(this.boardStats.lastMove!.player)) {
                        isCheckmate = false;
                        break;
                    }

                    freshBoard.undoLastMove();
                }

                if (enemy === ChessPlayer.white) {
                    this.boardStats.isWhiteInCheckmate = isCheckmate;
                } else {
                    this.boardStats.isBlackInCheckmate = isCheckmate;
                }
            }
        } else {
            if (enemy === ChessPlayer.white) {
                this.boardStats.isWhiteInCheck = false;
                this.boardStats.isWhiteInCheckmate = false;
            } else {
                this.boardStats.isBlackInCheck = false;
                this.boardStats.isBlackInCheckmate = false;
            }

            // if not in check, check if stalemate by seeing if enemy has any possible moves
            this.boardStats.isStalemate = !enemyPossibleMoves.hasMoves();
        }
    }

    /**
     * Update a single position and set reverse map
     */
    private updateSinglePiece(
        pos: ChessCell,
        piece: ChessPiece | null,
        moveNumber: number
    ): void {
        // if there is an existing piece, add entry in reverse map to replace it
        const existingPiece = this.positions.get(pos);
        if (existingPiece) {
            // move number has incremented already, so need to decrement
            this.boardStats.lastMoveReverseUpdates.set(pos, { piece: existingPiece, turnNumber: this.boardStats.moveNumber - 1 });
        } else {
            this.boardStats.lastMoveReverseUpdates.set(pos, { piece: null, turnNumber: this.boardStats.moveNumber - 1 });
        }

        // if the input piece is null, we're clearing current position
        if (!piece) {
            // if there was a piece before, it was already put in reverse map above
            this.positions.delete(pos);
        } else {
            const prevPos = piece.getPosition();

            // clear old position
            this.positions.delete(prevPos);

            // set new position
            this.positions.set(pos, piece);
            piece.setPosition(pos, moveNumber);

            // add entry to reverse-map to put it back to its original spot
            this.boardStats.lastMoveReverseUpdates.set(prevPos, { piece, turnNumber: this.boardStats.moveNumber - 1 });

        }
    }

    /**
     * Reverse the last move, can be called multiple times to reverse multiple moves
     */
    undoLastMove(): void {
        this._possiblePieceCache.clear();

        // get reference to previous move stats
        const prevStats = this.boardStats.prevStats;

        // get the revesre moves to make
        const reverseMoves = this.boardStats.lastMoveReverseUpdates;

        for (const [pos, { piece, turnNumber }] of reverseMoves) {
            // place a piece at pos
            if (piece) {
                this.positions.set(pos, piece);
                piece.setPosition(pos, turnNumber);
            } else {
                // delete a piece from pos
                this.positions.delete(pos);
            }
        }

        this.boardStats = prevStats!;
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
        // TODO: deep recursive copy of board stats
        state.boardStats.lastMove = this.boardStats.lastMove?.clone() || null;
        state.whiteKingPiece = this.whiteKingPiece.clone() as KingPiece;
        state.blackKingPiece = this.blackKingPiece.clone() as KingPiece;
        state.boardStats = { ...(this.boardStats) };

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
        board += `Last move: ${this.boardStats.lastNotation}\n`;
        board += `White in check: ${this.boardStats.isWhiteInCheck
            } | White in checkmate: ${this.boardStats.isWhiteInCheckmate
            } | White King: ${ChessPosition.toString(this.whiteKingPiece.getPosition())}\n`;
        board += `Black in check: ${this.boardStats.isBlackInCheck
            } | Black in checkmate: ${this.boardStats.isBlackInCheckmate
            } | Black King: ${ChessPosition.toString(this.blackKingPiece.getPosition())}\n`;
        board += `Stalemate: ${this.boardStats.isStalemate}\n`;
        board += `Move Number: ${this.getMoveNumber()}\n`;
        board += `Board Value: ${this.getScore()}\n`;

        return board;
    }

    /**
     * Get a board state object of the beginning of a game
     */
    public static getStartBoard(): ChessBoardState {
        const positions = new Map<ChessCell, ChessPiece>();

        // temp variable to store positions for insertion
        let pos: ChessCell;

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
        const whiteKingPiece = new KingPiece(ChessPlayer.white, pos);
        positions.set(pos, whiteKingPiece);
        pos = ChessPosition.get(5, 8);
        const blackKingPiece = new KingPiece(ChessPlayer.black, pos);
        positions.set(pos, blackKingPiece);

        const state = new ChessBoardState(positions);
        state.whiteKingPiece = whiteKingPiece;
        state.blackKingPiece = blackKingPiece;
        return state;
    }
}
