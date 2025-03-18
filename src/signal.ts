import { ObserverContext, SignalNotifier } from "./ObserverContext";

export type Signal<T> = {
  value: T;
};

export type SignalTuple<T> = [
  Signal<T>,
  <U extends T>(value: U | ((current: T) => U)) => U
];

export function signal<T>(initialValue: T) {
  let value = initialValue;
  const signalNotifier = new SignalNotifier();

  const signalGetter = {
    get value() {
      if (ObserverContext.current) {
        ObserverContext.current.registerSignal(signalNotifier);
      }

      return value;
    },
  };

  function signalSetter(newValue: any) {
    // The update signature
    if (typeof newValue === "function") {
      newValue = newValue(value);
    }

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
