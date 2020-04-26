/**
 * @file Record formatter
 */
import dayjs, { Dayjs } from 'dayjs'

import { getLatestOf, recordsTypes } from '../state/ducks/records'
import { makeRecordKey } from '../state/ducks/records/types'

import { getDaysInMonth } from './utilities'

//
// Functions
//

/**
 * Format specified month records as CSV for mail
 * @param firstDayOfMonth First day of target month
 * @param records Records
 * @param defaultBreakTimeLength Default break time length
 * @returns Array of string instance
 */
export function formatSpecifiedMonthRecordsAsCsvForMail(
  firstDayOfMonth: Dayjs,
  records: recordsTypes.Records,
  defaultBreakTimeLength: number | undefined
): string[] {
  return getDaysInMonth(firstDayOfMonth).map((date) => {
    const key = makeRecordKey(date.toDate())
    const record = Object.prototype.hasOwnProperty.call(records, key)
      ? records[key]
      : null
    const latest = getLatestOf(record, defaultBreakTimeLength)
    let breakTimeLength = ''
    if (
      latest.breakTimeLengthMin !== null &&
      latest.start !== null &&
      latest.stop !== null
    ) {
      breakTimeLength = dayjs()
        .hour(Math.floor(latest.breakTimeLengthMin / 60))
        .minute(latest.breakTimeLengthMin % 60)
        .format('HH:mm')
    }
    const columns = [
      date.format('YYYY-MM-DD'),
      latest.start !== null ? dayjs(latest.start).format('HH:mm') : '',
      latest.stop !== null ? dayjs(latest.stop).format('HH:mm') : '',
      latest.memo,
      breakTimeLength,
    ]
    return columns.map((column) => `"${column}"`).join(',')
  })
}