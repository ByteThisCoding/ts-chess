import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";
import { QueenPiece } from "./queen";

/**
 * Encapsulation of a rook
 */
export class RookPiece extends ChessPiece {
    static letter = "R";
    letter: string = RookPiece.letter;

    name: string = "Rook";
    type = 3;

    static pointsValue = 5;
    pointsValue: number = RookPiece.pointsValue;

    doCacheMoves = true;

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 14);
    }

    protected doClone(): RookPiece {
        return new RookPiece(this.player, this.getPosition());
    }

    /**
     * The Queen piece can re-use this method to get its possible positions
     */
    static addPossibleMovesToSet(
        thisPiece: ChessPiece,
        boardState: ChessBoardState,
        moves: ChessPieceAvailableMoveSet
    ): void {
        const posCol = ChessPosition.getCellCol(thisPiece.getPosition());
        const posRow = ChessPosition.getCellRow(thisPiece.getPosition());

        let isShadow: boolean;
        let blockingPiece: ChessPiece | null = null;

        // add all to the right in col
        isShadow = false;
        blockingPiece = null;
        for (let i = posCol + 1; i < 9; i++) {
            const newPos = ChessPosition.get(i, posRow);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (isShadow) {
                    if (existingPiece.player !== thisPiece.player) {
                        moves.addShadowMove(
                            this.newShadowMove(
                                thisPiece,
                                newPos,
                                blockingPiece!
                            )
                        );
                    }
                    break;
                } else if (existingPiece.player !== thisPiece.player) {
                    moves.addMove(this.newMove(thisPiece, newPos), boardState);
                    // ensure next position is marked as blocked
                    const blockedPosition = ChessPosition.get(i + 1, posRow);
                    moves.addBlockedPosition(blockedPosition);
                    isShadow = true;
                    blockingPiece = existingPiece;
                } else {
                    moves.addBlockedPosition(newPos);
                    break;
                }
            } else if (isShadow) {
                moves.addShadowMove(
                    this.newShadowMove(thisPiece, newPos, blockingPiece!)
                );
            } else {
                moves.addMove(this.newMove(thisPiece, newPos), boardState);
            }
        }

        // add all to the left in col
        isShadow = false;
        blockingPiece = null;
        for (let i = posCol - 1; i > 0; i--) {
            const newPos = ChessPosition.get(i, posRow);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (isShadow) {
                    if (existingPiece.player !== thisPiece.player) {
                        moves.addShadowMove(
                            this.newShadowMove(
                                thisPiece,
                                newPos,
                                blockingPiece!
                            )
                        );
                    }
                    break;
                } else if (existingPiece.player !== thisPiece.player) {
                    moves.addMove(this.newMove(thisPiece, newPos), boardState);
                    // ensure next position is marked as blocked
                    const blockedPosition = ChessPosition.get(i - 1, posRow);
                    moves.addBlockedPosition(blockedPosition);
                    isShadow = true;
                    blockingPiece = existingPiece;
                } else {
                    moves.addBlockedPosition(newPos);
                    break;
                }
            } else if (isShadow) {
                moves.addShadowMove(
                    this.newShadowMove(thisPiece, newPos, blockingPiece!)
                );
            } else {
                moves.addMove(this.newMove(thisPiece, newPos), boardState);
            }
        }

        // add all above in row
        isShadow = false;
        blockingPiece = null;
        for (let i = posRow + 1; i < 9; i++) {
            const newPos = ChessPosition.get(posCol, i);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (isShadow) {
                    if (existingPiece.player !== thisPiece.player) {
                        moves.addShadowMove(
                            this.newShadowMove(
                                thisPiece,
                                newPos,
                                blockingPiece!
                            )
                        );
                    }
                    break;
                } else if (existingPiece.player !== thisPiece.player) {
                    moves.addMove(this.newMove(thisPiece, newPos), boardState);
                    // ensure next position is marked as blocked
                    const blockedPosition = ChessPosition.get(posCol, i + 1);
                    moves.addBlockedPosition(blockedPosition);
                    isShadow = true;
                    blockingPiece = existingPiece;
                } else {
                    moves.addBlockedPosition(newPos);
                    break;
                }
            } else if (isShadow) {
                moves.addShadowMove(
                    this.newShadowMove(thisPiece, newPos, blockingPiece!)
                );
            } else {
                moves.addMove(this.newMove(thisPiece, newPos), boardState);
            }
        }

        // add all below in row
        isShadow = false;
        blockingPiece = null;
        for (let i = posRow - 1; i > 0; i--) {
            const newPos = ChessPosition.get(posCol, i);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (isShadow) {
                    if (existingPiece.player !== thisPiece.player) {
                        moves.addShadowMove(
                            this.newShadowMove(
                                thisPiece,
                                newPos,
                                blockingPiece!
                            )
                        );
                    }
                    break;
                } else if (existingPiece.player !== thisPiece.player) {
                    moves.addMove(this.newMove(thisPiece, newPos), boardState);
                    // ensure next position is marked as blocked
                    const blockedPosition = ChessPosition.get(posCol, i - 1);
                    moves.addBlockedPosition(blockedPosition);
                    isShadow = true;
                    blockingPiece = existingPiece;
                } else {
                    moves.addBlockedPosition(newPos);
                    break;
                }
            } else if (isShadow) {
                moves.addShadowMove(
                    this.newShadowMove(thisPiece, newPos, blockingPiece!)
                );
            } else {
                moves.addMove(this.newMove(thisPiece, newPos), boardState);
            }
        }
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player);

        RookPiece.addPossibleMovesToSet(this, boardState, moves);

        return moves;
    }

    // movements are the same for black or white
    protected getPossibleMovementsBlack(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        return this.getPossibleMovementsWhite(boardState);
    }
}
