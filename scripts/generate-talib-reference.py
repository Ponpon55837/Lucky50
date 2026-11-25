"""Regenerate the offline Vitest reference from the checked-in 0050 market fixture.

Use Python 3.10+ with the official TA-Lib 0.6.8 wheel (C core 0.6.4):
    python -m pip install --only-binary=:all: TA-Lib==0.6.8
    python scripts/generate-talib-reference.py

TA-Lib is only needed to regenerate the JSON. Vitest consumes the committed values.
https://pypi.org/project/TA-Lib/0.6.8/
https://github.com/TA-Lib/ta-lib/releases/tag/v0.6.4
"""

import ast
import json
import math
import re
from pathlib import Path

import numpy as np
import talib


FIXTURES = Path(__file__).resolve().parents[1] / "src" / "tests" / "fixtures"
TA_LIB_PYTHON_VERSION = "0.6.8"
TA_LIB_CORE_VERSION = "0.6.4"


def as_json_series(values):
    return [None if math.isnan(value) else value for value in values.tolist()]


def main():
    core_version = talib.__ta_version__.decode().split()[0]
    if talib.__version__ != TA_LIB_PYTHON_VERSION or core_version != TA_LIB_CORE_VERSION:
        raise RuntimeError(
            f"Expected TA-Lib {TA_LIB_PYTHON_VERSION} (C core {TA_LIB_CORE_VERSION})"
        )

    source = (FIXTURES / "etf0050.ts").read_text(encoding="utf-8")
    rows_source = re.search(r"^const ROWS: [^\n]+ = (\[.*?^\])", source, re.M | re.S)
    if rows_source is None:
        raise ValueError("Expected the raw OHLC rows in etf0050.ts")
    rows = ast.literal_eval(rows_source[1])
    _, _, adjustments_source = source.partition("export const ETF_0050_ADJUSTMENTS")
    adjustments = re.findall(
        r"date: '([^']+)'.*?factor: ([\d.]+) / ([\d.]+)", adjustments_source, re.S
    )
    if not adjustments or len(adjustments) != adjustments_source.count("factor:"):
        raise ValueError("Expected adjustment dates and price ratios in etf0050.ts")

    # Apply recent events first, with prices anchored to the last observed bar.
    last_date = rows[-1][0]
    ordered_adjustments = sorted(adjustments, reverse=True)
    prices = []
    for date, _, high, low, close, _ in rows:
        factor = math.prod(
            float(reference) / float(before)
            for event_date, reference, before in ordered_adjustments
            if date < event_date <= last_date
        )
        prices.append((high * factor, low * factor, close * factor))
    high, low, close = np.array(prices, dtype=np.float64).T.copy()

    atr = as_json_series(talib.ATR(high, low, close, timeperiod=14))
    cci = as_json_series(talib.CCI(high, low, close, timeperiod=20))
    rsi = as_json_series(talib.RSI(close, timeperiod=6))
    flat_closes = np.full(15, 100.0)
    reference = {
        "source": "FinMind TaiwanStockPrice 0050, adjusted with etf0050.ts event ratios",
        "talib": {"python": TA_LIB_PYTHON_VERSION, "core": TA_LIB_CORE_VERSION},
        "columns": ["date", "atr14", "cci20", "rsi6"],
        "rows": list(zip((row[0] for row in rows), atr, cci, rsi, strict=True)),
        "flatRsi6": {
            "close": flat_closes[0],
            "length": len(flat_closes),
            "values": as_json_series(talib.RSI(flat_closes, timeperiod=6)),
        },
    }
    path = FIXTURES / "etf0050-talib.json"
    path.write_text(json.dumps(reference, indent=2, allow_nan=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
