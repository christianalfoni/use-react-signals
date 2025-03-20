import { FunctionComponent, useRef, useSyncExternalStore } from "react";
import { isServer } from "./utils";
import { ObserverContext } from "./ObserverContext";

// This is automatically imported using the plugins
export function observer<T>(component: FunctionComponent<T>) {
  // No reason to set up a ObserverContext on the server
  if (isServer) {
    return component;
  }

  function ObserverComponent(props: T) {
    const observerContext = ObserverContext();

    // We start tracking the signals accessed by this component
    observerContext.startTracking();

    // Only after tracking we actually subscribe to the signals. This is important memory management
    // in concurrent mode, or we could risk not disposing subscriptions
    useSyncExternalStore(
      // We subscribe to the context. This only notifies about a change
      observerContext.subscribe,
      // We then grab the current snapshot, which is the global number for any change to any signal,
      // ensuring we'll always get a new snapshot whenever a related signal changes
      observerContext.getSnapshot,
      // Even though Impact is not designed to run on the server, we still give this callback
      // as for example Next JS requires it to be there, even when rendering client only components
      observerContext.getSnapshot
    );

    try {
      return component(props);
    } finally {
      // We always stop tracking after rendering to ensure
      // we do not pick up on any other signal access outside the scope
      // of the component
      observerContext.stopTracking();
    }
  }

  ObserverComponent.displayName = component.name;

  return ObserverComponent;
}
