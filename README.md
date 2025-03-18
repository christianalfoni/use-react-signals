# use-react-signal

Replace **useState** with **useSignal** and say goodbye to performance issues.

- ☘️ Gradual adoption replacing **useState** with **useSignal**
- 🌎 Share state through **props** or **context** without performance challenges
- 🧠 Same mental model for updating state and using effects and memoizing
- 🎈 Simple implementation that you can **read** and **understand**

## Get Started

```sh
npm install use-react-signal
```

Make your components default to **observation** instead of **reconciliation**:

```ts
import babelPlugin from "use-react-signal/babel-plugin";
import swcPlugin from "use-react-signal/swc-plugin";
```

## Example

```tsx
import { useSignal } from "use-react-signal";

function Counter() {
  const [count, setCount] = useSignal(0);

  return (
    <button onClick={() => setCount(count.value + 1)}>
      Count {count.value}
    </button>
  );
}
```

The same signature, only the state is a signal. Use `.value` to access and observe the value.

Scale up your contexts for accessible state management without worrying about performance issues:

```tsx
import { createContext, useContext } from "react";
import { useSignal } from "use-react-signal";

const AppStateContext = createContext(null);

export function useState() {
  return useContext(AppStateContext);
}

export function AppStateProvider({ children }) {
  const [count, setCount] = useSignal(0);

  function increment() {
    setCount(count.value + 1);
  }

  return (
    <AppStateContext.Provider value={{ count, increment }}>
      {children}
    </AppStateContext.Provider>
  );
}
```

## How

With signals there will be far less changes to props/context that trigger reconciliation. This is because signals are passed by reference and not value, which means the same signal instance will be passed to child components, even when the value changes. The result of this is isolated and predictable reconciliation.

The **plugin** will transform your application components to observe signals and prevent reconciliation waterfalls with **memo**.

With the minimal implementation of signals and observation, the application will be more performant and waste less memory due to targeted reconciliation.
