import { ChessBoardSingleMove } from "../moves/chess-board-move";

export enum ChessNotationParseFailure {
    invalidNotationFormat = "The notation you've entered is not in valid format.",
    illegalMove = "The move you've entered is illegal.",
    pieceNotFound = "There is no piece which can complete the specified move.",
    pieceDesignationIncorrect = "There is a different piece at the position specified.",
    pieceAmbiguous = "There are more than one pieces which can make this move. Please specify.",
}

export class ChessNotationParseStatus {
    public constructor(
        public readonly success: boolean,
        public readonly move: ChessBoardSingleMove | null,
        public readonly failureReason: ChessNotationParseFailure | null,
        public readonly additionalData?: any
    ) {}
}
