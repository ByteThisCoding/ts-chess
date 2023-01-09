/**
 * Encapsulate a single data point
 */
export class HeuristicDataPoint {
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
