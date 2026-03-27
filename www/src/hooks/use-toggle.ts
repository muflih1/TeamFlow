import { useReducer } from "react"

function reducer<T>(state: boolean, nextValue?: T) {
  return typeof nextValue === 'boolean' ? nextValue : !state
}

export function useToggle<T>(initialValue: boolean): [boolean, (nextValue: T) => void] {
  return useReducer(reducer, initialValue)
}