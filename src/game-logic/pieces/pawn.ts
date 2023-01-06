import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a pawn
 */
export class PawnPiece extends ChessPiece {
    name: string = "Pawn";
    letter: string = "P";
    pointsValue: number = 1;

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
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);
        const [posCol, posRow] = ChessPosition.cellToColRow(this.getPosition());

        if (
            (inc === -1 && posRow > 1) ||
            (inc === 1 && posRow < 8)
        ) {
            const nextPos = ChessPosition.get(
                posCol,
                posRow + inc
            );

            if (!boardState.hasPieceAtPosition(nextPos)) {
                // if this can be promoted, do it
                if (
                    (inc === -1 && posRow === 2) ||
                    (inc === 1 && posRow === 7)
                ) {
                    ["r", "n", "b", "q"].forEach((letter) => {
                        moves.add(
                            this.newMove(
                                boardState,
                                nextPos,
                                false,
                                false,
                                true,
                                letter
                            )
                        );
                    });
                } else {
                    moves.add(this.newMove(boardState, nextPos));
                }
            }

            // add capture pieces if possible
            if (posCol > 1) {
                const takeLeftPos = ChessPosition.get(
                    posCol - 1,
                    posRow + inc
                );
                if (boardState.hasPieceAtPosition(takeLeftPos)) {
                    // if this can be promoted, do it
                    if (
                        (inc === -1 && posRow === 2) ||
                        (inc === 1 && posRow === 7)
                    ) {
                        ["r", "n", "b", "q"].forEach((letter) => {
                            moves.add(
                                this.newMove(
                                    boardState,
                                    takeLeftPos,
                                    false,
                                    false,
                                    true,
                                    letter
                                )
                            );
                        });
                    } else {
                        moves.add(this.newMove(boardState, takeLeftPos));
                    }
                }
            }

            if (posCol < 8) {
                const takeRightPos = ChessPosition.get(
                    posCol + 1,
                    posRow + inc
                );
                if (boardState.hasPieceAtPosition(takeRightPos)) {
                    // if this can be promoted, do it
                    if (
                        (inc === -1 && posRow === 2) ||
                        (inc === 1 && posRow === 7)
                    ) {
                        ["r", "n", "b", "q"].forEach((letter) => {
                            moves.add(
                                this.newMove(
                                    boardState,
                                    takeRightPos,
                                    false,
                                    false,
                                    true,
                                    letter
                                )
                            );
                        });
                    } else {
                        moves.add(this.newMove(boardState, takeRightPos));
                    }
                }
            }
        }

        // can move two if on home row and no piece in the way
        if (
            (inc === -1 && posRow === 7) ||
            (inc === 1 && posRow === 2)
        ) {
            const blockingPos = ChessPosition.get(
                posCol,
                posRow + inc
            );

            if (!boardState.hasPieceAtPosition(blockingPos)) {
                const nextPos = ChessPosition.get(
                    posCol,
                    posRow + inc * 2
                );

                if (!boardState.hasPieceAtPosition(nextPos)) {
                    moves.add(this.newMove(boardState, nextPos));
                }
            }
        }

        // en passant
        if (
            (inc === -1 && posRow === 4) ||
            (inc === 1 && posRow === 5)
        ) {
            if (posCol > 1) {
                const leftPawnPos = ChessPosition.get(
                    posCol - 1,
                    posRow
                );
                const leftPawn = boardState.getPieceAtPosition(leftPawnPos);

                if (
                    leftPawn &&
                    leftPawn.getLastPositionChangeTurn() ===
                        boardState.getMoveNumber()
                ) {
                    moves.add(
                        this.newMove(
                            boardState,
                            ChessPosition.get(
                                posCol - 1,
                                posRow + inc
                            ),
                            false,
                            true
                        )
                    );
                }
            }

            if (posCol < 8) {
                const rightPawnPos = ChessPosition.get(
                    posCol + 1,
                    posRow
                );
                const rightPawn = boardState.getPieceAtPosition(rightPawnPos);
                if (
                    rightPawn &&
                    rightPawn.getLastPositionChangeTurn() ===
                        boardState.getMoveNumber()
                ) {
                    moves.add(
                        this.newMove(
                            boardState,
                            ChessPosition.get(
                                posCol + 1,
                                posRow + inc
                            ),
                            false,
                            true
                        )
                    );
                }
            }
        }

        return moves;
    }
}
