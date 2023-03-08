import { ChessBoardSingleMove } from "../../../public-api";
import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessPieceAvailableMoveSet } from "../../game-logic/moves/chess-piece-available-move-set";
import { BishopPiece } from "../../game-logic/pieces/bishop";
import { ChessPiece } from "../../game-logic/pieces/chess-piece";
import { KingPiece } from "../../game-logic/pieces/king";
import { KnightPiece } from "../../game-logic/pieces/knight";
import { PawnPiece } from "../../game-logic/pieces/pawn";
import { QueenPiece } from "../../game-logic/pieces/queen";
import { RookPiece } from "../../game-logic/pieces/rook";
import {
    ChessCell,
    ChessPosition,
} from "../../game-logic/position/chess-position";
import {
    iChessAiHeuristic,
    iChessAiHeuristicEvaluation,
} from "../models/heuristic";
import {
    iChessAiHeuristicDataPoint,
    iChessAiHeuristicDataPoints,
} from "../models/heuristic-data-point";
import { HeuristicDataPoint } from "./heuristic-data-point";

const GOOD_HEURISTICS: iChessAiHeuristicDataPoints<number>[] = [
    // hand-picked
    {
        relativePiecesScore: 0.7,
        pinSkewerScore: 0.1,
        threateningScore: 0.06,
        passedPawnScore: 0.04,
        activatedScore: 0.03,
        centerControlScore: 0.02,
        mobilityScore: 0.04,
        stackedPawnScore: 0.01,
    },
    // determined by genetic algorithm
    {
        relativePiecesScore: 0.6214999999999999,
        passedPawnScore: 0.010999999999999996,
        pinSkewerScore: 0.0315,
        threateningScore: 0.03599999999999999,
        activatedScore: 0.035500000000000004,
        mobilityScore: 0.013000000000000001,
        centerControlScore: 0.0405,
        stackedPawnScore: 0.21100000000000002,
    },
    {
        relativePiecesScore: 0.7321249999999999,
        pinSkewerScore: 0.058625,
        threateningScore: 0.056749999999999995,
        passedPawnScore: 0.02275,
        activatedScore: 0.024875,
        centerControlScore: 0.021124999999999998,
        mobilityScore: 0.02375,
        stackedPawnScore: 0.060000000000000005,
    },
];

export class ChessAiHeuristic implements iChessAiHeuristic {
    private maxPiecePoints =
        PawnPiece.pointsValue * 8 +
        BishopPiece.pointsValue * 2 +
        KnightPiece.pointsValue * 2 +
        RookPiece.pointsValue * 2 +
        QueenPiece.pointsValue;

    // TODO: genetic algorithm or manually adjust values
    private dataPoints: iChessAiHeuristicDataPoints<iChessAiHeuristicDataPoint>;

    private whitePossibleMovements = new ChessPieceAvailableMoveSet(
        ChessPlayer.white
    );
    private blackPossibleMovements = new ChessPieceAvailableMoveSet(
        ChessPlayer.black
    );

    constructor(weights?: iChessAiHeuristicDataPoints<number>) {
        // if none provided, pick randomly from one of the reviewed good ones
        if (!weights) {
            weights =
                GOOD_HEURISTICS[
                    Math.floor(Math.random() * GOOD_HEURISTICS.length)
                ];
        }

        this.dataPoints = {
            // the relative value of each piece score
            relativePiecesScore: new HeuristicDataPoint(
                weights.relativePiecesScore,
                this.maxPiecePoints
            ),
            // score based on if player is threatening with a skewer (TODO: max value of 2)
            pinSkewerScore: new HeuristicDataPoint(weights.pinSkewerScore, 2),
            // score based on what each player is threatening
            threateningScore: new HeuristicDataPoint(
                weights.threateningScore,
                this.maxPiecePoints
            ),
            // passed pawn score
            passedPawnScore: new HeuristicDataPoint(weights.passedPawnScore, 8),
            // activation score
            activatedScore: new HeuristicDataPoint(
                weights.activatedScore,
                // 1.25 for bishop, 1.15 for knight, 1 for pawn
                1.25 * 2 + 1.15 * 2 + 1 * 2
            ),
            // control of center
            centerControlScore: new HeuristicDataPoint(
                weights.centerControlScore,
                16
            ),
            // mobility
            mobilityScore: new HeuristicDataPoint(
                weights.mobilityScore,
                40 //TODO: find better value
            ),
            // doubled pawns, tripled, etc
            stackedPawnScore: new HeuristicDataPoint(
                weights.stackedPawnScore,
                4
            ),
        };
    }

    /**
     * Calculate the score for all of the metrics
     */
    getScore(boardState: ChessBoardState): iChessAiHeuristicEvaluation {
        if (boardState.isGameInCheckmate()) {
            return {
                score: boardState.isPlayerInCheckmate(ChessPlayer.white)
                    ? -Number.MAX_SAFE_INTEGER
                    : Number.MAX_SAFE_INTEGER,
                data: {},
            };
        }

        // rest state
        this.whitePossibleMovements.clear();
        this.blackPossibleMovements.clear();

        // commenting out to check if this hurts performance too
        /*if (boardState.isGameInStalemate()) {
            return {
                score: 0,
                data: {},
            };
        }*/

        // reset data point values
        for (const key in this.dataPoints) {
            // @ts-ignore
            this.dataPoints[key].value = 0;
        }

        // control of the center
        const centerControlWhite = new Set<ChessCell>();
        const centerControlBlack = new Set<ChessCell>();

        // iterate over all pieces and assemble data points
        for (const piece of boardState.getAllPieces()) {
            let inc = 0;
            const possibleMoves =
                boardState.getPossibleMovementsForPiece(piece);
            if (piece.player === ChessPlayer.white) {
                inc = 1;
                this.whitePossibleMovements.merge(possibleMoves, boardState);
            } else {
                inc = -1;
                this.blackPossibleMovements.merge(possibleMoves, boardState);
            }

            if (piece.letter !== KingPiece.letter) {
                this.dataPoints.relativePiecesScore.value +=
                    inc * piece.pointsValue;
            }

            // adjust score to represent activated pieces, we favor bishops > knights > pawns
            if (piece.getIsActivated()) {
                switch (piece.letter) {
                    case BishopPiece.letter:
                        this.dataPoints.activatedScore.value += 1.25 * inc;
                        break;
                    case KnightPiece.letter:
                        this.dataPoints.activatedScore.value += 1.1 * inc;
                        break;
                    case PawnPiece.letter:
                        this.dataPoints.activatedScore.value += 1 * inc;
                        break;
                }
            }

            // if it's a pawn, check if it's passed
            this.adjustPassedPawnScore(boardState, piece, inc);

            // adjust control of center based on position
            // commenting out to check if it is better to leave out
            /*this.adjustControlOfCenterScoreFromPiece(
                boardState,
                piece,
                centerControlWhite,
                centerControlBlack
            );*/

            // check threats
            for (const move of possibleMoves.getMoves()) {
                this.adjustThreatScoreFromMove(boardState, piece, move, inc);

                // check if has a line in the center
                this.adjustControlOfCenterScoreFromMove(
                    boardState,
                    move,
                    centerControlWhite,
                    centerControlBlack
                );
            }

            // use shadow moves to check skewers and pins
            this.adjustSkewersPinsScore(boardState, possibleMoves, inc);
        }

        // check doubled / stacked pawns, enemy having them helps us
        this.scoreStackedPawns(boardState);

        // add up
        this.dataPoints.centerControlScore.value =
            centerControlWhite.size - centerControlBlack.size;

        // the longer a piece isn't activated, the worse off the player is, so adjust
        this.dataPoints.activatedScore.value *=
            0.2 * boardState.getMoveNumber();

        // general mobility score, how many moves can we make?
        this.dataPoints.mobilityScore.value =
            this.whitePossibleMovements.getNumMoves() -
            this.blackPossibleMovements.getNumMoves();

        let totalScore = 0;
        let data: any = {};
        for (const key in this.dataPoints) {
            const datapoint = (this.dataPoints as any)[
                key
            ] as HeuristicDataPoint;
            data[key] = {
                value: datapoint.value,
                norm: datapoint.getNorm(),
                weight: datapoint.weight,
            };
            totalScore += datapoint.getNorm() * datapoint.weight;
        }
        return {
            score: totalScore,
            data,
        };
    }

    /**
     * Adjust the score for passed pawns
     * This is called during an iteration of all pieces
     */
    private adjustPassedPawnScore(
        boardState: ChessBoardState,
        piece: ChessPiece,
        inc: number
    ): void {
        if (piece.letter === PawnPiece.letter) {
            let isPassed = true;
            const col = ChessPosition.getCellCol(piece.getPosition());
            const row = ChessPosition.getCellRow(piece.getPosition());

            // check rows in front
            for (
                let checkRow = row + inc;
                isPassed && checkRow > 0 && checkRow < 9;
                checkRow += inc
            ) {
                const checkPos = ChessPosition.get(col, checkRow);
                const checkPiece = boardState.getPieceAtPosition(checkPos);
                if (checkPiece?.letter === PawnPiece.letter) {
                    isPassed = false;
                    break;
                }
            }

            if (!isPassed) {
                this.dataPoints.passedPawnScore.value += inc;
            }
        }
    }

    /**
     * Adjust the score for the control of the center
     * This is called during an iteration of all pieces
     */
    private adjustControlOfCenterScoreFromMove(
        boardState: ChessBoardState,
        move: ChessBoardSingleMove,
        centerControlWhite: Set<ChessCell>,
        centerControlBlack: Set<ChessCell>
    ): void {
        switch (move.toPosition) {
            case 27: //case ChessPosition.get(4, 4):
            case 35: //case ChessPosition.get(4, 5):
            case 28: //case ChessPosition.get(5, 4):
            case 36: //case ChessPosition.get(5, 5):
                if (move.player === ChessPlayer.white) {
                    centerControlWhite.add(move.toPosition);
                } else {
                    centerControlBlack.add(move.toPosition);
                }
                break;
        }
    }

    /**
     * Adjust the score for the control of the center
     * This is called during an iteration of all pieces
     *
     * TODO: if a move can actually remove this piece, we need to account for that!!
     */
    private adjustControlOfCenterScoreFromPiece(
        boardState: ChessBoardState,
        piece: ChessPiece,
        centerControlWhite: Set<ChessCell>,
        centerControlBlack: Set<ChessCell>
    ): void {
        switch (piece.getPosition()) {
            case 27: //case ChessPosition.get(4, 4):
            case 35: //case ChessPosition.get(4, 5):
            case 28: //case ChessPosition.get(5, 4):
            case 36: //case ChessPosition.get(5, 5):
                if (piece.player === ChessPlayer.white) {
                    centerControlWhite.add(piece.getPosition());
                } else {
                    centerControlBlack.add(piece.getPosition());
                }
                break;
        }
    }

    /**
     * Adjust the score for threats
     * This is called during an iteration of all pieces
     */
    private adjustThreatScoreFromMove(
        boardState: ChessBoardState,
        piece: ChessPiece,
        move: ChessBoardSingleMove,
        inc: number
    ): void {
        const pieceAtPos = boardState.getPieceAtPosition(move.toPosition);
        // add some score for threatening
        if (pieceAtPos && pieceAtPos.player !== piece.player) {
            // this shouldn't be considered a threat of the piece under attack can capture this one
            const pieceAtPosPossibleMoves =
                boardState.getPossibleMovementsForPiece(pieceAtPos);
            if (!pieceAtPosPossibleMoves.hasMoveToPosition(move.toPosition)) {
                this.dataPoints.threateningScore.value +=
                    inc * pieceAtPos.pointsValue;
            }
        }
    }

    /**
     * Score the skewers and pins
     */
    private adjustSkewersPinsScore(
        boardState: ChessBoardState,
        possibleMoves: ChessPieceAvailableMoveSet,
        inc: number
    ): void {
        for (const move of possibleMoves.getShadowMoves()) {
            const existingPiece = boardState.getPieceAtPosition(
                move.toPosition
            );
            if (existingPiece) {
                const blockingPiece = move.blockingPiece;

                // ensure blocking piece can't capture the original one
                if (
                    blockingPiece.letter !== PawnPiece.letter &&
                    !boardState
                        .getPossibleMovementsForPiece(blockingPiece)
                        .hasMoveToPosition(move.pieceMoved.getPosition())
                ) {
                    // we should only increment if the threatened piece doesn't have the power to take original piece
                    this.dataPoints.pinSkewerScore.value += inc;
                }
            }
        }
    }

    /**
     * Adjust the score based on stacked pawns
     */
    private scoreStackedPawns(boardState: ChessBoardState): void {
        for (let col = 0; col < 8; col++) {
            let blackPawnInCol = false;
            let whitePawnInCol = false;

            for (let row = 0; row < 8; row++) {
                const piece = boardState.getPieceAtPosition(
                    ChessPosition.get(col, row)
                );
                if (piece?.letter === PawnPiece.letter) {
                    if (piece.player === ChessPlayer.white) {
                        if (whitePawnInCol) {
                            this.dataPoints.stackedPawnScore.value += 1;
                        }
                        whitePawnInCol = true;
                    } else {
                        if (blackPawnInCol) {
                            this.dataPoints.stackedPawnScore.value -= 1;
                        }
                        blackPawnInCol = true;
                    }
                }
            }
        }
    }
}
