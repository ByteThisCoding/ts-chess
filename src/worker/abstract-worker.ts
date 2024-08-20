import { WorkerCoreEnums, WorkerFacade } from "./worker";

export abstract class AbstractWorker implements WorkerFacade {

    private workerAwaiter: Promise<void>;

    constructor() {
        // create the promise that waits for the initial ready signal
        this.workerAwaiter = new Promise(resolve => {
            // use a timeout to allow constructors to finish
            setTimeout(() => {
                this.doOnMessage(WorkerCoreEnums.workerReady, () => {
                    console.log("[AbstractWorker] worker ready");
                    resolve();
                });
            }, 4);
        });
    }

    async postMessage(message: string, data: any): Promise<void> {
        await this.workerAwaiter;
        console.log("[AbstractWorker] sending message", message);
        return this.doPostMessage(message, data);
    }

    onMessage(message: string, callback: (data: any) => any): void {
        return this.doOnMessage(message, callback);
    }

    protected abstract doPostMessage(message: string, data: any): void;

    protected abstract doOnMessage(message: string, callback: (data: any) => any): void;
}