export class ObjectPool<T> {
  private freeList: T[] = [];
  private factory: () => T;
  private resetFn: (item: T) => void;

  constructor(factory: () => T, resetFn: (item: T) => void, initialCapacity: number = 20) {
    this.factory = factory;
    this.resetFn = resetFn;

    for (let i = 0; i < initialCapacity; i++) {
      this.freeList.push(this.factory());
    }
  }

  public acquire(): T {
    if (this.freeList.length > 0) {
      return this.freeList.pop()!;
    }
    return this.factory();
  }

  public release(item: T): void {
    this.resetFn(item);
    this.freeList.push(item);
  }

  public getFreeCount(): number {
    return this.freeList.length;
  }

  public clear(): void {
    this.freeList = [];
  }
}
