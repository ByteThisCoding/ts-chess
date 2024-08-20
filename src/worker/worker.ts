export interface WorkerFacade {

    postMessage(message: string, data: any): void;
    
    onMessage(message: string, callback: (data: any) => any): void;

}

export enum WorkerCoreEnums {
    workerReady = "worker-ready"
};