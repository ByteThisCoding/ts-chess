import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a King
 * This piece doesn't use move caching to prevent any issues with castling
 * This piece doesn't use shadow moves since it can only move 1 square / castle
 */
export class KingPiece extends ChessPiece {
    name: string = "King";

    static letter = "K";
    letter: string = KingPiece.letter;
    type = 5;

    static pointsValue = 50;
    pointsValue: number = KingPiece.pointsValue;

    // don't want to cache because of castling
    doCacheMoves = false;

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 10);
    }

    protected doClone(): KingPiece {
        return new KingPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = this.getNonCastleMovements(boardState);
        this.addCastleMovements(boardState, moves, 1);

        return moves;
    }

    // movements are the same for black or white
    protected getPossibleMovementsBlack(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = this.getNonCastleMovements(boardState);
        this.addCastleMovements(boardState, moves, 8);

        return moves;
    }

    /**
     * Add castle movements to the first or last row if criteria is met
     */
    private addCastleMovements(
        boardState: ChessBoardState,
        moves: ChessPieceAvailableMoveSet,
        row: 1 | 8
    ): void {
        // invalid if the king has moved
        if (this.getIsActivated()) {
            return;
        }

        // can't if player is in check
        /*if (boardState.isGameInCheck()) {
            return;
        }*/

        // invalid if king is in wrong position (sanity check, other conditions not sufficient at time of writing)
        const col = ChessPosition.getCellCol(this.getPosition());

        if (col !== 5) {
            return;
        }

        // queenside rook
        const firstRookPos = ChessPosition.get(1, row);
        const firstRook = boardState.getPieceAtPosition(firstRookPos);
        if (firstRook && !firstRook.getIsActivated()) {
            // check if any pieces in the way
            const knightPos = ChessPosition.get(2, row);
            const bishopPos = ChessPosition.get(3, row);
            if (
                !boardState.hasPieceAtPosition(knightPos) &&
                !boardState.hasPieceAtPosition(bishopPos)
            ) {
                moves.addMove(
                    ChessPiece.newMove(this, firstRookPos, true),
                    boardState
                );
            }
        }

        // kingside rook
        const secondRookPos = ChessPosition.get(8, row);
        const secondRook = boardState.getPieceAtPosition(secondRookPos);
        if (secondRook && !secondRook.getIsActivated()) {
            // check if any pieces in the way
            const knightPos = ChessPosition.get(7, row);
            const bishopPos = ChessPosition.get(6, row);
            if (
                !boardState.hasPieceAtPosition(knightPos) &&
                !boardState.hasPieceAtPosition(bishopPos)
            ) {
                moves.addMove(
                    ChessPiece.newMove(this, secondRookPos, true),
                    boardState
                );
            }
        }
    }

    /**
     * Get all possible board states except for castle
     */
    private getNonCastleMovements(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player);

        // add for bishop like movements
        // add for higher columns
        const posCol = ChessPosition.getCellCol(this.getPosition());
        const posRow = ChessPosition.getCellRow(this.getPosition());

        if (posCol > 1) {
            if (posRow + 1 < 9) {
                moves.addMove(
                    ChessPiece.newMove(
                        this,
                        ChessPosition.get(posCol - 1, posRow + 1)
                    ),
                    boardState
                );
            }
            if (posRow - 1 > 0) {
                moves.addMove(
                    ChessPiece.newMove(
                        this,
                        ChessPosition.get(posCol - 1, posRow - 1)
                    ),
                    boardState
                );
            }
        }

        // add for lower columns
        if (posCol < 8) {
            if (posRow + 1 < 9) {
                moves.addMove(
                    ChessPiece.newMove(
                        this,
                        ChessPosition.get(posCol + 1, posRow + 1)
                    ),
                    boardState
                );
            }
            if (posRow - 1 > 0) {
                moves.addMove(
                    ChessPiece.newMove(
                        this,
                        ChessPosition.get(posCol + 1, posRow - 1)
                    ),
                    boardState
                );
            }
        }

        // add for rook like movements
        // add all in current col
        if (posRow > 1) {
            moves.addMove(
                ChessPiece.newMove(this, ChessPosition.get(posCol, posRow - 1)),
                boardState
            );
        }
        if (posRow < 8) {
            moves.addMove(
                ChessPiece.newMove(this, ChessPosition.get(posCol, posRow + 1)),
                boardState
            );
        }
        if (posCol > 1) {
            moves.addMove(
                ChessPiece.newMove(this, ChessPosition.get(posCol - 1, posRow)),
                boardState
            );
        }
        if (posCol < 8) {
            moves.addMove(
                ChessPiece.newMove(this, ChessPosition.get(posCol + 1, posRow)),
                boardState
            );
        }

        return moves;
    }
}
