import pandas as pd
import pandas_ta as ta
from backend.models.strategy import IndicatorCondition


def calculate_indicators(df: pd.DataFrame, conditions: list) -> pd.DataFrame:
    """
    Dynamically calculates only the indicators needed by the strategy.
    Uses pandas-ta with the period from the condition or pandas-ta defaults.
    """
    df = df.copy()

    for condition in conditions:
        if condition.type != "indicator":
            continue

        indicator_name = condition.indicator.lower()
        period = condition.period
        period2 = condition.period2

        try:
            indicator_func = getattr(ta, indicator_name, None)
            if indicator_func is None:
                print(f"Warning: indicator '{indicator_name}' not found in pandas-ta")
                continue

            kwargs = {}
            if period is not None:
                kwargs['length'] = period
            if period2 is not None:
                kwargs['signal'] = period2

            result = indicator_func(
                df['close'],
                high=df.get('high'),
                low=df.get('low'),
                volume=df.get('volume'),
                **kwargs
            )

            if isinstance(result, pd.DataFrame):
                for col in result.columns:
                    col_key = f"{indicator_name}_{col}" if period is None else f"{indicator_name}_{period}_{col}"
                    df[col_key] = result[col]
            elif isinstance(result, pd.Series):
                col_key = f"{indicator_name}_{period}" if period else indicator_name
                df[col_key] = result

        except Exception as e:
            print(f"Warning: could not calculate {indicator_name}: {e}")
            continue

    return df


def get_available_indicators() -> list:
    """
    Returns all callable indicator names from pandas-ta,
    filtered to only real trading indicators.
    """
    exclude = {
        'above', 'above_value', 'below', 'below_value', 'camelCase2Title',
        'candle_color', 'category_files', 'combination', 'create_dir',
        'cross', 'cross_value', 'cube', 'df_dates', 'df_error_analysis',
        'df_month_to_date', 'df_quarter_to_date', 'df_year_to_date',
        'final_time', 'geometric_mean', 'get_time', 'help', 'high_low_range',
        'hl2', 'hlc3', 'import_dir', 'log_geometric_mean', 'long_run',
        'ms2secs', 'mtd', 'nb_ffill', 'nb_idiff', 'nb_nonzero_range',
        'nb_prenan', 'nb_prepend', 'nb_rolling', 'nb_shift',
        'non_zero_range', 'ohlc4', 'pascals_triangle', 'pd_rma',
        'percent_rank', 'qtd', 'real_body', 'recent_maximum_index',
        'recent_minimum_index', 'remap', 'signed_series', 'simplify_columns',
        'speed_test', 'strided_window', 'sum_signed_rolling_deltas',
        'symmetric_triangle', 'to_utc', 'total_time', 'unix_convert',
        'unsigned_differences', 'v_array', 'v_ascending', 'v_bool',
        'v_dataframe', 'v_datetime_ordered', 'v_drift', 'v_float',
        'v_int', 'v_list', 'v_lowerbound', 'v_mamode', 'v_null',
        'v_offset', 'v_percent', 'v_pos_default', 'v_scalar', 'v_series',
        'v_str', 'v_talib', 'v_tradingview', 'v_upperbound', 'weights',
        'ytd', 'zero', 'short_run', 'signals', 'tsignals', 'xsignals',
        'AnalysisIndicators', 'Study', 'wcp', 'tal_ma', 'ma',
    }

    all_funcs = [
        name for name in dir(ta)
        if callable(getattr(ta, name))
        and not name.startswith('_')
        and name not in exclude
    ]

    return sorted(all_funcs)