export enum ChessBoardMoveValidationFailure {
    positionOccupiedBySamePlayer = "The target position is occupied by a piece owned by the same player",
    pieceCannotAccessPosition = "The piece does not have access to the target position.",
    fromPositionMismatch = "The from position and selected piece do not match up.",
}

export class ChessBoardMoveValidationStatus {
    public constructor(
        public readonly success: boolean,
        public readonly failureReason: ChessBoardMoveValidationFailure | null
    ) {}
}
