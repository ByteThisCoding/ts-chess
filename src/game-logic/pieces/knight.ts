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
    type = 1;

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
        const moves = new ChessPieceAvailableMoveSet(this.player);
        const posCol = ChessPosition.getCellCol(this.getPosition());
        const posRow = ChessPosition.getCellRow(this.getPosition());

        const moveOffsets = [
            { col: 1, row: 2 }, { col: -1, row: 2 },
            { col: 1, row: -2 }, { col: -1, row: -2 },
            { col: 2, row: 1 }, { col: -2, row: 1 },
            { col: 2, row: -1 }, { col: -2, row: -1 }
        ];

        for (const offset of moveOffsets) {
            const toCol = posCol + offset.col;
            const toRow = posRow + offset.row;
            if (toCol >= 1 && toCol <= 8 && toRow >= 1 && toRow <= 8) {
                const toPos = ChessPosition.get(toCol, toRow);
                if (boardState.getPieceAtPosition(toPos)?.player === this.player) {
                    moves.addBlockedPosition(toPos);
                } else {
                    moves.addMove(ChessPiece.newMove(this, toPos), boardState);
                }
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
