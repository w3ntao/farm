import datetime
import chinese_calendar
import akshare as ak
import argparse
import os

import akshare.stock_feature.stock_hist_tx as stock_hist_tx

stock_hist_tx.get_tqdm = lambda enable=True: (lambda iterable, *args, **kwargs: iterable)
# to hide tqdm progressive bar


def get_last_stock_date():
    code = "000001"

    data = ak.stock_zh_a_hist_tx(symbol="sz" + code)

    data_date = data[["date"]]
    newest_date = data_date.iloc[-1].iloc[0]

    print(newest_date)


def stock_open_today(date=None):
    check_date = datetime.date.today()

    if chinese_calendar.is_holiday(check_date) or check_date.weekday() >= 5:
        # weekday: 0 - 6: Mon - Sun
        print("no")
        exit(1)

    print("yes")
    exit(0)


def main():
    parser = argparse.ArgumentParser(description="stock market utilities")

    parser.add_argument("--last_stock_date", action="store_true", help="print last stock date")

    parser.add_argument("--open_today", action="store_true", help="if stock market open today")

    args = parser.parse_args()

    if args.last_stock_date:
        get_last_stock_date()
        return

    if args.open_today:
        stock_open_today()
        return

    parser.print_help()


if __name__ == "__main__":
    main()
