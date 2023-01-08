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

/**
 * Encapsulate a single data point
 */
class HeuristicDataPoint {
    public value: number = 0;

    constructor(
        public readonly weight: number,
        public readonly maxValueAbs: number
    ) {}

    getNorm(): number {
        let value = this.value / this.maxValueAbs;
        if (value > 1) {
            value = 1;
        } else if (value < -1) {
            value = -1;
        }
        return value;
    }
}

export class ChessAiHeuristic implements iChessAiHeuristic {
    private maxPiecePoints =
        PawnPiece.pointsValue * 8 +
        BishopPiece.pointsValue * 2 +
        KnightPiece.pointsValue * 2 +
        RookPiece.pointsValue * 2 +
        QueenPiece.pointsValue;

    private maxSkewerPinScore =
        BishopPiece.pointsValue +
        KnightPiece.pointsValue +
        QueenPiece.pointsValue +
        RookPiece.pointsValue;

    // TODO: genetic algorithm or manually adjust values
    private dataPoints = {
        // the relative value of each piece score
        relativePiecesScore: new HeuristicDataPoint(0.725, this.maxPiecePoints),
        skewerScore: new HeuristicDataPoint(0.09, this.maxSkewerPinScore),
        pinScore: new HeuristicDataPoint(0.09, this.maxSkewerPinScore),
        // score based on what is threatening
        threatenedScore: new HeuristicDataPoint(0.01, this.maxPiecePoints),
        // passed pawn score
        passedPawnScore: new HeuristicDataPoint(0.03, 8),
        // activation score
        activatedScore: new HeuristicDataPoint(
            0.015,
            // 1.25 for bishop, 1.15 for knight, 1 for pawn
            1.25 * 2 + 1.15 * 2 + 1 * 2
        ),
        // control of center
        centerControlScore: new HeuristicDataPoint(0.03, 16),
        // mobility
        mobilityScore: new HeuristicDataPoint(
            0.02,
            50 //TODO: find better value
        ),
    };

    /**
     * TODO: add more criteria
     */
    getScore(boardState: ChessBoardState): iChessAiHeuristicEvaluation {
        // reset values
        for (const key in this.dataPoints) {
            // @ts-ignore
            this.dataPoints[key].value = 0;
        }

        if (boardState.isGameInCheckmate()) {
            return {
                score: boardState.isPlayerInCheckmate(ChessPlayer.white)
                    ? -Infinity
                    : Infinity,
                data: {},
            };
        }

        const whitePossibleMovements = new ChessPieceAvailableMoveSet(
            ChessPlayer.white,
            boardState
        );
        const blackPossibleMovements = new ChessPieceAvailableMoveSet(
            ChessPlayer.black,
            boardState
        );

        // control of the center
        const centerControlWhite = new Set<ChessCell>();
        const centerControlBlack = new Set<ChessCell>();

        for (const piece of boardState.getAllPieces()) {
            let inc = 0;
            const possibleMoves =
                boardState.getPossibleMovementsForPiece(piece);
            if (piece.player === ChessPlayer.white) {
                inc = 1;
                whitePossibleMovements.merge(possibleMoves);
            } else {
                inc = -1;
                blackPossibleMovements.merge(possibleMoves);
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
            if (piece.letter === PawnPiece.letter) {
                let isPassed = true;
                const [col, row] = ChessPosition.cellToColRow(
                    piece.getPosition()
                );
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

            // check threats
            let threatenedPiece: ChessPiece | null = null;
            let isSkewerPin = false;
            for (const move of possibleMoves.getMoves()) {
                const pieceAtPos = boardState.getPieceAtPosition(
                    move.toPosition
                );
                // add some score for threatening
                if (pieceAtPos && pieceAtPos.player !== piece.player) {
                    // this shouldn't be considered a threat of the piece under attack can capture this one
                    const pieceAtPosPossibleMoves =
                        boardState.getPossibleMovementsForPiece(pieceAtPos);
                    if (
                        !pieceAtPosPossibleMoves.hasMoveToPosition(
                            move.toPosition
                        )
                    ) {
                        // if there wasn't a threat yet, add to it
                        if (!threatenedPiece) {
                            this.dataPoints.threatenedScore.value +=
                                inc * pieceAtPos.pointsValue;
                            threatenedPiece = pieceAtPos;
                        } else if (!isSkewerPin) {
                            // if there was a threat, then this is a pin or skewer
                            if (
                                pieceAtPos.pointsValue <=
                                threatenedPiece.pointsValue
                            ) {
                                // this is a skewer (consider a tie a skewer)
                                this.dataPoints.skewerScore.value +=
                                    pieceAtPos.pointsValue;
                            } else {
                                // this is a pin
                                this.dataPoints.pinScore.value +=
                                    pieceAtPos.pointsValue;
                            }
                            isSkewerPin = true;
                        }
                    }
                }

                // check if has a line in the center
                switch (move.toPosition) {
                    case ChessPosition.get(4, 4):
                    case ChessPosition.get(4, 5):
                    case ChessPosition.get(5, 4):
                    case ChessPosition.get(5, 5):
                        if (move.player === ChessPlayer.white) {
                            centerControlWhite.add(move.toPosition);
                        } else {
                            centerControlBlack.add(move.toPosition);
                        }
                        break;
                }
            }
        }

        // add up
        this.dataPoints.centerControlScore.value =
            centerControlWhite.size - centerControlBlack.size;

        // the longer a piece isn't activated, the worse off the player is, so adjust
        this.dataPoints.activatedScore.value *=
            0.2 * boardState.getMoveNumber();

        // general mobility score, how many moves can we make?
        this.dataPoints.mobilityScore.value =
            whitePossibleMovements.getNumMoves() -
            blackPossibleMovements.getNumMoves();

        let totalScore = 0;
        let data: any = {};
        for (const key in this.dataPoints) {
            const datapoint = (this.dataPoints as any)[
                key
            ] as HeuristicDataPoint;
            data[key] = {
                value: datapoint.value,
                norm: datapoint.getNorm(),
            };
            totalScore += datapoint.getNorm();
        }
        return {
            score: totalScore,
            data,
        };
    }
}
