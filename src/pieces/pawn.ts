import { ChessBoardState } from "../chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";
import { ChessPieceAvailableMove } from "../moves/chess-piece-available-move";

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

        if (inc === - 1 && this.getPosition().row > 1 || inc === 1 && this.getPosition().row < 8) {
            moves.add(
                ChessPosition.get(
                    this.getPosition().col,
                    this.getPosition().row + inc
                )
            );

            // add capture pieces if possible
            if (this.getPosition().col > 1) {
                const takeLeftPos = ChessPosition.get(
                    this.getPosition().col - 1,
                    this.getPosition().row + inc
                );
                if (boardState.getPieceAtPosition(takeLeftPos)) {
                    moves.add(takeLeftPos);
                }
            }

            if (this.getPosition().col < 8) {
                const takeRightPos = ChessPosition.get(
                    this.getPosition().col + 1,
                    this.getPosition().row + inc
                );
                if (boardState.getPieceAtPosition(takeRightPos)) {
                    moves.add(takeRightPos);
                }
            }
        }

        // can move two if on home row
        if (inc === -1 && this.getPosition().row === 7 || inc === 1 && this.getPosition().row === 2) {
            moves.add(
                ChessPosition.get(
                    this.getPosition().col,
                    this.getPosition().row + inc*2
                )
            );
        }

        // en passant
        if (inc === -1 && this.getPosition().row === 4 || inc === 1 && this.getPosition().row === 5) {
            const leftPawnPos = ChessPosition.get(this.getPosition().col - 1, this.getPosition().row);
            const leftPawn = boardState.getPieceAtPosition(leftPawnPos);

            if (leftPawn && leftPawn.getLastPositionChangeTurn() === boardState.getTurnNumber()) {
                moves.add(
                    new ChessPieceAvailableMove({
                        toPosition: ChessPosition.get(this.getPosition().col - 1, this.getPosition().row + inc),
                        isEnPassant: true 
                    })
                );
            }

            const rightPawnPos = ChessPosition.get(this.getPosition().col + 1, this.getPosition().row);
            const rightPawn = boardState.getPieceAtPosition(rightPawnPos);
            if (rightPawn && rightPawn.getLastPositionChangeTurn() === boardState.getTurnNumber()) {
                moves.add(
                    new ChessPieceAvailableMove({
                        toPosition: ChessPosition.get(this.getPosition().col + 1, this.getPosition().row + inc),
                        isEnPassant: true 
                    })
                );
            }
        }

        return moves;
    }
}
