# use-react-signals

Replace **useState** with **useSignals** for shared state and say goodbye to performance issues.

- 🌎 Share state through **props** or **context** without performance challenges
- ☘️ Gradual adoption replacing **useState** with **useSignals** where it makes sense
- 🧠 Same mental model for updating state and using effects and memoizing
- 🎈 Simple implementation that you can **read** and **understand**

## Get Started

```sh
npm install use-react-signals
```

Make your components default to **observation** instead of **reconciliation**:

```ts
import babelPlugin from "use-react-signals/babel-plugin";
import swcPlugin from "use-react-signals/swc-plugin";
```

## Example

```tsx
import { useSignals } from "use-react-signal";

function Counter() {
  const [counter, setCounter] = useSignals({
    count: 0,
    increment() {
      setCounter({ count: counter.count + 1 });
    },
  });

  return (
    <>
      <Count counter={counter} />
      <Incrementer counter={counter} />
    </>
  );
}

function Count({ counter }) {
  // Count is observed when accessed
  return <h1>My count is: {counter.count}</h1>;
}

function Incrementer({ counter }) {
  // Only Count will reconcile when incrementing
  return <button onClick={counter.increment}>Increment</button>;
}
```

**useState** is great for local component state, but when you want to share state, either through props or context, use **useSignals**. It takes an object where each key represents an immutable signal. It also encourages to include methods, as the result of this is state management that only triggers reconciliation when the accessed signal changes its value.

Scale up your contexts for accessible state management without worrying about performance issues:

```tsx
import { createContext, useContext } from "react";
import { useSignals } from "use-react-signals";

const AppStateContext = createContext(null);

export function useState() {
  return useContext(AppStateContext);
}

export function AppStateProvider({ children }) {
  const [counter, setCounter] = useSignals({
    count: 0,
    increment() {
      setCounter({ count: counter.count + 1 });
    },
  });

  return (
    <AppStateContext.Provider value={counter}>
      {children}
    </AppStateContext.Provider>
  );
}
```

## How

With signals there will be far less changes to props/context references that trigger reconciliation. This is because the object returned by **useSignals** never changes reference. The functions never changes reference either. The only way reconciliation can trigger is when a component accesses a signal key. The result of this is isolated and predictable reconciliation.

The **plugin** will transform your application components to observe signals and prevent reconciliation waterfalls with **memo**.

With the minimal implementation of signals and observation, the application will be more performant and waste less memory due to targeted reconciliation.
