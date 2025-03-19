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
  const setter = (partial: any) => {
    for (const key in partial) {
      setters[key](partial[key]);
    }
  };

  for (const key in value) {
    if (value.hasOwnProperty(key) && typeof value[key] !== "function") {
      const [getter, setter] = signal(value[key]);
      setters[key] = setter;
      Object.defineProperty(getters, key, {
        get() {
          return getter();
        },
      });
    }
  }

  return [getters, setter] as SignalsTuple<T>;
}

export function useSignals<T extends Record<string, any>>(value: T) {
  if (isServer) {
    return [value, serverThrowUpdateError];
  }

  const signalRef = useRef<SignalsTuple<T>>(null);

  if (!signalRef.current) {
    signalRef.current = createSignals(value);
  }

  return signalRef.current;
}
