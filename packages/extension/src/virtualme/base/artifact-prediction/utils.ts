

export function mergeAndDeduplicate<T>(arr1: T[], arr2: T[], equals: (a: T, b: T) => boolean): T[] {
    const result: T[] = [];
    for (const item of [...arr1, ...arr2]) {
        if (!result.some(existing => equals(item, existing))) {
            result.push(item);
        }
    }
    return result;
}

export function removeConsecutiveDuplicates<T>(arr: T[], equals: (a: T, b: T) => boolean): T[] {
    if (arr.length === 0) return []
    const result: T[] = [arr[0]]
    for (let i = 1; i < arr.length; i++) {
        if (!equals(arr[i], arr[i - 1])) {
            result.push(arr[i])
        }
    }
    return result
}