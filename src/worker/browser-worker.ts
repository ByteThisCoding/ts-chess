import { AbstractWorker } from "./abstract-worker";
import { WorkerFacade } from "./worker";

export class BrowserWorker extends AbstractWorker {
    private worker: Worker;

    constructor(scriptPath: string) {
        super();
        this.worker = new Worker(scriptPath);
    }

    doPostMessage(message: string, payload: any): void {
        this.worker.postMessage({ message, payload });
    }

    doOnMessage(message: string, callback: (data: any) => any): void {
        this.worker.addEventListener('message', (event: any) => {
            const { message: receivedMessage, payload: receivedData } = event.detail;
            if (receivedMessage === message) {
                callback(receivedData);
            }
        });
    }
}
