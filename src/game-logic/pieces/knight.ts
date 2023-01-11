import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a knight
 * This piece doesn't use shadow moves because it can only move to specific square (i.e. not in a line)
 */
export class KnightPiece extends ChessPiece {
    static letter = "N";
    letter: string = KnightPiece.letter;

    name: string = "Knight";

    static pointsValue = 3;
    pointsValue: number = KnightPiece.pointsValue;

    doCacheMoves = true;

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 8);
    }

    protected doClone(): KnightPiece {
        return new KnightPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);
        const [posCol, posRow] = ChessPosition.cellToColRow(this.getPosition());

        // <->
        //  ^
        //  ^
        //  B
        if (posCol < 8 && posRow < 7) {
            const toPos = ChessPosition.get(posCol + 1, posRow + 2);
            if (boardState.getPieceAtPosition(toPos)?.player === this.player) {
                moves.addBlockedPosition(toPos);
            } else {
                moves.addMove(ChessPiece.newMove(this, toPos));
            }
        }

        if (posCol > 1 && posRow < 7) {
            const toPos = ChessPosition.get(posCol - 1, posRow + 2);
            if (boardState.getPieceAtPosition(toPos)?.player === this.player) {
                moves.addBlockedPosition(toPos);
            } else {
                moves.addMove(ChessPiece.newMove(this, toPos));
            }
        }

        if (posCol < 8 && posRow > 2) {
            const toPos = ChessPosition.get(posCol + 1, posRow - 2);
            if (boardState.getPieceAtPosition(toPos)?.player === this.player) {
                moves.addBlockedPosition(toPos);
            } else {
                moves.addMove(ChessPiece.newMove(this, toPos));
            }
        }

        if (posCol > 1 && posRow > 2) {
            const toPos = ChessPosition.get(posCol - 1, posRow - 2);
            if (boardState.getPieceAtPosition(toPos)?.player === this.player) {
                moves.addBlockedPosition(toPos);
            } else {
                moves.addMove(ChessPiece.newMove(this, toPos));
            }
        }

        // <-<->->
        //    ^
        //    B
        if (posCol < 7 && posRow < 8) {
            const toPos = ChessPosition.get(posCol + 2, posRow + 1);
            if (boardState.getPieceAtPosition(toPos)?.player === this.player) {
                moves.addBlockedPosition(toPos);
            } else {
                moves.addMove(ChessPiece.newMove(this, toPos));
            }
        }

        if (posCol < 7 && posRow > 1) {
            const toPos = ChessPosition.get(posCol + 2, posRow - 1);
            if (boardState.getPieceAtPosition(toPos)?.player === this.player) {
                moves.addBlockedPosition(toPos);
            } else {
                moves.addMove(ChessPiece.newMove(this, toPos));
            }
        }

        if (posCol > 2 && posRow < 8) {
            const toPos = ChessPosition.get(posCol - 2, posRow + 1);
            if (boardState.getPieceAtPosition(toPos)?.player === this.player) {
                moves.addBlockedPosition(toPos);
            } else {
                moves.addMove(ChessPiece.newMove(this, toPos));
            }
        }

        if (posCol > 2 && posRow > 1) {
            const toPos = ChessPosition.get(posCol - 2, posRow - 1);
            if (boardState.getPieceAtPosition(toPos)?.player === this.player) {
                moves.addBlockedPosition(toPos);
            } else {
                moves.addMove(ChessPiece.newMove(this, toPos));
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
