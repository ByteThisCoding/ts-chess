import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { WorkerFacade } from './worker';

export class NodeWorker implements WorkerFacade {
    private worker: Worker;

    constructor(scriptPath: string) {
        this.worker = new Worker(scriptPath);
    }

    postMessage(message: string, data: any): void {
        this.worker.postMessage({ message, data });
    }

    onMessage(message: string, callback: (data: any) => any): void {
        this.worker.on('message', (receivedData) => {
            if (receivedData.message === message) {
                callback(receivedData.data);
            }
        });
    }
}
