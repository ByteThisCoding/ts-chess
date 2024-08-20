import { WorkerCoreEnums, WorkerFacade } from "./worker";
import { parentPort } from "worker_threads";

/**
 * The worker itself will use this
 */
export class WorkerBootstrapper implements WorkerFacade {

    private listenMessage: Function;
    private sendMessage: Function;

    constructor() {
        if (typeof self !== 'undefined' && self?.onmessage) {
            console.log("[WorkerBootstrapper] using webworker callbacks.");
            this.listenMessage = (message: string,  callback: (data: any) => any) => {
                self.addEventListener('message', (event: any) => {
                    console.log("[WorkerBootstrapper] message received", event?.detail?.message);
                    if (event.detail.message === message) {
                        callback(event.detail.payload);
                    }
                });
            };

            this.sendMessage = (message: string, payload: any) => {
                self.postMessage({
                    message,
                    payload
                });
            }
        } else {
            console.log("[WorkerBootstrapper] using Node callbacks.");
            this.listenMessage = (message: string,  callback: (data: any) => any) => {
                parentPort?.on('message', (event: any) => {
                    console.log("[WorkerBootstrapper] message received", event?.message);
                    if (event.message === message) {
                        callback(event.payload);
                    }
                });
            };

            this.sendMessage = (message: string, payload: any) => {
                parentPort?.postMessage({
                    message,
                    payload
                })
            };
        }

        this.postMessage(WorkerCoreEnums.workerReady, {});
    }

    postMessage(message: string, data: any): void {
        this.sendMessage(message, data);
    }

    onMessage(message: string, callback: (data: any) => any): void {
        this.listenMessage(message, callback);
    }
}