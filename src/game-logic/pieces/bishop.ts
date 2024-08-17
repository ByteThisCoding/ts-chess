import { AbstractChessPiece } from "./abstract-chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessBoardState } from "../board-state/chess-board-state.model";
import { ChessPiece } from "./chess-piece.model";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set.model";
import { ChessPieceAvailableMoveSetImpl } from "../moves/chess-piece-available-move-set-impl";

/**
 * Encapsulation of a bishop
 */
export class BishopPiece extends AbstractChessPiece {
    static letter = "B";
    letter: string = BishopPiece.letter;

    doCacheMoves = true;

    name: string = "Bishop";
    type = 2;

    static pointsValue = 3;
    pointsValue: number = BishopPiece.pointsValue;

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 14);
    }

    protected doClone(): BishopPiece {
        return new BishopPiece(this.player, this.getPosition());
    }

    /**
     * The Queen piece can re-use this method to get its possible positions
     */
    static addPossibleMovesToSet(
        thisPiece: ChessPiece,
        boardState: ChessBoardState,
        moves: ChessPieceAvailableMoveSet
    ): void {
        // add for higher columns
        const posCol = ChessPosition.getCellCol(thisPiece.getPosition());
        const posRow = ChessPosition.getCellRow(thisPiece.getPosition());

        let isShadow: boolean;
        let blockingPiece: ChessPiece | null;

        isShadow = false;
        blockingPiece = null;
        for (let col = posCol - 1; col > 0; col--) {
            const rowOffset = posCol - col;
            const toPosition = ChessPosition.get(col, posRow + rowOffset);

            // stop if out of bounds
            if (posRow + rowOffset > 8) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (isShadow) {
                    if (existingPiece.player !== thisPiece.player) {
                        moves.addShadowMove(
                            this.newShadowMove(
                                thisPiece,
                                toPosition,
                                blockingPiece!
                            )
                        );
                    }
                    break;
                } else if (existingPiece.player !== thisPiece.player) {
                    moves.addMove(
                        this.newMove(thisPiece, toPosition),
                        boardState
                    );
                    // block the next position
                    const blockedPosition = ChessPosition.get(
                        col,
                        posRow + rowOffset + 1
                    );
                    moves.addBlockedPosition(blockedPosition);
                    isShadow = true;
                    blockingPiece = existingPiece;
                } else {
                    moves.addBlockedPosition(toPosition);
                    break;
                }
            } else if (isShadow) {
                moves.addShadowMove(
                    this.newShadowMove(thisPiece, toPosition, blockingPiece!)
                );
            } else {
                moves.addMove(this.newMove(thisPiece, toPosition), boardState);
            }
        }

        isShadow = false;
        blockingPiece = null;
        for (let col = posCol - 1; col > 0; col--) {
            const rowOffset = posCol - col;
            const toPosition = ChessPosition.get(col, posRow - rowOffset);

            // stop if out of bounds
            if (posRow - rowOffset < 1) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (isShadow) {
                    if (existingPiece.player !== thisPiece.player) {
                        moves.addShadowMove(
                            this.newShadowMove(
                                thisPiece,
                                toPosition,
                                blockingPiece!
                            )
                        );
                        break;
                    }
                } else if (existingPiece.player !== thisPiece.player) {
                    moves.addMove(
                        this.newMove(thisPiece, toPosition),
                        boardState
                    );
                    // block the next position
                    const blockedPosition = ChessPosition.get(
                        col,
                        posRow + rowOffset - 1
                    );
                    moves.addBlockedPosition(blockedPosition);
                    isShadow = true;
                    blockingPiece = existingPiece;
                } else {
                    moves.addBlockedPosition(toPosition);
                    break;
                }
            } else if (isShadow) {
                moves.addShadowMove(
                    this.newShadowMove(thisPiece, toPosition, blockingPiece!)
                );
            } else {
                moves.addMove(this.newMove(thisPiece, toPosition), boardState);
            }
        }

        isShadow = false;
        blockingPiece = null;
        // add for lower columns
        for (let col = posCol + 1; col < 9; col++) {
            const rowOffset = col - posCol;
            const toPosition = ChessPosition.get(col, posRow + rowOffset);

            if (posRow + rowOffset > 8) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (isShadow) {
                    if (existingPiece.player !== thisPiece.player) {
                        moves.addShadowMove(
                            this.newShadowMove(
                                thisPiece,
                                toPosition,
                                blockingPiece!
                            )
                        );
                    }
                    break;
                } else if (existingPiece.player !== thisPiece.player) {
                    moves.addMove(
                        this.newMove(thisPiece, toPosition),
                        boardState
                    );
                    // block the next position
                    const blockedPosition = ChessPosition.get(
                        col,
                        posRow + rowOffset + 1
                    );
                    moves.addBlockedPosition(blockedPosition);
                    isShadow = true;
                    blockingPiece = existingPiece;
                } else {
                    moves.addBlockedPosition(toPosition);
                    break;
                }
            } else if (isShadow) {
                moves.addShadowMove(
                    this.newShadowMove(thisPiece, toPosition, blockingPiece!)
                );
            } else {
                moves.addMove(this.newMove(thisPiece, toPosition), boardState);
            }
        }

        isShadow = false;
        blockingPiece = null;
        for (let col = posCol + 1; col < 9; col++) {
            const rowOffset = col - posCol;
            const toPosition = ChessPosition.get(col, posRow - rowOffset);

            if (posRow - rowOffset < 1) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (isShadow) {
                    if (existingPiece.player !== thisPiece.player) {
                        moves.addShadowMove(
                            this.newShadowMove(
                                thisPiece,
                                toPosition,
                                blockingPiece!
                            )
                        );
                    }
                    break;
                } else if (existingPiece.player !== thisPiece.player) {
                    moves.addMove(
                        this.newMove(thisPiece, toPosition),
                        boardState
                    );
                    // block the next position
                    const blockedPosition = ChessPosition.get(
                        col,
                        posRow + rowOffset - 1
                    );
                    moves.addBlockedPosition(blockedPosition);
                    isShadow = true;
                    blockingPiece = existingPiece;
                } else {
                    moves.addBlockedPosition(toPosition);
                    break;
                }
            } else if (isShadow) {
                moves.addShadowMove(
                    this.newShadowMove(thisPiece, toPosition, blockingPiece!)
                );
            } else {
                moves.addMove(this.newMove(thisPiece, toPosition), boardState);
            }
        }
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSetImpl(this.player);
        BishopPiece.addPossibleMovesToSet(this, boardState, moves);
        return moves;
    }

    // movements are the same for black or white
    protected getPossibleMovementsBlack(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        return this.getPossibleMovementsWhite(boardState);
    }
}
