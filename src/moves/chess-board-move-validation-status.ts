export enum ChessBoardMoveValidationFailure {
    positionOccupiedBySamePlayer = "The target position is occupied by a piece owned by the same player",
    pieceCannotAccessPosition = "The piece does not have access to the target position.",
    fromPositionMismatch = "The from position and selected piece do not match up.",
    invalidCheck = "The move would put the player in an invalid check.",
    playerDoesNotOwn = "The player attempted to move a piece they don't own.",
}

export class ChessBoardMoveValidationStatus {
    public constructor(
        public readonly success: boolean,
        public readonly failureReason: ChessBoardMoveValidationFailure | null,
        public readonly additionalData?: any
    ) {}
}
