/**
 * @file 'List' component
 */
import React from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import H from 'history'
import { useSelector } from 'react-redux'
import { FormattedMessage, useIntl } from 'react-intl'
import dayjs, { Dayjs } from 'dayjs'

import Button from '@material/react-button'
import Fab from '@material/react-fab'
import { Cell, Grid, Row } from '@material/react-layout-grid'
import MaterialIcon from '@material/react-material-icon'
import { Headline6 } from '@material/react-typography'

import { AppState } from '../../state/store'
import {
  getLatestOf,
  getMonthlyRecordsOf,
  recordsTypes,
} from '../../state/ducks/records'
import { getSendToMailAddress } from '../../state/ducks/settings'

import { makeRecordKey } from '../../state/ducks/records/types'

//
// Functions
//

/**
 * Get days in month
 * @param month Target month
 * @returns Array of Dayjs
 */
function getDaysInMonth(month: Dayjs): Dayjs[] {
  return Array.from(Array(month.daysInMonth()), (_, i) =>
    dayjs(month).set('date', i + 1)
  )
}

/**
 * Create mailto uri
 * @param firstDayOfMonth First day of target month
 * @param records Records to send
 * @param mailAddress Mail address to send
 * @returns mailto uri
 */
function createMailToUri(
  firstDayOfMonth: Dayjs,
  records: recordsTypes.Records,
  mailAddress: string
): string {
  const bodyLines = getDaysInMonth(firstDayOfMonth).map(date => {
    const key = makeRecordKey(date.toDate())
    const record = Object.prototype.hasOwnProperty.call(records, key)
      ? records[key]
      : null
    const latest = getLatestOf(record)
    const columns = [
      date.format('YYYY-MM-DD'),
      latest.start !== null ? dayjs(latest.start).format('HH:mm') : '',
      latest.stop !== null ? dayjs(latest.stop).format('HH:mm') : '',
      latest.memo,
    ]
    return columns.map(column => `"${column}"`).join(',')
  })

  const hfieldsMap: { [index: string]: string } = {
    subject: `${firstDayOfMonth.format('ll')} - ${firstDayOfMonth
      .endOf('month')
      .format('ll')}`,
    body: bodyLines.join('\r\n'),
  }
  const hfields = Object.keys(hfieldsMap).map(
    key => `${key}=${encodeURIComponent(hfieldsMap[key])}`
  )
  return `mailto:${encodeURIComponent(mailAddress)}?${hfields.join('&')}`
}

/**
 * 'List' component
 */
const List: React.FC<
  RouteComponentProps<{ year: string; month: string }>
> = props => {
  const { year, month } = props.match.params
  const firstDayOfMonth = new Date(+year, +month - 1, 1)
  const dj = dayjs(firstDayOfMonth)

  const records = useSelector((state: AppState) =>
    getMonthlyRecordsOf(firstDayOfMonth, state.records)
  )
  const mailAddress = useSelector((state: AppState) =>
    getSendToMailAddress(state.settings)
  )

  const intl = useIntl()
  const timeFormat = intl.formatMessage({ id: 'Format.time.24' })
  return (
    <Grid className="list">
      <MonthHeading target={dj} />
      <Row>
        <Cell columns={12}>
          <DateList
            target={dj}
            records={records}
            timeFormat={timeFormat}
            history={props.history}
          />
        </Cell>
      </Row>
      <Row>
        <Cell columns={12}>
          <a
            className="app-fab--absolute"
            href={createMailToUri(dj, records, mailAddress)}
          >
            <Fab
              icon={<i className="material-icons">mail</i>}
              textLabel={intl.formatMessage({ id: 'Send.mail' })}
            />
          </a>
        </Cell>
      </Row>
    </Grid>
  )
}
export default List

/**
 * 'MonthHeading' component
 */
const MonthHeading: React.FC<{ target: Dayjs }> = props => {
  const intl = useIntl()

  return (
    <Row className="text-align-center">
      <Cell
        desktopColumns={1}
        tabletColumns={1}
        phoneColumns={1}
        className="navigation-before"
      >
        <Link to={props.target.add(-1, 'month').format('/YYYY/M')}>
          <MaterialIcon
            aria-label={intl.formatMessage({ id: 'Prev.month' })}
            icon="navigate_before"
          />
        </Link>
      </Cell>
      <Cell desktopColumns={10} tabletColumns={6} phoneColumns={2}>
        <Headline6 tag="h2">
          {props.target.format(intl.formatMessage({ id: 'Format.month' }))}
        </Headline6>
      </Cell>
      <Cell
        desktopColumns={1}
        tabletColumns={1}
        phoneColumns={1}
        className="navigation-next"
      >
        <Link to={props.target.add(1, 'month').format('/YYYY/M')}>
          <MaterialIcon
            aria-label={intl.formatMessage({ id: 'Next.month' })}
            icon="navigate_next"
          />
        </Link>
      </Cell>
    </Row>
  )
}

/**
 * 'DateList' component
 */
const DateList: React.FC<{
  target: Dayjs
  records: recordsTypes.Records
  timeFormat: string
  history: H.History
}> = props => {
  const days = getDaysInMonth(props.target)

  return (
    <Grid className="date-list">
      <Row className="date-list-header date-list-row">
        <Cell desktopColumns={3} tabletColumns={2} phoneColumns={1}>
          <FormattedMessage id="Date" />
        </Cell>
        <Cell desktopColumns={3} tabletColumns={2} phoneColumns={1}>
          <FormattedMessage id="Start" />
        </Cell>
        <Cell desktopColumns={3} tabletColumns={2} phoneColumns={1}>
          <FormattedMessage id="Stop" />
        </Cell>
        <Cell desktopColumns={3} tabletColumns={2} phoneColumns={1}>
          <FormattedMessage id="Edit" />
        </Cell>
      </Row>
      {days.map(date => {
        let dayKind = ''
        if (date.day() === 0) {
          dayKind = 'sunday'
        } else if (date.day() === 6) {
          dayKind = 'saturday'
        }
        const key = makeRecordKey(date.toDate())
        const record = Object.prototype.hasOwnProperty.call(props.records, key)
          ? props.records[key]
          : null
        const latest = getLatestOf(record)
        return (
          <Row key={date.date()} className="date-list-row">
            <Cell
              desktopColumns={3}
              tabletColumns={2}
              phoneColumns={1}
              className={dayKind}
            >
              {date.format('D(ddd)')}
            </Cell>
            <Cell desktopColumns={3} tabletColumns={2} phoneColumns={1}>
              {latest.start !== null
                ? dayjs(latest.start).format(props.timeFormat)
                : ''}
            </Cell>
            <Cell desktopColumns={3} tabletColumns={2} phoneColumns={1}>
              {latest.stop !== null
                ? dayjs(latest.stop).format(props.timeFormat)
                : ''}
            </Cell>
            <Cell desktopColumns={3} tabletColumns={2} phoneColumns={1}>
              <Button
                dense={true}
                onClick={(): void =>
                  props.history.push(date.format('/YYYY/M/D'))
                }
              >
                <span dangerouslySetInnerHTML={{ __html: '&hellip;' }} />
              </Button>
            </Cell>
          </Row>
        )
      })}
    </Grid>
  )
}
