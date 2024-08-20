import { BrowserWorker } from "./browser-worker";
import { NodeWorker } from "./node-worker";
import { WorkerFacade } from "./worker";

export class WorkerFactory {

    static getWorker(scriptPath: string): WorkerFacade {
        if (typeof window !== 'undefined') {
            console.log("[WorkerFactory] creating web worker");
            return new BrowserWorker(scriptPath);
        }

        console.log("[WorkerFactory] creating node worker");
        return new NodeWorker(scriptPath);
    }

}