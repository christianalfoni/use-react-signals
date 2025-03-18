# use-react-signal

Replace useState with useSignal and forget about performance issues.

```sh
npm install use-react-signal
```

Activate the plugin to optimise all application components to become observers. No explicit observation or memo components needed.

```ts
import babelPlugin from "use-react-signal/babel-plugin";
import swcPlugin from "use-react-signal/swc-plugin";
```

The `useSignal` hook has the same signature as `useState`. The difference is that the state is a signal. You access and observe the value with `.value`.

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

## Why?

The primary reason developers lean on state management beyond `useState` is because of its performance characteristics. With shallow value comparison React quickly hits performance issues with state management, especially using context.

By simply making all components observers using the plugin and replacing `useState` with `useSignal`, your React components will optimally reconcile from contexts and props passing out of the box.

The library is designed to showcase how React itself could provide such a primitive natively.

## Component behavior

By default `useState` causes all nested components to reconcile. With context `useState` will cause all consuming components AND their nested components to reconcile.

With `use-react-signal` your components do not reconcile by default. They rather observe by default. That means exposing a signal as a prop, or on a context, will not cause the component to reconcile, only accessing the signal value will.

## Context

Now that components only reconcile when accessed signals change, the context providers can safely expose state without performance challenges.

```tsx
function StateContextProvider({ children }) {
  const [count, setCount] = useSignal(0);

  const state = {
    count,
    increase() {
      setCount(count.value + 1);
    },
  };

  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}
```

You can compose multiple hooks together and safely expose them all through the context.

## Effects and Computed

Other reactive solutions also includes their own observable effects and computed. This is not strictly necessary for React. Since signal values can still be shallow compared, just like `useState`, you use `useEffect` and `useMemo` as normal. Linters and typing are unaffected.

```tsx
function Counter() {
  const [count, setCount] = useSignal(0);

  const doubled = useMemo(() => count.value * 2, [count.value]);
}
```
