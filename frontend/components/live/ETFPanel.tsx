"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricField {
  value: string;
  lastUpdateDate: string;
  status: string;
}

interface ETFEntry {
  id: number;
  ticker: string;
  institute: string;
  fee: MetricField;
  netAssets: MetricField;
  dailyNetInflow: MetricField;
  cumNetInflow: MetricField;
  dailyValueTraded: MetricField;
  discountPremiumRate: MetricField;
}

interface ETFMetrics {
  totalNetAssets: MetricField;
  totalNetAssetsPercentage: MetricField;
  dailyNetInflow: MetricField;
  cumNetInflow: MetricField;
  dailyTotalValueTraded: MetricField;
  totalTokenHoldings: MetricField;
  list: ETFEntry[];
}

interface TabState {
  data: ETFMetrics | null;
  loading: boolean;
  error: string | null;
}

interface ETFPanelProps {
  coin?: string;   // primary coin, e.g. "BTC/USDT"
  coins?: string[]; // all coins in strategy, e.g. ["BTC/USDT", "ETH/USDT", "SOL/USDT"]
}

// ─── Mapping & Helpers ────────────────────────────────────────────────────────

const ETF_TYPE_MAP: Record<string, string> = {
  BTC: "us-btc-spot",
  ETH: "us-eth-spot",
};

const parseBase = (pair: string): string =>
  pair.includes("/") ? pair.split("/")[0].toUpperCase() : pair.toUpperCase();

const resolveCoins = (coin?: string, coins?: string[]): string[] => {
  const all = [...(coins ?? []), ...(coin ? [coin] : [])].map(parseBase);
  return all.filter((val, idx, self) => self.indexOf(val) === idx);
};

const fmt = (value: string, decimals = 2): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

const fmtUSD = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
};

const fmtPct = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return `${(num * 100).toFixed(4)}%`;
};

const signColor = (value: string): string => {
  const num = parseFloat(value);
  if (num > 0) return "#00e5a0";
  if (num < 0) return "#ff4d6d";
  return "#6b7280";
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ETFPanel({ coin, coins }: ETFPanelProps) {
  const [tabData, setTabData] = useState<Record<string, TabState>>({});
  const [activeTab, setActiveTab] = useState<string>("");

  const resolvedCoins = resolveCoins(coin, coins);

  const fetchForCoin = useCallback(async (symbol: string) => {
    const etfType = ETF_TYPE_MAP[symbol];
    if (!etfType) return;

    setTabData((prev) => ({
      ...prev,
      [symbol]: { ...prev[symbol], loading: true, error: null },
    }));

    try {
      const res = await fetch(
        "https://api.sosovalue.xyz/openapi/v2/etf/currentEtfDataMetrics",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-soso-api-key": process.env.NEXT_PUBLIC_SOSOVALUE_API_KEY ?? "",
          },
          body: JSON.stringify({ type: etfType }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.msg ?? "API error");

      setTabData((prev) => ({
        ...prev,
        [symbol]: { data: json.data, loading: false, error: null },
      }));
    } catch (err) {
      setTabData((prev) => ({
        ...prev,
        [symbol]: {
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed",
        },
      }));
    }
  }, []);

  useEffect(() => {
    const resolved = resolveCoins(coin, coins);
    if (resolved.length > 0 && !activeTab) {
      setActiveTab(resolved[0]);
    }
    resolved.forEach((symbol) => {
      if (ETF_TYPE_MAP[symbol] && !tabData[symbol]?.data) {
        fetchForCoin(symbol);
      }
    });
  }, [coin, coins, fetchForCoin, activeTab, tabData]);

  const currentStatus = tabData[activeTab] || {
    data: null,
    loading: false,
    error: null,
  };

  return (
    <div style={styles.panel}>
      {/* Header & Tabs */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Spot ETF Tracker</h2>
          <p style={styles.subtitle}>US Market · Live Metrics</p>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.refreshBtn} onClick={() => fetchForCoin(activeTab)}>
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {resolvedCoins.map((symbol) => {
          const hasETF = !!ETF_TYPE_MAP[symbol];
          const isActive = activeTab === symbol;
          return (
            <button
              key={symbol}
              onClick={() => setActiveTab(symbol)}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
            >
              {symbol}
              {!hasETF && <span style={styles.noEtfLabel}>no ETF</span>}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {!ETF_TYPE_MAP[activeTab] ? (
          <div style={styles.emptyState}>
            <p>No ETF data available for {activeTab}.</p>
            <p style={{ fontSize: "11px", marginTop: "4px" }}>
              US spot ETFs only exist for BTC and ETH currently.
            </p>
          </div>
        ) : currentStatus.loading && !currentStatus.data ? (
          <div style={styles.loadingWrapper}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Fetching {activeTab} ETF data…</p>
          </div>
        ) : currentStatus.error ? (
          <div style={styles.errorWrapper}>
            <span style={styles.errorIcon}>⚠</span>
            <p style={styles.errorText}>{currentStatus.error}</p>
            <button
              style={styles.retryBtn}
              onClick={() => fetchForCoin(activeTab)}
            >
              Retry
            </button>
          </div>
        ) : currentStatus.data ? (
          <>
            {/* Summary Cards */}
            <div style={styles.summaryGrid}>
              <SummaryCard
                label="Total Net Assets"
                value={fmtUSD(currentStatus.data.totalNetAssets.value)}
                sub={`${(
                  parseFloat(currentStatus.data.totalNetAssetsPercentage.value) *
                  100
                ).toFixed(2)}% of ${activeTab} supply`}
                accent="#3b82f6"
              />
              <SummaryCard
                label="Daily Net Inflow"
                value={fmtUSD(currentStatus.data.dailyNetInflow.value)}
                sub={currentStatus.data.dailyNetInflow.lastUpdateDate}
                accent={signColor(currentStatus.data.dailyNetInflow.value)}
                signed
                rawValue={currentStatus.data.dailyNetInflow.value}
              />
              <SummaryCard
                label="Cumulative Net Inflow"
                value={fmtUSD(currentStatus.data.cumNetInflow.value)}
                sub="Since inception"
                accent={signColor(currentStatus.data.cumNetInflow.value)}
                signed
                rawValue={currentStatus.data.cumNetInflow.value}
              />
              <SummaryCard
                label="Daily Volume Traded"
                value={fmtUSD(currentStatus.data.dailyTotalValueTraded.value)}
                sub={currentStatus.data.dailyTotalValueTraded.lastUpdateDate}
                accent="#f59e0b"
              />
              <SummaryCard
                label={`Total ${activeTab} Holdings`}
                value={`${fmt(currentStatus.data.totalTokenHoldings.value, 2)} ${activeTab}`}
                sub="Across all funds"
                accent="#8b5cf6"
              />
            </div>

            {/* ETF Table */}
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      "Ticker",
                      "Issuer",
                      "Fee",
                      "Net Assets",
                      "Daily Inflow",
                      "Cum. Inflow",
                      "Volume",
                      "Disc/Prem",
                    ].map((h) => (
                      <th key={h} style={styles.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentStatus.data.list.map((etf, i) => (
                    <tr
                      key={etf.id}
                      style={{
                        ...styles.tr,
                        backgroundColor:
                          i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <td style={styles.tdTicker}>{etf.ticker}</td>
                      <td style={styles.td}>{etf.institute.trim()}</td>
                      <td style={styles.td}>
                        {(parseFloat(etf.fee.value) * 100).toFixed(2)}%
                      </td>
                      <td style={styles.td}>{fmtUSD(etf.netAssets.value)}</td>
                      <td
                        style={{
                          ...styles.td,
                          color: signColor(etf.dailyNetInflow.value),
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {parseFloat(etf.dailyNetInflow.value) > 0 ? "+" : ""}
                        {fmtUSD(etf.dailyNetInflow.value)}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color: signColor(etf.cumNetInflow.value),
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {parseFloat(etf.cumNetInflow.value) > 0 ? "+" : ""}
                        {fmtUSD(etf.cumNetInflow.value)}
                      </td>
                      <td style={styles.td}>
                        {fmtUSD(etf.dailyValueTraded.value)}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color: signColor(etf.discountPremiumRate.value),
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {fmtPct(etf.discountPremiumRate.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Summary Card Sub-component ───────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  accent,
  signed,
  rawValue,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  signed?: boolean;
  rawValue?: string;
}) {
  const isPositive = rawValue ? parseFloat(rawValue) >= 0 : true;

  return (
    <div style={{ ...styles.card, borderTop: `2px solid ${accent}` }}>
      <p style={styles.cardLabel}>{label}</p>
      <p
        style={{
          ...styles.cardValue,
          color: signed ? accent : "#f1f5f9",
        }}
      >
        {signed && isPositive ? "+" : ""}
        {value}
      </p>
      <p style={styles.cardSub}>{sub}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: "#0d0d0d",
    borderRadius: "12px",
    border: "1px solid #1f1f1f",
    padding: "24px",
    fontFamily: "var(--font-mono), monospace",
    color: "#4b5563",
    width: "100%",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "-0.5px",
    textTransform: "uppercase",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: "10px",
    color: "#4b5563",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  refreshBtn: {
    background: "transparent",
    border: "1px solid #1f1f1f",
    color: "#4b5563",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "all 0.2s",
  },
  tabBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    borderBottom: "1px solid #1f1f1f",
    paddingBottom: "12px",
    overflowX: "auto",
  },
  tab: {
    background: "#111111",
    border: "1px solid #1f1f1f",
    color: "#4b5563",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  tabActive: {
    borderColor: "#facc15",
    color: "#facc15",
    background: "rgba(250, 204, 21, 0.05)",
  },
  noEtfLabel: {
    fontSize: "8px",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    border: "1px solid #1f1f1f",
    padding: "1px 4px",
    borderRadius: "4px",
  },
  content: {
    minHeight: "200px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    border: "1px dashed #1f1f1f",
    borderRadius: "12px",
    color: "#4b5563",
    fontSize: "13px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  card: {
    backgroundColor: "#111111",
    borderRadius: "8px",
    padding: "16px",
    border: "1px solid #1f1f1f",
  },
  cardLabel: {
    margin: "0 0 8px",
    fontSize: "9px",
    color: "#4b5563",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  cardValue: {
    margin: "0 0 4px",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "-0.5px",
    color: "#ffffff",
  },
  cardSub: {
    margin: 0,
    fontSize: "9px",
    color: "#374151",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #1f1f1f",
    backgroundColor: "#111111",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "11px",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    color: "#4b5563",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontSize: "9px",
    borderBottom: "1px solid #1f1f1f",
    backgroundColor: "#111111",
    whiteSpace: "nowrap",
  },
  tr: {
    transition: "background 0.15s",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #0f0f0f",
    color: "#9ca3af",
    whiteSpace: "nowrap",
  },
  tdTicker: {
    padding: "12px 16px",
    borderBottom: "1px solid #0f0f0f",
    color: "#ffffff",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  loadingWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "300px",
    gap: "16px",
    color: "#4b5563",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "2px solid #1f1f1f",
    borderTop: "2px solid #facc15",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    margin: 0,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  errorWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    gap: "12px",
    color: "#ef4444",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: "24px",
  },
  errorText: {
    margin: 0,
    fontSize: "12px",
    color: "#4b5563",
  },
  retryBtn: {
    background: "transparent",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "6px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
  },
};