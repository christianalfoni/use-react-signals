// Use for memory leak debugging
// const registry = new FinalizationRegistry(console.log);

// This global counter makes sure that every signal update is unqiue and
// can be tracked by React
let currentSnapshot = 0;

export type SignalNotifier = {
  addContext(context: ObserverContext): void;
  removeContext(context: ObserverContext): void;
  notify(): void;
  snapshot: number;
};

// Every signal created has a related signal notifier. This signal notifier is responsible for
// keeping track of what components (observer contexts) are currently accessing the signal. When a signal changes
// it will notify all related components. This is done by keeping a set of ObserverContexts

export function SignalNotifier(): SignalNotifier {
  const contexts = new Set<ObserverContext>();
  let snapshot = ++currentSnapshot;

  return {
    addContext,
    removeContext,
    notify,
    get snapshot() {
      return snapshot;
    },
  };

  function addContext(context: ObserverContext) {
    contexts.add(context);
  }
  function removeContext(context: ObserverContext) {
    contexts.delete(context);
  }
  function notify() {
    // Any signal change updates the global snapshot
    snapshot = ++currentSnapshot;

    // A context can be synchronously added back to this signal related to firing the signal, which
    // could cause a loop. We only want to notify the current contexts
    const currentContexts = Array.from(contexts);

    currentContexts.forEach((context) => context.notify(snapshot));
  }
}

// Every component has an ObserverContext. When the components starts tracking, the context becomes the active context
// in the system. Any component retrieving a signal value will register to this active ObserverContext.
// The component then subscribes to the context, which will add the context to every signal tracked, allowing
// it to notify these contexts when the signal value is updated. When the context is notified about a change it will remove itself from current signals
// and notify any subscribing components. When component unmounts the subscription is disposed. This will remove the context from any tracked signals,
// making sure that component unmount will also remove the context from any signals... making it primed for garbage collection

export type ObserverContext = {
  startTracking: () => void;
  stopTracking: () => void;
  subscribe: (subscriber: () => void) => () => void;
  registerSignal: (signal: SignalNotifier) => void;
  getSnapshot: () => number;
  notify: (newSnapshot: number) => void;
};

ObserverContext.current = undefined as ObserverContext | undefined;

export function ObserverContext() {
  // We track all signals accessed by this context
  const signalNotifiers = new Set<SignalNotifier>();
  // An ObserverContext only has one subscriber at any time
  let currentSubscriber: (() => void) | undefined = undefined;
  let snapshot = currentSnapshot;

  const observerContext: ObserverContext = {
    startTracking,
    stopTracking,
    subscribe,
    registerSignal,
    getSnapshot,
    notify,
  };

  // registry.register(observerContext, "ObserverContext GONE!");

  return observerContext;

  // Components are using "useSyncExternalStore" which expects a snapshot to indicate a change
  // to the store. We use a simple number for this to trigger reconciliation of a component. We start
  // out with the current as it reflects the current state of all signals
  function getSnapshot() {
    // It is possible that a tracked signal has changed its snapshot after
    // we have stopped tracking and before we have started subscribing. We
    // have to guarantee to React that we indeed have the same snapshot as
    // when we initially tracked the signals, or React needs to reconcile again
    if (!currentSubscriber) {
      signalNotifiers.forEach((signal) => {
        snapshot = Math.max(snapshot, signal.snapshot);
      });
    }

    return snapshot;
  }

  function startTracking() {
    // We clear our existing signals as dynamic UIs might track different signals now
    ObserverContext.current = observerContext;
  }

  // Deactivates this context
  function stopTracking() {
    if (ObserverContext.current === observerContext) {
      ObserverContext.current = undefined;
    }
  }

  function registerSignal(signal: SignalNotifier) {
    // Track the signal access
    signalNotifiers.add(signal);
  }

  // When adding a subscriber we ensure that the relevant signals are
  // notifying this ObserverContext of updates. That means when nothing
  // is subscribing to this ObserverContext the instance is free to
  // be garbage collected. React asynchronously subscribes and unsubscribes,
  // but useSyncExternalStore has a mechanism that ensures the validity
  // of the subscription using snapshots
  function subscribe(subscriber: () => void) {
    // If there's a previous subscription, we don't need to clean anything up
    // as we're just replacing the callback function
    currentSubscriber = subscriber;

    // Make sure all tracked signals have this context registered
    signalNotifiers.forEach((signal) => signal.addContext(observerContext));

    return () => {
      currentSubscriber = undefined;
      // Clean up by removing this context from all signals
      signalNotifiers.forEach((signal) =>
        signal.removeContext(observerContext)
      );
    };
  }

  // When a signal updates it goes through its registered contexts and calls this method.
  // Here we always know that we get the very latest global snapshot as it was just
  // generated. We immediately apply it and React will now reconcile given it is
  // subscribing
  function notify(newSnapshot: number) {
    snapshot = newSnapshot;

    // We clear the tracking information of the ObserverContext when we notify
    // as it should result in a new tracking
    signalNotifiers.forEach((signal) => {
      signal.removeContext(observerContext);
    });
    signalNotifiers.clear();

    // Notify the single subscriber if it exists
    if (currentSubscriber) {
      currentSubscriber();
    }
  }
}
