import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a pawn
 */
export class PawnPiece extends ChessPiece {
    name: string = "Pawn";
    letter: string = "P";
    pointsValue: number = 1;

    constructor(public player: ChessPlayer, position: ChessPosition) {
        super(position);
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

        if (
            (inc === -1 && this.getPosition().row > 1) ||
            (inc === 1 && this.getPosition().row < 8)
        ) {
            const nextPos = ChessPosition.get(
                this.getPosition().col,
                this.getPosition().row + inc
            );

            if (!boardState.hasPieceAtPosition(nextPos)) {
                // if this can be promoted, do it
                if (
                    (inc === -1 && this.getPosition().row === 2) ||
                    (inc === 1 && this.getPosition().row === 7)
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
            if (this.getPosition().col > 1) {
                const takeLeftPos = ChessPosition.get(
                    this.getPosition().col - 1,
                    this.getPosition().row + inc
                );
                if (boardState.hasPieceAtPosition(takeLeftPos)) {
                    // if this can be promoted, do it
                    if (
                        (inc === -1 && this.getPosition().row === 2) ||
                        (inc === 1 && this.getPosition().row === 7)
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

            if (this.getPosition().col < 8) {
                const takeRightPos = ChessPosition.get(
                    this.getPosition().col + 1,
                    this.getPosition().row + inc
                );
                if (boardState.hasPieceAtPosition(takeRightPos)) {
                    // if this can be promoted, do it
                    if (
                        (inc === -1 && this.getPosition().row === 2) ||
                        (inc === 1 && this.getPosition().row === 7)
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

        // can move two if on home row
        if (
            (inc === -1 && this.getPosition().row === 7) ||
            (inc === 1 && this.getPosition().row === 2)
        ) {
            const nextPos = ChessPosition.get(
                this.getPosition().col,
                this.getPosition().row + inc * 2
            );

            if (!boardState.hasPieceAtPosition(nextPos)) {
                moves.add(this.newMove(boardState, nextPos));
            }
        }

        // en passant
        if (
            (inc === -1 && this.getPosition().row === 4) ||
            (inc === 1 && this.getPosition().row === 5)
        ) {
            if (this.getPosition().col > 1) {
                const leftPawnPos = ChessPosition.get(
                    this.getPosition().col - 1,
                    this.getPosition().row
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
                                this.getPosition().col - 1,
                                this.getPosition().row + inc
                            ),
                            false,
                            true
                        )
                    );
                }
            }

            if (this.getPosition().col < 8) {
                const rightPawnPos = ChessPosition.get(
                    this.getPosition().col + 1,
                    this.getPosition().row
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
                                this.getPosition().col + 1,
                                this.getPosition().row + inc
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
