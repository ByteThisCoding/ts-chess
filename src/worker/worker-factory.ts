import { BrowserWorker } from "./browser-worker";
import { NodeWorker } from "./node-worker";
import { WorkerFacade } from "./worker";

export class WorkerFactory {

    static getWorker(scriptPath: string): WorkerFacade {
        if (typeof window !== 'undefined') {
            return new BrowserWorker(scriptPath);
        }

        return new NodeWorker(scriptPath);
    }

}