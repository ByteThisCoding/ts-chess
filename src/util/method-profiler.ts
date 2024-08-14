const profileMap = new Map<string, any>();

const ENABLED = false;

export function MethodProfiler(
    target: Object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
) {
    if (!ENABLED) {
        return;
    }

    const originalMethod = descriptor.value!;
    const className = target.constructor.name;
    const mapKey = `${className} - ${propertyKey}`;
    console.log(`Attaching profiler to ${mapKey}`);

    // We initialize count and totalTime outside the closure
    let count = 0;
    let totalTime = 0;

    descriptor.value = function createProfiler(...args: any[]) {
        count++;
        const start = performance.now();

        const result = originalMethod.apply(this, args);
        if (result instanceof Promise) {
            return result
                .then((res) => {
                    const end = performance.now();
                    totalTime += end - start;
                    const avgTime = totalTime / count;
                    profileMap.set(mapKey, { count, avgTime, totalTime: count*avgTime });
                    return res;
                })
                .catch((err) => {
                    const end = performance.now();
                    totalTime += end - start;
                    const avgTime = totalTime / count;
                    profileMap.set(mapKey, { count, avgTime, totalTime: count*avgTime });
                    throw err; // rethrow error after profiling
                });
        } else {
            const end = performance.now();
            totalTime += end - start;
            const avgTime = totalTime / count;
            profileMap.set(mapKey, { count, avgTime, totalTime: count*avgTime });
            return result;
        }
    };
}

export function logProfileMap(): void {
    const sorted = Array.from(profileMap)
        .sort((a, b) => {
            return b[1].totalTime - a[1].totalTime;
        });
    console.log(sorted);
}
