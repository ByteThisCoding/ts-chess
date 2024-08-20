import { WorkerFacade } from "./worker";
import { parentPort } from "worker_threads";

/**
 * The worker itself will use this
 * 
 * TODO: need to add double-blind initialization callbacks
 */
export class WorkerBootstrapper implements WorkerFacade {

    private listenMessage: Function;
    private sendMessage: Function;

    constructor() {
        if (typeof self !== 'undefined' && self?.onmessage) {
            console.log("[WorkerBootstrapper] using webworker callbacks.");
            this.listenMessage = (message: string,  callback: (data: any) => any) => {
                self.addEventListener(message, (event: any) => {
                    callback(event.data);
                })
            };

            this.sendMessage = (message: string, data: any) => {
                self.postMessage({
                    message,
                    data
                });
            }
        } else {
            console.log("[WorkerBootstrapper] using Node callbacks.");
            this.listenMessage = (message: string,  callback: (data: any) => any) => {
                parentPort?.on(message, (event: any) => {
                    callback(event.data);
                })
            };

            this.sendMessage = (message: string, data: any) => {
                parentPort?.postMessage({
                    message,
                    data
                })
            };
        }
    }

    postMessage(message: string, data: any): void {
        this.sendMessage(message, data);
    }

    onMessage(message: string, callback: (data: any) => any): void {
        this.listenMessage(message, callback);
    }
}