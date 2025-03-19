# use-react-signals

Simplify shared state management and boost React performance by replacing **useState** with **useSignals**.

- 🌎 **Efficient Shared State**: Seamlessly share state through **props** or **context** without triggering unnecessary re-renders.
- ☘️ **Incremental Adoption**: Gradually replace **useState** with **useSignals** where it benefits your application.
- 🧠 **Familiar Mental Model**: Maintain the intuitive React patterns you already know for state updates, effects, and memoization.
- 🎈 **Transparent Implementation**: Clear, simple, and readable implementation that you can understand.

## Installation

```sh
npm install use-react-signals
```

## Enable Observation Mode

Observation Mode makes components observers of signals and allows for targeted reconciliation. Use the provided plugins to automatically enable this mode:

### Babel Plugin

```ts
import babelPlugin from "use-react-signals/babel-plugin";
```

### SWC Plugin

```ts
import swcPlugin from "use-react-signals/swc-plugin";
```

## Basic Example

Here's a minimal example demonstrating how **useSignals** works:

```tsx
import { useSignals } from "use-react-signals";

// Does not re-render on `count` changes
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

// Re-renders only when `count` changes
function Count({ counter }) {
  return <h1>My count is: {counter.count}</h1>;
}

// Does not re-render on `count` changes
function Incrementer({ counter }) {
  return <button onClick={counter.increment}>Increment</button>;
}
```

## Using Signals with React Context

You can easily expose shared state via context with signals:

```tsx
import { createContext, useContext } from "react";
import { useSignals } from "use-react-signals";

const AppStateContext = createContext(null);

export function useAppState() {
  return useContext(AppStateContext);
}

export function AppStateProvider({ children }) {
  const [state, setState] = useSignals({
    count: 0,
    increment() {
      setState({ count: state.count + 1 });
    },
  });

  return (
    <AppStateContext.Provider value={state}>
      {children}
    </AppStateContext.Provider>
  );
}
```

## How It Works

**useSignals** returns an object whose reference never changes, significantly reducing unnecessary re-renders caused by changes in props or context references. The methods returned by **useSignals** also retain stable references. Components re-render only when they explicitly access updated signal keys.

Observation Mode, enabled by the Babel or SWC plugins, makes components observers of signals, allowing targeted reconciliation and improving performance by avoiding unnecessary re-renders.

## Did you know?

- You can use **useSignals** for local component state if you prefer it
- You can safely perform asynchronous state changes in effects as the component stops subscribing to signals when it unmounts
- You can use **useSignals** with **useMemo** and **useEffect** as normal
