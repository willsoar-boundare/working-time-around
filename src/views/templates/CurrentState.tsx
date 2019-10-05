/**
 * @file 'CurrentState' component
 */
import React, { useCallback, useEffect, useRef } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import dayjs from 'dayjs'

import Button from '@material/react-button'
import { Cell, Grid, Row } from '@material/react-layout-grid'
import MaterialIcon from '@material/react-material-icon'
import TextField, { Input } from '@material/react-text-field'
import { Headline4 } from '@material/react-typography'

import { AppState } from '../../state/store'
import {
  getDailyRecordOf,
  getLatestMemoOf,
  getLatestOf,
  start,
  stop,
  updateLatestMemo,
} from '../../state/ducks/records'
import {
  getTime,
  getWindow,
  showMessage,
  updateTime,
} from '../../state/ducks/running'
import {
  canSendMessageToSlack,
  getSlackSettings,
} from '../../state/ducks/settings'
import { formatSendFailedMessage, sendMessageToSlack } from '../pages/App'

//
// Components
//

/**
 * 'CurrentState' component
 */
const CurrentState: React.FC<RouteComponentProps<{}>> = props => {
  const intervalRef = useRef<number>()

  const dispatch = useDispatch()
  function timeout(): void {
    dispatch(updateTime())
    intervalRef.current = window.setTimeout(() => timeout(), 1000)
  }
  useEffect(() => {
    timeout()
    return function cleanup() {
      window.clearTimeout(intervalRef.current)
    }
  }, [])

  const time = useSelector((state: AppState) => getTime(state.running))
  const record = useSelector((state: AppState) =>
    getDailyRecordOf(time, state.records)
  )
  const latest = getLatestOf(record)
  const dj = dayjs(time)

  const handleClick = useCallback(() => {
    props.history.push(dj.format('/YYYY/M/D'))
  }, [time])

  const intl = useIntl()
  return (
    <Grid className="current-state">
      <Row>
        <Cell columns={12}>
          <StartButton disabled={latest.stop !== null} time={latest.start} />
        </Cell>
      </Row>
      <Row className="gutter-top">
        <Cell columns={12}>
          <Button className="date full-width" onClick={handleClick}>
            <Headline4 tag="span">
              {dj.format(intl.formatMessage({ id: 'Format.date' }))}
            </Headline4>
          </Button>
        </Cell>
      </Row>
      <Row>
        <Cell columns={12}>
          <Headline4 tag="div" className="text-align-center">
            {dj.format(intl.formatMessage({ id: 'Format.time.24' }))}
          </Headline4>
        </Cell>
      </Row>
      <Row className="gutter-top">
        <Cell columns={12}>
          <StopButton time={latest.stop} />
        </Cell>
      </Row>
      <Row className="gutter-top">
        <Cell columns={12}>
          <MemoTextField
            time={time}
            memo={latest.memo}
            afterStopped={latest.stop !== null}
          />
        </Cell>
      </Row>
    </Grid>
  )
}
export default CurrentState

/**
 * 'StartButton' component renderer
 */
const StartButton: React.FC<{
  time: Date | null
  disabled: boolean
}> = props => {
  const initialRef = useRef<{ time: Date | null }>({ time: props.time })

  const intl = useIntl()
  const labelStart = intl.formatMessage({ id: 'Start' })
  const timeFormat = intl.formatMessage({ id: 'Format.time.24' })

  const canPost = useSelector((state: AppState) =>
    canSendMessageToSlack(state.settings)
  )
  const dispatch = useDispatch()
  if (canPost !== false) {
    const w = useSelector((state: AppState) => getWindow(state.running))
    const slackSettings = useSelector((state: AppState) =>
      getSlackSettings(state.settings)
    )
    useEffect(() => {
      if (w.navigator.onLine === false) {
        dispatch(
          showMessage(
            intl.formatMessage({ id: 'Could.not.send.because.offline.' })
          )
        )
        return
      }

      if (props.time !== null && props.time !== initialRef.current.time) {
        sendMessageToSlack(
          slackSettings,
          `[${labelStart}] ${dayjs(props.time).format(timeFormat)}`
        ).then(resultMessage => {
          if (0 < resultMessage.length) {
            dispatch(showMessage(formatSendFailedMessage(intl, resultMessage)))
          }
        })
      }
    }, [props.time])
  }

  const handleClick = useCallback(() => {
    dispatch(start())
  }, [])

  return (
    <Button
      className="full-width"
      data-testid="start"
      unelevated={true}
      disabled={props.disabled !== false || props.time !== null}
      onClick={handleClick}
    >
      {props.time !== null ? dayjs(props.time).format(timeFormat) : labelStart}
    </Button>
  )
}

/**
 * 'StopButton' component renderer
 */
const StopButton: React.FC<{
  time: Date | null
}> = props => {
  const initialRef = useRef<{ time: Date | null }>({ time: props.time })

  const record = useSelector((state: AppState) =>
    getDailyRecordOf(
      props.time !== null ? props.time : new Date(),
      state.records
    )
  )
  const memo = record !== null ? getLatestMemoOf(record) : ''

  const intl = useIntl()
  const labelStop = intl.formatMessage({ id: 'Stop' })
  const timeFormat = intl.formatMessage({ id: 'Format.time.24' })

  const canPost = useSelector((state: AppState) =>
    canSendMessageToSlack(state.settings)
  )
  const dispatch = useDispatch()
  if (canPost !== false) {
    const w = useSelector((state: AppState) => getWindow(state.running))
    const slackSettings = useSelector((state: AppState) =>
      getSlackSettings(state.settings)
    )
    useEffect(() => {
      if (w.navigator.onLine === false) {
        dispatch(
          showMessage(
            intl.formatMessage({ id: 'Could.not.send.because.offline.' })
          )
        )
        return
      }

      if (props.time !== null && props.time !== initialRef.current.time) {
        sendMessageToSlack(
          slackSettings,
          `[${labelStop}] ${dayjs(props.time).format(timeFormat)}\n${memo}`
        ).then(resultMessage => {
          if (0 < resultMessage.length) {
            dispatch(showMessage(formatSendFailedMessage(intl, resultMessage)))
          }
        })
      }
    }, [props.time])
  }

  const handleClick = useCallback(() => {
    dispatch(stop())
  }, [])
  return (
    <Button
      className="full-width"
      data-testid="stop"
      unelevated={true}
      disabled={props.time !== null}
      onClick={handleClick}
    >
      {props.time !== null ? dayjs(props.time).format(timeFormat) : labelStop}
    </Button>
  )
}

/**
 * 'MemoTextField' component renderer
 */
const MemoTextField: React.FC<{
  memo: string
  time: Date
  afterStopped: boolean
}> = props => {
  const updateRef = useRef<{
    initial: string | null
    updated: string | null
  }>({
    initial: null,
    updated: null,
  })

  const dj = dayjs(props.time)
  const tomorrow = dj.startOf('date').add(1, 'day')

  const canPost = useSelector((state: AppState) =>
    canSendMessageToSlack(state.settings)
  )
  const w = useSelector((state: AppState) => getWindow(state.running))
  const slackSettings = useSelector((state: AppState) =>
    getSlackSettings(state.settings)
  )
  const intl = useIntl()
  const postUpdate = () => {
    if (updateRef.current.updated !== null) {
      if (w.navigator.onLine === false) {
        dispatch(
          showMessage(
            intl.formatMessage({ id: 'Could.not.send.because.offline.' })
          )
        )
        return
      }

      sendMessageToSlack(
        slackSettings,
        `[${intl.formatMessage({ id: 'Memo' })}] ${updateRef.current.updated}`
      ).then(resultMessage => {
        if (0 < resultMessage.length) {
          dispatch(showMessage(formatSendFailedMessage(intl, resultMessage)))
        }
      })
    }
  }

  const requirePost = props.afterStopped !== false && canPost !== false
  if (requirePost !== false) {
    useEffect(() => {
      w.addEventListener('unload', postUpdate)
      return function cleanup() {
        w.removeEventListener('unload', postUpdate)
        postUpdate()
      }
    }, [])

    useEffect(() => {
      const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
        const msg =
          updateRef.current.updated !== null
            ? 'Do you want to leave this page?'
            : ''
        e.returnValue = msg
        return msg
      }
      w.addEventListener('beforeunload', beforeUnloadHandler)
      return function cleanup() {
        w.removeEventListener('beforeunload', beforeUnloadHandler)
      }
    }, [updateRef.current.updated])
  }

  const showSendButton =
    requirePost !== false && updateRef.current.updated !== null
  const trailingIcon =
    showSendButton !== false ? (
      <MaterialIcon
        aria-label={intl.formatMessage({ id: 'Send.update' })}
        icon="send"
      />
    ) : (
      <></>
    )
  const handleTrailingIconSelect =
    showSendButton !== false
      ? () => {
          postUpdate()
          updateRef.current.updated = null
        }
      : undefined

  const dispatch = useDispatch()
  const handleInput = useCallback(e => {
    updateRef.current.updated = e.currentTarget.value
    dispatch(updateLatestMemo(e.currentTarget.value))
  }, [])

  return (
    <TextField
      textarea={true}
      fullWidth={true}
      trailingIcon={trailingIcon}
      onTrailingIconSelect={handleTrailingIconSelect}
      disabled={tomorrow.diff(dj, 'm') < 5}
    >
      <Input value={props.memo} onInput={handleInput} />
    </TextField>
  )
}
