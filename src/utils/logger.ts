import { createLogger, transports, format, config } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

export const logger = createLogger({
  levels: config.syslog.levels,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message }) => {
          return `[${level}]: ${message} [${timestamp}]`
        })
      )
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  ]
})
