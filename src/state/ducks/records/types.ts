/**
 * @file Records state types
 */
import dayjs from 'dayjs'

//
// Types
//

/**
 * Daily record
 */
export interface DailyRecord {
  starts: Date[]
  stops: Date[]
  memos: string[]
}

/**
 * Map of date and record
 */
export interface Records {
  [index: string]: DailyRecord
}

/**
 * Records state
 */
export interface RecordsState {
  records: Records
}

//
// Helper functions
//

/**
 * Make record key
 * @param date Date to make key
 * @returns Record key
 */
export function makeRecordKey(date: Date) {
  return dayjs(date).format('YYYYMMDD')
}
