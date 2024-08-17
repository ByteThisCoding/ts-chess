import { WorkerFacade } from "./worker";

export class BrowserWorker implements WorkerFacade {
    private worker: Worker;

    constructor(scriptPath: string) {
        this.worker = new Worker(scriptPath);
    }

    postMessage(message: string, data: any): void {
        this.worker.postMessage({ message, data });
    }

    onMessage(message: string, callback: (data: any) => any): void {
        this.worker.addEventListener('message', (event) => {
            const { message: receivedMessage, data: receivedData } = event.data;
            if (receivedMessage === message) {
                callback(receivedData);
            }
        });
    }
}
