import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessBoardSingleMove } from "../moves/chess-board-move";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";
import { ChessBoardSingleMoveShadow } from "../moves/chess-board-shadow-move";
import { ProfileAllMethods } from "../../util/profile-all-methods";

/**
 * Abstraction for common chess piece logic + external reference
 */
@ProfileAllMethods
export abstract class ChessPiece {
    abstract name: string;
    abstract letter: string;
    abstract player: ChessPlayer;
    abstract pointsValue: number;
    abstract doCacheMoves: boolean;
    abstract type: number;

    // TODO: is bug with isActivated when looking ahead, doesn't unset
    private isActivated = false;
    private lastPositionChangeTurn: number = 0;
    private startPosition: ChessCell;
    private prevPosition: ChessCell | null = null;

    private movesCache: ChessPieceAvailableMoveSet | null = null;

    constructor(
        private position: ChessCell,
        private maxNumPossibleMoves: number
    ) {
        this.startPosition = position;
    }

    getType(): number {
        return this.player === ChessPlayer.black
            ? this.type + 6
            : this.type;
    }

    areMovesCached(): boolean {
        return this.doCacheMoves && !!this.movesCache;
    }

    invalidateMovesCache(): void {
        this.movesCache = null;
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
        this.isActivated =
            pos !== this.startPosition && this.lastPositionChangeTurn === 0;
        this.invalidateMovesCache();
    }

    /**
     * Get possible movements, ignorning the current state of the board
     */
    getPossibleMovements(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet {
        /*if (this.doCacheMoves) {
            if (this.movesCache === null) {
                this.movesCache =
                    this.player === ChessPlayer.white
                        ? this.getPossibleMovementsWhite(boardState)
                        : this.getPossibleMovementsBlack(boardState);
            }
            return this.movesCache;
        } else {*/
            const moves =
                this.player === ChessPlayer.white
                    ? this.getPossibleMovementsWhite(boardState)
                    : this.getPossibleMovementsBlack(boardState);

            return moves;
        //}
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
        return `(${this.player} ${this.name} : ${ChessPosition.toString(
            this.position
        )})`;
    }

    /**
     * Helper method to simplify creating new move objects for subclasses
     */
    protected static newMove(
        thisPiece: ChessPiece,
        toPosition: ChessCell,
        isCastle: boolean = false,
        isEnPassant: boolean = false,
        isPromotion: boolean = false,
        promotionLetter: string = ""
    ): ChessBoardSingleMove | null {
        return new ChessBoardSingleMove(
            thisPiece.player,
            thisPiece,
            thisPiece.position,
            toPosition,
            isCastle,
            isEnPassant,
            isPromotion,
            promotionLetter
        );
    }

    protected static newShadowMove(
        thisPiece: ChessPiece,
        toPosition: ChessCell,
        blockingPiece: ChessPiece
    ): ChessBoardSingleMoveShadow | null {
        return new ChessBoardSingleMoveShadow(
            thisPiece.player,
            thisPiece,
            thisPiece.position,
            toPosition,
            blockingPiece
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
