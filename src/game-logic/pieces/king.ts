import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a King
 */
export class KingPiece extends ChessPiece {
    name: string = "King";
    letter: string = "K";
    pointsValue: number = 0;

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
        if (boardState.isGameInCheck()) {
            return;
        }

        // check rook on a1
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
                moves.add(this.newMove(boardState, firstRookPos, true));
            }
        }

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
                moves.add(this.newMove(boardState, secondRookPos, true));
            }
        }
    }

    /**
     * Get all possible board states except for castle
     */
    private getNonCastleMovements(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);

        // add for bishop like movements
        // add for higher columns
        const [posCol, posRow] = ChessPosition.cellToColRow(this.getPosition());

        if (posCol > 1) {
            if (posRow + 1 < 9) {
                moves.add(
                    this.newMove(
                        boardState,
                        ChessPosition.get(
                            posCol - 1,
                            posRow + 1
                        )
                    )
                );
            }
            if (posRow - 1 > 0) {
                moves.add(
                    this.newMove(
                        boardState,
                        ChessPosition.get(
                            posCol - 1,
                            posRow - 1
                        )
                    )
                );
            }
        }

        // add for lower columns
        if (posCol < 8) {
            if (posRow + 1 < 9) {
                moves.add(
                    this.newMove(
                        boardState,
                        ChessPosition.get(
                            posCol + 1,
                            posRow + 1
                        )
                    )
                );
            }
            if (posRow - 1 > 0) {
                moves.add(
                    this.newMove(
                        boardState,
                        ChessPosition.get(
                            posCol + 1,
                            posRow - 1
                        )
                    )
                );
            }
        }

        // add for rook like movements
        // add all in current col
        if (posRow > 1) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol,
                        posRow - 1
                    )
                )
            );
        }
        if (posRow < 8) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol,
                        posRow + 1
                    )
                )
            );
        }
        if (posCol > 1) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol - 1,
                        posRow
                    )
                )
            );
        }
        if (posCol < 8) {
            moves.add(
                this.newMove(
                    boardState,
                    ChessPosition.get(
                        posCol + 1,
                        posRow
                    )
                )
            );
        }

        return moves;
    }
}
