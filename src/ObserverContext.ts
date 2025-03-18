// Use for memory leak debugging
// const registry = new FinalizationRegistry((message) => console.log(message));

// This global counter makes sure that every signal update is unqiue and
// can be tracked by React
let currentSnapshot = 0;

// This is instantiated by a signal to keep track of what ObsererContexts are interested
// in the signal and notifies them when the signal changes
export class SignalNotifier {
  contexts = new Set<ObserverContext>();
  constructor() {}
  // A signal holds a global snapshot value, which changes whenever the signal changes.
  // This snapshot is passed and stored on the ObserverContext to make sure
  // React understands that a change has happened
  snapshot = ++currentSnapshot;
  addContext(context: ObserverContext) {
    this.contexts.add(context);
  }
  removeContext(context: ObserverContext) {
    this.contexts.delete(context);
  }
  notify() {
    // Any signal change updates the global snapshot
    this.snapshot = ++currentSnapshot;

    // A context can be synchronously added back to this signal related to firing the signal, which
    // could cause a loop. We only want to notify the current contexts
    const contexts = Array.from(this.contexts);

    contexts.forEach((context) => context.notify(this.snapshot));
  }
}

// The observer context is responsible for keeping track of signals accessed in a component, derived or effect. It
// does this by being set as the currently active ObserverContext. Any signals setting/getting will register
// to this active ObserverContext. The component/derived/effect then subscribes to the context, which will add the
// context to every signal tracked. When context is notified about a change it will remove itself from current signals
// and notify any subscribers of the context. It is expected that the subscriber(s) of the context will initiate tracking again.
// The subscription to the context can be disposed, which will also remove the context from any tracked signals. This makes
// sure that component/store unmount/disposal will also remove the context from any signals... making it primed for garbage collection
export class ObserverContext {
  // We keep a global reference to the currently active observer context
  private static currentContext: ObserverContext | undefined = undefined;

  static get current(): ObserverContext | undefined {
    return ObserverContext.currentContext;
  }

  // We track all signals accessed by this context
  _signals = new Set<SignalNotifier>();
  // An ObserverContext only has one subscriber at any time
  _subscriber?: () => void;
  stackTrace = "";
  // Components are using "useSyncExternalStore" which expects a snapshot to indicate a change
  // to the store. We use a simple number for this to trigger reconciliation of a component. We start
  // out with the current as it reflects the current state of all signals
  snapshot = currentSnapshot;

  constructor() {
    // Use for memory leak debugging
    // registry.register(this, this.id + " has been collected");
  }

  startTracking() {
    ObserverContext.currentContext = this;
  }

  // Deactivates this context if it's the current one
  stopTracking() {
    if (ObserverContext.currentContext === this) {
      ObserverContext.currentContext = undefined;
    }
  }

  registerSignal(signal: SignalNotifier) {
    // Track the signal access
    this._signals.add(signal);
  }

  // When adding a subscriber we ensure that the relevant signals are
  // notifying this ObserverContext of updates. That means when nothing
  // is subscribing to this ObserverContext the instance is free to
  // be garbage collected. React asynchronously subscribes and unsubscribes,
  // but useSyncExternalStore has a mechanism that ensures the validity
  // of the subscription using snapshots
  subscribe(subscriber: () => void) {
    // If there's a previous subscription, we don't need to clean anything up
    // as we're just replacing the callback function
    this._subscriber = subscriber;

    // Make sure all tracked signals have this context registered
    this._signals.forEach((signal) => signal.addContext(this));

    // Return unsubscribe function
    return () => {
      this._subscriber = undefined;
      // Clean up by removing this context from all signals
      this._signals.forEach((signal) => signal.removeContext(this));
    };
  }

  // When a signal updates it goes through its registered contexts and calls this method.
  // Here we always know that we get the very latest global snapshot as it was just
  // generated. We immediately apply it and React will now reconcile given it is
  // subscribing
  notify(snapshot: number) {
    this.snapshot = snapshot;

    // We clear the tracking information of the ObserverContext when we notify
    // as it should result in a new tracking
    this._signals.forEach((signal) => {
      signal.removeContext(this);
    });
    this._signals.clear();

    // Notify the single subscriber if it exists
    if (this._subscriber) {
      this._subscriber();
    }
  }
}
