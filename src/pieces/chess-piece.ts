import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessBoardSingleMove } from "../moves/chess-board-move";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

/**
 * Abstraction for common chess piece logic + external reference
 */
export abstract class ChessPiece {
    abstract name: string;
    abstract letter: string;
    abstract player: ChessPlayer;
    abstract pointsValue: number;

    private startPosition: ChessPosition;
    private prevPosition: ChessPosition | null = null;
    private lastPositionChangeTurn: number = 0;

    constructor(private position: ChessPosition) {
        this.startPosition = position;
    }

    getPosition(): ChessPosition {
        return this.position;
    }

    getPrevPosition(): ChessPosition | null {
        return this.prevPosition;
    }

    getLastPositionChangeTurn(): number {
        return this.lastPositionChangeTurn;
    }

    setPosition(pos: ChessPosition, turnNumber: number): void {
        this.prevPosition = this.position;
        this.position = pos;
        this.lastPositionChangeTurn = turnNumber;
    }

    hasPieceMoved(): boolean {
        return this.startPosition !== this.position;
    }

    /**
     * Get possible movements, ignorning the current state of the board
     */
    getPossibleMovements(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        const moves =
            this.player === ChessPlayer.white
                ? this.getPossibleMovementsWhite(boardState)
                : this.getPossibleMovementsBlack(boardState);

        return moves;
    }

    clone(): ChessPiece {
        const cloned = this.doClone();
        cloned.position = this.position;
        cloned.startPosition = this.startPosition;
        cloned.prevPosition = this.prevPosition;
        cloned.lastPositionChangeTurn = this.lastPositionChangeTurn;
        return cloned;
    }

    equals(piece: ChessPiece): boolean {
        return (
            this.name === piece.name &&
            this.position === piece.position &&
            this.player === piece.player
        );
    }

    /**
     * Helper method to simplify creating new move objects for subclasses
     */
    protected newMove(
        boardState: ChessBoardState,
        toPosition: ChessPosition,
        isCastle: boolean = false,
        isEnPassant: boolean = false,
        isPromotion: boolean = false,
        promotionLetter: string = ""
    ): ChessBoardSingleMove | null {
        return new ChessBoardSingleMove(
            boardState.getLastMove()?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white,
            this,
            this.position,
            toPosition,
            isCastle,
            isEnPassant,
            isPromotion,
            promotionLetter
        );
    }

    protected abstract doClone(): ChessPiece;

    protected abstract getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet;
    protected abstract getPossibleMovementsBlack(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet;
}
