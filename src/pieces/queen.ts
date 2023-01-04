import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a queen
 */
export class QueenPiece extends ChessPiece {
    name: string = "Queen";
    letter: string = "Q";
    pointsValue: number = 9;

    constructor(public player: ChessPlayer, position: ChessPosition) {
        super(position);
    }

    protected doClone(): QueenPiece {
        return new QueenPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);

        // add for bishop like movements
        // add for higher columns
        for (let col = this.getPosition().col - 1; col > 0; col--) {
            const rowOffset = this.getPosition().col - col;
            const toPosition = ChessPosition.get(
                col,
                this.getPosition().row + rowOffset
            );

            // stop if out of bounds
            if (this.getPosition().row + rowOffset > 8) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, toPosition));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, toPosition));
            }
        }

        for (let col = this.getPosition().col - 1; col > 0; col--) {
            const rowOffset = this.getPosition().col - col;
            const toPosition = ChessPosition.get(
                col,
                this.getPosition().row - rowOffset
            );

            // stop if out of bounds
            if (this.getPosition().row - rowOffset < 1) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, toPosition));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, toPosition));
            }
        }

        // add for lower columns
        for (let col = this.getPosition().col + 1; col < 9; col++) {
            const rowOffset = col - this.getPosition().col;
            const toPosition = ChessPosition.get(
                col,
                this.getPosition().row + rowOffset
            );

            if (this.getPosition().row + rowOffset > 8) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, toPosition));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, toPosition));
            }
        }

        for (let col = this.getPosition().col + 1; col < 9; col++) {
            const rowOffset = col - this.getPosition().col;
            const toPosition = ChessPosition.get(
                col,
                this.getPosition().row - rowOffset
            );

            if (this.getPosition().row - rowOffset < 1) {
                break;
            }

            const existingPiece = boardState.getPieceAtPosition(toPosition);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(this.newMove(boardState, toPosition));
                }

                break;
            } else {
                moves.add(this.newMove(boardState, toPosition));
            }
        }

        // add for rook like movements
        // add all to the right in col
        for (let i = this.getPosition().col + 1; i < 9; i++) {
            const newPos = ChessPosition.get(i, this.getPosition().row);

            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(
                        this.newMove(
                            boardState,
                            newPos
                        )
                    );
                }

                break;
            } else {
                moves.add(
                    this.newMove(
                        boardState,
                        newPos
                    )
                );
            }
        }

        // add all to the left in col
        for (let i = this.getPosition().col - 1; i > 0; i--) {
            const newPos = ChessPosition.get(i, this.getPosition().row);
            
            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(
                        this.newMove(
                            boardState,
                            newPos
                        )
                    );
                }

                break;
            } else {
                moves.add(
                    this.newMove(
                        boardState,
                        newPos
                    )
                );
            }
        }

        // add all above in row
        for (let i = this.getPosition().row + 1; i < 9; i++) {
            const newPos = ChessPosition.get(this.getPosition().col, i);
            
            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(
                        this.newMove(
                            boardState,
                            newPos
                        )
                    );
                }

                break;
            } else {
                moves.add(
                    this.newMove(
                        boardState,
                        newPos
                    )
                );
            }
        }

        // add all below in row
        for (let i = this.getPosition().row - 1; i > 0; i--) {
            const newPos = ChessPosition.get(this.getPosition().col, i);
            
            const existingPiece = boardState.getPieceAtPosition(newPos);
            if (existingPiece) {
                if (existingPiece.player !== this.player) {
                    moves.add(
                        this.newMove(
                            boardState,
                            newPos
                        )
                    );
                }

                break;
            } else {
                moves.add(
                    this.newMove(
                        boardState,
                        newPos
                    )
                );
            }
        }

        return moves;
    }

    // movements are the same for black or white
    protected getPossibleMovementsBlack(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        return this.getPossibleMovementsWhite(boardState);
    }
}
