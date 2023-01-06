import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessCell, ChessPosition } from "../position/chess-position";
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

    // TODO: is bug with isActivated when looking ahead, doesn't unset
    private isActivated = false;
    private lastPositionChangeTurn: number = 0;
    private startPosition: ChessCell;
    private prevPosition: ChessCell | null = null;

    constructor(
        private position: ChessCell,
        private maxNumPossibleMoves: number
    ) {
        this.startPosition = position;
    }

    getPosition(): ChessCell {
        return this.position;
    }

    getIsActivated(): boolean {
        return this.isActivated;
    }

    getPrevPosition(): ChessCell | null {
        return this.prevPosition;
    }

    getLastPositionChangeTurn(): number {
        return this.lastPositionChangeTurn;
    }

    setPosition(pos: ChessCell, turnNumber: number): void {
        this.prevPosition = this.position;
        this.position = pos;
        this.lastPositionChangeTurn = turnNumber;
        this.isActivated = true;
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

        cloned.player = this.player;
        cloned.position = this.position;
        cloned.startPosition = this.startPosition;
        cloned.prevPosition = this.prevPosition;
        cloned.lastPositionChangeTurn = this.lastPositionChangeTurn;
        cloned.isActivated = this.isActivated;

        return cloned;
    }

    equals(piece: ChessPiece): boolean {
        return (
            this.name === piece.name &&
            this.position === piece.position &&
            this.player === piece.player
        );
    }

    toString(): string {
        return `(${this.player} ${this.name} : ${ChessPosition.toString(this.position)})`;
    }

    /**
     * Helper method to simplify creating new move objects for subclasses
     */
    protected newMove(
        boardState: ChessBoardState,
        toPosition: ChessCell,
        isCastle: boolean = false,
        isEnPassant: boolean = false,
        isPromotion: boolean = false,
        promotionLetter: string = ""
    ): ChessBoardSingleMove | null {
        return new ChessBoardSingleMove(
            this.player,
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
