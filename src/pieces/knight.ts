import { ChessBoardState } from "../chess-board-state";
import { ChessPiece } from "./chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Encapsulation of a knight
 */
export class KnightPiece extends ChessPiece {
    name: string = "Knight";
    letter: string = "N";
    pointsValue: number = 3;

    constructor(public player: ChessPlayer, position: ChessPosition) {
        super(position);
    }

    protected doClone(): KnightPiece {
        return new KnightPiece(this.player, this.getPosition());
    }

    protected getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves = new ChessPieceAvailableMoveSet(this.player, boardState);

        // <->
        //  ^
        //  ^
        //  B
        moves.add(
            ChessPosition.get(
                this.getPosition().col + 1,
                this.getPosition().row + 2
            )
        );
        moves.add(
            ChessPosition.get(
                this.getPosition().col - 1,
                this.getPosition().row + 2
            )
        );
        moves.add(
            ChessPosition.get(
                this.getPosition().col + 1,
                this.getPosition().row - 2
            )
        );
        moves.add(
            ChessPosition.get(
                this.getPosition().col - 1,
                this.getPosition().row - 2
            )
        );

        // <-<->->
        //    ^
        //    B
        moves.add(
            ChessPosition.get(
                this.getPosition().col + 1,
                this.getPosition().row + 2
            )
        );
        moves.add(
            ChessPosition.get(
                this.getPosition().col - 1,
                this.getPosition().row + 2
            )
        );
        moves.add(
            ChessPosition.get(
                this.getPosition().col + 1,
                this.getPosition().row - 2
            )
        );
        moves.add(
            ChessPosition.get(
                this.getPosition().col - 1,
                this.getPosition().row - 2
            )
        );

        return moves;
    }

    // movements are the same for black or white
    protected getPossibleMovementsBlack(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        return this.getPossibleMovementsWhite(boardState);
    }
}
