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
import { ChessMoveValidator } from "../moves/chess-move-validator";

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
        /*if (!this._possiblePieceCache.has(piece)) {
            this._possiblePieceCache.set(piece, piece.getPossibleMovements(this));
        }
        return this._possiblePieceCache.get(piece)!;*/
        return piece.getPossibleMovements(this);
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

        // TODO: temporary bug fix
        /*if (move.pieceMoved instanceof KingPiece) {
            if (move.player === ChessPlayer.white) {
                this.whiteKingPiece = move.pieceMoved;
            } else {
                this.blackKingPiece = move.pieceMoved;
            }
        }*/

        // handle special cases
        if (move.isPromotion) {
            const newPiece = ChessPieceFactory.createPiece(
                move.promoteToPieceLetter,
                move.player,
                move.toPosition
            );
            this.updateSinglePiece(move.toPosition, move.pieceMoved, this.boardStats.moveNumber, newPiece);
        } else if (move.isEnPassant) {
            // the to-position indicates above or below the pawn to delete
            const [col, row] = ChessPosition.cellToColRow(move.toPosition);
            const existingPawnRow =
                move.player === ChessPlayer.white
                    ? row - 1
                    : col + 1;
                    
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
     */
    private updateCheckStalemateStatus(): void {
        // since we have validations, the person who just made the move isn't in check
        if (this.boardStats.lastMove?.player === ChessPlayer.white) {
            this.boardStats.isWhiteInCheck = false;
        } else {
            this.boardStats.isBlackInCheck = false;
        }

        // search through possible moves
        const lastPlayerPossibleMoves = this.getPossibleMovesForPlayer(
            this.boardStats.lastMove!.player
        );

        const enemy =
            this.boardStats.lastMove?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        // check if enemy's king's position is included
        const enemyKing = this.getPlayerKingPiece(enemy);
        const enemyKingPos = enemyKing.getPosition();

        //let enemyInCheck = this.isPlayerInCheck(this.boardStats.lastMove!.player);
        let enemyInCheck = false;

        if (!enemyInCheck) {
            for (const move of lastPlayerPossibleMoves.getMoves()) {
                /*if (move.fromPosition === ChessPosition.get(3, 7)) {
                    console.log("check?", move.toString());
                }*/

                if (move.toPosition === enemyKingPos) {
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
                const enemyPossibleMoves = this.getPossibleMovesForPlayer(enemy);

                for (const move of enemyPossibleMoves.getMoves()) {
                    if (!this.doesMovePutPlayerInIllegalCheck(move)) {
                        isCheckmate = false;
                        break;
                    }
                }

                if (enemy === ChessPlayer.white) {
                    this.boardStats.isWhiteInCheckmate = isCheckmate;
                } else {
                    this.boardStats.isBlackInCheckmate = isCheckmate;
                }
            }
        } else {
            const enemyPossibleMoves = this.getPossibleMovesForPlayer(enemy);

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
     * Check if a potential move will put a player in an illegal check
     */
    doesMovePutPlayerInIllegalCheck(move: ChessBoardSingleMove): boolean {
        const prevCheck = this._performCheckmateEvaluation;
        this._performCheckmateEvaluation = false;

        // perform check
        const enemy =
            move.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        let isIllegal = false;

        this.setPiecesFromMove(move, "");
        const playerKing = this.getPlayerKingPiece(move.player);
        let playerKingPos = playerKing.getPosition();
        const enemyMoves = this.getPossibleMovesForPlayer(enemy);

        for (const enemyMove of enemyMoves.getMoves()) {
            if (enemyMove.toPosition === playerKingPos) {
                isIllegal = true;
                break;
            }
        }


        // reset
        this.undoLastMove();
        this._performCheckmateEvaluation = prevCheck;

        return isIllegal;
    }

    /**
     * Update a single position and set reverse map
     */
    private updateSinglePiece(
        pos: ChessCell,
        piece: ChessPiece | null,
        moveNumber: number,
        promotionPiece?: ChessPiece
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
        } else if (promotionPiece) {
            // special case, we're promoting a piece
            // we need to add that piece, then reverse map to put the pawn piece back
            const prevPos = piece.getPosition();

            // clear old position
            this.positions.delete(prevPos);

            // set new position
            this.positions.set(pos, promotionPiece);
            promotionPiece.setPosition(pos, moveNumber);

            // add entry to reverse-map to put it back to its original spot
            this.boardStats.lastMoveReverseUpdates.set(prevPos, { piece, turnNumber: this.boardStats.moveNumber - 1 });
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
        let cloneWhiteKing!: ChessPiece;
        let cloneBlackKing!: ChessPiece;
        const clonedPositions = new Map<ChessPosition, ChessPiece>();
        for (let [pos, piece] of this.positions) {
            piece = piece.clone();
            clonedPositions.set(pos, piece);
            if (piece instanceof KingPiece) {
                if (piece.player === ChessPlayer.white) {
                    cloneWhiteKing = piece;
                } else {
                    cloneBlackKing = piece;
                }
            }
        }
        const state = new ChessBoardState(clonedPositions);
        // TODO: deep recursive copy of board stats
        state.boardStats.lastMove = this.boardStats.lastMove?.clone() || null;
        state.whiteKingPiece = cloneWhiteKing as KingPiece;
        state.blackKingPiece = cloneBlackKing as KingPiece;
        state.boardStats = { ...(this.boardStats) };

        return state;
    }

    /**
     * Get a user-unfriendly string of board positions
     */
    toString(): string {
        let str = "";
        for (let i=0; i<64; i++) {
            const piece = this.getPieceAtPosition(i);
            if (piece) {
                str += piece.player === ChessPlayer.white ? piece.letter.toUpperCase() : piece.letter.toLowerCase();
            } else {
                str += "-";
            }
        }

        return str;
    }

    /**
     * Make a human readable string representation of the board
     */
    toStringDetailed(): string {
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
