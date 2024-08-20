import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { WorkerFacade } from './worker';
import { AbstractWorker } from './abstract-worker';

export class NodeWorker extends AbstractWorker {
    private worker: Worker;

    constructor(scriptPath: string) {
        super();
        this.worker = new Worker(scriptPath, {
            stdout: true,
            stderr: true
        });

        // Pipe worker's stdout and stderr to the main thread's console
        this.worker.stdout.pipe(process.stdout);
        this.worker.stderr.pipe(process.stderr);

        this.worker.on('error', (error) => {
            console.error('[NodeWorker] error received', error);
        });
    }

    doPostMessage(message: string, payload: any): void {
        console.log("[NodeWorker] sending message", message);
        this.worker.postMessage({ message, payload });
    }

    doOnMessage(message: string, callback: (data: any) => any): void {
        this.worker.on('message', (event: any) => {
            console.log("[NodeWorker] message received", event);
            if (event.message === message) {
                callback(event.payload);
            }
        });
    }
}
