"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ─── Currency ID Map ──────────────────────────────────────────────────────────
// Built from the real SoSoValue coin list response.
// Key = base symbol (uppercase), Value = SoSoValue currencyId

const CURRENCY_ID_MAP: Record<string, string> = {
  BTC: "1673723677362319866",
  ETH: "1673723677362319867",
  USDT: "1673723677362319868",
  BNB: "1673723677362319869",
  USDC: "1673723677362319870",
  XRP: "1673723677362319871",
  STETH: "1673723677362319872",
  ADA: "1673723677362319873",
  DOGE: "1673723677362319874",
  SOL: "1673723677362319875",
  LTC: "1673723677362319876",
  DOT: "1673723677362319877",
  DAI: "1673723677362319879",
  SHIB: "1673723677362319881",
  WBTC: "1673723677362319882",
  AVAX: "1673723677362319883",
  UNI: "1673723677362319884",
  LINK: "1673723677362319887",
  ATOM: "1673723677362319888",
  ETC: "1673723677362319889",
  XLM: "1673723677362319890",
  NEAR: "1673723677362319891",
  ALGO: "1673723677362319892",
  BCH: "1673723677362319893",
  FIL: "1673723677362319894",
  ICP: "1673723677362319895",
  VET: "1673723677362319896",
  LDO: "1673723677362319897",
  HBAR: "1673723677362319898",
  QNT: "1673723677362319899",
  APT: "1673723677362319900",
  ARB: "1673723677362319901",
  OP: "1673723677362319902",
  MKR: "1673723677362319903",
  AAVE: "1673723677362319904",
  GRT: "1673723677362319905",
  SNX: "1673723677362319906",
  SUI: "1673723677362319907",
  TRX: "1673723677362319908",
  MATIC: "1673723677362319909",
  TON: "1673723677362319910",
  INJ: "1673723677362319911",
  FTM: "1673723677362319912",
  PEPE: "1673723677362319913",
  WIF: "1673723677362319914",
  JUP: "1673723677362319915",
  SEI: "1673723677362319916",
  TIA: "1673723677362319917",
  PYTH: "1673723677362319918",
};

// ─── Category Labels ──────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<number, string> = {
  1: "News",
  2: "Research",
  3: "Institution",
  4: "Insights",
  5: "Macro",
  6: "Macro Research",
  7: "Tweet",
  9: "Price Alert",
  10: "On-Chain",
};

const CATEGORY_COLOR: Record<number, string> = {
  1: "#3b82f6",
  2: "#8b5cf6",
  3: "#f59e0b",
  4: "#10b981",
  5: "#ef4444",
  6: "#ec4899",
  7: "#06b6d4",
  9: "#f97316",
  10: "#84cc16",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface MultiLangContent {
  language: string;
  title: string | null;
  content: string;
}

interface MediaInfo {
  sosoUrl: string;
  originalUrl: string;
  shortUrl?: string;
  type: "photo" | "video" | "gif";
}

interface MatchedCurrency {
  id: string;
  fullName: string;
  name: string;
}

interface QuoteInfo {
  multilanguageContent: MultiLangContent[];
  impressionCount: number;
  likeCount: number;
  replyCount: number;
  retweetCount: number;
  createdAt: number;
  mediaInfo: MediaInfo[] | null;
  originalUrl: string;
  authorAvatarUrl: string;
  author: string;
  nickName: string;
  isBlueVerified: number;
  verifiedType: string;
}

interface NewsItem {
  id: string;
  sourceLink: string;
  releaseTime: number;
  author: string;
  nickName: string;
  isBlueVerified: number;
  verifiedType: string;
  authorDescription: string | null;
  authorAvatarUrl: string;
  category: number;
  featureImage: string;
  matchedCurrencies: MatchedCurrency[];
  tags: string[];
  multilanguageContent: MultiLangContent[];
  mediaInfo: MediaInfo[] | null;
  quoteInfo: QuoteInfo | null;
}

interface NewsPanelProps {
  coin?: string;
  coins?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseBase = (pair: string): string =>
  pair.includes("/") ? pair.split("/")[0].toUpperCase() : pair.toUpperCase();

const getEnglishContent = (items: MultiLangContent[]): MultiLangContent | null =>
  items.find((c) => c.language === "en") ?? items[0] ?? null;

const formatTime = (ms: number): string => {
  const now = Date.now();
  const diff = now - ms;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const fmtCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewsPanel({ coin, coins }: NewsPanelProps) {
  const allCoins = Array.from(
    new Set([...(coins ?? []), ...(coin ? [coin] : [])].map(parseBase))
  );
  const primaryCoin = allCoins[0] ?? "BTC";

  const [activeTab, setActiveTab] = useState(primaryCoin);
  const [newsMap, setNewsMap] = useState<Record<string, NewsItem[]>>({});
  const [pageMap, setPageMap] = useState<Record<string, number>>({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchNews = useCallback(
    async (symbol: string, page = 1, append = false) => {
      const currencyId = CURRENCY_ID_MAP[symbol];
      if (!currencyId) {
        setErrorMap((p) => ({ ...p, [symbol]: `No news feed found for ${symbol}` }));
        return;
      }

      setLoadingMap((p) => ({ ...p, [symbol]: true }));
      setErrorMap((p) => ({ ...p, [symbol]: null }));

      try {
        const params = new URLSearchParams({
          currencyId,
          pageNum: String(page),
          pageSize: "15",
          categoryList: "1,2,4,5,7,10",
        });

        const res = await fetch(
          `https://openapi.sosovalue.com/api/v1/news/featured/currency?${params}`,
          {
            headers: {
              "x-soso-api-key": process.env.NEXT_PUBLIC_SOSOVALUE_API_KEY ?? "",
            },
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.code !== 0) throw new Error(json.msg ?? "API error");

        const incoming: NewsItem[] = json.data.list ?? [];
        const totalPages = Number(json.data.totalPage ?? 1);

        setNewsMap((p) => ({
          ...p,
          [symbol]: append ? [...(p[symbol] ?? []), ...incoming] : incoming,
        }));
        setPageMap((p) => ({ ...p, [symbol]: page }));
        setHasMoreMap((p) => ({ ...p, [symbol]: page < totalPages }));
      } catch (err: unknown) {
        setErrorMap((p) => ({
          ...p,
          [symbol]: err instanceof Error ? err.message : "Failed to load news",
        }));
      } finally {
        setLoadingMap((p) => ({ ...p, [symbol]: false }));
      }
    },
    []
  );

  // Initial fetch for all coins
  useEffect(() => {
    allCoins.forEach((sym) => {
      if (!newsMap[sym]) fetchNews(sym, 1, false);
    });
    if (!allCoins.includes(activeTab) && allCoins.length > 0) {
      setActiveTab(allCoins[0]);
    }
  }, [coin, coins]);

  // Infinite scroll observer
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreMap[activeTab] &&
          !loadingMap[activeTab]
        ) {
          fetchNews(activeTab, (pageMap[activeTab] ?? 1) + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activeTab, hasMoreMap, loadingMap, pageMap, fetchNews]);

  const activeNews = newsMap[activeTab] ?? [];
  const isLoading = loadingMap[activeTab];
  const error = errorMap[activeTab];

  return (
    <>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Market News</h2>
            <p style={s.subtitle}>Live Feed · SoSoValue</p>
          </div>
          <button
            style={s.refreshBtn}
            onClick={() => fetchNews(activeTab, 1, false)}
            disabled={isLoading}
          >
            ↺
          </button>
        </div>

        {/* Tabs */}
        {allCoins.length > 1 && (
          <div style={s.tabBar}>
            {allCoins.map((sym) => (
              <button
                key={sym}
                style={{ ...s.tab, ...(sym === activeTab ? s.tabActive : {}) }}
                onClick={() => {
                  setActiveTab(sym);
                  if (!newsMap[sym]) fetchNews(sym, 1, false);
                }}
              >
                {sym}
                {!CURRENCY_ID_MAP[sym] && <span style={s.noDataBadge}>?</span>}
              </button>
            ))}
          </div>
        )}

        {/* Feed */}
        <div style={s.feed}>
          {error && !isLoading && activeNews.length === 0 ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: 28 }}>⚠</span>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>{error}</p>
              <button style={s.retryBtn} onClick={() => fetchNews(activeTab, 1, false)}>
                Retry
              </button>
            </div>
          ) : activeNews.length === 0 && isLoading ? (
            <SkeletonFeed />
          ) : (
            <>
              {activeNews.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={loaderRef} style={{ height: 1 }} />

              {isLoading && activeNews.length > 0 && (
                <div style={s.loadMore}>
                  <span style={s.dot} />
                  <span style={s.dot} />
                  <span style={s.dot} />
                </div>
              )}

              {!hasMoreMap[activeTab] && activeNews.length > 0 && (
                <p style={s.endLabel}>— End of feed —</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expandable Drawer */}
      {selectedItem && (
        <NewsDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        .news-card:hover { background: rgba(255,255,255,0.04) !important; }
        .news-card:hover .read-more { opacity: 1 !important; }
      `}</style>
    </>
  );
}

// ─── News Card ────────────────────────────────────────────────────────────────

function NewsCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  const content = getEnglishContent(item.multilanguageContent);
  const catColor = CATEGORY_COLOR[item.category] ?? "#64748b";
  const catLabel = CATEGORY_LABEL[item.category] ?? "News";

  // Strip HTML tags for preview
  const plainText = content?.content
    ?.replace(/<img[^>]*>/gi, "")
    ?.replace(/<[^>]+>/g, "")
    ?.trim() ?? "";

  const hasImage = item.featureImage || item.mediaInfo?.[0]?.sosoUrl;

  return (
    <div
      className="news-card"
      style={s.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div style={s.cardInner}>
        {/* Left: content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meta row */}
          <div style={s.cardMeta}>
            <span style={{ ...s.catBadge, background: `${catColor}22`, color: catColor }}>
              {catLabel}
            </span>
            <div style={s.authorRow}>
              {item.authorAvatarUrl && (
                <img
                  src={item.authorAvatarUrl}
                  alt={item.author}
                  style={s.avatarSm}
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              )}
              <span style={s.authorName}>{item.nickName || item.author}</span>
              {item.isBlueVerified === 1 && <span style={s.verified}>✓</span>}
            </div>
            <span style={s.timestamp}>{formatTime(item.releaseTime)}</span>
          </div>

          {/* Content preview */}
          <p style={s.cardPreview}>{plainText || "View full article →"}</p>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div style={s.tagRow}>
              {item.tags.slice(0, 4).map((t) => (
                <span key={t} style={s.tag}>#{t}</span>
              ))}
            </div>
          )}

          {/* Quote indicator */}
          {item.quoteInfo && (
            <div style={s.quoteIndicator}>
              <span style={{ opacity: 0.5, fontSize: 11 }}>💬</span>
              <span style={{ fontSize: 11, color: "#475569" }}>
                {fmtCount(item.quoteInfo.impressionCount)} views ·{" "}
                {fmtCount(item.quoteInfo.likeCount)} likes
              </span>
            </div>
          )}
        </div>

        {/* Right: thumbnail */}
        {hasImage && (
          <img
            src={(item.featureImage || item.mediaInfo![0].sosoUrl) as string}
            alt=""
            style={s.thumbnail}
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}
      </div>

      <span
        className="read-more"
        style={{
          fontSize: 11,
          color: "#3b82f6",
          marginTop: 8,
          display: "block",
          opacity: 0,
          transition: "opacity 0.2s",
        }}
      >
        Read full article ↗
      </span>
    </div>
  );
}

// ─── News Drawer ──────────────────────────────────────────────────────────────

function NewsDrawer({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const content = getEnglishContent(item.multilanguageContent);
  const quoteContent = item.quoteInfo
    ? getEnglishContent(item.quoteInfo.multilanguageContent)
    : null;
  const catColor = CATEGORY_COLOR[item.category] ?? "#64748b";
  const catLabel = CATEGORY_LABEL[item.category] ?? "News";

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={s.backdrop} onClick={handleBackdrop}>
      <div style={s.drawer}>
        {/* Drawer Header */}
        <div style={s.drawerHeader}>
          <div style={s.drawerMeta}>
            <span style={{ ...s.catBadge, background: `${catColor}22`, color: catColor, fontSize: 12 }}>
              {catLabel}
            </span>
            <span style={{ fontSize: 12, color: "#475569" }}>
              {new Date(item.releaseTime).toLocaleString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Scrollable body */}
        <div style={s.drawerBody}>
          {/* Author */}
          <div style={s.drawerAuthor}>
            {item.authorAvatarUrl && (
              <img
                src={item.authorAvatarUrl}
                alt={item.author}
                style={s.avatarLg}
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            )}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={s.authorNameLg}>{item.nickName || item.author}</span>
                {item.isBlueVerified === 1 && (
                  <span style={{ ...s.verified, fontSize: 14 }}>✓</span>
                )}
                {item.verifiedType === "Business" && (
                  <span style={s.goldBadge}>🏢</span>
                )}
              </div>
              {item.authorDescription && (
                <p style={s.authorDesc}>{item.authorDescription}</p>
              )}
            </div>
          </div>

          {/* Main HTML Content */}
          {content && (
            <div
              style={s.htmlContent}
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          )}

          {/* Media gallery */}
          {item.mediaInfo && item.mediaInfo.length > 0 && (
            <div style={s.mediaGallery}>
              {item.mediaInfo.map((m, i) => (
                m.type === "photo" ? (
                  <img
                    key={i}
                    src={m.sosoUrl || m.originalUrl}
                    alt=""
                    style={s.mediaImg}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                ) : m.type === "video" ? (
                  <video key={i} src={m.sosoUrl} controls style={s.mediaImg} />
                ) : null
              ))}
            </div>
          )}

          {/* Matched Currencies */}
          {item.matchedCurrencies?.length > 0 && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Related Assets</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {item.matchedCurrencies.map((c) => (
                  <span key={c.id} style={s.coinBadge}>
                    {c.name} <span style={{ opacity: 0.5, fontSize: 11 }}>{c.fullName}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Tags</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {item.tags.map((t) => (
                  <span key={t} style={s.tag}>#{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quote Tweet Block */}
          {item.quoteInfo && (
            <div style={s.quoteBlock}>
              <div style={s.quoteBlockHeader}>
                {item.quoteInfo.authorAvatarUrl && (
                  <img
                    src={item.quoteInfo.authorAvatarUrl}
                    alt={item.quoteInfo.author}
                    style={s.avatarSm}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                )}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                      {item.quoteInfo.nickName || item.quoteInfo.author}
                    </span>
                    {item.quoteInfo.isBlueVerified === 1 && (
                      <span style={s.verified}>✓</span>
                    )}
                    {item.quoteInfo.verifiedType === "Business" && (
                      <span style={s.goldBadge}>🏢</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "#475569" }}>
                    @{item.quoteInfo.author} ·{" "}
                    {formatTime(item.quoteInfo.createdAt)}
                  </span>
                </div>
              </div>

              {quoteContent && (
                <p style={s.quoteText}>{quoteContent.content}</p>
              )}

              {/* Quote media */}
              {item.quoteInfo.mediaInfo?.map((m, i) =>
                m.type === "photo" && (m.sosoUrl || m.originalUrl) ? (
                  <img
                    key={i}
                    src={m.sosoUrl || m.originalUrl}
                    alt=""
                    style={{ ...s.mediaImg, marginTop: 8 }}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                ) : null
              )}

              {/* Engagement metrics */}
              <div style={s.engagementRow}>
                <span style={s.engStat}>
                  👁 {fmtCount(item.quoteInfo.impressionCount)}
                </span>
                <span style={s.engStat}>
                  ❤️ {fmtCount(item.quoteInfo.likeCount)}
                </span>
                <span style={s.engStat}>
                  🔁 {fmtCount(item.quoteInfo.retweetCount)}
                </span>
                <span style={s.engStat}>
                  💬 {fmtCount(item.quoteInfo.replyCount)}
                </span>
                {item.quoteInfo.originalUrl && (
                  <a
                    href={item.quoteInfo.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={s.tweetLink}
                  >
                    View on X ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Source link */}
          <a
            href={item.sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            style={s.sourceLink}
          >
            View on SoSoValue ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonFeed() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ ...s.card, animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1e293b" }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, background: "#1e293b", borderRadius: 4, marginBottom: 6, width: "40%" }} />
              <div style={{ height: 8, background: "#1e293b", borderRadius: 4, width: "20%" }} />
            </div>
          </div>
          <div style={{ height: 10, background: "#1e293b", borderRadius: 4, marginBottom: 6 }} />
          <div style={{ height: 10, background: "#1e293b", borderRadius: 4, width: "80%" }} />
        </div>
      ))}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: "#0d1117",
    borderRadius: 12,
    border: "1px solid #1e293b",
    padding: 20,
    fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
    color: "#cbd5e1",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 400,
    maxHeight: 720,
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "3px 0 0",
    fontSize: 11,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  refreshBtn: {
    background: "transparent",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    width: 32,
    height: 32,
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tabBar: {
    display: "flex",
    gap: 6,
    marginBottom: 14,
    flexShrink: 0,
    flexWrap: "wrap",
  },
  tab: {
    background: "transparent",
    border: "1px solid #1e293b",
    color: "#64748b",
    padding: "4px 12px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "all 0.15s",
  },
  tabActive: {
    background: "#1e293b",
    color: "#f1f5f9",
    borderColor: "#334155",
  },
  noDataBadge: {
    fontSize: 9,
    background: "#451a03",
    color: "#f97316",
    padding: "1px 4px",
    borderRadius: 3,
  },
  feed: {
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    paddingRight: 4,
  },
  card: {
    padding: "12px 14px",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 0.15s",
    borderBottom: "1px solid #0f172a",
    animation: "fadeUp 0.3s ease both",
  },
  cardInner: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 7,
    flexWrap: "wrap",
  },
  catBadge: {
    fontSize: 10,
    padding: "2px 7px",
    borderRadius: 4,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    flexShrink: 0,
  },
  authorRow: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  avatarSm: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    objectFit: "cover",
  },
  authorName: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 500,
  },
  verified: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: 700,
  },
  goldBadge: {
    fontSize: 11,
  },
  timestamp: {
    fontSize: 11,
    color: "#475569",
    marginLeft: "auto",
  },
  cardPreview: {
    margin: "0 0 8px",
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 1.55,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  tagRow: {
    display: "flex",
    gap: 5,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  tag: {
    fontSize: 10,
    color: "#475569",
    background: "#0f172a",
    padding: "2px 6px",
    borderRadius: 4,
  },
  quoteIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 6,
    objectFit: "cover",
    flexShrink: 0,
  },
  loadMore: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    padding: "16px 0",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#334155",
    display: "inline-block",
    animation: "pulse 1s ease-in-out infinite",
  },
  endLabel: {
    textAlign: "center",
    fontSize: 11,
    color: "#334155",
    padding: "12px 0",
    margin: 0,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 12,
    padding: 40,
    color: "#475569",
    textAlign: "center",
  },
  retryBtn: {
    background: "transparent",
    border: "1px solid #ff4d6d",
    color: "#ff4d6d",
    padding: "6px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "inherit",
  },

  // ── Drawer ──────────────────────────────────────────────────────────────────
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "flex-end",
  },
  drawer: {
    width: "min(580px, 100vw)",
    height: "100vh",
    background: "#0d1117",
    borderLeft: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
    fontFamily: "'DM Mono', 'Fira Code', monospace",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #1e293b",
    flexShrink: 0,
  },
  drawerMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  closeBtn: {
    background: "transparent",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    width: 32,
    height: 32,
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerBody: {
    overflowY: "auto",
    flex: 1,
    padding: "20px 24px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  drawerAuthor: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarLg: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: "2px solid #1e293b",
  },
  authorNameLg: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f1f5f9",
  },
  authorDesc: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#475569",
    lineHeight: 1.4,
  },
  htmlContent: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#cbd5e1",
    wordBreak: "break-word",
  },
  mediaGallery: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  mediaImg: {
    width: "100%",
    borderRadius: 8,
    objectFit: "cover",
    maxHeight: 400,
    border: "1px solid #1e293b",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionLabel: {
    margin: 0,
    fontSize: 10,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  coinBadge: {
    fontSize: 12,
    background: "#0f172a",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    padding: "4px 10px",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  quoteBlock: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  quoteBlockHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  quoteText: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#cbd5e1",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  engagementRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    paddingTop: 8,
    borderTop: "1px solid #1e293b",
  },
  engStat: {
    fontSize: 12,
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  tweetLink: {
    fontSize: 12,
    color: "#3b82f6",
    marginLeft: "auto",
    textDecoration: "none",
  },
  sourceLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 13,
    color: "#3b82f6",
    textDecoration: "none",
    border: "1px solid #1e293b",
    padding: "8px 16px",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
};