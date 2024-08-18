import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { BishopPiece } from "../pieces/bishop";
import { KingPiece } from "../pieces/king";
import { KnightPiece } from "../pieces/knight";
import { PawnPiece } from "../pieces/pawn";
import { QueenPiece } from "../pieces/queen";
import { RookPiece } from "../pieces/rook";
import {
    ChessPieceFactory,
    ChessPieceStatic,
} from "../pieces/chess-piece-factory";
import { ProfileAllMethods } from "../../util/profile-all-methods";
import { ChessBoardState } from "./chess-board-state.model";
import { ChessBoardSingleMove } from "../moves/chess-board-move.model";
import { ChessPiece } from "../pieces/chess-piece.model";
import { AbstractChessPiece } from "../pieces/abstract-chess-piece";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set.model";
import { ChessPieceAvailableMoveSetImpl } from "../moves/chess-piece-available-move-set-impl";
import { ChessBoardMoveDeserializer } from "../moves/chess-board-move-deserializer";

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
    lastMoveReverseUpdates: Map<
        ChessCell,
        { piece: ChessPiece | null; turnNumber: number }
    >;
    prevStats: BoardMoveStats | null;
    // this is move, not turn, and 0 based, so white's first is 0 and black's first is 1
    moveNumber: number;
    blackPieceTypeCounts: Map<ChessPieceStatic, number>;
    whitePieceTypeCounts: Map<ChessPieceStatic, number>;
}

/**
 * Mutable Representation of a chess board with pieces
 */
@ProfileAllMethods
export class ChessBoardStateImpl implements ChessBoardState {
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
        moveNumber: 0,
        blackPieceTypeCounts: new Map(),
        whitePieceTypeCounts: new Map(),
    };

    // internal, used to prevent infinite recursion when evaluating checkmate
    private _performCheckmateEvaluation = true;
    private _availableMovesCache = new Map<
        ChessPiece | ChessPlayer,
        ChessPieceAvailableMoveSet
    >();
    private _useAvailableMovesCache = true;

    // store here so we don't have to search on each move
    private whiteKingPiece!: KingPiece;
    private blackKingPiece!: KingPiece;

    // for each position, keep a cache of pieces which have moves to it
    private cellMovesPieces: Set<ChessPiece>[] = new Array(64)
        .fill(null)
        .map(() => new Set());

    private zobristTable!: number[][];
    private zobristHash!: number;

    // store information about the last move
    private constructor(private positions: (ChessPiece | null)[]) {
        // set piece counts
        for (const position of positions) {

            switch (position?.player) {
                case ChessPlayer.white:
                    const whitePiece = ChessPieceFactory.getPieceClass(
                        position?.letter
                    );
                    this.boardStats.whitePieceTypeCounts.set(
                        whitePiece,
                        (this.boardStats.whitePieceTypeCounts.get(whitePiece) ||
                            0) + 1
                    );
                    break;
                case ChessPlayer.black:
                    const blackPiece = ChessPieceFactory.getPieceClass(
                        position?.letter
                    );
                    this.boardStats.blackPieceTypeCounts.set(
                        blackPiece,
                        (this.boardStats.blackPieceTypeCounts.get(blackPiece) ||
                            0) + 1
                    );
                    break;
            }
        }

        this.buildZobristTable();

        // build cache
        this.getPossibleMovesForPlayer(ChessPlayer.white);
        this.getPossibleMovesForPlayer(ChessPlayer.black);
    }

    getBlackPiecesValue(): number {
        return this.boardStats.blackPiecesValue;
    }

    getWhitePiecesValue(): number {
        return this.boardStats.whitePiecesValue;
    }

    getScore(): number {
        return (
            this.boardStats.whitePiecesValue - this.boardStats.blackPiecesValue
        );
    }

    getBlackPieceTypeCounts(): Map<ChessPieceStatic, number> {
        return this.boardStats.blackPieceTypeCounts;
    }

    getWhitePieceTypeCounts(): Map<ChessPieceStatic, number> {
        return this.boardStats.whitePieceTypeCounts;
    }

    getPossibleMovementsForPiece(
        piece: ChessPiece
    ): ChessPieceAvailableMoveSet {
        const moves = piece.getPossibleMovements(this);

        // update positions cache
        /*if (piece.areMovesCached()) {
            for (const move of moves.getMoves()) {
                this.cellMovesPieces[move.toPosition].add(piece);
            }

            for (const pos of moves.getBlockedPositions()) {
                this.cellMovesPieces[pos].add(piece);
            }
        }*/

        return moves;
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
        return (
            this.boardStats.isWhiteInCheckmate ||
            this.boardStats.isBlackInCheckmate
        );
    }

    isGameInStalemate(): boolean {
        return this.boardStats.isStalemate;
    }

    hasPieceAtPosition(pos: ChessCell): boolean {
        return this.positions[pos] !== null;
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
    getPieceAtPosition(pos: ChessCell): ChessPiece | null {
        return this.positions[pos];
    }

    *getAllPieces(): Iterable<ChessPiece> {
        for (const piece of this.positions) {
            if (piece) {
                yield piece;
            }
        }
    }

    /**
     * Indicate that a move has occurred
     * 
     * Returns true if a piece was captured
     */
    setPiecesFromMove(
        move: ChessBoardSingleMove | null,
        notation: string
    ): boolean {
        this._useAvailableMovesCache = false;

        let pieceCaptured = false;

        // Instead of deep copying the entire boardStats, selectively copy only what's necessary
        this.boardStats.prevStats = {
            ...this.boardStats,
            blackPieceTypeCounts: new Map(this.boardStats.blackPieceTypeCounts),
            whitePieceTypeCounts: new Map(this.boardStats.whitePieceTypeCounts),
        };

        this.boardStats.lastNotation = notation;
        this.boardStats.moveNumber++;
        this.boardStats.lastMoveReverseUpdates = new Map();

        // Handle special cases with reduced redundant calls
        if (move?.isPromotion) {
            const newPiece = ChessPieceFactory.createPiece(
                move.promoteToPieceLetter,
                move.player,
                move.toPosition
            );
            pieceCaptured = this.updateSinglePiece(move.toPosition, move.fromPosition, move.pieceMoved, this.boardStats.moveNumber, newPiece);
        } else if (move?.isEnPassant) {
            const col = ChessPosition.getCellCol(move.toPosition);
            const row = ChessPosition.getCellRow(move.toPosition);

            const prevCol = ChessPosition.getCellCol(move.fromPosition);

            this.updateSinglePiece(move.toPosition, move.fromPosition, move.pieceMoved, this.boardStats.moveNumber);
            this.updateSinglePiece(
                ChessPosition.get(col, row + (move.player === ChessPlayer.white ? -1 : 1)),
                ChessPosition.get(prevCol, row + (move.player === ChessPlayer.white ? -1 : 1)),
                null,
                this.boardStats.moveNumber
            );

            pieceCaptured = true;
        } else if (move?.isCastle) {
            const rowNumber = move.player === ChessPlayer.white ? 1 : 8;
            const rook = this.positions[move.toPosition]!;
            const rookCol = ChessPosition.getCellCol(rook.getPosition());

            if (rookCol === 1) { // queenside
                this.updateSinglePiece(
                    ChessPosition.get(3, rowNumber),
                    move.fromPosition,
                    move.pieceMoved,
                    this.boardStats.moveNumber
                );
                this.updateSinglePiece(
                    ChessPosition.get(4, rowNumber),
                    ChessPosition.get(1, rowNumber),
                    rook,
                    this.boardStats.moveNumber
                );
            } else { // kingside
                this.updateSinglePiece(
                    ChessPosition.get(6, rowNumber),
                    ChessPosition.get(8, rowNumber),
                    rook,
                    this.boardStats.moveNumber
                );
                this.updateSinglePiece(
                    ChessPosition.get(7, rowNumber),
                    move.fromPosition,
                    move.pieceMoved,
                    this.boardStats.moveNumber
                );
            }

            pieceCaptured = false;
        } else if (move) {
            pieceCaptured = this.updateSinglePiece(move.toPosition, move.fromPosition, move.pieceMoved, this.boardStats.moveNumber);
        }

        // Directly set the last move and update board status
        this.boardStats.lastMove = move;
        this.updateCheckStalemateStatus();

        // Clear and re-enable the available moves cache
        this._availableMovesCache.clear();
        this._useAvailableMovesCache = true;

        return pieceCaptured;
    }

    /**
     * Given a player, see what moves they can make next (even if it's not their turn)
     */
    getPossibleMovesForPlayer(player: ChessPlayer): ChessPieceAvailableMoveSet {
        /*if (
            !this._useAvailableMovesCache ||
            !this._availableMovesCache.has(player)
        ) {
            const allPlayerMoves = new ChessPieceAvailableMoveSet(player);

            for (const piece of this.positions) {
                if (piece && piece.player === player) {
                    const possibleMoves =
                        this.getPossibleMovementsForPiece(piece);

                    allPlayerMoves.merge(possibleMoves, this);
                }
            }

            this._availableMovesCache.set(player, allPlayerMoves);
        }

        return this._availableMovesCache.get(player)!;*/

        const allPlayerMoves = new ChessPieceAvailableMoveSetImpl(player);

        for (const piece of this.positions) {
            if (piece && piece.player === player) {
                const possibleMoves =
                    this.getPossibleMovementsForPiece(piece);

                allPlayerMoves.merge(possibleMoves, this);
            }
        }

        return allPlayerMoves;
    }

    /**
     * After a move is made, this is called to check if the reverse player is in check
     * This checks by seeing if the player that just went has a line of sight of the king for possible moves
     */
    private updateCheckStalemateStatus(): void {
        const lastMove = this.boardStats.lastMove;
        if (!lastMove) return;

        const currentPlayer = lastMove.player;
        const enemyPlayer = currentPlayer === ChessPlayer.white ? ChessPlayer.black : ChessPlayer.white;

        // Since we have validations, the current player is not in check
        if (currentPlayer === ChessPlayer.white) {
            this.boardStats.isWhiteInCheck = false;
        } else {
            this.boardStats.isBlackInCheck = false;
        }

        // Generate possible moves for the current player
        const lastPlayerPossibleMoves = this.getPossibleMovesForPlayer(currentPlayer);
        const enemyKing = this.getPlayerKingPiece(enemyPlayer);
        const enemyKingPos = enemyKing.getPosition();

        // Check if enemy's king is under attack
        let enemyInCheck = false;
        for (const move of lastPlayerPossibleMoves.getMoves()) {
            if (move.toPosition === enemyKingPos) {
                enemyInCheck = true;
                break;
            }
        }

        // Handle checkmate or stalemate conditions
        if (enemyInCheck) {
            if (enemyPlayer === ChessPlayer.white) {
                this.boardStats.isWhiteInCheck = true;
            } else {
                this.boardStats.isBlackInCheck = true;
            }

            if (this._performCheckmateEvaluation) {
                const enemyPossibleMoves = this.getPossibleMovesForPlayer(enemyPlayer);
                let isCheckmate = true;

                for (const move of enemyPossibleMoves.getMoves()) {
                    if (!this.doesMovePutPlayerInIllegalCheck(move).inCheck) {
                        isCheckmate = false;
                        break;
                    }
                }

                if (enemyPlayer === ChessPlayer.white) {
                    this.boardStats.isWhiteInCheckmate = isCheckmate;
                } else {
                    this.boardStats.isBlackInCheckmate = isCheckmate;
                }
            }
        } else {
            // Enemy is not in check, check for stalemate
            const enemyPossibleMoves = this.getPossibleMovesForPlayer(enemyPlayer);

            if (enemyPlayer === ChessPlayer.white) {
                this.boardStats.isWhiteInCheck = false;
                this.boardStats.isWhiteInCheckmate = false;
            } else {
                this.boardStats.isBlackInCheck = false;
                this.boardStats.isBlackInCheckmate = false;
            }

            this.boardStats.isStalemate = !enemyPossibleMoves.hasMoves();
        }
    }

    /**
     * Check if a potential move will put a player in an illegal check
     */
    doesMovePutPlayerInIllegalCheck(move: ChessBoardSingleMove): {
        inCheck: boolean;
        piece: ChessPiece | null;
    } {
        const prevCheck = this._performCheckmateEvaluation;
        this._performCheckmateEvaluation = false;

        const enemy =
            move.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        let isIllegal = false;
        let illegalThreaten: ChessPiece | null = null;

        // Make the move
        this.setPiecesFromMove(move, "");

        // Directly get king's position after the move
        const playerKing = this.getPlayerKingPiece(move.player);
        const playerKingPos = playerKing.getPosition();

        const enemyMoves = this.getPossibleMovesForPlayer(enemy);

        for (const enemyMove of enemyMoves.getMoves()) {
            if (
                enemyMove.toPosition === playerKingPos &&
                enemyMove.fromPosition !== move.toPosition
            ) {
                isIllegal = true;
                illegalThreaten = enemyMove.pieceMoved;
                break;
            }
        }

        // Revert the move
        this.undoLastMove();
        this._performCheckmateEvaluation = prevCheck;

        return {
            inCheck: isIllegal,
            piece: illegalThreaten,
        };
    }


    /**
     * Update a single position and set reverse map
     * Returns true if a piece was captured
     */
    private updateSinglePiece(
        pos: ChessCell,
        prevPos: ChessCell,
        piece: ChessPiece | null,
        moveNumber: number,
        promotionPiece?: ChessPiece
    ): boolean {
        this._useAvailableMovesCache = false;

        const prevPosition = piece?.getPosition();
        const existingPiece = this.positions[pos];

        this.updateZobristHash(prevPos, pos);

        // Update reverse map with existing piece
        this.boardStats.lastMoveReverseUpdates.set(pos, {
            piece: existingPiece,
            turnNumber: this.boardStats.moveNumber - 1,
        });

        // Update score and piece type counts if there's an existing piece
        if (existingPiece) {
            const pieceType = ChessPieceFactory.getPieceClass(existingPiece.letter);
            const playerPieceCountMap = existingPiece.player === ChessPlayer.white
                ? this.boardStats.whitePieceTypeCounts
                : this.boardStats.blackPieceTypeCounts;

            if (existingPiece.letter !== KingPiece.letter) {
                if (existingPiece.player === ChessPlayer.white) {
                    this.boardStats.whitePiecesValue -= existingPiece.pointsValue;
                } else {
                    this.boardStats.blackPiecesValue -= existingPiece.pointsValue;
                }

                playerPieceCountMap.set(
                    pieceType,
                    (playerPieceCountMap.get(pieceType) || 0) - 1
                );
            }
        }

        if (piece) {
            if (promotionPiece) {
                // Handle promotion
                this.handlePromotion(prevPosition!, pos, piece, promotionPiece);
            } else {
                // Regular move
                this.handleRegularMove(prevPosition!, pos, piece, moveNumber);
            }
        } else {
            // Clear position
            this.positions[pos] = null;
        }

        // Invalidate moves cache
        this.invalidateMovesCache(pos, prevPosition);

        this._useAvailableMovesCache = true;

        return !!existingPiece;
    }

    private handlePromotion(
        prevPosition: ChessCell,
        pos: ChessCell,
        piece: ChessPiece,
        promotionPiece: ChessPiece
    ): void {
        this.positions[prevPosition] = null;

        this.positions[pos] = promotionPiece;

        // Update score and piece type counts
        const playerPieceCountMap = piece.player === ChessPlayer.white
            ? this.boardStats.whitePieceTypeCounts
            : this.boardStats.blackPieceTypeCounts;

        if (piece.player === ChessPlayer.white) {
            this.boardStats.whitePiecesValue += promotionPiece.pointsValue - PawnPiece.pointsValue;
        } else {
            this.boardStats.blackPiecesValue += promotionPiece.pointsValue - PawnPiece.pointsValue;
        }

        playerPieceCountMap.set(
            PawnPiece,
            (playerPieceCountMap.get(PawnPiece) || 0) - 1
        );

        const newPieceType = ChessPieceFactory.getPieceClass(promotionPiece.letter);
        playerPieceCountMap.set(
            newPieceType,
            (playerPieceCountMap.get(newPieceType) || 0) + 1
        );

        this.boardStats.lastMoveReverseUpdates.set(prevPosition, {
            piece,
            turnNumber: this.boardStats.moveNumber - 1,
        });
    }

    private handleRegularMove(
        prevPosition: ChessCell,
        pos: ChessCell,
        piece: ChessPiece,
        moveNumber: number
    ): void {
        this.positions[prevPosition] = null;

        this.positions[pos] = piece;
        piece.setPosition(pos, moveNumber);

        this.boardStats.lastMoveReverseUpdates.set(prevPosition, {
            piece,
            turnNumber: this.boardStats.moveNumber - 1,
        });
    }

    // TODO: revisit this implementaiton, particularly _availableMovesCache.clear()
    private invalidateMovesCache(
        pos: ChessCell,
        prevPosition: ChessCell | undefined
    ): void {
        /*const removePieces = new Map<number, Set<ChessPiece>>();

        for (let cell = 0; cell < 64; cell++) {
            for (const piece of this.cellMovesPieces[cell]) {
                if (removePieces.get(cell)?.has(piece)) {
                    const moves = piece.getPossibleMovements(this);

                    const hasBlockedPos = moves.hasBlockedPosition(pos);
                    const hasMoveToPos = moves.hasMoveToPosition(pos);
                    const hasMoveToPrevPos = prevPosition ? moves.hasMoveToPosition(prevPosition) : false;
                    const hasBlockedPrevPos = prevPosition ? moves.hasBlockedPosition(prevPosition) : false;

                    if (hasBlockedPos || hasMoveToPos || hasMoveToPrevPos || hasBlockedPrevPos) {
                        piece.invalidateMovesCache();
                        if (!removePieces.has(cell)) {
                            removePieces.set(cell, new Set());
                        }
                        removePieces.get(cell)?.add(piece);
                    }
                }
            }
        }

        // Remove stale pieces
        for (const [cell, pieces] of removePieces) {
            for (const piece of pieces) {
                this.cellMovesPieces[cell].delete(piece);
            }
        }

        // Clear the overall cache for the opponent's available moves
        this._availableMovesCache.clear();*/

        // NOTE: this force clears the cache while we debug issues!
        for (let cell = 0; cell < 64; cell++) {
            for (const piece of this.cellMovesPieces[cell]) {
                piece.invalidateMovesCache();
            }
            this.cellMovesPieces[cell].clear();
        }
        this._availableMovesCache.clear();
    }

    /**
     * Reverse the last move, can be called multiple times to reverse multiple moves
     */
    undoLastMove(): void {
        this._availableMovesCache.clear();

        // Get reference to previous move stats
        const prevStats = this.boardStats.prevStats;

        // Get the reverse moves to make
        const reverseMoves = this.boardStats.lastMoveReverseUpdates;

        const removePieces = new Set<ChessPiece>();

        // Process reverse moves and invalidate necessary pieces
        for (const [pos, { piece, turnNumber }] of reverseMoves) {
            if (piece) {
                // Place a piece at pos
                this.positions[pos] = piece;
                piece.setPosition(pos, turnNumber);
                removePieces.add(piece);
            } else {
                // Remove piece from pos and collect for cache invalidation
                const existingPiece = this.positions[pos];
                if (existingPiece) {
                    removePieces.add(existingPiece);
                }

                // Invalidate and clear position
                this.positions[pos] = null;
            }

            // Collect pieces affected by the move
            for (const ePiece of this.cellMovesPieces[pos]) {
                removePieces.add(ePiece);
            }
        }

        // Invalidate move caches and remove stale pieces in a single loop
        for (const piece of removePieces) {
            piece.invalidateMovesCache();
            for (let cell = 0; cell < 64; cell++) {
                this.cellMovesPieces[cell].delete(piece);
            }
        }

        // Restore previous board stats
        this.boardStats = prevStats!;
    }


    /**
     * Deep clone the state of this board and its pieces
     */
    clone(): ChessBoardStateImpl {
        let cloneWhiteKing!: ChessPiece;
        let cloneBlackKing!: ChessPiece;
        const clonedPositions: (ChessPiece | null)[] = new Array(64);
        for (let pos = 0; pos < 64; pos++) {
            let piece = this.positions[pos];
            if (piece) {
                piece = piece.clone();
                clonedPositions[pos] = piece;
                if (piece.letter === KingPiece.letter) {
                    if (piece.player === ChessPlayer.white) {
                        cloneWhiteKing = piece;
                    } else {
                        cloneBlackKing = piece;
                    }
                }
            }
        }
        const state = new ChessBoardStateImpl(clonedPositions);
        // TODO: deep recursive copy of board stats
        state.boardStats.lastMove = this.boardStats.lastMove?.clone() || null;
        state.whiteKingPiece = cloneWhiteKing as KingPiece;
        state.blackKingPiece = cloneBlackKing as KingPiece;
        state.boardStats = { ...this.boardStats };

        state.boardStats.blackPieceTypeCounts = new Map(
            state.boardStats.blackPieceTypeCounts
        );
        state.boardStats.whitePieceTypeCounts = new Map(
            state.boardStats.whitePieceTypeCounts
        );

        return state;
    }

    /**
     * Get a user-unfriendly string of board positions
     */
    toString(): string {
        return `${this.zobristHash}`;
    }

    toHash(): number {
        return this.zobristHash;
    }

    /**
     * Make a human readable string representation of the board
     */
    toStringDetailed(): string {
        let board = "  a b c d e f g h\n"; // Adding file labels
        board += " +----------------\n"; // Adding top border
    
        for (let row = 8; row > 0; row--) {
            board += `${row}|`; // Adding rank label
            for (let col = 1; col < 9; col++) {
                const piece = this.getPieceAtPosition(
                    ChessPosition.get(col, row)
                );
                let pieceStr = piece ? piece.letter : ".";
                if (piece?.player === ChessPlayer.black) {
                    pieceStr = pieceStr.toLocaleLowerCase();
                }
                board += ` ${pieceStr}`;
            }
            board += ` |${row}\n`; // Adding rank label on the right side
        }
    
        board += " +----------------\n"; // Adding bottom border
        board += "  a b c d e f g h\n\n"; // Adding file labels again
    
        board += `Last move: ${this.boardStats.lastNotation}\n`;
        board += `White in check: ${this.boardStats.isWhiteInCheck} | White in checkmate: ${this.boardStats.isWhiteInCheckmate} | White King: ${ChessPosition.toString(this.whiteKingPiece.getPosition())}\n`;
        board += `Black in check: ${this.boardStats.isBlackInCheck} | Black in checkmate: ${this.boardStats.isBlackInCheckmate} | Black King: ${ChessPosition.toString(this.blackKingPiece.getPosition())}\n`;
        board += `Stalemate: ${this.boardStats.isStalemate}\n`;
        board += `Move Number: ${this.getMoveNumber()}\n`;
        board += `Board Value: ${this.getScore()}\n`;
    
        return board;
    }
    

    /**
     * Get a board state object of the beginning of a game
     */
    public static getStartBoard(): ChessBoardStateImpl {
        const positions: (ChessPiece | null)[] = new Array(64).fill(null);

        // temp variable to store positions for insertion
        let pos: ChessCell;

        // add pawns
        for (let col = 1; col < 9; col++) {
            pos = ChessPosition.get(col, 2);
            // white pawn
            positions[pos] = new PawnPiece(ChessPlayer.white, pos);

            // black pawn
            pos = ChessPosition.get(col, 7);
            positions[pos] = new PawnPiece(ChessPlayer.black, pos);
        }

        // add rooks
        pos = ChessPosition.get(1, 1);
        positions[pos] = new RookPiece(ChessPlayer.white, pos);
        pos = ChessPosition.get(1, 8);
        positions[pos] = new RookPiece(ChessPlayer.black, pos);
        pos = ChessPosition.get(8, 1);
        positions[pos] = new RookPiece(ChessPlayer.white, pos);
        pos = ChessPosition.get(8, 8);
        positions[pos] = new RookPiece(ChessPlayer.black, pos);

        // add knights
        pos = ChessPosition.get(2, 1);
        positions[pos] = new KnightPiece(ChessPlayer.white, pos);
        pos = ChessPosition.get(2, 8);
        positions[pos] = new KnightPiece(ChessPlayer.black, pos);
        pos = ChessPosition.get(7, 1);
        positions[pos] = new KnightPiece(ChessPlayer.white, pos);
        pos = ChessPosition.get(7, 8);
        positions[pos] = new KnightPiece(ChessPlayer.black, pos);

        // add bishops
        pos = ChessPosition.get(3, 1);
        positions[pos] = new BishopPiece(ChessPlayer.white, pos);
        pos = ChessPosition.get(3, 8);
        positions[pos] = new BishopPiece(ChessPlayer.black, pos);
        pos = ChessPosition.get(6, 1);
        positions[pos] = new BishopPiece(ChessPlayer.white, pos);
        pos = ChessPosition.get(6, 8);
        positions[pos] = new BishopPiece(ChessPlayer.black, pos);

        // add queens
        pos = ChessPosition.get(4, 1);
        positions[pos] = new QueenPiece(ChessPlayer.white, pos);
        pos = ChessPosition.get(4, 8);
        positions[pos] = new QueenPiece(ChessPlayer.black, pos);

        // add kings
        pos = ChessPosition.get(5, 1);
        const whiteKingPiece = new KingPiece(ChessPlayer.white, pos);
        positions[pos] = whiteKingPiece;
        pos = ChessPosition.get(5, 8);
        const blackKingPiece = new KingPiece(ChessPlayer.black, pos);
        positions[pos] = blackKingPiece;

        const state = new ChessBoardStateImpl(positions);
        state.whiteKingPiece = whiteKingPiece;
        state.blackKingPiece = blackKingPiece;

        const piecesValue =
            BishopPiece.pointsValue * 2 +
            KnightPiece.pointsValue * 2 +
            RookPiece.pointsValue * 2 +
            QueenPiece.pointsValue +
            PawnPiece.pointsValue * 8;
        state.boardStats.whitePiecesValue = piecesValue;
        state.boardStats.blackPiecesValue = piecesValue;

        return state;
    }

    private getPieceStringLetter(position: ChessPiece | null): string {
        if (!position) {
            return "-";
        }
        return position.player === ChessPlayer.white
            ? position.letter
            : position.letter.toLowerCase();
    }

    private buildZobristTable(): void {
        // Initialize Zobrist table
        this.zobristTable = [];
        for (let piece = 0; piece < 12; piece++) {
            this.zobristTable[piece] = [];
            for (let square = 0; square < 64; square++) {
                this.zobristTable[piece][square] = this.generateRandomBitstring();
            }
        }
        this.zobristHash = this.calculateInitialZobristHash();
    }

    private generateRandomBitstring(): number {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }

    private calculateInitialZobristHash(): number {
        let hash = 0;
        for (let square = 0; square < 64; square++) {
            const piece = this.getPieceAtPosition(square);
            if (piece) {
                const pieceIndex = piece.getType();
                hash ^= this.zobristTable[pieceIndex][square];
            }
        }
        return hash;
    }

    public getZobristHash(): number {
        return this.zobristHash;
    }

    // Update Zobrist hash incrementally after a move
    private updateZobristHash(fromPos: number, toPos: number): void {
        // XOR out the piece from the fromPosition
        const movingPiece = this.getPieceAtPosition(fromPos);
        if (movingPiece) {
            const pieceIndex = movingPiece.getType();
            this.zobristHash ^= this.zobristTable[pieceIndex][fromPos];
            this.zobristHash ^= this.zobristTable[pieceIndex][toPos];
        }

        // XOR out any captured piece at toPos
        const capturedPiece = this.getPieceAtPosition(toPos);
        if (capturedPiece && capturedPiece !== movingPiece) {
            const capturedPieceIndex = capturedPiece.getType();
            this.zobristHash ^= this.zobristTable[capturedPieceIndex][toPos];
        }
    }

    /**
     * Serializes the entire state of the ChessBoardState, including all properties.
     */
    serialize(): string {
        const serializedState: any = {};

        // Serialize all properties of the class instance
        for (const key of Object.keys(this)) {
            const value = (this as any)[key];

            if (value instanceof Map) {
                serializedState[key] = Array.from(value.entries());
            } else if (value instanceof Set) {
                serializedState[key] = Array.from(value);
            } else if (value instanceof AbstractChessPiece) {
                serializedState[key] = value.serialize();
            } else if (value && typeof value === 'object' && typeof value.serialize === 'function') {
                serializedState[key] = value.serialize();
            } else {
                serializedState[key] = value;
            }
        }

        return JSON.stringify(serializedState);
    }

    /**
     * Deserializes a JSON string into a ChessBoardState object.
     */
    static deserialize(jsonString: string): ChessBoardStateImpl {
        const parsedState = JSON.parse(jsonString);
        const state = new ChessBoardStateImpl(parsedState.positions);

        // Reflectively deserialize all properties
        for (const key of Object.keys(parsedState)) {
            let value = parsedState[key];

            if (Array.isArray(value) && value.every(item => Array.isArray(item))) {
                // Handle Maps
                (state as any)[key] = new Map(value as any);
            } else if (Array.isArray(value)) {
                // Handle Sets
                (state as any)[key] = new Set(value);
            } else if (value && typeof value === 'object' && value.letter && value.player) {
                // Handle ChessPiece
                (state as any)[key] = ChessPieceFactory.createPieceFromSerialized(value);
            } else if (value && typeof value === 'object' && value.zobristHash) {
                // Handle complex nested objects that are not ChessPieces
                (state as any)[key] = ChessBoardMoveDeserializer.deserialize(value);
            } else {
                // Handle simple types
                (state as any)[key] = value;
            }
        }

        return state;
    }

}
