/**
 * Encapsulates a single data point
 */
export interface iChessAiHeuristicDataPoint {
    value: number;

    weight: number,
    maxValueAbs: number;

    getNorm(): number;
}

export interface iChessAiHeuristicDataPoints<T> {
    // the relative value of each piece score
    relativePiecesScore: T;
    // score based on if player is threatening with a skewer (TODO: max value of 2)
    pinSkewerScore: T;
    // score based on what each player is threatening
    threateningScore: T;
    // passed pawn score
    passedPawnScore: T;
    // activation score
    activatedScore: T;
    // control of center
    centerControlScore: T;
    // mobility
    mobilityScore: T;
    // doubled pawns, tripled, etc
    stackedPawnScore: T;
}