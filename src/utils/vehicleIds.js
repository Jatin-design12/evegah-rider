// Shared vehicle ID options.
// Vehicle IDs are stored as display strings (do not force normalization here);
// consumers can normalize for search/compare when needed.

const normalizeForSearch = (value) =>
  String(value || "")
    .replace(/[^a-z0-9]+/gi, "")
    .toUpperCase();

export const VEHICLE_ID_GROUPS = [
  {
    label: "Paddle Cycle",
    ids: [
      "PC 01-A",
      "PC 02-A",
      "PC 03-A",
      "PC 04-A",
      "PC 05-A",
      "PC 06-A",
      "PC 07-A",
      "PC 08-A",
      "PC 09-A",
      "PC 10-A",
      "PC 11-A",
      "PC 12-A",
      "PC 13-A",
      "PC 14-A",
      "PC 01-D",
      "PC 02-D",
      "PC 03-D",
      "PC 04-D",
      "PC 05-D",
      "PC 06-D",
      "PC 07-D",
      "PC 08-D",
      "PC 09-D",
      "PC 10-D",
      "PC 11-D",
      "PC 12-D",
    ],
  },
  {
    label: "Electric Cycle",
    ids: [
      "EC 01-A",
      "EC 02-A",
      "EC 03-A",
      "EC 04-A",
      "EC 05-A",
      "EC 06-A",
      "EC 01-D",
      "EC 02-D",
      "EC 03-D",
      "EC 04-D",
      "EC 05-D",
      "EC 06-D",
    ],
  },
  {
    label: "EV Kick Scooter",
    ids: [
      "KS 001-A",
      "KS 002-A",
      "KS 003-A",
      "KS 004-A",
      "KS 001-D",
      "KS 002-D",
    ],
  },
  {
    label: "Kids EV Car",
    ids: ["TC 01-A", "TC 02-A", "TC 01-D", "TC 02-D"],
  },
  {
    label: "Kids Paddle Scooter",
    ids: ["PS 01-A", "PS 02-A"],
  },
  {
    label: "Double Seat Cycle",
    ids: ["DS 01-A", "DS 02-A"],
  },
  {
    label: "MINK",
    ids: [
      "EVM1024002",
      "EVM1024003",
      "EVM1024004",
      "EVM1024005",
      "EVM1024006",
      "EVM1024009",
      "EVM1024010",
      "EVM1024011",
      "EVM1024012",
      "EVM1024014",
      "EVM1024016",
      "EVM1024017",
      "EVM1024018",
      "EVM1024019",
      "EVM1024020",
      "EVM1024021",
      "EVM1024022",
      "EVM1024023",
      "EVM1025029",
      "EVM1025030",
      "EVM1025031",
      "EVM1025032",
      "EVM1025033",
      "EVM1025034",
      "EVM1025035",
      "EVM1025036",
      "EVM1025037",
      "EVM1025038",
      "EVM1024001",
      "EVM1025026",
      "EVM1025027",
      "EVM1025028",
    ],
  },
  {
    label: "CITY",
    ids: [
      "EVM2025001",
      "EVM2025002",
      "EVM2025004",
      "EVM2025005",
      "EVM2025006",
    ],
  },
  {
    label: "KING",
    ids: ["EVM2025007", "EVM2025008", "EVM2025009"],
  },
];

export const VEHICLE_MODEL_OPTIONS = VEHICLE_ID_GROUPS.map((g) => g.label);

export const flattenVehicleIdGroups = (groups) => {
  const out = [];
  const seen = new Set();
  for (const group of Array.isArray(groups) ? groups : []) {
    for (const id of Array.isArray(group?.ids) ? group.ids : []) {
      const key = normalizeForSearch(id);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(id);
    }
  }
  return out;
};

// Backwards-compatible flat options list.
export const VEHICLE_ID_OPTIONS = flattenVehicleIdGroups(VEHICLE_ID_GROUPS);

export const getVehicleIdGroupsForModel = (model) => {
  const m = String(model || "").trim();
  if (!m) return VEHICLE_ID_GROUPS;

  const mKey = normalizeForSearch(m);
  const match = VEHICLE_ID_GROUPS.find((g) => normalizeForSearch(g?.label) === mKey);
  return match ? [match] : VEHICLE_ID_GROUPS;
};

export const filterVehicleIdGroups = (query, groups = VEHICLE_ID_GROUPS) => {
  const q = String(query || "").trim().toUpperCase();
  const qNorm = normalizeForSearch(q);

  const base = Array.isArray(groups) ? groups : [];

  if (!q && !qNorm) return base;

  return base
    .map((group) => {
    const ids = (Array.isArray(group?.ids) ? group.ids : []).filter((id) => {
      const raw = String(id || "").toUpperCase();
      if (q && raw.includes(q)) return true;
      if (qNorm && normalizeForSearch(id).includes(qNorm)) return true;
      return false;
    });

    return { ...group, ids };
    })
    .filter((group) => (Array.isArray(group?.ids) ? group.ids.length > 0 : false));
};
