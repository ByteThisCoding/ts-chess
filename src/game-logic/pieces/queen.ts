import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";
import { BishopPiece } from "./bishop";
import { RookPiece } from "./rook";

/**
 * Encapsulation of a queen
 */
export class QueenPiece extends ChessPiece {
    static letter = "Q";
    letter: string = QueenPiece.letter;

    name: string = "Queen";

    static pointsValue = 9;
    pointsValue: number = QueenPiece.pointsValue;

    doCacheMoves = true;

    constructor(public player: ChessPlayer, position: ChessCell) {
        super(position, 28);
    }

    protected doClone(): QueenPiece {
        return new QueenPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player);

        BishopPiece.addPossibleMovesToSet(this, boardState, moves);
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
