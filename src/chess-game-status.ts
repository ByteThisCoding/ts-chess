import { ChessPlayer } from "./enums";

export class ChessGameStatus {
    public isCheckmate = false;
    public isStalemate = false;
    public winner: ChessPlayer | null = null;
}
