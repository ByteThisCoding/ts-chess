import { ChessBoardState } from "../board-state/chess-board-state.model";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set.model";
import { ChessCell } from "../position/chess-position";

export interface ChessPiece {
    position: number;
    name: string;
    letter: string;
    player: ChessPlayer;
    pointsValue: number;
    doCacheMoves: boolean;
    type: number;

    isActivated: boolean;
    lastPositionChangeTurn: number;
    startPosition: ChessCell;
    prevPosition: ChessCell | null;

    getType(): number;

    areMovesCached(): boolean;

    invalidateMovesCache(): void;

    getPosition(): ChessCell;

    getIsActivated(): boolean;

    getPrevPosition(): ChessCell | null;

    getLastPositionChangeTurn(): number;

    setPosition(pos: ChessCell, turnNumber: number): void;

    /**
     * Get possible movements, ignorning the current state of the board
     */
    getPossibleMovements(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet;

    clone(): ChessPiece;

    equals(piece: ChessPiece): boolean;

    toString(): string;

    serialize(): any;
}