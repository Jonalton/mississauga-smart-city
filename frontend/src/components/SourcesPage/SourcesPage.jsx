const S = {
  container: {
    position: 'absolute', inset: 0, background: '#f5f7fa',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    paddingLeft: 320,
  },
  header: {
    background: '#1a3a5c', color: '#fff',
    padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  },
  headerTitle: { fontSize: 18, fontWeight: 700, margin: 0 },
  headerSub: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  backBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
  },
  body: { flex: 1, overflowY: 'auto', padding: '28px 32px', maxWidth: 960, width: '100%' },
  section: { marginBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8,
    color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 6, marginBottom: 16,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14,
  },
  card: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#1a3a5c', marginBottom: 4 },
  cardMeta: { fontSize: 11, color: '#888', marginBottom: 8 },
  cardBody: { fontSize: 13, color: '#444', lineHeight: 1.55 },
  badge: (color) => ({
    display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px',
    borderRadius: 10, marginRight: 6, marginBottom: 6,
    background: color + '22', color: color, border: `1px solid ${color}44`,
  }),
  list: { paddingLeft: 18, margin: '0 0 0 0' },
  listItem: { fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 4 },
  concernBlock: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '14px 16px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  concernTitle: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 },
  pill: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 12,
    background: color + '18', color: color, border: `1px solid ${color}33`, marginRight: 6,
  }),
  connectionCard: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '14px 16px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex', gap: 12, alignItems: 'flex-start',
  },
  connectionIcon: {
    fontSize: 20, flexShrink: 0, width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f0f6ff', borderRadius: 8,
  },
  connectionText: { flex: 1 },
  connectionTitle: { fontSize: 13, fontWeight: 700, color: '#1a3a5c', marginBottom: 3 },
  connectionDesc: { fontSize: 13, color: '#555', lineHeight: 1.5 },
  sourceTags: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  assumptionRow: {
    display: 'flex', gap: 10, padding: '10px 0',
    borderBottom: '1px solid #f0f0f0', alignItems: 'flex-start',
  },
  assumptionIcon: { fontSize: 14, flexShrink: 0, marginTop: 1 },
  assumptionText: { fontSize: 13, color: '#444', lineHeight: 1.55 },
}

const SOURCES = [
  {
    name: 'City WiFi Locations',
    service: 'WiFi / FeatureServer/0',
    count: '50 points',
    color: '#0079c1',
    usedFor: 'Mapped as WiFi asset markers. Included in equity score calculation (asset_per_1k_residents). Forms part of digital access coverage analysis.',
    tags: ['Assets Map', 'Equity Score'],
  },
  {
    name: 'Traffic Signals (ATMS)',
    service: 'TrafficSignals_ATMS / FeatureServer/0',
    count: '803 points',
    color: '#e67e22',
    usedFor: 'Mapped as traffic signal markers. Contributes to total asset count per ward. Gap flag raised if a ward has zero traffic signals.',
    tags: ['Assets Map', 'Equity Score', 'Gap Flags'],
  },
  {
    name: 'MiWay Transit Stops',
    service: 'MiWay_Transit_Stop / FeatureServer/0',
    count: '3,323 points',
    color: '#1abc9c',
    usedFor: 'Mapped as transit stop markers. Largest contributor to asset counts. Accessibility flag (stp_access) tracked per stop. Gap flag raised if a ward has zero transit stops.',
    tags: ['Assets Map', 'Equity Score', 'Gap Flags'],
  },
  {
    name: 'Ward Boundaries',
    service: 'Ward_Boundaries / FeatureServer/2',
    count: '11 polygons',
    color: '#1a3a5c',
    usedFor: 'Choropleth fill showing equity score per ward. Boundary outlines and ward number labels on map. Spatial join container for all asset-to-ward attribution.',
    tags: ['Choropleth', 'Spatial Join', 'Labels'],
  },
  {
    name: '2016 Ward Census',
    service: 'Ward_2016Census / FeatureServer/0',
    count: '11 records',
    color: '#9b59b6',
    usedFor: 'Provides population per ward. Used to normalize asset counts (assets per 1,000 residents). Basis for the equity score and ward-level gap flags.',
    tags: ['Equity Score', 'Population Denominator'],
  },
  {
    name: '2016 Neighbourhood Census',
    service: '2016_Census_Data_By_Neighbourhoods_Shape_File / FeatureServer/0',
    count: '43 polygons',
    color: '#e74c3c',
    usedFor: 'Population density choropleth layer (YlOrRd scale, persons/km²). Popup shows: population, density, median income, transit/drive commute %, visible minority %, low income count and rate.',
    tags: ['Density Choropleth', 'Demographic Popup'],
  },
]

const ASSUMPTIONS = [
  { icon: '📅', text: '2016 census data is used as the current demographic baseline. No 2021 neighbourhood-level shapefile was available in the Mississauga ArcGIS org at time of development.' },
  { icon: '✅', text: 'A traffic signal with STATUS = "OPEN" is treated as active and functional. Signals under maintenance or fault states are not distinguished.' },
  { icon: '🚌', text: 'A transit stop is treated as accessible if the stp_access field is populated with an affirmative value. The exact field encoding is not documented in the service metadata.' },
  { icon: '📐', text: 'Neighbourhood area (km²) is computed by re-projecting GeoJSON polygon geometry to UTM Zone 17N (EPSG:32617) before calculating area. This matches the projection used for ward areas and is accurate for Ontario.' },
  { icon: '⚖️', text: 'The equity score is a relative rank (normalized 0–100 within the 11 Mississauga wards). A score of 100 means best-covered ward, 0 means worst — it is not an absolute measure of service adequacy.' },
  { icon: '🌐', text: 'WiFi locations represent officially listed public hotspots. Temporary or event-based WiFi deployments and private networks are not captured.' },
  { icon: '🗺️', text: 'Ward boundaries reflect the post-2018 Mississauga ward redistribution (11 wards). Boundary changes between 2016 and 2018 mean census and asset data are not perfectly co-registered.' },
  { icon: '🔄', text: 'Data refreshes once daily via Cloud Scheduler. All asset counts, equity scores, and demographic values reflect the most recent pipeline run, not real-time conditions.' },
]

const RESTRICTIONS = [
  { label: 'Census Age', text: '2016 data is 8–10 years old. Income levels, commute patterns, and demographic composition have shifted — especially post-COVID.' },
  { label: 'MiWay Only', text: 'Transit stops cover MiWay bus routes only. GO Transit, Hazel McCallion LRT, and regional connections are excluded.' },
  { label: 'No Real-Time Data', text: 'No live feeds. WiFi uptime, signal fault states, and bus stop closures are not reflected.' },
  { label: 'No Crime Data', text: 'Peel Regional Police has no public API. Only PDF annual reports are published — machine-readable incident data is not available.' },
  { label: 'No Air Quality', text: 'Despite the asset registry listing air quality sensors, no usable public service with spatial sensor readings was found in the Mississauga ArcGIS org.' },
  { label: 'Pagination Cap', text: 'ArcGIS Feature Service queries are capped at 2,000 records per request. The fetcher paginates automatically, but services may silently omit features beyond their configured max record count.' },
  { label: 'No Signal Timing', text: 'Traffic signal data provides location and status only — no cycle timing, congestion metrics, or incident history.' },
  { label: 'No Ridership', text: 'Transit stop data includes location and accessibility flags but no ridership counts, service frequency, or real-time arrival information.' },
]

const CONCERNS = [
  {
    source: 'WiFi',
    color: '#0079c1',
    items: [
      'Only 50 hotspots serve a city of 717,000 — roughly 1 hotspot per 14,000 residents.',
      'Coverage is concentrated in central and older wards. Newer suburban areas (Wards 9–11) have noticeably fewer hotspots.',
      'No uptime or signal strength data. A listed location may be non-functional.',
      'Hotspots at libraries and arenas are only accessible during operating hours — "always-on" outdoor coverage is minimal.',
    ],
  },
  {
    source: 'Traffic Signals',
    color: '#e67e22',
    items: [
      '803 signals from the ATMS network may not represent all signalized intersections — older signals not connected to the management system may be absent.',
      'STATUS = "OPEN" does not distinguish active, recently installed, or decommissioned signals.',
      'No pedestrian signal or crossing data is attached. Walkability analysis is not possible from this source alone.',
      'Signal density skews toward arterial roads in central wards, which may over-represent infrastructure investment there.',
    ],
  },
  {
    source: 'Transit Stops',
    color: '#1abc9c',
    items: [
      '3,323 stops at face value suggests strong coverage, but stop density does not reflect frequency, reliability, or span of service hours.',
      'The accessibility field (stp_access) encoding is undocumented — "accessible" vs "limited" classification is inferred from field values.',
      'Many stops in low-income and high-visible-minority neighbourhoods may have low service frequency despite being counted as present.',
      'No shelter, bench, or real-time display data is available — physical stop quality cannot be assessed.',
    ],
  },
  {
    source: 'Neighbourhood Census',
    color: '#e74c3c',
    items: [
      '"Visible minority" uses Statistics Canada\'s 2016 classification methodology, which has since been revised in 2021 — comparisons to newer data require care.',
      'Low income rate uses LIM-AT (Low Income Measure, After Tax) — one of several measures. LICO-AT and MBM measures would yield different rates.',
      'Drive commute % is from 2016 commuting data. Remote work adoption since 2020 has materially altered travel patterns.',
      '43 neighbourhood polygons do not align cleanly with 11 ward boundaries. Some neighbourhoods straddle ward lines, making cross-layer comparisons approximate.',
      'Malton CN stands out as a high-concern neighbourhood: 80.7% visible minority, 37.6% low income rate, $21,427 median income, 7,493 persons/km² density.',
    ],
  },
]

const CONNECTIONS = [
  {
    icon: '📶',
    title: 'Digital Divide Mapping',
    desc: 'Overlay WiFi hotspot density against median income and visible minority % per neighbourhood. Identify specific areas where low digital infrastructure access compounds socioeconomic disadvantage.',
    tags: ['WiFi', 'Neighbourhood Census'],
  },
  {
    icon: '🚌',
    title: 'Transit Equity Gap',
    desc: 'Compare transit stop count per ward against low-income resident concentration. Wards with high poverty rates and low stop density signal where MiWay service expansion would have the greatest equity impact.',
    tags: ['Transit Stops', 'Neighbourhood Census', 'Ward Census'],
  },
  {
    icon: '🚗',
    title: 'Car Dependency vs. Infrastructure Investment',
    desc: 'Cross-reference drive commute % (neighbourhood) with traffic signal density (ward). High car-dependency combined with dense signal infrastructure may indicate road-prioritised planning at the expense of transit.',
    tags: ['Traffic Signals', 'Neighbourhood Census'],
  },
  {
    icon: '♿',
    title: 'Accessible Transit Coverage',
    desc: 'Map accessible vs. non-accessible stops against neighbourhoods with high elderly population (Pop_65+) or high visible minority %. Flag wards where AODA-compliant stop density is below the city average.',
    tags: ['Transit Stops', 'Neighbourhood Census'],
  },
  {
    icon: '📊',
    title: 'Equity Score vs. Median Income',
    desc: 'Plot ward equity score (asset coverage) against ward median income. A positive correlation would indicate that infrastructure investment tracks existing wealth — a systemic equity concern.',
    tags: ['WiFi', 'Traffic Signals', 'Transit Stops', 'Ward Census'],
  },
  {
    icon: '🏙️',
    title: 'Development Pressure vs. Transit Supply',
    desc: 'Active development applications (209 currently tracked) cluster in specific wards. Overlay against transit stop density to identify wards absorbing population growth without proportional transit investment.',
    tags: ['Transit Stops', 'Development Applications'],
  },
  {
    icon: '🌡️',
    title: 'Dense Neighbourhoods and Smart Infrastructure',
    desc: 'High-density neighbourhoods (>5,000 ppl/km²) generate more demand for public WiFi, efficient traffic signals, and frequent transit. Compare infrastructure counts in dense vs. sparse neighbourhoods.',
    tags: ['WiFi', 'Traffic Signals', 'Neighbourhood Census'],
  },
  {
    icon: '🔴',
    title: 'Compound Vulnerability Index',
    desc: 'Combine low income rate + low transit accessibility + no public WiFi per neighbourhood into a single vulnerability score. This composite would highlight where multiple infrastructure gaps co-occur.',
    tags: ['WiFi', 'Transit Stops', 'Neighbourhood Census'],
  },
]

export default function SourcesPage({ onClose }) {
  return (
    <div style={S.container}>
      <div style={S.header}>
        <div>
          <h1 style={S.headerTitle}>Data Sources & Methodology</h1>
          <p style={{ ...S.headerSub, margin: '3px 0 0' }}>
            All data from City of Mississauga Open Data (data.mississauga.ca) via ArcGIS Hub
          </p>
        </div>
        <button style={S.backBtn} onClick={onClose}>← Back to Map</button>
      </div>

      <div style={S.body}>

        {/* DATA SOURCES */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Data Sources</h2>
          <div style={S.grid}>
            {SOURCES.map((src) => (
              <div key={src.name} style={{ ...S.card, borderTop: `3px solid ${src.color}` }}>
                <div style={S.cardTitle}>{src.name}</div>
                <div style={S.cardMeta}>{src.service} — {src.count}</div>
                <div style={S.cardBody}>{src.usedFor}</div>
                <div style={{ marginTop: 10 }}>
                  {src.tags.map((t) => (
                    <span key={t} style={S.badge(src.color)}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ASSUMPTIONS */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Development Assumptions</h2>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {ASSUMPTIONS.map((a, i) => (
              <div key={i} style={{ ...S.assumptionRow, borderBottom: i < ASSUMPTIONS.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <span style={S.assumptionIcon}>{a.icon}</span>
                <span style={S.assumptionText}>{a.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RESTRICTIONS */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Data Restrictions & Limitations</h2>
          <div style={S.grid}>
            {RESTRICTIONS.map((r) => (
              <div key={r.label} style={S.card}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>{r.label}</div>
                <div style={S.cardBody}>{r.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CONCERNS */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Points of Concern by Source</h2>
          {CONCERNS.map((c) => (
            <div key={c.source} style={S.concernBlock}>
              <div style={S.concernTitle}>
                <span style={S.pill(c.color)}>{c.source}</span>
              </div>
              <ul style={S.list}>
                {c.items.map((item, i) => (
                  <li key={i} style={S.listItem}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CONNECTIONS */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Potential Connections & Analysis Opportunities</h2>
          {CONNECTIONS.map((c) => (
            <div key={c.title} style={S.connectionCard}>
              <div style={S.connectionIcon}>{c.icon}</div>
              <div style={S.connectionText}>
                <div style={S.connectionTitle}>{c.title}</div>
                <div style={S.connectionDesc}>{c.desc}</div>
                <div style={S.sourceTags}>
                  {c.tags.map((t) => (
                    <span key={t} style={{ fontSize: 10, background: '#f0f6ff', color: '#1a3a5c', padding: '2px 8px', borderRadius: 10, border: '1px solid #c7ddf5' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0 32px' }}>
          <button
            style={{
              background: '#1a3a5c', color: '#fff', border: 'none',
              padding: '11px 32px', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
            onClick={onClose}
          >
            ← Back to Map
          </button>
        </div>

      </div>
    </div>
  )
}
