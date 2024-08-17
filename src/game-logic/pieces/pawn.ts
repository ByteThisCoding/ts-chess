import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { KnightPiece } from "./knight";
import { QueenPiece } from "./queen";
import { ChessBoardState } from "../board-state/chess-board-state.model";
import { AbstractChessPiece } from "./abstract-chess-piece";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set.model";
import { ChessPieceAvailableMoveSetImpl } from "../moves/chess-piece-available-move-set-impl";

/**
 * Encapsulation of a pawn
 * This piece doesn't use shadow moves because it can only move to specific squares in a capturing manner (i.e. not in a line)
 */
export class PawnPiece extends AbstractChessPiece {
    static letter = "P";
    letter: string = PawnPiece.letter;

    name: string = "Pawn";
    type = 0;

    static pointsValue = 1;
    pointsValue: number = PawnPiece.pointsValue;

    doCacheMoves = true;

    // if rook or bishop, might as well make it a queen instead
    private promotionLetters = [QueenPiece.letter, KnightPiece.letter];

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 13);
    }

    protected doClone(): PawnPiece {
        return new PawnPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        return this.doGetPossibleMovements(boardState, 1);
    }

    protected getPossibleMovementsBlack(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        return this.doGetPossibleMovements(boardState, -1);
    }

    /**
     * Generic implementation to let us handle up or down
     */
    private doGetPossibleMovements(
        boardState: ChessBoardState,
        inc: 1 | -1
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSetImpl(this.player);
        const posCol = ChessPosition.getCellCol(this.getPosition());
        const posRow = ChessPosition.getCellRow(this.getPosition());

        // see if the pawn can move forward
        if ((inc === -1 && posRow > 1) || (inc === 1 && posRow < 8)) {
            const nextPos = ChessPosition.get(posCol, posRow + inc);

            // if no position infront, it can move forward
            if (!boardState.hasPieceAtPosition(nextPos)) {
                // if this can be promoted, do it
                if (
                    (inc === -1 && posRow === 2) ||
                    (inc === 1 && posRow === 7)
                ) {
                    this.promotionLetters.forEach((letter) => {
                        moves.addMove(
                            AbstractChessPiece.newMove(
                                this,
                                nextPos,
                                false,
                                false,
                                true,
                                letter
                            ),
                            boardState
                        );
                    });
                } else {
                    // otherwise, add normal move
                    moves.addMove(
                        AbstractChessPiece.newMove(this, nextPos),
                        boardState
                    );
                }
            } else {
                moves.addBlockedPosition(nextPos);
            }

            // add capture pieces if possible
            if (posCol > 1) {
                const takeLeftPos = ChessPosition.get(posCol - 1, posRow + inc);
                if (
                    boardState.hasPieceAtPosition(takeLeftPos) &&
                    boardState.getPieceAtPosition(takeLeftPos)?.player !==
                        this.player
                ) {
                    // if this can be promoted, do it
                    if (
                        (inc === -1 && posRow === 2) ||
                        (inc === 1 && posRow === 7)
                    ) {
                        this.promotionLetters.forEach((letter) => {
                            moves.addMove(
                                AbstractChessPiece.newMove(
                                    this,
                                    takeLeftPos,
                                    false,
                                    false,
                                    true,
                                    letter
                                ),
                                boardState
                            );
                        });
                    } else {
                        moves.addMove(
                            AbstractChessPiece.newMove(this, takeLeftPos),
                            boardState
                        );
                    }
                } else {
                    moves.addBlockedPosition(takeLeftPos);
                }
            }

            if (posCol < 8) {
                const takeRightPos = ChessPosition.get(
                    posCol + 1,
                    posRow + inc
                );
                if (
                    boardState.hasPieceAtPosition(takeRightPos) &&
                    boardState.getPieceAtPosition(takeRightPos)?.player !==
                        this.player
                ) {
                    // if this can be promoted, do it
                    if (
                        (inc === -1 && posRow === 2) ||
                        (inc === 1 && posRow === 7)
                    ) {
                        this.promotionLetters.forEach((letter) => {
                            moves.addMove(
                                AbstractChessPiece.newMove(
                                    this,
                                    takeRightPos,
                                    false,
                                    false,
                                    true,
                                    letter
                                ),
                                boardState
                            );
                        });
                    } else {
                        moves.addMove(
                            AbstractChessPiece.newMove(this, takeRightPos),
                            boardState
                        );
                    }
                } else {
                    moves.addBlockedPosition(takeRightPos);
                }
            }
        }

        // can move two if on home row and no piece in the way
        if ((inc === -1 && posRow === 7) || (inc === 1 && posRow === 2)) {
            const blockingPos = ChessPosition.get(posCol, posRow + inc);

            if (!boardState.hasPieceAtPosition(blockingPos)) {
                const nextPos = ChessPosition.get(posCol, posRow + inc * 2);

                if (!boardState.hasPieceAtPosition(nextPos)) {
                    moves.addMove(
                        AbstractChessPiece.newMove(this, nextPos),
                        boardState
                    );
                } else {
                    moves.addBlockedPosition(nextPos);
                }
            } else {
                // redundant?
                moves.addBlockedPosition(blockingPos);
            }
        }

        // en passant
        if ((inc === -1 && posRow === 4) || (inc === 1 && posRow === 5)) {
            if (posCol > 1) {
                const leftPawnPos = ChessPosition.get(posCol - 1, posRow);
                const leftPawn = boardState.getPieceAtPosition(leftPawnPos);
                const leftPawnMove = ChessPosition.get(
                    posCol - 1,
                    posRow + inc
                );

                if (
                    leftPawn &&
                    leftPawn.letter === PawnPiece.letter &&
                    leftPawn.player !== this.player &&
                    leftPawn.getLastPositionChangeTurn() ===
                        boardState.getMoveNumber()
                ) {
                    moves.addMove(
                        AbstractChessPiece.newMove(this, leftPawnMove, false, true),
                        boardState
                    );
                } else {
                    moves.addBlockedPosition(leftPawnMove);
                }
            }

            if (posCol < 8) {
                const rightPawnPos = ChessPosition.get(posCol + 1, posRow);
                const rightPawn = boardState.getPieceAtPosition(rightPawnPos);
                const rightPawnMove = ChessPosition.get(
                    posCol + 1,
                    posRow + inc
                );

                if (
                    rightPawn &&
                    rightPawn.letter === PawnPiece.letter &&
                    rightPawn.player !== this.player &&
                    rightPawn.getLastPositionChangeTurn() ===
                        boardState.getMoveNumber()
                ) {
                    moves.addMove(
                        AbstractChessPiece.newMove(this, rightPawnMove, false, true),
                        boardState
                    );
                } else {
                    moves.addBlockedPosition(rightPawnMove);
                }
            }
        }

        return moves;
    }
}
