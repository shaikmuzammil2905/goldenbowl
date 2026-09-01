import { useEffect, useState } from 'react'
import { getState, subscribe } from '../services/prototypeStore'

export function usePrototypeStore() {
  const [state, setState] = useState(getState())

  useEffect(() => subscribe(setState), [])

  return state
}
