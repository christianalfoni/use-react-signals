import { ObserverContext, SignalNotifier } from "./ObserverContext";

export type SignalTuple<T> = [
  () => T,
  <U extends T>(value: U | ((current: T) => U)) => U
];

export function signal<T>(initialValue: T) {
  let value = initialValue;
  const signalNotifier = SignalNotifier();

  function signalGetter() {
    if (ObserverContext.current) {
      ObserverContext.current.registerSignal(signalNotifier);
    }

    return value;
  }

  function signalSetter(newValue: any) {
    // We do nothing if the values are the same
    if (value === newValue) {
      return value;
    }

    value = newValue;

    signalNotifier.notify();

    return value;
  }

  return [signalGetter, signalSetter] as SignalTuple<T>;
}
