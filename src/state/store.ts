/**
 * @file Store
 */
import {
  AnyAction,
  applyMiddleware,
  combineReducers,
  createStore,
  Reducer,
  Store,
} from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { createTransform, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import dayjs from 'dayjs'

import recordsReducer, {
  INITIAL_STATE as recordsInitialState,
  recordsTypes,
} from './ducks/records'
import settingsReducer, {
  INITIAL_STATE as settingsInitialState,
  settingsTypes,
} from './ducks/settings'
import runningReducer, {
  INITIAL_STATE as runningInitialState,
  runningTypes,
} from './ducks/running'

//
// Types
//

/**
 * App state
 */
export interface AppState {
  records: recordsTypes.RecordsState
  settings: settingsTypes.SettingsState
  running: runningTypes.RunningState
}

//
// Variables
//

/**
 * Initial state
 */
export const INITIAL_STATE: AppState = {
  records: recordsInitialState,
  settings: settingsInitialState,
  running: runningInitialState,
}

/**
 * Persistence and rehydrate transformer
 */
const setTransform = createTransform(
  (inboundState, key) =>
    key === 'records' ? JSON.stringify(inboundState) : inboundState,
  (outboundState, key) => {
    if (key !== 'records') {
      return outboundState
    }

    return JSON.parse(outboundState as string, (key, value) =>
      key === 'starts' || key === 'stops'
        ? (value as string[]).map(v => dayjs(v).toDate())
        : value
    )
  },
  { blacklist: ['recordsReducer'] }
)

/**
 * Persistence configuration
 */
const persistConfig = {
  key: 'root',
  storage,
  version: 1,
  transforms: [setTransform],
  blacklist: ['running'],
}

//
// Functions
//

/**
 * Create root reducer
 * @returns Root reducer
 */
export function createRootReducer(): Reducer<AppState, AnyAction> {
  return combineReducers({
    records: recordsReducer,
    settings: settingsReducer,
    running: runningReducer,
  })
}

/**
 * Configure store
 * @param state Initial state
 * @returns Store
 */
export default function configureStore(
  state: AppState = INITIAL_STATE
): Store<AppState, AnyAction> {
  return createStore(
    persistReducer(persistConfig, createRootReducer()),
    state,
    composeWithDevTools(applyMiddleware())
  )
}
