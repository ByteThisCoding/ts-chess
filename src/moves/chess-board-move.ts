import { ChessPiece } from "../pieces/chess-piece";
import { ChessPosition } from "../chess-position";
import { ChessPlayer } from "../enums";

/**
 * This represents a single player's move (not a grouping of white and black)
 */
export class ChessBoardSingleMove {
    constructor(
        public player: ChessPlayer,
        public pieceMoved: ChessPiece,
        public moveCommand: string, //NxD6 for example
        public fromPosition: ChessPosition,
        public toPosition: ChessPosition,
        public toPositionPrevPiece: ChessPiece | null,
        public gameMoveNumber: number, //overall move number, so black's first move is still 1
        public isCastle: boolean,
        public isEnPassant: boolean
    ) {}
}
