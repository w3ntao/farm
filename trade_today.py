import chinese_calendar
import datetime
from zoneinfo import ZoneInfo

beijing_timezone = ZoneInfo("Asia/Shanghai")
date = datetime.datetime.now(beijing_timezone).date()

if not chinese_calendar.is_holiday(date) and date.weekday() < 5:
    # trade today
    exit(0)

exit(1)
