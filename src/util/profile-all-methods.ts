import { MethodProfiler } from "./method-profiler";

export function ProfileAllMethods(target: Function) {
    const methodNames = Object.getOwnPropertyNames(target.prototype);

    for (const methodName of methodNames) {
        if (methodName !== 'constructor' && !methodName.startsWith('ng')) {
            const descriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName) as TypedPropertyDescriptor<any>; // Type assertion
            if (descriptor && typeof descriptor.value === 'function') {
                // Apply the MethodProfiler decorator manually
                MethodProfiler(target.prototype, methodName, descriptor);
                // Reassign the updated descriptor to the method
                Object.defineProperty(target.prototype, methodName, descriptor);
            }
        }
    }
}
