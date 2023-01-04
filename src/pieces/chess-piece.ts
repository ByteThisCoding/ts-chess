import { ChessBoardState } from "../chess-board-state";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";
import { ChessPieceAvailableMoveSet } from "../moves/chess-piece-available-move-set";

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
        return this.player === ChessPlayer.white
            ? this.getPossibleMovementsWhite(boardState)
            : this.getPossibleMovementsBlack(boardState);
    }

    clone(): ChessPiece {
        const cloned = this.doClone();
        cloned.position = this.position;
        cloned.startPosition = this.startPosition;
        cloned.prevPosition = this.prevPosition;
        cloned.lastPositionChangeTurn = this.lastPositionChangeTurn;
        return cloned;
    }

    protected abstract doClone(): ChessPiece;

    protected abstract getPossibleMovementsWhite(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet;
    protected abstract getPossibleMovementsBlack(
        boardState: ChessBoardState
    ): ChessPieceAvailableMoveSet;
}
