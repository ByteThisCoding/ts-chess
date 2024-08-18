import { ChessPieceFactory } from "../pieces/chess-piece-factory";
import { ChessBoardSingleMoveImpl } from "./chess-board-move-impl";
import { ChessBoardSingleMove } from "./chess-board-move.model";

export class ChessBoardMoveDeserializer {
    /**
     * Deserializes a ChessBoardSingleMove from its serialized format
     */
    public static deserialize(data: any): ChessBoardSingleMove {
        const pieceMoved = ChessPieceFactory.createPieceFromSerialized(data.pieceMoved);
        return new ChessBoardSingleMoveImpl(
            data.player,
            pieceMoved,
            data.fromPosition,
            data.toPosition,
            data.isCastle,
            data.isEnPassant,
            data.isPromotion,
            data.promoteToPieceLetter
        );
    }
}