import { useRef } from "react";
import { signal } from "./signal";
import { isServer } from "./utils";

type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type SignalsTuple<T> = [
  T,
  (partial: Partial<Pick<T, NonFunctionPropertyNames<T>>>) => void
];

function serverThrowUpdateError() {
  throw new Error("You can not change signals on the server");
}

export function createSignals<T extends Record<string, any>>(value: T) {
  const setters: any = {};
  const getters: any = {};
  const functions: any = {};
  const setter = (partial: any) => {
    for (const key in partial) {
      setters[key](partial[key]);
    }
  };

  for (const key in value) {
    if (typeof value[key] === "function") {
      functions[key] = value[key];
      // We add a function that will always reference the latest function, so they
      // always point to the latest props
      getters[key] = (...args: any[]) => functions[key](...args);
    } else {
      const [getter, setter] = signal(value[key]);
      setters[key] = setter;
      Object.defineProperty(getters, key, {
        get() {
          return getter();
        },
      });
    }
  }

  return {
    tuple: [getters, setter] as SignalsTuple<T>,
    functions,
  };
}

export function useSignals<T extends Record<string, any>>(value: T) {
  if (isServer) {
    return [value, serverThrowUpdateError];
  }

  const signalRef = useRef<{
    tuple: SignalsTuple<T>;
    functions: Record<string, Function>;
  }>(null);

  if (signalRef.current) {
    for (const key in signalRef.current.functions) {
      signalRef.current.functions[key] = value[key];
    }
  } else {
    signalRef.current = createSignals(value);
  }

  return signalRef.current.tuple;
}
