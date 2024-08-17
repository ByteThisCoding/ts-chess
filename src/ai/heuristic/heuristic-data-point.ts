import { iChessAiHeuristicDataPoint } from "../models/heuristic-data-point.model";

/**
 * Encapsulate a single data point
 */
export class HeuristicDataPoint implements iChessAiHeuristicDataPoint {
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
        return value * this.maxValueAbs;
    }
}
