import { ChessPiece } from "../pieces/chess-piece.model";
import { ChessBoardSingleMove } from "./chess-board-move.model";

export interface ChessBoardSingleMoveShadow extends ChessBoardSingleMove {
    blockingPiece: ChessPiece;
}