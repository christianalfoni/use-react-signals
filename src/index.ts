import { FunctionComponent, useRef, useSyncExternalStore } from "react";
import { ObserverContext } from "./ObserverContext";
import { Signal, signal, SignalTuple } from "./signal";

// When on server we drop out of using "useSyncExternalStore" as there is really no
// reason to run it (It holds no state, just subscribes to updates)
const isServer = typeof window === "undefined";

export type { Signal } from "./signal";

function serverThrowUpdateError() {
  throw new Error("You can not ");
}

export function useSignal<T>(value: T) {
  if (isServer) {
    return [
      {
        get value() {
          return value;
        },
      },
      serverThrowUpdateError,
    ];
  }

  const signalRef = useRef<SignalTuple<T>>(null);

  if (!signalRef.current) {
    signalRef.current = signal(value);
  }

  return signalRef.current;
}

export function observer<T>(component: FunctionComponent<T>) {
  // No reason to set up a ObserverContext on the server
  if (isServer) {
    return component;
  }

  function ObserverComponent(props: T) {
    const observerContextRef = useRef<ObserverContext>(null);

    if (!observerContextRef.current) {
      observerContextRef.current = new ObserverContext();
    }

    const observerContext = observerContextRef.current;

    observerContext.startTracking();

    useSyncExternalStore(
      // We subscribe to the context. This only notifies about a change
      (update) => observerContext.subscribe(update),
      // We then grab the current snapshot, which is the global number for any change to any signal,
      // ensuring we'll always get a new snapshot whenever a related signal changes
      () => observerContext.snapshot,
      // Even though Impact is not designed to run on the server, we still give this callback
      // as for example Next JS requires it to be there, even when rendering client only components
      () => observerContext.snapshot
    );

    try {
      // @ts-ignore
      return component(props);
    } finally {
      observerContext.stopTracking();
    }
  }

  ObserverComponent.displayName = component.name;

  return ObserverComponent;
}
