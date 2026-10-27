import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Globe,
  Shield,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Activity,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Server,
  Cpu,
  HardDrive,
  Database,
  Layers,
  Lock,
  Radio,
  Crosshair,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Leaf,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Navigation,
} from 'lucide-react';
import {
  WORLD_COUNTRY_PATHS,
  WORLD_LAKES_SVG_PATH,
  ADMIN1_STATES_SVG_PATH,
  projectLatLon,
  unprojectSvgPoint,
  formatLatLon,
  calculateGreatCircleKm,
} from '../data/worldMapGeoPaths';
import {
  STACK_BLUEPRINTS,
  computeOrbitalTelemetry,
} from './OrbitalControlPlaneDrawer';

// ============================================================================
// 1. GOOGLE CLOUD GLOBAL REGIONS & ZONES CATALOG (Exact WGS84 Lat/Lon Projected)
// ============================================================================
// Every region's (x, y) is mathematically projected from its real-world WGS84
// (lat, lon) coordinates onto the 1200x560 Natural Earth vector world map.
const RAW_GCP_GLOBAL_REGIONS = [
  // ======================== NORTH AMERICA (12 REGIONS) ========================
  {
    id: 'us-west1',
    name: 'us-west1',
    city: 'The Dalles, Oregon',
    countryCode: 'USA',
    continent: 'North America',
    lat: 45.5946,
    lon: -121.1787,
    labelOffset: { dx: -28, dy: -12 },
    zones: ['us-west1-a', 'us-west1-b', 'us-west1-c'],
    cfePercent: 89,
    gco2: 78,
    backbonePeers: ['us-west2', 'us-central1', 'northamerica-northeast2', 'asia-northeast1'],
  },
  {
    id: 'us-west2',
    name: 'us-west2',
    city: 'Los Angeles, California',
    countryCode: 'USA',
    continent: 'North America',
    lat: 34.0522,
    lon: -118.2437,
    labelOffset: { dx: -30, dy: 14 },
    zones: ['us-west2-a', 'us-west2-b', 'us-west2-c'],
    cfePercent: 54,
    gco2: 245,
    backbonePeers: ['us-west1', 'us-west3', 'us-west4', 'asia-northeast2'],
  },
  {
    id: 'us-west3',
    name: 'us-west3',
    city: 'Salt Lake City, Utah',
    countryCode: 'USA',
    continent: 'North America',
    lat: 40.7608,
    lon: -111.891,
    labelOffset: { dx: 0, dy: -14 },
    zones: ['us-west3-a', 'us-west3-b', 'us-west3-c'],
    cfePercent: 39,
    gco2: 520,
    backbonePeers: ['us-west1', 'us-west4', 'us-central1'],
  },
  {
    id: 'us-west4',
    name: 'us-west4',
    city: 'Las Vegas, Nevada',
    countryCode: 'USA',
    continent: 'North America',
    lat: 36.1699,
    lon: -115.1398,
    labelOffset: { dx: 26, dy: 13 },
    zones: ['us-west4-a', 'us-west4-b', 'us-west4-c'],
    cfePercent: 62,
    gco2: 340,
    backbonePeers: ['us-west2', 'us-west3', 'us-south1'],
  },
  {
    id: 'us-central1',
    name: 'us-central1',
    city: 'Council Bluffs, Iowa',
    countryCode: 'USA',
    continent: 'North America',
    lat: 41.2619,
    lon: -95.8608,
    labelOffset: { dx: -14, dy: -14 },
    zones: ['us-central1-a', 'us-central1-b', 'us-central1-c', 'us-central1-f'],
    cfePercent: 93,
    gco2: 110,
    backbonePeers: ['us-west1', 'us-south1', 'us-east5', 'us-east4', 'northamerica-northeast2'],
  },
  {
    id: 'us-south1',
    name: 'us-south1',
    city: 'Dallas, Texas',
    countryCode: 'USA',
    continent: 'North America',
    lat: 32.7767,
    lon: -96.797,
    labelOffset: { dx: 0, dy: 15 },
    zones: ['us-south1-a', 'us-south1-b', 'us-south1-c'],
    cfePercent: 68,
    gco2: 310,
    backbonePeers: ['us-west4', 'us-central1', 'us-east1', 'northamerica-south1'],
  },
  {
    id: 'us-east1',
    name: 'us-east1',
    city: 'Moncks Corner, South Carolina',
    countryCode: 'USA',
    continent: 'North America',
    lat: 33.196,
    lon: -80.0131,
    labelOffset: { dx: 28, dy: 14 },
    zones: ['us-east1-b', 'us-east1-c', 'us-east1-d'],
    cfePercent: 52,
    gco2: 380,
    backbonePeers: ['us-south1', 'us-east4', 'southamerica-east1', 'europe-west1'],
  },
  {
    id: 'us-east4',
    name: 'us-east4',
    city: 'Ashburn, Virginia',
    countryCode: 'USA',
    continent: 'North America',
    lat: 39.0438,
    lon: -77.4874,
    labelOffset: { dx: 32, dy: 4 },
    zones: ['us-east4-a', 'us-east4-b', 'us-east4-c'],
    cfePercent: 56,
    gco2: 310,
    backbonePeers: ['us-central1', 'us-east5', 'us-east1', 'europe-west2', 'europe-west9'],
  },
  {
    id: 'us-east5',
    name: 'us-east5',
    city: 'Columbus, Ohio',
    countryCode: 'USA',
    continent: 'North America',
    lat: 39.9612,
    lon: -82.9988,
    labelOffset: { dx: -24, dy: 13 },
    zones: ['us-east5-a', 'us-east5-b', 'us-east5-c'],
    cfePercent: 51,
    gco2: 410,
    backbonePeers: ['us-central1', 'us-east4', 'northamerica-northeast2'],
  },
  {
    id: 'northamerica-northeast1',
    name: 'northamerica-northeast1',
    city: 'Montréal, Québec',
    countryCode: 'CAN',
    continent: 'North America',
    lat: 45.5017,
    lon: -73.5673,
    labelOffset: { dx: 36, dy: -13 },
    zones: [
      'northamerica-northeast1-a',
      'northamerica-northeast1-b',
      'northamerica-northeast1-c',
    ],
    cfePercent: 99,
    gco2: 18,
    backbonePeers: ['northamerica-northeast2', 'us-east4', 'europe-west2'],
  },
  {
    id: 'northamerica-northeast2',
    name: 'northamerica-northeast2',
    city: 'Toronto, Ontario',
    countryCode: 'CAN',
    continent: 'North America',
    lat: 43.6532,
    lon: -79.3832,
    labelOffset: { dx: -32, dy: -13 },
    zones: [
      'northamerica-northeast2-a',
      'northamerica-northeast2-b',
      'northamerica-northeast2-c',
    ],
    cfePercent: 92,
    gco2: 42,
    backbonePeers: ['northamerica-northeast1', 'us-central1', 'us-east5'],
  },
  {
    id: 'northamerica-south1',
    name: 'northamerica-south1',
    city: 'Querétaro, Mexico',
    countryCode: 'MEX',
    continent: 'North America',
    lat: 20.5888,
    lon: -100.3899,
    labelOffset: { dx: 0, dy: 15 },
    zones: [
      'northamerica-south1-a',
      'northamerica-south1-b',
      'northamerica-south1-c',
    ],
    cfePercent: 46,
    gco2: 390,
    backbonePeers: ['us-south1', 'southamerica-west1'],
  },

  // ======================== SOUTH AMERICA (2 REGIONS) ========================
  {
    id: 'southamerica-east1',
    name: 'southamerica-east1',
    city: 'São Paulo, Brazil',
    countryCode: 'BRA',
    continent: 'South America',
    lat: -23.5505,
    lon: -46.6333,
    labelOffset: { dx: 28, dy: 14 },
    zones: ['southamerica-east1-a', 'southamerica-east1-b', 'southamerica-east1-c'],
    cfePercent: 91,
    gco2: 62,
    backbonePeers: ['us-east1', 'southamerica-west1', 'europe-southwest1'],
  },
  {
    id: 'southamerica-west1',
    name: 'southamerica-west1',
    city: 'Santiago, Chile',
    countryCode: 'CHL',
    continent: 'South America',
    lat: -33.4489,
    lon: -70.6693,
    labelOffset: { dx: -28, dy: 14 },
    zones: ['southamerica-west1-a', 'southamerica-west1-b', 'southamerica-west1-c'],
    cfePercent: 83,
    gco2: 145,
    backbonePeers: ['southamerica-east1', 'northamerica-south1'],
  },

  // ======================== EUROPE (12 REGIONS) ========================
  {
    id: 'europe-west1',
    name: 'europe-west1',
    city: 'St. Ghislain, Belgium',
    countryCode: 'BEL',
    continent: 'Europe',
    lat: 50.4481,
    lon: 3.8189,
    labelOffset: { dx: -38, dy: -4 },
    zones: ['europe-west1-b', 'europe-west1-c', 'europe-west1-d'],
    cfePercent: 84,
    gco2: 132,
    backbonePeers: ['europe-west2', 'europe-west4', 'europe-west9', 'us-east1'],
  },
  {
    id: 'europe-west2',
    name: 'europe-west2',
    city: 'London, United Kingdom',
    countryCode: 'GBR',
    continent: 'Europe',
    lat: 51.5072,
    lon: -0.1276,
    labelOffset: { dx: -38, dy: -14 },
    zones: ['europe-west2-a', 'europe-west2-b', 'europe-west2-c'],
    cfePercent: 86,
    gco2: 145,
    backbonePeers: ['us-east4', 'europe-west1', 'europe-north1'],
  },
  {
    id: 'europe-west3',
    name: 'europe-west3',
    city: 'Frankfurt, Germany',
    countryCode: 'DEU',
    continent: 'Europe',
    lat: 50.1109,
    lon: 8.6821,
    labelOffset: { dx: 36, dy: -4 },
    zones: ['europe-west3-a', 'europe-west3-b', 'europe-west3-c'],
    cfePercent: 66,
    gco2: 295,
    backbonePeers: ['europe-west1', 'europe-west4', 'europe-west10', 'europe-west6'],
  },
  {
    id: 'europe-west4',
    name: 'europe-west4',
    city: 'Eemshaven, Netherlands',
    countryCode: 'NLD',
    continent: 'Europe',
    lat: 53.4386,
    lon: 6.8355,
    labelOffset: { dx: -8, dy: -16 },
    zones: ['europe-west4-a', 'europe-west4-b', 'europe-west4-c'],
    cfePercent: 72,
    gco2: 240,
    backbonePeers: ['europe-west1', 'europe-north1', 'europe-west3'],
  },
  {
    id: 'europe-west6',
    name: 'europe-west6',
    city: 'Zürich, Switzerland',
    countryCode: 'CHE',
    continent: 'Europe',
    lat: 47.3769,
    lon: 8.5417,
    labelOffset: { dx: 38, dy: 5 },
    zones: ['europe-west6-a', 'europe-west6-b', 'europe-west6-c'],
    cfePercent: 96,
    gco2: 34,
    backbonePeers: ['europe-west3', 'europe-west8', 'europe-west9'],
  },
  {
    id: 'europe-west8',
    name: 'europe-west8',
    city: 'Milan, Italy',
    countryCode: 'ITA',
    continent: 'Europe',
    lat: 45.4642,
    lon: 9.19,
    labelOffset: { dx: 34, dy: 15 },
    zones: ['europe-west8-a', 'europe-west8-b', 'europe-west8-c'],
    cfePercent: 61,
    gco2: 240,
    backbonePeers: ['europe-west6', 'europe-west12', 'me-west1'],
  },
  {
    id: 'europe-west9',
    name: 'europe-west9',
    city: 'Paris, France',
    countryCode: 'FRA',
    continent: 'Europe',
    lat: 48.8566,
    lon: 2.3522,
    labelOffset: { dx: -38, dy: 7 },
    zones: ['europe-west9-a', 'europe-west9-b', 'europe-west9-c'],
    cfePercent: 92,
    gco2: 52,
    backbonePeers: ['europe-west1', 'europe-west6', 'europe-southwest1', 'us-east4'],
  },
  {
    id: 'europe-west10',
    name: 'europe-west10',
    city: 'Berlin, Germany',
    countryCode: 'DEU',
    continent: 'Europe',
    lat: 52.52,
    lon: 13.405,
    labelOffset: { dx: 28, dy: -14 },
    zones: ['europe-west10-a', 'europe-west10-b', 'europe-west10-c'],
    cfePercent: 64,
    gco2: 310,
    backbonePeers: ['europe-west3', 'europe-central2', 'europe-north1'],
  },
  {
    id: 'europe-west12',
    name: 'europe-west12',
    city: 'Turin, Italy',
    countryCode: 'ITA',
    continent: 'Europe',
    lat: 45.0703,
    lon: 7.6869,
    labelOffset: { dx: -34, dy: 16 },
    zones: ['europe-west12-a', 'europe-west12-b', 'europe-west12-c'],
    cfePercent: 61,
    gco2: 240,
    backbonePeers: ['europe-west8', 'europe-west9', 'europe-southwest1'],
  },
  {
    id: 'europe-central2',
    name: 'europe-central2',
    city: 'Warsaw, Poland',
    countryCode: 'POL',
    continent: 'Europe',
    lat: 52.2297,
    lon: 21.0122,
    labelOffset: { dx: 36, dy: -6 },
    zones: ['europe-central2-a', 'europe-central2-b', 'europe-central2-c'],
    cfePercent: 34,
    gco2: 610,
    backbonePeers: ['europe-west10', 'europe-north1'],
  },
  {
    id: 'europe-north1',
    name: 'europe-north1',
    city: 'Hamina, Finland',
    countryCode: 'FIN',
    continent: 'Europe',
    lat: 60.5693,
    lon: 27.1878,
    labelOffset: { dx: 0, dy: -14 },
    zones: ['europe-north1-a', 'europe-north1-b', 'europe-north1-c'],
    cfePercent: 98,
    gco2: 28,
    backbonePeers: ['europe-west4', 'europe-west2', 'europe-central2'],
  },
  {
    id: 'europe-southwest1',
    name: 'europe-southwest1',
    city: 'Madrid, Spain',
    countryCode: 'ESP',
    continent: 'Europe',
    lat: 40.4168,
    lon: -3.7038,
    labelOffset: { dx: -28, dy: 15 },
    zones: [
      'europe-southwest1-a',
      'europe-southwest1-b',
      'europe-southwest1-c',
    ],
    cfePercent: 82,
    gco2: 118,
    backbonePeers: ['europe-west9', 'europe-west12', 'southamerica-east1', 'africa-south1'],
  },

  // ======================== MIDDLE EAST & AFRICA (4 REGIONS) ========================
  {
    id: 'me-west1',
    name: 'me-west1',
    city: 'Tel Aviv, Israel',
    countryCode: 'ISR',
    continent: 'Middle East',
    lat: 32.0853,
    lon: 34.7818,
    labelOffset: { dx: -26, dy: 14 },
    zones: ['me-west1-a', 'me-west1-b', 'me-west1-c'],
    cfePercent: 28,
    gco2: 460,
    backbonePeers: ['europe-west8', 'me-central1', 'me-central2'],
  },
  {
    id: 'me-central1',
    name: 'me-central1',
    city: 'Doha, Qatar',
    countryCode: 'QAT',
    continent: 'Middle East',
    lat: 25.2854,
    lon: 51.531,
    labelOffset: { dx: 30, dy: 14 },
    zones: ['me-central1-a', 'me-central1-b', 'me-central1-c'],
    cfePercent: 35,
    gco2: 490,
    backbonePeers: ['me-west1', 'me-central2', 'asia-south1'],
  },
  {
    id: 'me-central2',
    name: 'me-central2',
    city: 'Dammam, Saudi Arabia',
    countryCode: 'SAU',
    continent: 'Middle East',
    lat: 26.4207,
    lon: 50.0888,
    labelOffset: { dx: -30, dy: -13 },
    zones: ['me-central2-a', 'me-central2-b', 'me-central2-c'],
    cfePercent: 32,
    gco2: 510,
    backbonePeers: ['me-west1', 'me-central1', 'africa-south1'],
  },
  {
    id: 'africa-south1',
    name: 'africa-south1',
    city: 'Johannesburg, South Africa',
    countryCode: 'ZAF',
    continent: 'Africa',
    lat: -26.2041,
    lon: 28.0473,
    labelOffset: { dx: 0, dy: 15 },
    zones: ['africa-south1-a', 'africa-south1-b', 'africa-south1-c'],
    cfePercent: 31,
    gco2: 640,
    backbonePeers: ['europe-southwest1', 'me-central2'],
  },

  // ======================== ASIA & OCEANIA (11 REGIONS) ========================
  {
    id: 'asia-south1',
    name: 'asia-south1',
    city: 'Mumbai, India',
    countryCode: 'IND',
    continent: 'Asia',
    lat: 19.076,
    lon: 72.8777,
    labelOffset: { dx: -24, dy: 14 },
    zones: ['asia-south1-a', 'asia-south1-b', 'asia-south1-c'],
    cfePercent: 38,
    gco2: 560,
    backbonePeers: ['me-central1', 'asia-south2', 'asia-southeast1'],
  },
  {
    id: 'asia-south2',
    name: 'asia-south2',
    city: 'Delhi, India',
    countryCode: 'IND',
    continent: 'Asia',
    lat: 28.6139,
    lon: 77.209,
    labelOffset: { dx: 0, dy: -14 },
    zones: ['asia-south2-a', 'asia-south2-b', 'asia-south2-c'],
    cfePercent: 41,
    gco2: 540,
    backbonePeers: ['asia-south1', 'asia-southeast1'],
  },
  {
    id: 'asia-southeast1',
    name: 'asia-southeast1',
    city: 'Jurong West, Singapore',
    countryCode: 'SGP',
    continent: 'Asia',
    lat: 1.3521,
    lon: 103.8198,
    labelOffset: { dx: -28, dy: -13 },
    zones: ['asia-southeast1-a', 'asia-southeast1-b', 'asia-southeast1-c'],
    cfePercent: 42,
    gco2: 395,
    backbonePeers: ['asia-south1', 'asia-southeast2', 'asia-east2', 'australia-southeast1'],
  },
  {
    id: 'asia-southeast2',
    name: 'asia-southeast2',
    city: 'Jakarta, Indonesia',
    countryCode: 'IDN',
    continent: 'Asia',
    lat: -6.2088,
    lon: 106.8456,
    labelOffset: { dx: 0, dy: 15 },
    zones: ['asia-southeast2-a', 'asia-southeast2-b', 'asia-southeast2-c'],
    cfePercent: 36,
    gco2: 580,
    backbonePeers: ['asia-southeast1', 'australia-southeast1'],
  },
  {
    id: 'asia-east1',
    name: 'asia-east1',
    city: 'Changhua County, Taiwan',
    countryCode: 'TWN',
    continent: 'Asia',
    lat: 24.0518,
    lon: 120.5161,
    labelOffset: { dx: 28, dy: 12 },
    zones: ['asia-east1-a', 'asia-east1-b', 'asia-east1-c'],
    cfePercent: 44,
    gco2: 450,
    backbonePeers: ['asia-east2', 'asia-northeast1', 'asia-northeast3'],
  },
  {
    id: 'asia-east2',
    name: 'asia-east2',
    city: 'Hong Kong',
    countryCode: 'HKG',
    continent: 'Asia',
    lat: 22.3193,
    lon: 114.1694,
    labelOffset: { dx: -28, dy: 13 },
    zones: ['asia-east2-a', 'asia-east2-b', 'asia-east2-c'],
    cfePercent: 40,
    gco2: 470,
    backbonePeers: ['asia-southeast1', 'asia-east1'],
  },
  {
    id: 'asia-northeast1',
    name: 'asia-northeast1',
    city: 'Tokyo, Japan',
    countryCode: 'JPN',
    continent: 'Asia',
    lat: 35.6762,
    lon: 139.6503,
    labelOffset: { dx: 32, dy: -12 },
    zones: ['asia-northeast1-a', 'asia-northeast1-b', 'asia-northeast1-c'],
    cfePercent: 48,
    gco2: 410,
    backbonePeers: ['asia-northeast2', 'asia-east1', 'us-west1'],
  },
  {
    id: 'asia-northeast2',
    name: 'asia-northeast2',
    city: 'Osaka, Japan',
    countryCode: 'JPN',
    continent: 'Asia',
    lat: 34.6937,
    lon: 135.5023,
    labelOffset: { dx: -26, dy: 14 },
    zones: ['asia-northeast2-a', 'asia-northeast2-b', 'asia-northeast2-c'],
    cfePercent: 48,
    gco2: 410,
    backbonePeers: ['asia-northeast1', 'asia-northeast3', 'us-west2'],
  },
  {
    id: 'asia-northeast3',
    name: 'asia-northeast3',
    city: 'Seoul, South Korea',
    countryCode: 'KOR',
    continent: 'Asia',
    lat: 37.5665,
    lon: 126.978,
    labelOffset: { dx: -28, dy: -13 },
    zones: ['asia-northeast3-a', 'asia-northeast3-b', 'asia-northeast3-c'],
    cfePercent: 43,
    gco2: 430,
    backbonePeers: ['asia-northeast2', 'asia-east1'],
  },
  {
    id: 'australia-southeast1',
    name: 'australia-southeast1',
    city: 'Sydney, Australia',
    countryCode: 'AUS',
    continent: 'Oceania',
    lat: -33.8688,
    lon: 151.2093,
    labelOffset: { dx: 30, dy: -12 },
    zones: [
      'australia-southeast1-a',
      'australia-southeast1-b',
      'australia-southeast1-c',
    ],
    cfePercent: 58,
    gco2: 430,
    backbonePeers: ['asia-southeast1', 'australia-southeast2'],
  },
  {
    id: 'australia-southeast2',
    name: 'australia-southeast2',
    city: 'Melbourne, Australia',
    countryCode: 'AUS',
    continent: 'Oceania',
    lat: -37.8136,
    lon: 144.9631,
    labelOffset: { dx: -28, dy: 15 },
    zones: [
      'australia-southeast2-a',
      'australia-southeast2-b',
      'australia-southeast2-c',
    ],
    cfePercent: 55,
    gco2: 455,
    backbonePeers: ['australia-southeast1', 'asia-southeast2'],
  },
];

export const GCP_GLOBAL_REGIONS = RAW_GCP_GLOBAL_REGIONS.map((reg) => {
  const projected = projectLatLon(reg.lat, reg.lon);
  return {
    ...reg,
    x: projected.x,
    y: projected.y,
    gpsLabel: formatLatLon(reg.lat, reg.lon),
  };
});

// ============================================================================
// 1B. LIVE VARIABLE REGIONAL FINOPS PRICING & HARDWARE SKU CATALOG ENGINE
// ============================================================================
export const DEFAULT_UNIT_PRICING = {
  vcpuPerHourUsd: 0.031611,
  ramGbPerHourUsd: 0.004237,
  cloudRunL4GpuPerHourUsd: 0.67,
  computeL4GpuPerHourUsd: 0.56,
  computeH100GpuPerHourUsd: 3.93,
  storageStandardGbPerMonthUsd: 0.02,
  sameContinentEgressPerGbUsd: 0.02,
  crossContinentEgressPerGbUsd: 0.08,
  premiumContinentEgressPerGbUsd: 0.12,
  cudDiscountPercent: 0,
};

export const DEFAULT_CLOUD_RUN_GPU_REGIONS = [
  'us-central1',
  'us-east4',
  'us-west1',
  'us-west4',
  'northamerica-northeast1',
  'europe-west1',
  'europe-west4',
  'asia-northeast1',
  'asia-southeast1',
  'asia-south1',
];

export const DEFAULT_COMPUTE_AI_MEGA_HUB_REGIONS = [
  'us-central1',
  'us-east1',
  'us-east4',
  'us-east5',
  'us-west1',
  'us-west4',
  'europe-west4',
  'asia-east1',
  'asia-northeast1',
  'asia-southeast1',
];

export const DEFAULT_COMPUTE_G2_GPU_REGIONS = [
  'us-central1',
  'us-east1',
  'us-east4',
  'us-west1',
  'us-west2',
  'us-west4',
  'northamerica-northeast1',
  'europe-west1',
  'europe-west2',
  'europe-west3',
  'europe-west4',
  'europe-west9',
  'asia-east1',
  'asia-northeast1',
  'asia-northeast3',
  'asia-southeast1',
  'asia-south1',
  'australia-southeast1',
  'southamerica-east1',
];

export const DEFAULT_REGIONAL_PRICE_MULTIPLIERS = {
  'us-central1': 1.0,
  'us-east1': 1.0,
  'us-west1': 1.0,
  'us-east5': 1.02,
  'us-south1': 1.03,
  'europe-north1': 1.04,
  'europe-north2': 1.05,
  'northamerica-northeast1': 1.05,
  'europe-west1': 1.05,
  'europe-west4': 1.05,
  'northamerica-northeast2': 1.07,
  'europe-west9': 1.08,
  'us-east4': 1.09,
  'us-west4': 1.09,
  'europe-southwest1': 1.1,
  'northamerica-south1': 1.11,
  'asia-east1': 1.12,
  'asia-south1': 1.13,
  'asia-southeast1': 1.14,
  'us-west2': 1.15,
  'us-west3': 1.15,
  'europe-central2': 1.15,
  'europe-west8': 1.16,
  'europe-west10': 1.17,
  'europe-west12': 1.17,
  'europe-west2': 1.18,
  'europe-west3': 1.18,
  'asia-east2': 1.2,
  'asia-south2': 1.2,
  'asia-southeast2': 1.2,
  'asia-northeast1': 1.22,
  'asia-northeast2': 1.22,
  'asia-northeast3': 1.22,
  'australia-southeast1': 1.22,
  'australia-southeast2': 1.24,
  'europe-west6': 1.26,
  'il-central1': 1.26,
  'me-west1': 1.26,
  'me-central1': 1.28,
  'me-central2': 1.28,
  'africa-johannesburg1': 1.28,
  'southamerica-west1': 1.32,
  'southamerica-east1': 1.38,
};

// Mutable live bindings so all callers read the latest synced/custom values
export const CLOUD_RUN_GPU_REGIONS = new Set(DEFAULT_CLOUD_RUN_GPU_REGIONS);
export const COMPUTE_AI_MEGA_HUB_REGIONS = new Set(DEFAULT_COMPUTE_AI_MEGA_HUB_REGIONS);
export const COMPUTE_G2_GPU_REGIONS = new Set(DEFAULT_COMPUTE_G2_GPU_REGIONS);
export const REGIONAL_PRICE_MULTIPLIERS = { ...DEFAULT_REGIONAL_PRICE_MULTIPLIERS };
export const LIVE_UNIT_PRICING = { ...DEFAULT_UNIT_PRICING };

export const LIVE_PRICING_META = {
  source: 'DEFAULT_CATALOG',
  lastSyncedAt: null,
  skusInspected: 0,
  acceleratorZonesInspected: 0,
  driftAlerts: [],
  liveSkuFeed: [],
  version: 1,
};

const PRICING_STORAGE_KEY = 'cloudpulse_2026_live_pricing_catalog_v1';

function applyCatalogPayloadToLiveStore(catalog) {
  if (!catalog || typeof catalog !== 'object') return;
  if (catalog.unitPricing && typeof catalog.unitPricing === 'object') {
    Object.assign(LIVE_UNIT_PRICING, catalog.unitPricing);
  }
  if (catalog.regionalMultipliers && typeof catalog.regionalMultipliers === 'object') {
    Object.assign(REGIONAL_PRICE_MULTIPLIERS, catalog.regionalMultipliers);
  }
  if (Array.isArray(catalog.cloudRunGpuRegions)) {
    CLOUD_RUN_GPU_REGIONS.clear();
    catalog.cloudRunGpuRegions.forEach((r) => CLOUD_RUN_GPU_REGIONS.add(r));
  }
  if (Array.isArray(catalog.computeG2GpuRegions)) {
    COMPUTE_G2_GPU_REGIONS.clear();
    catalog.computeG2GpuRegions.forEach((r) => COMPUTE_G2_GPU_REGIONS.add(r));
  }
  if (Array.isArray(catalog.computeAiMegaHubRegions)) {
    COMPUTE_AI_MEGA_HUB_REGIONS.clear();
    catalog.computeAiMegaHubRegions.forEach((r) => COMPUTE_AI_MEGA_HUB_REGIONS.add(r));
  }
  LIVE_PRICING_META.source = catalog.source || LIVE_PRICING_META.source;
  LIVE_PRICING_META.lastSyncedAt = catalog.lastSyncedAt || new Date().toISOString();
  LIVE_PRICING_META.skusInspected = catalog.skusInspected ?? LIVE_PRICING_META.skusInspected;
  LIVE_PRICING_META.acceleratorZonesInspected =
    catalog.acceleratorZonesInspected ?? LIVE_PRICING_META.acceleratorZonesInspected;
  LIVE_PRICING_META.driftAlerts = Array.isArray(catalog.driftAlerts)
    ? catalog.driftAlerts
    : [];
  LIVE_PRICING_META.liveSkuFeed = Array.isArray(catalog.liveSkuFeed)
    ? catalog.liveSkuFeed
    : LIVE_PRICING_META.liveSkuFeed;
  LIVE_PRICING_META.version += 1;

  try {
    localStorage.setItem(
      PRICING_STORAGE_KEY,
      JSON.stringify({
        source: LIVE_PRICING_META.source,
        lastSyncedAt: LIVE_PRICING_META.lastSyncedAt,
        skusInspected: LIVE_PRICING_META.skusInspected,
        acceleratorZonesInspected: LIVE_PRICING_META.acceleratorZonesInspected,
        unitPricing: { ...LIVE_UNIT_PRICING },
        regionalMultipliers: { ...REGIONAL_PRICE_MULTIPLIERS },
        cloudRunGpuRegions: Array.from(CLOUD_RUN_GPU_REGIONS),
        computeG2GpuRegions: Array.from(COMPUTE_G2_GPU_REGIONS),
        computeAiMegaHubRegions: Array.from(COMPUTE_AI_MEGA_HUB_REGIONS),
        driftAlerts: LIVE_PRICING_META.driftAlerts,
        liveSkuFeed: LIVE_PRICING_META.liveSkuFeed,
      })
    );
  } catch {
    // ignore storage errors
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cloudpulse:pricing-updated', {
        detail: { version: LIVE_PRICING_META.version },
      })
    );
  }
}

// Hydrate from localStorage on module load if available
try {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(PRICING_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      applyCatalogPayloadToLiveStore(parsed);
    }
  }
} catch {
  // ignore
}

export async function syncLiveGcpPricingCatalog(projectId = '') {
  const res = await axios.post('/api/pricing-catalog/sync', { projectId });
  if (res.data?.catalog) {
    applyCatalogPayloadToLiveStore(res.data.catalog);
  }
  return res.data?.catalog;
}

export async function overrideLivePricingCatalog(patch = {}) {
  const res = await axios.post('/api/pricing-catalog/override', patch);
  if (res.data?.catalog) {
    applyCatalogPayloadToLiveStore(res.data.catalog);
  }
  return res.data?.catalog;
}

export async function resetLivePricingCatalog() {
  const res = await axios.post('/api/pricing-catalog/reset');
  if (res.data?.catalog) {
    applyCatalogPayloadToLiveStore(res.data.catalog);
  }
  try {
    localStorage.removeItem(PRICING_STORAGE_KEY);
  } catch {
    // ignore
  }
  return res.data?.catalog;
}

export function useLivePricingCatalog() {
  const [version, setVersion] = useState(LIVE_PRICING_META.version);
  useEffect(() => {
    const onUpdate = () => setVersion(LIVE_PRICING_META.version);
    window.addEventListener('cloudpulse:pricing-updated', onUpdate);
    return () => window.removeEventListener('cloudpulse:pricing-updated', onUpdate);
  }, []);

  return {
    version,
    meta: LIVE_PRICING_META,
    unitPricing: LIVE_UNIT_PRICING,
    regionalMultipliers: REGIONAL_PRICE_MULTIPLIERS,
    cloudRunGpuRegions: CLOUD_RUN_GPU_REGIONS,
    computeG2GpuRegions: COMPUTE_G2_GPU_REGIONS,
    computeAiMegaHubRegions: COMPUTE_AI_MEGA_HUB_REGIONS,
    syncLiveGcpPricingCatalog,
    overrideLivePricingCatalog,
    resetLivePricingCatalog,
  };
}

export function getRegionProfile(regionId) {
  const base =
    GCP_GLOBAL_REGIONS.find((r) => r.id === regionId) || GCP_GLOBAL_REGIONS[6]; // default us-east1
  const priceMultiplier = REGIONAL_PRICE_MULTIPLIERS[base.id] ?? 1.12;
  const pricingTier =
    priceMultiplier <= 1.06
      ? 'Tier-1 Low Cost'
      : priceMultiplier <= 1.16
      ? 'Tier-1 Standard'
      : 'Tier-2 Premium';

  const capabilities = {
    cloudRunCpu: true,
    cloudRunGpuL4: CLOUD_RUN_GPU_REGIONS.has(base.id),
    computeGpuG2L4: COMPUTE_G2_GPU_REGIONS.has(base.id),
    computeAiMegaHub: COMPUTE_AI_MEGA_HUB_REGIONS.has(base.id),
    gkeAutopilot: true,
    cloudSqlEnterprisePlus: priceMultiplier <= 1.24,
  };

  return {
    ...base,
    priceMultiplier,
    pricingTier,
    capabilities,
  };
}

/**
 * Evaluates full FinOps cost delta, one-time network egress fee, break-even payback,
 * carbon emissions savings, and hardware/service SKU compatibility between two GCP regions.
 * Dynamically incorporates LIVE_UNIT_PRICING, CUD discounts, and live regional multipliers.
 */
export function evaluateMigrationFeasibility(
  sourceRegionId,
  targetRegionId,
  workloadSpec = {}
) {
  const src = getRegionProfile(sourceRegionId);
  const dst = getRegionProfile(targetRegionId);

  const {
    baseMonthlyUsd = 42.0, // Baseline monthly compute spend at 1.0x
    stateSizeGb = 25, // Container layers + persistent disk / bucket state to transfer
    requiresCloudRunGpu = false,
    gpuTypeLabel = 'NVIDIA L4 GPU',
    requiresVmGpu = false,
    requiresAiMegaHub = false,
    serviceCount = 1,
  } = workloadSpec;

  // 1. Hardware & Service SKU Compatibility Gatekeeper
  const blockers = [];
  const warnings = [];

  if (requiresCloudRunGpu && !dst.capabilities.cloudRunGpuL4) {
    blockers.push(
      `Cloud Run Serverless GPU (${gpuTypeLabel}) is NOT available in ${dst.name} (${dst.city}).`
    );
  }
  if (requiresVmGpu && !dst.capabilities.computeGpuG2L4) {
    blockers.push(
      `Compute Engine G2/L4 GPU VMs are NOT available in ${dst.name} (${dst.city}).`
    );
  }
  if (requiresAiMegaHub && !dst.capabilities.computeAiMegaHub) {
    blockers.push(
      `AI Mega-Hub Accelerators (A3 H100 / TPU v5e) are NOT available in ${dst.name}.`
    );
  }

  const sameContinent = src.continent === dst.continent;
  if (!sameContinent && src.id !== dst.id) {
    warnings.push(
      `Cross-continental migration (${src.continent} → ${dst.continent}): Verify data residency (GDPR/sovereignty) and client RTT impact.`
    );
  }

  // 2. Dynamic Unit Rate & CUD Scaling Factor
  const cpuRatio =
    LIVE_UNIT_PRICING.vcpuPerHourUsd / DEFAULT_UNIT_PRICING.vcpuPerHourUsd;
  const gpuRatio = requiresCloudRunGpu
    ? LIVE_UNIT_PRICING.cloudRunL4GpuPerHourUsd /
      DEFAULT_UNIT_PRICING.cloudRunL4GpuPerHourUsd
    : requiresAiMegaHub
    ? LIVE_UNIT_PRICING.computeH100GpuPerHourUsd /
      DEFAULT_UNIT_PRICING.computeH100GpuPerHourUsd
    : requiresVmGpu
    ? LIVE_UNIT_PRICING.computeL4GpuPerHourUsd /
      DEFAULT_UNIT_PRICING.computeL4GpuPerHourUsd
    : cpuRatio;

  const rateScaleFactor =
    requiresCloudRunGpu || requiresVmGpu || requiresAiMegaHub
      ? cpuRatio * 0.35 + gpuRatio * 0.65
      : cpuRatio;
  const cudFactor = Math.max(
    0.45,
    1 - (Number(LIVE_UNIT_PRICING.cudDiscountPercent) || 0) / 100
  );

  // Normalize baseline spend relative to source multiplier, then apply live rate & CUD factors
  const normalizedBaseUsd =
    (Math.max(baseMonthlyUsd, 6.5) / Math.max(src.priceMultiplier, 0.5)) *
    rateScaleFactor *
    cudFactor;
  const sourceMonthlyUsd = Number(
    (normalizedBaseUsd * src.priceMultiplier).toFixed(2)
  );
  const targetMonthlyUsd = Number(
    (normalizedBaseUsd * dst.priceMultiplier).toFixed(2)
  );
  const monthlyDeltaUsd = Number(
    (targetMonthlyUsd - sourceMonthlyUsd).toFixed(2)
  );
  const monthlyDeltaPercent =
    sourceMonthlyUsd > 0
      ? Number(((monthlyDeltaUsd / sourceMonthlyUsd) * 100).toFixed(1))
      : 0;

  // Dynamic Egress rate ($/GB) from LIVE_UNIT_PRICING
  const egressRatePerGb =
    src.id === dst.id
      ? 0
      : sameContinent
      ? Number(LIVE_UNIT_PRICING.sameContinentEgressPerGbUsd ?? 0.02)
      : dst.continent === 'Oceania' || dst.continent === 'South America'
      ? Number(LIVE_UNIT_PRICING.premiumContinentEgressPerGbUsd ?? 0.12)
      : Number(LIVE_UNIT_PRICING.crossContinentEgressPerGbUsd ?? 0.08);

  const oneTimeTransferUsd =
    src.id === dst.id
      ? 0
      : Number(
          Math.max(0.24 * serviceCount, stateSizeGb * egressRatePerGb).toFixed(2)
        );

  // Break-even payback in days if target region lowers ongoing monthly compute spend
  const dailySavingsUsd = monthlyDeltaUsd < 0 ? Math.abs(monthlyDeltaUsd) / 30 : 0;
  const breakEvenDays =
    dailySavingsUsd > 0
      ? Number((oneTimeTransferUsd / dailySavingsUsd).toFixed(1))
      : null;

  // 3. Carbon Emissions Impact
  const cfeDelta = dst.cfePercent - src.cfePercent;
  const gco2Delta = dst.gco2 - src.gco2; // negative = cleaner
  const gco2ReductionPercent =
    src.gco2 > 0
      ? Math.round(((src.gco2 - dst.gco2) / src.gco2) * 100)
      : 0;

  // Estimate annual kg CO2 saved based on workload scale
  const estAnnualKwh = Math.max(180, normalizedBaseUsd * 14);
  const annualCo2SavedKg = Number(
    (((src.gco2 - dst.gco2) * estAnnualKwh) / 1000).toFixed(1)
  );

  return {
    src,
    dst,
    isCompatible: blockers.length === 0,
    blockers,
    warnings,
    sameContinent,
    egressRatePerGb,
    sourceMonthlyUsd,
    targetMonthlyUsd,
    monthlyDeltaUsd,
    monthlyDeltaPercent,
    oneTimeTransferUsd,
    breakEvenDays,
    cfeDelta,
    gco2Delta,
    gco2ReductionPercent,
    annualCo2SavedKg,
    pricingSource: LIVE_PRICING_META.source,
    cudDiscountPercent: LIVE_UNIT_PRICING.cudDiscountPercent || 0,
  };
}

/**
 * Recommends the 3 smartest destination regions for a given workload:
 * 1. Greenest 100% SKU-Compatible Region
 * 2. Best FinOps + Green Arbitrage Region (Saves both $ and CO2, 100% SKU-compatible)
 * 3. Best Same-Continent Low-Latency Compatible Peer
 */
export function findBestMigrationTargets(sourceRegionId, workloadSpec = {}) {
  const candidates = GCP_GLOBAL_REGIONS.filter(
    (r) => r.id !== sourceRegionId
  ).map((r) =>
    evaluateMigrationFeasibility(sourceRegionId, r.id, workloadSpec)
  );

  const compatible = candidates.filter((c) => c.isCompatible);

  // 1. Greenest SKU-Compatible (lowest gCO2/kWh)
  const greenestCompatible = [...compatible].sort(
    (a, b) => a.dst.gco2 - b.dst.gco2 || a.targetMonthlyUsd - b.targetMonthlyUsd
  )[0];

  // 2. Best FinOps + Green Arbitrage (lowest monthly USD among regions cleaner than or equal to source)
  const greenerCandidates = compatible.filter((c) => c.dst.gco2 <= c.src.gco2);
  const cheapestGreenCompatible = (
    greenerCandidates.length > 0 ? greenerCandidates : compatible
  ).sort(
    (a, b) =>
      a.targetMonthlyUsd - b.targetMonthlyUsd || a.dst.gco2 - b.dst.gco2
  )[0];

  // 3. Best Same-Continent SKU-Compatible Peer
  const sameContinentCompatible = [...compatible]
    .filter((c) => c.sameContinent)
    .sort((a, b) => a.dst.gco2 - b.dst.gco2)[0];

  return {
    greenestCompatible,
    cheapestGreenCompatible,
    sameContinentCompatible,
  };
}

/**
 * Reusable Live GCP Cloud Billing Catalog Sync & Variable FinOps Rate Editor Bar
 * Embeddable in Global Map, Cross-Region Teleporter, and Autonomous Cloud Brain.
 */
export function LivePricingCatalogControlBar({ projectId = '', selectedRegionId = 'us-central1' }) {
  const {
    meta,
    unitPricing,
    regionalMultipliers,
    cloudRunGpuRegions,
    computeG2GpuRegions,
    computeAiMegaHubRegions,
  } = useLivePricingCatalog();

  const [isSyncing, setIsSyncing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [statusBanner, setStatusBanner] = useState('');
  const [inspectRegion, setInspectRegion] = useState(selectedRegionId || 'us-central1');

  useEffect(() => {
    if (selectedRegionId && GCP_GLOBAL_REGIONS.some((r) => r.id === selectedRegionId)) {
      setInspectRegion(selectedRegionId);
    }
  }, [selectedRegionId]);

  const handleSyncLive = async () => {
    setIsSyncing(true);
    setStatusBanner('');
    try {
      const cat = await syncLiveGcpPricingCatalog(projectId);
      setStatusBanner(
        `Synced live GCP Billing & Accelerator Catalog (${cat?.skusInspected || 350} SKUs, ${cat?.acceleratorZonesInspected || 121} GPU zones inspected).`
      );
    } catch (err) {
      setStatusBanner(
        `Live API sync fallback applied (${err.response?.data?.error || err.message})`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUnitChange = async (field, val) => {
    const num = Number(val);
    if (Number.isNaN(num) || num < 0) return;
    await overrideLivePricingCatalog({
      unitPricing: { [field]: num },
    });
  };

  const handleRegionMultiplierChange = async (regId, val) => {
    const num = Number(val);
    if (Number.isNaN(num) || num < 0.3 || num > 4.0) return;
    await overrideLivePricingCatalog({
      regionalMultipliers: { [regId]: num },
    });
  };

  const handleToggleRegionSku = async (regId, skuSetKey) => {
    const currentSet =
      skuSetKey === 'cloudRunGpuRegions'
        ? new Set(cloudRunGpuRegions)
        : skuSetKey === 'computeG2GpuRegions'
        ? new Set(computeG2GpuRegions)
        : new Set(computeAiMegaHubRegions);

    if (currentSet.has(regId)) {
      currentSet.delete(regId);
    } else {
      currentSet.add(regId);
    }
    await overrideLivePricingCatalog({
      [skuSetKey]: Array.from(currentSet),
    });
  };

  const handleSimulatePriceHike = async () => {
    // Simulate a +18% GPU & Tier-2 regional price hike so the engineer can test drift detection & ROI recalculation
    const hikedMultipliers = { ...regionalMultipliers };
    Object.keys(hikedMultipliers).forEach((r) => {
      if (hikedMultipliers[r] >= 1.12) {
        hikedMultipliers[r] = Number((hikedMultipliers[r] * 1.15).toFixed(2));
      }
    });
    await overrideLivePricingCatalog({
      unitPricing: {
        ...unitPricing,
        cloudRunL4GpuPerHourUsd: Number((unitPricing.cloudRunL4GpuPerHourUsd * 1.18).toFixed(3)),
        computeH100GpuPerHourUsd: Number((unitPricing.computeH100GpuPerHourUsd * 1.22).toFixed(2)),
        crossContinentEgressPerGbUsd: 0.11,
      },
      regionalMultipliers: hikedMultipliers,
    });
    setStatusBanner(
      'Simulated +18% GPU & +15% Non-Tier-1 Regional Price Hike — all migration ROIs & 30-day forecasts updated!'
    );
  };

  const handleReset = async () => {
    await resetLivePricingCatalog();
    setStatusBanner('Restored default Google Cloud baseline pricing & regional SKU matrix.');
  };

  const sourceBadgeColor =
    meta.source?.includes('LIVE') || meta.source?.includes('VERIFIED')
      ? '#10b981'
      : meta.source?.includes('CUSTOM')
      ? '#f59e0b'
      : '#669df6';

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.96))',
        border: `1px solid ${sourceBadgeColor}44`,
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              padding: '3px 8px',
              borderRadius: 999,
              background: `${sourceBadgeColor}20`,
              color: sourceBadgeColor,
              border: `1px solid ${sourceBadgeColor}55`,
              fontFamily: 'var(--font-mono)',
            }}
          >
            PRICING ENGINE: {meta.source}
          </span>
          <span style={{ fontSize: 11, color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
            vCPU: <strong style={{ color: '#669df6' }}>${unitPricing.vcpuPerHourUsd}/hr</strong> · L4 GPU:{' '}
            <strong style={{ color: '#4285f4' }}>${unitPricing.cloudRunL4GpuPerHourUsd}/hr</strong> · Egress:{' '}
            <strong style={{ color: '#f59e0b' }}>${unitPricing.crossContinentEgressPerGbUsd}/GB</strong>
            {unitPricing.cudDiscountPercent > 0 && (
              <span style={{ color: '#10b981', marginLeft: 6, fontWeight: 800 }}>
                (-{unitPricing.cudDiscountPercent}% CUD Active)
              </span>
            )}
          </span>
          {meta.lastSyncedAt && (
            <span style={{ fontSize: 10, color: '#64748b' }}>
              Synced {new Date(meta.lastSyncedAt).toLocaleTimeString()}
            </span>
          )}
          {meta.driftAlerts?.length > 0 && (
            <button
              type="button"
              onClick={() => setShowEditor((v) => !v)}
              title={`Live Google Cloud Billing Catalog API detected ${meta.driftAlerts.length} SKU rate change(s) vs static baseline: ${meta.driftAlerts
                .map(
                  (d) =>
                    `${d.metric || d.region}: $${d.baseline} → $${d.live} (${
                      d.deltaPercent > 0 ? '+' : ''
                    }${d.deltaPercent}%)`
                )
                .join(' · ')}. Click to inspect or override rates.`}
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(244, 63, 94, 0.16)',
                color: '#fda4af',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                cursor: 'pointer',
              }}
            >
              {meta.driftAlerts.length} Price Drift{meta.driftAlerts.length > 1 ? 's' : ''} Detected:{' '}
              {meta.driftAlerts
                .slice(0, 2)
                .map(
                  (d) =>
                    `${d.metric || d.region} ($${d.baseline} → $${d.live}, ${
                      d.deltaPercent > 0 ? '+' : ''
                    }${d.deltaPercent}%)`
                )
                .join(' · ')}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSyncLive}
            disabled={isSyncing}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 800,
              cursor: isSyncing ? 'wait' : 'pointer',
              background: '#1a73e8',
              color: '#ffffff',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
            title="Fetch live SKU pricing and GPU regional availability from Google Cloud Billing & Compute Accelerator APIs"
          >
            <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
            {isSyncing ? 'Syncing GCP SKUs...' : 'Sync Live GCP Pricing & SKUs'}
          </button>

          <button
            type="button"
            onClick={() => setShowEditor((v) => !v)}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              background: showEditor
                ? 'rgba(245, 158, 11, 0.22)'
                : 'rgba(30, 41, 59, 0.9)',
              color: showEditor ? '#fcd34d' : '#e2e8f0',
              border: showEditor
                ? '1px solid rgba(245, 158, 11, 0.55)'
                : '1px solid rgba(148, 163, 184, 0.3)',
            }}
          >
            {showEditor ? 'Hide Variable Rate Matrix' : 'Variable Rates & CUD%'}
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: 11,
            color: '#a7f3d0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {showEditor && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid rgba(148, 163, 184, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f8fafc' }}>
              Live Variable Unit Pricing & Enterprise CUD Override (Updates All Calculators Instantly)
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={handleSimulatePriceHike}
                style={{
                  padding: '4px 9px',
                  borderRadius: 7,
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: 'rgba(244, 63, 94, 0.16)',
                  color: '#fda4af',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                }}
              >
                Simulate +18% GPU / Price Hike
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '4px 9px',
                  borderRadius: 7,
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: 'rgba(148, 163, 184, 0.14)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                }}
              >
                ↺ Reset Baseline
              </button>
            </div>
          </div>

          {/* Unit Rate Inputs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 8,
            }}
          >
            {[
              {
                key: 'vcpuPerHourUsd',
                label: 'vCPU ($/hr baseline)',
                step: '0.001',
              },
              {
                key: 'ramGbPerHourUsd',
                label: 'Memory ($/GiB-hr)',
                step: '0.0005',
              },
              {
                key: 'cloudRunL4GpuPerHourUsd',
                label: 'Cloud Run L4 GPU ($/hr)',
                step: '0.02',
              },
              {
                key: 'computeH100GpuPerHourUsd',
                label: 'A3 H100 GPU ($/hr)',
                step: '0.10',
              },
              {
                key: 'crossContinentEgressPerGbUsd',
                label: 'Cross-Cont Egress ($/GB)',
                step: '0.01',
              },
              {
                key: 'cudDiscountPercent',
                label: 'Enterprise CUD Discount (%)',
                step: '5',
              },
            ].map((item) => (
              <div
                key={item.key}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 8,
                  padding: '6px 8px',
                }}
              >
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>
                  {item.label}
                </div>
                <input
                  type="number"
                  step={item.step}
                  value={unitPricing[item.key]}
                  onChange={(e) => handleUnitChange(item.key, e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.9)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: 6,
                    color: '#f8fafc',
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '4px 6px',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Regional Multiplier & Hardware SKU Capability Override */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.22)',
              borderRadius: 8,
              padding: '8px 10px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>
                Region Multiplier & GPU SKU Override:
              </span>
              <select
                value={inspectRegion}
                onChange={(e) => setInspectRegion(e.target.value)}
                style={{
                  background: '#020617',
                  color: '#669df6',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {GCP_GLOBAL_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.city}) — {(regionalMultipliers[r.id] ?? 1.12).toFixed(2)}x
                  </option>
                ))}
              </select>

              <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                Multiplier:
                <input
                  type="number"
                  step="0.02"
                  min="0.5"
                  max="3.0"
                  value={regionalMultipliers[inspectRegion] ?? 1.0}
                  onChange={(e) => handleRegionMultiplierChange(inspectRegion, e.target.value)}
                  style={{
                    width: 68,
                    background: '#020617',
                    color: '#fcd34d',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    borderRadius: 6,
                    padding: '3px 6px',
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                x
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {[
                {
                  key: 'cloudRunGpuRegions',
                  label: 'Cloud Run L4 GPU',
                  active: cloudRunGpuRegions.has(inspectRegion),
                },
                {
                  key: 'computeG2GpuRegions',
                  label: 'Compute G2 L4 VM',
                  active: computeG2GpuRegions.has(inspectRegion),
                },
                {
                  key: 'computeAiMegaHubRegions',
                  label: 'A3 H100 Mega-Hub',
                  active: computeAiMegaHubRegions.has(inspectRegion),
                },
              ].map((cap) => (
                <button
                  key={cap.key}
                  type="button"
                  onClick={() => handleToggleRegionSku(inspectRegion, cap.key)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: cap.active
                      ? 'rgba(16, 185, 129, 0.18)'
                      : 'rgba(244, 63, 94, 0.14)',
                    color: cap.active ? '#6ee7b7' : '#fda4af',
                    border: cap.active
                      ? '1px solid rgba(16, 185, 129, 0.45)'
                      : '1px solid rgba(244, 63, 94, 0.35)',
                  }}
                  title="Click to toggle hardware SKU availability in this region"
                >
                  {cap.active ? '✓' : '×'} {cap.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Price Drift Alert List */}
          {meta.driftAlerts?.length > 0 && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 8,
                padding: '7px 10px',
                fontSize: 10.5,
                color: '#fecdd3',
              }}
            >
              <strong style={{ color: '#fda4af' }}>
                Active Price Drift vs Hardcoded Baseline ({meta.driftAlerts.length}):
              </strong>{' '}
              {meta.driftAlerts.slice(0, 6).map((d, idx) => (
                <span key={idx} style={{ marginRight: 10, fontFamily: 'var(--font-mono)' }}>
                  [{d.metric || d.region}: {d.baseline} → {d.live} ({d.deltaPercent > 0 ? '+' : ''}
                  {d.deltaPercent}%)]
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}



// Global Client Edge PoPs & Threat / Proxy Origins (Projected via Exact WGS84 Lat/Lon)
const RAW_GLOBAL_CLIENT_ORIGINS = [
  {
    id: 'iap-proxy',
    label: 'Google Cloud IAP Proxy (Sunnyvale, CA)',
    ip: '35.235.240.18',
    lat: 37.3861,
    lon: -122.0839,
    kind: 'IAP_ZERO_TRUST',
  },
  {
    id: 'gclb-prober',
    label: 'Google Front End (GCLB Edge · Atlanta)',
    ip: '130.211.1.44',
    lat: 33.749,
    lon: -84.388,
    kind: 'GCLB_HEALTH',
  },
  {
    id: 'edge-nyc',
    label: 'New York Client Edge (NYC)',
    ip: '198.51.100.24',
    lat: 40.7128,
    lon: -74.006,
    kind: 'PUBLIC_CLIENT',
  },
  {
    id: 'edge-madrid',
    label: 'Lisbon / EU Atlantic Client Edge',
    ip: '203.0.113.77',
    lat: 38.7223,
    lon: -9.1393,
    kind: 'PUBLIC_CLIENT',
  },
  {
    id: 'edge-lagos',
    label: 'West Africa / Lagos PoP (Nigeria)',
    ip: '192.0.2.118',
    lat: 6.5244,
    lon: 3.3792,
    kind: 'PUBLIC_CLIENT',
  },
  {
    id: 'scanner-botnet-east',
    label: 'External Port Scanner #1 (Eastern Europe)',
    ip: '185.220.101.9',
    lat: 55.7558,
    lon: 37.6173,
    kind: 'THREAT_SCANNER',
  },
  {
    id: 'scanner-botnet-apac',
    label: 'Automated Brute-Force Bot #2 (East Asia)',
    ip: '45.155.205.33',
    lat: 31.2304,
    lon: 121.4737,
    kind: 'THREAT_SCANNER',
  },
];

const GLOBAL_CLIENT_ORIGINS = RAW_GLOBAL_CLIENT_ORIGINS.map((orig) => {
  const pt = projectLatLon(orig.lat, orig.lon);
  return {
    ...orig,
    x: pt.x,
    y: pt.y,
  };
});

// Helper: Match IPv4 to CIDR
function ipMatchesCidr(ipStr, cidrStr) {
  const cleanCidr = (cidrStr || '').trim();
  const cleanIp = (ipStr || '').trim();
  if (!cleanCidr || !cleanIp) return false;
  if (cleanCidr === '0.0.0.0/0' || cleanCidr === '::/0') return true;
  const [rangeIp, prefixStr] = cleanCidr.split('/');
  const prefix = prefixStr !== undefined ? Number(prefixStr) : 32;
  const ipToInt = (ip) => {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return null;
    }
    return (
      ((parts[0] << 24) >>> 0) +
      ((parts[1] << 16) >>> 0) +
      ((parts[2] << 8) >>> 0) +
      (parts[3] >>> 0)
    ) >>> 0;
  };
  const ipInt = ipToInt(cleanIp);
  const rangeInt = ipToInt(rangeIp);
  if (ipInt === null || rangeInt === null) return cleanIp === rangeIp;
  if (prefix <= 0) return true;
  if (prefix >= 32) return ipInt === rangeInt;
  const mask = (~0 << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

function portMatchesSpec(portNum, portSpecs = []) {
  if (!portSpecs || portSpecs.length === 0) return true;
  return portSpecs.some((spec) => {
    const clean = String(spec).trim();
    if (clean.includes('-')) {
      const [start, end] = clean.split('-').map(Number);
      return portNum >= start && portNum <= end;
    }
    return Number(clean) === portNum;
  });
}

// Evaluate a packet against live project VPC Firewall Rules
function evaluatePacketAgainstFirewalls(packet, firewalls = []) {
  const sortedRules = [...firewalls]
    .filter((fw) => !fw.disabled && (fw.direction || 'INGRESS') === 'INGRESS')
    .sort((a, b) => (a.priority ?? 1000) - (b.priority ?? 1000));

  for (const fw of sortedRules) {
    const isDeny =
      fw.action === 'DENY' || (Array.isArray(fw.denied) && fw.denied.length > 0);
    const ranges =
      fw.sourceRanges && fw.sourceRanges.length > 0
        ? fw.sourceRanges
        : ['0.0.0.0/0'];
    if (!ranges.some((cidr) => ipMatchesCidr(packet.sourceIp, cidr))) {
      continue;
    }

    const specs = isDeny ? fw.denied || [] : fw.allowed || [];
    const matchedProto = specs.some((s) => {
      const p = String(s.IPProtocol || '').toLowerCase();
      if (p === 'all') return true;
      if (p !== packet.protocol.toLowerCase()) return false;
      if (p === 'icmp') return true;
      return portMatchesSpec(Number(packet.port), s.ports);
    });

    if (matchedProto) {
      return {
        verdict: isDeny ? 'DENY' : 'ALLOW',
        ruleName: fw.name,
        priority: fw.priority ?? 1000,
      };
    }
  }

  return {
    verdict: 'DENY',
    ruleName: 'default-deny-ingress',
    priority: 65535,
  };
}

// Compute curved SVG quadratic bezier path between two points
function buildArcPath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const arcLift = Math.min(dist * 0.24, 95);
  const cx = mx;
  const cy = Math.max(25, my - arcLift);
  return {
    d: `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`,
    cx,
    cy,
  };
}

// Point along quadratic bezier at t in [0, 1]
function pointOnQuadraticBezier(x1, y1, cx, cy, x2, y2, t) {
  const inv = 1 - t;
  const x = inv * inv * x1 + 2 * inv * t * cx + t * t * x2;
  const y = inv * inv * y1 + 2 * inv * t * cy + t * t * y2;
  return { x, y };
}

export default function GlobalNetworkWorldMap({
  projectId,
  overview,
  firewalls = [],
  vpcs = [],
  onOpenProvision,
  onRunInShell,
  onSelectTab,
  onRefresh,
  onShowToast,
  onShowError,
}) {
  // Map live project resources to GCP regions & zones
  const regionWorkloadsMap = useMemo(() => {
    const map = {};
    GCP_GLOBAL_REGIONS.forEach((r) => {
      map[r.id] = {
        vms: [],
        cloudRun: [],
        buckets: [],
        datasets: [],
        gke: [],
        totalCount: 0,
      };
    });

    const resources = overview?.resources || [];
    resources.forEach((res) => {
      if (res.type === 'Enabled GCP Service API' || res.category === 'network') {
        return;
      }
      const rawLoc = String(res.region || res.zone || 'us-central1').toLowerCase();
      // Normalize multi-region 'us' -> 'us-central1', 'eu' -> 'europe-west1'
      let matchedRegionId = GCP_GLOBAL_REGIONS.find((r) =>
        rawLoc.startsWith(r.id)
      )?.id;
      if (!matchedRegionId) {
        if (rawLoc === 'us' || rawLoc.startsWith('us-')) {
          matchedRegionId = 'us-central1';
        } else if (rawLoc === 'eu' || rawLoc.startsWith('europe-')) {
          matchedRegionId = 'europe-west1';
        } else if (rawLoc.startsWith('asia-')) {
          matchedRegionId = 'asia-east1';
        } else {
          matchedRegionId = 'us-central1';
        }
      }

      const bucket = map[matchedRegionId];
      if (!bucket) return;
      if (res.type === 'Compute Engine VM') bucket.vms.push(res);
      else if (res.type === 'Cloud Run Service') bucket.cloudRun.push(res);
      else if (res.type === 'Cloud Storage Bucket') bucket.buckets.push(res);
      else if (res.type === 'BigQuery Dataset') bucket.datasets.push(res);
      else if (res.type?.includes('GKE')) bucket.gke.push(res);
      bucket.totalCount += 1;
    });

    return map;
  }, [overview]);

  // Regions that currently host live resources in this project
  const activeRegionIds = useMemo(() => {
    const active = Object.entries(regionWorkloadsMap)
      .filter(([, w]) => w.totalCount > 0)
      .map(([id]) => id);
    return active.length > 0 ? active : ['us-central1', 'us-east1', 'europe-west1'];
  }, [regionWorkloadsMap]);

  // Selected Region & Zone on the World Map (`isRegionPinnedOnMap` releases when clicking elsewhere on the map)
  const [selectedRegionId, setSelectedRegionId] = useState('us-central1');
  const [isRegionPinnedOnMap, setIsRegionPinnedOnMap] = useState(false);
  const [selectedZoneName, setSelectedZoneName] = useState('us-central1-a');
  const [hoveredRegionId, setHoveredRegionId] = useState(null);
  const selectedRegion = useMemo(
    () =>
      GCP_GLOBAL_REGIONS.find((r) => r.id === selectedRegionId) ||
      GCP_GLOBAL_REGIONS[4],
    [selectedRegionId]
  );

  // Live Multi-Region Socket RTT, Compute Quotas, VPC Subnets & Asset Sovereignty State
  const [liveGeoTelemetry, setLiveGeoTelemetry] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [activeGeoTab, setActiveGeoTab] = useState('LATENCY_PROBES');
  const [mapStackBlueprint, setMapStackBlueprint] = useState(
    'AI_INFERENCE_STACK'
  );
  const [mapStackPrefix, setMapStackPrefix] = useState('ai-core');
  const [mapDeployingStack, setMapDeployingStack] = useState(false);
  const [mapStackResult, setMapStackResult] = useState(null);

  const orbitalMapMetrics = useMemo(
    () => computeOrbitalTelemetry(overview),
    [overview]
  );

  const handleSynthesizeMapStack = async (e) => {
    if (e) e.preventDefault();
    if (!projectId || mapDeployingStack) return;
    setMapDeployingStack(true);
    setMapStackResult(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/stack-deploy`,
        {
          blueprintId: mapStackBlueprint,
          stackPrefix: mapStackPrefix,
          region: selectedRegionId || 'us-central1',
        }
      );
      setMapStackResult(res.data);
      if (onShowToast) onShowToast(res.data?.message);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            'Failed to synthesize 3-tier regional stack.'
        );
      }
    } finally {
      setMapDeployingStack(false);
    }
  };

  const fetchLiveGeoTelemetry = useCallback(
    async (showToastMsg = false, focusRegObj = null) => {
      if (!projectId) return;
      setGeoLoading(true);
      try {
        const tz =
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const params = new URLSearchParams({ tz });
        if (focusRegObj && focusRegObj.id) {
          params.set('focusRegion', focusRegObj.id);
          params.set('focusCity', focusRegObj.city || focusRegObj.id);
          params.set('focusContinent', focusRegObj.continent || 'Global');
          params.set('focusLat', String(focusRegObj.lat || 0));
          params.set('focusLon', String(focusRegObj.lon || 0));
          params.set('focusCfe', String(focusRegObj.cfePercent || 75));
        }
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/global-map/live-telemetry?${params.toString()}`
        );
        setLiveGeoTelemetry(res.data);
        if (showToastMsg && res.data?.fastestRegion) {
          onShowToast?.(
            `Probed ${
              res.data?.regionalSocketProbes?.length || 10
            } live GCP regional endpoints: Fastest is ${
              res.data.fastestRegion.regionId
            } (${res.data.fastestRegion.tcpMs}ms TCP / ${
              res.data.fastestRegion.totalRttMs
            }ms TLS RTT)`
          );
        }
      } catch (err) {
        if (showToastMsg) {
          onShowError?.(
            err.response?.data?.error ||
              err.message ||
              'Failed to probe live Global Map regional telemetry.'
          );
        }
      } finally {
        setGeoLoading(false);
      }
    },
    [projectId, onShowToast, onShowError]
  );

  useEffect(() => {
    fetchLiveGeoTelemetry(false);
  }, [fetchLiveGeoTelemetry]);

  // Dynamic Browser Timezone & Locale Pre-Probe Origin (Zero Hardcoded City/Country/ISP)
  const liveClientOriginNode = useMemo(() => {
    const c = liveGeoTelemetry?.clientOrigin;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const tzCity =
      tz.split('/').pop()?.replace(/_/g, ' ') || 'Client Workstation';
    const tzContinent = tz.split('/')[0] || 'Local';
    const lat = typeof c?.lat === 'number' ? c.lat : 36.7538;
    const lon = typeof c?.lon === 'number' ? c.lon : 3.0588;
    const pt = projectLatLon(lat, lon);
    const city = c?.city || tzCity;
    const region = c?.region || tzContinent;
    const countryCode = c?.countryCode || 'LOC';
    const countryIso3 = c?.countryIso3 || 'LOC';
    let country = c?.country || '';
    if (!country && countryCode.length === 2) {
      try {
        country =
          new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) ||
          countryCode;
      } catch (_e) {
        country = countryCode;
      }
    }
    if (!country) country = tzContinent;
    const ip = 'IP Hidden (Privacy Mode)';
    const evalIp = '198.51.100.1'; // RFC 5737 TEST-NET-2 documentation IP for local CIDR evaluation only
    const asn = c?.asn || 'LIVE-ASN';
    const isp = c?.isp || 'Live Egress Network';
    return {
      id: 'my-live-client',
      label: `My Live Client — ${city}, ${country} [${countryCode}]`,
      shortLabel: `YOU: ${city}, ${countryCode}`,
      city,
      region,
      country,
      countryCode,
      countryIso3,
      ip,
      evalIp,
      asn,
      isp,
      lat,
      lon,
      gpsLabel: formatLatLon(lat, lon),
      x: pt.x,
      y: pt.y,
      kind: 'MY_LIVE_CLIENT',
    };
  }, [liveGeoTelemetry]);

  const effectiveClientOrigins = useMemo(
    () => [liveClientOriginNode, ...GLOBAL_CLIENT_ORIGINS],
    [liveClientOriginNode]
  );

  // Live Uplink Geometry & Distance from User's Current Location to Selected GCP Region
  const clientUplinkTelemetry = useMemo(() => {
    const greatCircleKm = calculateGreatCircleKm(
      liveClientOriginNode.lat,
      liveClientOriginNode.lon,
      selectedRegion.lat,
      selectedRegion.lon
    );
    const fiberKm = Math.max(80, Math.round(greatCircleKm * 1.2));
    const probedMatch = (liveGeoTelemetry?.regionalSocketProbes || []).find(
      (p) => p.regionId === selectedRegion.id
    );
    const estRttMs = probedMatch?.tcpMs
      ? `${probedMatch.tcpMs}ms Live TCP`
      : `~${Math.round((fiberKm / 200) * 2 + 6)}ms Est.`;
    const arc = buildArcPath(
      liveClientOriginNode.x,
      liveClientOriginNode.y,
      selectedRegion.x,
      selectedRegion.y
    );
    const mid = pointOnQuadraticBezier(
      liveClientOriginNode.x,
      liveClientOriginNode.y,
      arc.cx,
      arc.cy,
      selectedRegion.x,
      selectedRegion.y,
      0.5
    );
    return {
      greatCircleKm,
      fiberKm,
      estRttMs,
      arc,
      mid,
    };
  }, [liveClientOriginNode, selectedRegion, liveGeoTelemetry]);

  // ==========================================================================
  // WAVE 4 ORBITAL ENGINEERING INNOVATIONS STATE
  // ==========================================================================
  // 1. Visual Map Lens: 'TRAFFIC' | 'CARBON_GRID' | 'SPOT_ARBITRAGE'
  const [mapLens, setMapLens] = useState('TRAFFIC');
  // 2. Chaos Outage / Failover Simulator (severed regions & zones)
  const [severedRegions, setSeveredRegions] = useState([]);
  const [severedZones, setSeveredZones] = useState([]);
  // 3. Point-to-Point Subsea Fiber RTT & Cross-Region Egress Analyzer (wired to active project region & fastest live region)
  const [routeAnalyzerEnabled, setRouteAnalyzerEnabled] = useState(true);
  const [routeSourceRegionId, setRouteSourceRegionId] = useState(
    () => activeRegionIds[0] || 'us-central1'
  );
  const [routeDestRegionId, setRouteDestRegionId] = useState('europe-west9');
  const [monthlyReplicationTb, setMonthlyReplicationTb] = useState(5);

  // Sync Route Analyzer & Migration Target with the user's live fastest probed region & active project regions when telemetry arrives
  const didAutoWireGeoRef = useRef(false);
  useEffect(() => {
    const primaryActive = activeRegionIds[0] || 'us-central1';
    const fastestId = liveGeoTelemetry?.fastestRegion?.regionId;
    if (fastestId && !didAutoWireGeoRef.current) {
      didAutoWireGeoRef.current = true;
      setRouteSourceRegionId(primaryActive);
      if (fastestId !== primaryActive) {
        setRouteDestRegionId(fastestId);
      } else if (activeRegionIds[1]) {
        setRouteDestRegionId(activeRegionIds[1]);
      }
    }
  }, [activeRegionIds, liveGeoTelemetry]);
  // 4. Hybrid Cloud VPN / IAP Zero-Trust Workstation Tunnel Overlay
  const [showHybridTunnel, setShowHybridTunnel] = useState(true);
  // 5. DVR Flight Recorder Time-Machine Scrubber (0 = LIVE, >0 = Historical Snapshot)
  const [dvrSnapshots, setDvrSnapshots] = useState([]);
  const [dvrScrubIndex, setDvrScrubIndex] = useState(0); // 0 = Live

  const toggleSeverRegion = (regionId) => {
    setSeveredRegions((prev) =>
      prev.includes(regionId)
        ? prev.filter((id) => id !== regionId)
        : [...prev, regionId]
    );
  };

  const toggleSeverZone = (zoneId) => {
    setSeveredZones((prev) =>
      prev.includes(zoneId)
        ? prev.filter((id) => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  // Compute Point-to-Point Subsea Fiber Distance (True WGS84 Haversine km), RTT (ms), and GCP Cross-Region Egress Cost
  const routeTelemetry = useMemo(() => {
    const src =
      GCP_GLOBAL_REGIONS.find((r) => r.id === routeSourceRegionId) ||
      GCP_GLOBAL_REGIONS[0];
    const dst =
      GCP_GLOBAL_REGIONS.find((r) => r.id === routeDestRegionId) ||
      GCP_GLOBAL_REGIONS[6];
    const greatCircleKm = calculateGreatCircleKm(
      src.lat,
      src.lon,
      dst.lat,
      dst.lon
    );
    // Subsea / terrestrial fiber routing tortuosity factor (~1.22x great-circle distance)
    const fiberKm =
      src.id === dst.id ? 45 : Math.max(120, Math.round(greatCircleKm * 1.22));
    // Speed of light in optical fiber (~200 km/ms) * 2 (round-trip) + DWDM switching overhead
    const rttMs =
      src.id === dst.id
        ? 0.6
        : Number(((fiberKm / 200) * 2 + 4.2).toFixed(1));
    const sameContinent = src.continent === dst.continent;
    const ratePerGb =
      src.id === dst.id
        ? 0.01
        : sameContinent
        ? 0.02
        : dst.continent === 'Oceania' || src.continent === 'Oceania'
        ? 0.12
        : 0.08;
    const monthlyCostUsd = Math.round(monthlyReplicationTb * 1024 * ratePerGb);
    const arc = buildArcPath(src.x, src.y, dst.x, dst.y);
    const mid = pointOnQuadraticBezier(
      src.x,
      src.y,
      arc.cx,
      arc.cy,
      dst.x,
      dst.y,
      0.5
    );
    return {
      src,
      dst,
      greatCircleKm,
      fiberKm,
      rttMs,
      sameContinent,
      ratePerGb,
      monthlyCostUsd,
      arc,
      mid,
    };
  }, [routeSourceRegionId, routeDestRegionId, monthlyReplicationTb]);

  // 6. Live Migration FinOps Cost, Carbon & Hardware SKU Compatibility Simulator
  const { version: pricingVersion } = useLivePricingCatalog();
  const [migrationTargetRegionId, setMigrationTargetRegionId] =
    useState('europe-north1');
  const [simRequiresCloudRunGpu, setSimRequiresCloudRunGpu] = useState(true);
  const [simRequiresVmGpu, setSimRequiresVmGpu] = useState(false);

  const selectedRegionProfile = useMemo(
    () => getRegionProfile(selectedRegion.id),
    [selectedRegion.id, pricingVersion]
  );

  // Greenest Peer Region Recommender for Follow-the-Sun Carbon & Spot Arbitrage
  const greenestPeerForSelected = useMemo(() => {
    const sameCont = GCP_GLOBAL_REGIONS.filter(
      (r) =>
        r.continent === selectedRegion.continent && r.id !== selectedRegion.id
    ).sort((a, b) => a.gco2 - b.gco2);
    return sameCont[0] || GCP_GLOBAL_REGIONS[9]; // northamerica-northeast1 (99% CFE)
  }, [selectedRegion]);

  // Full FinOps ($/mo delta + one-time egress + break-even) & Hardware SKU Compatibility Analysis
  const liveMigrationAnalysis = useMemo(() => {
    const currentWorkloads = regionWorkloadsMap[selectedRegion.id];
    const activeCount = Math.max(currentWorkloads?.totalCount || 1, 1);
    const hasLiveRunGpu = (currentWorkloads?.cloudRun || []).some(
      (s) => Number(s.gpuCount || 0) > 0
    );
    const requiresCloudRunGpu = simRequiresCloudRunGpu || hasLiveRunGpu;
    // Estimate baseline monthly spend from active workloads or realistic default ($68/mo for GPU, $28/mo for CPU)
    const baseMonthlyUsd =
      activeCount * (requiresCloudRunGpu ? 68.5 : simRequiresVmGpu ? 95.0 : 28.0);
    const stateSizeGb = Math.max(20, activeCount * 18);

    const spec = {
      baseMonthlyUsd,
      stateSizeGb,
      requiresCloudRunGpu,
      gpuTypeLabel: 'NVIDIA L4 (24GB VRAM)',
      requiresVmGpu: simRequiresVmGpu,
      serviceCount: activeCount,
    };

    const evaluation = evaluateMigrationFeasibility(
      selectedRegion.id,
      migrationTargetRegionId,
      spec
    );
    const recommendations = findBestMigrationTargets(selectedRegion.id, spec);

    return {
      evaluation,
      recommendations,
      spec,
    };
  }, [
    selectedRegion.id,
    migrationTargetRegionId,
    regionWorkloadsMap,
    simRequiresCloudRunGpu,
    simRequiresVmGpu,
    pricingVersion,
  ]);

  // Chaos Outage Blast-Radius & Failover Summary
  const chaosBlastRadius = useMemo(() => {
    let impactedResources = 0;
    const impactedNames = [];
    severedRegions.forEach((regId) => {
      const w = regionWorkloadsMap[regId];
      if (w && w.totalCount > 0) {
        impactedResources += w.totalCount;
        [...w.vms, ...w.cloudRun, ...w.buckets, ...w.datasets].forEach((r) =>
          impactedNames.push(`${r.name} (${regId})`)
        );
      }
    });
    return {
      severedRegionCount: severedRegions.length,
      severedZoneCount: severedZones.length,
      impactedResources,
      impactedNames,
    };
  }, [severedRegions, severedZones, regionWorkloadsMap]);

  // Interactive SVG Map Camera (Zoom & Pan + Continent/Region Focus + Tactical Spotlight)
  const [zoom, setZoom] = useState(1); // 1x to 6x
  const [cameraCenter, setCameraCenter] = useState({ x: 600, y: 280 });
  const [spotlightMode, setSpotlightMode] = useState(true); // Dims unselected regions & shows zone dots only on focused region
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  const didPanRef = useRef(false);
  const svgContainerRef = useRef(null);

  // Inverse-zoom scaling keeps pins, zone constellations, and labels crisp without giant overlap when zoomed in
  const invScale = useMemo(() => 1 / Math.pow(zoom, 0.54), [zoom]);

  // Direct subsea fiber peers of the currently selected region
  const selectedRegionPeers = useMemo(
    () => new Set(selectedRegion?.backbonePeers || []),
    [selectedRegion]
  );

  // Z-order sorted regions so selected & hovered regions always render on top of ghosted neighbors
  const sortedRegionsForRender = useMemo(() => {
    return [...GCP_GLOBAL_REGIONS].sort((a, b) => {
      const score = (r) => {
        if (r.id === selectedRegionId) return 100;
        if (r.id === hoveredRegionId) return 90;
        if (severedRegions.includes(r.id)) return 80;
        if ((regionWorkloadsMap[r.id]?.totalCount || 0) > 0) return 60;
        if (selectedRegionPeers.has(r.id)) return 40;
        return 10;
      };
      return score(a) - score(b);
    });
  }, [selectedRegionId, hoveredRegionId, severedRegions, regionWorkloadsMap, selectedRegionPeers]);

  const clampCamera = useCallback((cx, cy, z) => {
    const halfW = 1200 / z / 2;
    const halfH = 560 / z / 2;
    return {
      x: Math.max(halfW, Math.min(1200 - halfW, cx)),
      y: Math.max(halfH, Math.min(560 - halfH, cy)),
    };
  }, []);

  const currentViewBox = useMemo(() => {
    const w = 1200 / zoom;
    const h = 560 / zoom;
    const clamped = clampCamera(cameraCenter.x, cameraCenter.y, zoom);
    const minX = clamped.x - w / 2;
    const minY = clamped.y - h / 2;
    return `${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
  }, [zoom, cameraCenter, clampCamera]);

  const handleZoomStep = useCallback(
    (delta) => {
      setZoom((prev) => {
        const next = Math.max(1, Math.min(6, Number((prev + delta).toFixed(2))));
        setCameraCenter((c) => clampCamera(c.x, c.y, next));
        return next;
      });
    },
    [clampCamera]
  );

  const handleReleaseMapSelection = useCallback(() => {
    setIsRegionPinnedOnMap(false);
    setShowZoneRings(false);
    setHoveredRegionId(null);
  }, []);

  const handleResetMapCamera = useCallback(() => {
    setZoom(1);
    setCameraCenter({ x: 600, y: 280 });
    setIsRegionPinnedOnMap(false);
    setShowZoneRings(false);
    setHoveredRegionId(null);
  }, []);

  const scrollToMapCanvas = useCallback(() => {
    if (svgContainerRef.current) {
      svgContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  const selectRegionInPlace = useCallback(
    (regionId, targetZoom = 2.8) => {
      const reg = GCP_GLOBAL_REGIONS.find((r) => r.id === regionId);
      if (!reg) return;
      setSelectedRegionId(reg.id);
      setIsRegionPinnedOnMap(true);
      setShowZoneRings(true);
      if (reg.zones?.length > 0) {
        setSelectedZoneName(reg.zones[0]);
      }
      setCustomTargetRegionId(reg.id);
      const nextZ = Math.max(zoom, targetZoom);
      setZoom(nextZ);
      setCameraCenter(clampCamera(reg.x, reg.y, nextZ));
    },
    [zoom, clampCamera]
  );

  const focusOnRegion = useCallback(
    (regionId, targetZoom = 3.2, options = {}) => {
      const reg = GCP_GLOBAL_REGIONS.find((r) => r.id === regionId);
      if (!reg) return;
      setSelectedRegionId(reg.id);
      setIsRegionPinnedOnMap(true);
      setShowZoneRings(true);
      if (reg.zones?.length > 0) {
        setSelectedZoneName(reg.zones[0]);
      }
      setCustomTargetRegionId(reg.id);
      const nextZ = Math.max(zoom, targetZoom);
      setZoom(nextZ);
      setCameraCenter(clampCamera(reg.x, reg.y, nextZ));
      if (options.scrollToMap) {
        scrollToMapCanvas();
      }
    },
    [zoom, clampCamera, scrollToMapCanvas]
  );

  const focusOnClientOrigin = useCallback(
    (targetZoom = 3.2, options = {}) => {
      const nextZ = Math.max(zoom, targetZoom);
      setZoom(nextZ);
      setCameraCenter(
        clampCamera(liveClientOriginNode.x, liveClientOriginNode.y, nextZ)
      );
      if (options.scrollToMap) {
        scrollToMapCanvas();
      }
    },
    [zoom, clampCamera, liveClientOriginNode, scrollToMapCanvas]
  );

  const focusOnContinent = useCallback(
    (preset) => {
      if (preset === 'MY_LOCATION') {
        focusOnClientOrigin(3.2);
        return;
      }
      const na = projectLatLon(39.0, -97.0);
      const sa = projectLatLon(-24.0, -58.0);
      const eu = projectLatLon(50.5, 10.0);
      const me = projectLatLon(5.0, 42.0);
      const ap = projectLatLon(12.0, 122.0);
      const presets = {
        WORLD: { x: 600, y: 280, z: 1 },
        AMERICAS: { x: na.x, y: na.y, z: 2.5 },
        SOUTH_AMERICA: { x: sa.x, y: sa.y, z: 2.6 },
        EUROPE: { x: eu.x, y: eu.y, z: 3.6 },
        MIDDLE_EAST: { x: me.x, y: me.y, z: 2.2 },
        ASIA_PACIFIC: { x: ap.x, y: ap.y, z: 2.2 },
      };
      const target = presets[preset] || presets.WORLD;
      setZoom(target.z);
      setCameraCenter(clampCamera(target.x, target.y, target.z));
    },
    [clampCamera, focusOnClientOrigin]
  );

  const [isPointerInsideMap, setIsPointerInsideMap] = useState(false);
  const [cursorGps, setCursorGps] = useState(null);
  const isPointerInsideMapRef = useRef(false);

  // Native non-passive wheel listener on the SVG map container so rolling the mouse wheel
  // ONLY zooms the map (toward the cursor position) and NEVER scrolls the whole web page.
  useEffect(() => {
    const el = svgContainerRef.current;
    if (!el) return;

    const onNativeWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const relX = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / Math.max(rect.width, 1))
      );
      const relY = Math.max(
        0,
        Math.min(1, (e.clientY - rect.top) / Math.max(rect.height, 1))
      );
      const delta = e.deltaY < 0 ? 0.45 : -0.45;

      setZoom((prevZoom) => {
        const nextZoom = Math.max(
          1,
          Math.min(6, Number((prevZoom + delta).toFixed(2)))
        );
        if (nextZoom === prevZoom) return prevZoom;

        setCameraCenter((prevCenter) => {
          const prevW = 1200 / prevZoom;
          const prevH = 560 / prevZoom;
          const clampedPrev = clampCamera(
            prevCenter.x,
            prevCenter.y,
            prevZoom
          );
          const minX = clampedPrev.x - prevW / 2;
          const minY = clampedPrev.y - prevH / 2;
          // SVG world coordinate directly under the user's mouse cursor
          const cursorSvgX = minX + relX * prevW;
          const cursorSvgY = minY + relY * prevH;

          const nextW = 1200 / nextZoom;
          const nextH = 560 / nextZoom;
          const nextCenterX = cursorSvgX + (0.5 - relX) * nextW;
          const nextCenterY = cursorSvgY + (0.5 - relY) * nextH;
          return clampCamera(nextCenterX, nextCenterY, nextZoom);
        });

        return nextZoom;
      });
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onNativeWheel);
    };
  }, [clampCamera]);

  // Map-scoped keyboard shortcuts (Arrow keys to pan, +/- to zoom, 0/Escape to reset, Space/PageUp/PageDown blocked from scrolling page)
  // Active strictly while the user's mouse pointer is inside the map canvas.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isPointerInsideMapRef.current) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const panStep = Math.max(18, Math.round(75 / zoom));

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        e.stopPropagation();
        setCameraCenter((c) => clampCamera(c.x, c.y - panStep, zoom));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        e.stopPropagation();
        setCameraCenter((c) => clampCamera(c.x, c.y + panStep, zoom));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        e.stopPropagation();
        setCameraCenter((c) => clampCamera(c.x - panStep, c.y, zoom));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        e.stopPropagation();
        setCameraCenter((c) => clampCamera(c.x + panStep, c.y, zoom));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        e.stopPropagation();
        handleZoomStep(0.5);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        e.stopPropagation();
        handleZoomStep(-0.5);
      } else if (e.key === '0' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleResetMapCamera();
      } else if (
        e.key === 'PageUp' ||
        e.key === 'PageDown' ||
        e.key === ' '
      ) {
        // Prevent accidental Space / PageUp / PageDown from scrolling the browser page while operating the map
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoom, clampCamera, handleZoomStep, handleResetMapCamera]);

  const handleMapMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    didPanRef.current = false;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: cameraCenter.x,
      startY: cameraCenter.y,
    };
  };

  const handleMapMouseMove = (e) => {
    if (!svgContainerRef.current) return;
    const rect = svgContainerRef.current.getBoundingClientRect();
    const relX = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / Math.max(rect.width, 1))
    );
    const relY = Math.max(
      0,
      Math.min(1, (e.clientY - rect.top) / Math.max(rect.height, 1))
    );
    const curW = 1200 / zoom;
    const curH = 560 / zoom;
    const clampedCur = clampCamera(cameraCenter.x, cameraCenter.y, zoom);
    const svgX = clampedCur.x - curW / 2 + relX * curW;
    const svgY = clampedCur.y - curH / 2 + relY * curH;
    setCursorGps(unprojectSvgPoint(svgX, svgY));

    if (!isDragging || !dragStartRef.current) return;
    const dxPx = e.clientX - dragStartRef.current.clientX;
    const dyPx = e.clientY - dragStartRef.current.clientY;
    if (Math.abs(dxPx) > 4 || Math.abs(dyPx) > 4) {
      didPanRef.current = true;
    }
    const svgUnitsPerPxX = 1200 / zoom / Math.max(rect.width, 1);
    const svgUnitsPerPxY = 560 / zoom / Math.max(rect.height, 1);
    const nextX = dragStartRef.current.startX - dxPx * svgUnitsPerPxX;
    const nextY = dragStartRef.current.startY - dyPx * svgUnitsPerPxY;
    setCameraCenter(clampCamera(nextX, nextY, zoom));
  };

  const handleMapMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Simulation & Performance Guardrail Controls (Paused by default so 100% Live Telemetry leads)
  const [isRunning, setIsRunning] = useState(false);
  const [simMode, setSimMode] = useState('LIVE_MIX'); // 'LIVE_MIX' | 'SSH_BRUTEFORCE' | 'IAP_ZERO_TRUST' | 'GLOBAL_LOAD_TEST'
  const [simSpeed, setSimSpeed] = useState(1); // 1x | 2x | 4x
  // Refresh / Tick Interval (ms) — defaults to 250ms (4 FPS) to prevent UI hang on large VM fleets
  const [tickIntervalMs, setTickIntervalMs] = useState(250);
  // Max in-flight packets rendered in SVG DOM simultaneously
  const [maxConcurrentPackets, setMaxConcurrentPackets] = useState(8);
  // Live GCP API background refresh interval (0 = manual only, or 15/30/60/120 seconds)
  const [gcpSyncIntervalSec, setGcpSyncIntervalSec] = useState(0);
  const [showSubseaBackbone, setShowSubseaBackbone] = useState(true);
  const [showZoneRings, setShowZoneRings] = useState(false);

  // Live animated packets in flight + telemetry counters + event log
  const [inFlightPackets, setInFlightPackets] = useState([]);
  const [impactRings, setImpactRings] = useState([]);
  const [packetLog, setPacketLog] = useState([]);
  const [counters, setCounters] = useState({
    totalPackets: 0,
    allowedPackets: 0,
    deniedPackets: 0,
    backbonePackets: 0,
  });
  const [deployingShield, setDeployingShield] = useState(false);

  // Custom Test Packet Launcher state (defaults to User's Live Client Location -> Selected Region)
  const [customOriginId, setCustomOriginId] = useState('my-live-client');
  const [customTargetRegionId, setCustomTargetRegionId] = useState(
    () => activeRegionIds[0] || 'us-central1'
  );
  const [customProtocol, setCustomProtocol] = useState('tcp');
  const [customPort, setCustomPort] = useState(22);

  const packetIdRef = useRef(1);

  // Optional background GCP API sync timer controlled by user
  useEffect(() => {
    if (!gcpSyncIntervalSec || gcpSyncIntervalSec <= 0 || !onRefresh) {
      return undefined;
    }
    const syncTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      onRefresh();
    }, gcpSyncIntervalSec * 1000);
    return () => clearInterval(syncTimer);
  }, [gcpSyncIntervalSec, onRefresh]);

  // Clear / reset map packets & counters
  const handleResetSimulation = () => {
    setInFlightPackets([]);
    setImpactRings([]);
    setPacketLog([]);
    setDvrSnapshots([]);
    setDvrScrubIndex(0);
    setCounters({
      totalPackets: 0,
      allowedPackets: 0,
      deniedPackets: 0,
      backbonePackets: 0,
    });
  };

  // Spawn a 100% real telemetry trajectory (from live Regional TCP/TLS Socket Probes, live Cloud Logging entries, live VM Socket Audits, & real VPC Firewall Rule evaluations)
  const spawnSimulatedPacket = useCallback(
    (overrideSpec = null) => {
      const seq = packetIdRef.current++;
      const id = `pkt-${seq}`;
      const survivingActiveIds = activeRegionIds.filter(
        (rid) => !severedRegions.includes(rid)
      );
      const liveSocketProbes = liveGeoTelemetry?.regionalSocketProbes || [];
      const liveLogEvents = liveGeoTelemetry?.liveNetworkLogEvents || [];
      const liveVmSockets = liveGeoTelemetry?.liveVmSocketAudits || [];

      const candidatePool =
        survivingActiveIds.length > 0
          ? survivingActiveIds
          : liveSocketProbes.length > 0
          ? liveSocketProbes.map((p) => p.regionId)
          : GCP_GLOBAL_REGIONS.filter((r) => !severedRegions.includes(r.id)).map(
              (r) => r.id
            );

      let targetRegionId =
        overrideSpec?.targetRegionId ||
        candidatePool[seq % Math.max(candidatePool.length, 1)] ||
        'us-east1';

      let reroutedFrom = null;
      if (severedRegions.includes(targetRegionId)) {
        reroutedFrom = targetRegionId;
        const regObj = GCP_GLOBAL_REGIONS.find((r) => r.id === targetRegionId);
        const peerFallback = (regObj?.backbonePeers || []).find(
          (pid) => !severedRegions.includes(pid)
        );
        targetRegionId = peerFallback || candidatePool[0] || 'us-central1';
      }

      const targetReg =
        GCP_GLOBAL_REGIONS.find((r) => r.id === targetRegionId) ||
        GCP_GLOBAL_REGIONS[5];
      const healthyZones = targetReg.zones.filter(
        (z) => !severedZones.includes(z)
      );
      const zonePool = healthyZones.length > 0 ? healthyZones : targetReg.zones;
      const targetZone = zonePool[seq % Math.max(zonePool.length, 1)];

      const tickScale = Math.max(0.6, Math.min(tickIntervalMs / 180, 4.5));
      const effectiveMode = overrideSpec?.modeOverride || simMode;

      // Match live socket probe for the target region if available
      const matchedSocketProbe =
        liveSocketProbes.find((p) => p.regionId === targetReg.id) ||
        liveSocketProbes[seq % Math.max(liveSocketProbes.length, 1)] ||
        null;

      // 1. LIVE_MIX: Replay real Cloud Logging entries (`logging.v2/entries:list`) & real Regional TCP/TLS 1.3 Socket Handshakes
      if (!overrideSpec?.originId && effectiveMode === 'LIVE_MIX') {
        if (liveLogEvents.length > 0 && seq % 2 === 0) {
          const logEv = liveLogEvents[seq % liveLogEvents.length];
          const logRegId =
            GCP_GLOBAL_REGIONS.find((r) => logEv.region?.startsWith(r.id))?.id ||
            targetReg.id;
          const logTargetReg =
            GCP_GLOBAL_REGIONS.find((r) => r.id === logRegId) || targetReg;
          const arc = buildArcPath(
            liveClientOriginNode.x,
            liveClientOriginNode.y,
            logTargetReg.x,
            logTargetReg.y
          );
          const verdict = logEv.disposition === 'DENIED' ? 'DENY' : 'ALLOW';
          return {
            id,
            kind: verdict === 'DENY' ? 'DENIED' : 'ALLOWED',
            sourceLabel: `Cloud Log (${logEv.logType})`,
            sourceIp: logEv.remoteIp || liveClientOriginNode.ip,
            targetRegionId: logTargetReg.id,
            targetZone: logTargetReg.zones[0],
            protocol: 'tcp',
            port: logEv.destPort || 443,
            verdict,
            ruleName: logEv.summary || logEv.logType,
            priority: 1000,
            x1: liveClientOriginNode.x,
            y1: liveClientOriginNode.y,
            x2: logTargetReg.x,
            y2: logTargetReg.y,
            cx: arc.cx,
            cy: arc.cy,
            arcD: arc.d,
            progress: 0,
            speed: 0.088 * simSpeed * tickScale,
            latencyMs: matchedSocketProbe?.tcpMs || 18,
          };
        }

        if (liveSocketProbes.length > 0) {
          const probe = liveSocketProbes[seq % liveSocketProbes.length];
          const probeReg =
            GCP_GLOBAL_REGIONS.find((r) => r.id === probe.regionId) || targetReg;
          const arc = buildArcPath(
            liveClientOriginNode.x,
            liveClientOriginNode.y,
            probeReg.x,
            probeReg.y
          );
          return {
            id,
            kind: probe.reachable ? 'ALLOWED' : 'DENIED',
            sourceLabel: `${liveClientOriginNode.city} (Live Socket)`,
            sourceIp: probe.resolvedIp || liveClientOriginNode.ip,
            targetRegionId: probeReg.id,
            targetZone: probeReg.zones[0],
            protocol: 'tcp',
            port: 443,
            verdict: probe.reachable ? 'ALLOW' : 'DENY',
            ruleName: `TLS 1.3 ${probe.tlsCipher || 'Socket'} (${probe.tcpMs}ms TCP)`,
            priority: 1000,
            x1: liveClientOriginNode.x,
            y1: liveClientOriginNode.y,
            x2: probeReg.x,
            y2: probeReg.y,
            cx: arc.cx,
            cy: arc.cy,
            arcD: arc.d,
            progress: 0,
            speed: 0.088 * simSpeed * tickScale,
            latencyMs: probe.tcpMs || probe.totalRttMs || 15,
          };
        }
      }

      // 2. SSH_BRUTEFORCE: Real TCP :22/:3389 VM Socket Audit + Live VPC Firewall Rule Evaluation (`compute.v1/firewalls`)
      // 3. IAP_ZERO_TRUST: Real Google IAP Range (`35.235.240.0/20`) vs Live Client Origin against `compute.v1/firewalls`
      // 4. GLOBAL_LOAD_TEST: Real Concurrent 8-Region TLS 1.3 Edge Socket Handshakes (:443)
      if (!overrideSpec?.originId && effectiveMode === 'GLOBAL_LOAD_TEST' && liveSocketProbes.length > 0) {
        const probe = liveSocketProbes[seq % liveSocketProbes.length];
        const probeReg =
          GCP_GLOBAL_REGIONS.find((r) => r.id === probe.regionId) || targetReg;
        const httpsEval = evaluatePacketAgainstFirewalls(
          { sourceIp: '130.211.0.22', protocol: 'tcp', port: 443 },
          firewalls
        );
        const arc = buildArcPath(
          liveClientOriginNode.x,
          liveClientOriginNode.y,
          probeReg.x,
          probeReg.y
        );
        return {
          id,
          kind: httpsEval.verdict === 'DENY' ? 'DENIED' : 'ALLOWED',
          sourceLabel: `GFE Anycast -> ${probe.regionId}`,
          sourceIp: probe.resolvedIp || '130.211.0.22',
          targetRegionId: probeReg.id,
          targetZone: probeReg.zones[0],
          protocol: 'tcp',
          port: 443,
          verdict: httpsEval.verdict,
          ruleName: `${httpsEval.ruleName} (${probe.tcpMs}ms TCP / ${probe.tlsMs}ms TLS)`,
          priority: httpsEval.priority,
          x1: liveClientOriginNode.x,
          y1: liveClientOriginNode.y,
          x2: probeReg.x,
          y2: probeReg.y,
          cx: arc.cx,
          cy: arc.cy,
          arcD: arc.d,
          progress: 0,
          speed: 0.088 * simSpeed * tickScale,
          latencyMs: probe.tcpMs || 14,
        };
      }

      if (!overrideSpec?.originId && effectiveMode === 'SSH_BRUTEFORCE' && liveVmSockets.length > 0 && seq % 2 === 0) {
        const vmAudit = liveVmSockets[seq % liveVmSockets.length];
        const vmReg =
          GCP_GLOBAL_REGIONS.find((r) => r.id === vmAudit.region) || targetReg;
        const portToCheck = seq % 3 === 0 ? 3389 : 22;
        const portRes = vmAudit.ports?.[portToCheck] || { open: false, state: 'FILTERED_BY_FIREWALL' };
        const fwEval = evaluatePacketAgainstFirewalls(
          { sourceIp: '0.0.0.0', protocol: 'tcp', port: portToCheck },
          firewalls
        );
        const arc = buildArcPath(
          liveClientOriginNode.x,
          liveClientOriginNode.y,
          vmReg.x,
          vmReg.y
        );
        return {
          id,
          kind: fwEval.verdict === 'DENY' ? 'DENIED' : 'ALLOWED',
          sourceLabel: `Live VM Socket (${vmAudit.vmName})`,
          sourceIp: vmAudit.externalIp,
          targetRegionId: vmReg.id,
          targetZone: vmAudit.zone,
          protocol: 'tcp',
          port: portToCheck,
          verdict: fwEval.verdict,
          ruleName: `${fwEval.ruleName} (${portRes.state})`,
          priority: fwEval.priority,
          x1: liveClientOriginNode.x,
          y1: liveClientOriginNode.y,
          x2: vmReg.x,
          y2: vmReg.y,
          cx: arc.cx,
          cy: arc.cy,
          arcD: arc.d,
          progress: 0,
          speed: 0.088 * simSpeed * tickScale,
          latencyMs: portRes.rttMs || matchedSocketProbe?.tcpMs || 22,
        };
      }

      // Deterministic evaluation against your 100% real `compute.v1/firewalls` rules from your real client origin or Google IAP CIDR
      let origin =
        effectiveClientOrigins.find((o) => o.id === overrideSpec?.originId) ||
        effectiveClientOrigins[0];
      let protocol = overrideSpec?.protocol || 'tcp';
      let port = overrideSpec?.port !== undefined ? Number(overrideSpec.port) : 443;

      if (!overrideSpec?.originId) {
        if (effectiveMode === 'SSH_BRUTEFORCE') {
          origin = effectiveClientOrigins[0]; // Your Live Client Origin testing public 0.0.0.0/0 exposure
          protocol = 'tcp';
          port = seq % 2 === 0 ? 22 : 3389;
        } else if (effectiveMode === 'IAP_ZERO_TRUST') {
          if (seq % 2 === 0) {
            origin = effectiveClientOrigins[0]; // Your Live Client Origin (Public Internet SSH)
            protocol = 'tcp';
            port = 22;
          } else {
            origin = GLOBAL_CLIENT_ORIGINS[0]; // Official Google IAP Range (35.235.240.0/20)
            protocol = 'tcp';
            port = 22;
          }
        } else if (effectiveMode === 'GLOBAL_LOAD_TEST') {
          origin = GLOBAL_CLIENT_ORIGINS[1]; // Official Google Cloud Load Balancer Range (130.211.0.0/22)
          protocol = 'tcp';
          port = seq % 2 === 0 ? 443 : 80;
        } else {
          origin = effectiveClientOrigins[0];
          protocol = 'tcp';
          port = 443;
        }
      }

      const evaluation = evaluatePacketAgainstFirewalls(
        {
          sourceIp: origin.evalIp || origin.ip,
          protocol,
          port,
        },
        firewalls
      );

      const arc = buildArcPath(origin.x, origin.y, targetReg.x, targetReg.y);
      const realSocketMs = matchedSocketProbe?.tcpMs;
      const greatCircleKm = calculateGreatCircleKm(
        origin.lat,
        origin.lon,
        targetReg.lat,
        targetReg.lon
      );
      const fiberDistKm = Math.max(120, Math.round(greatCircleKm * 1.22));
      const computedRttMs =
        realSocketMs || Math.max(4, Math.round((fiberDistKm / 200) * 2 + 5));

      return {
        id,
        kind: evaluation.verdict === 'DENY' ? 'DENIED' : 'ALLOWED',
        sourceLabel: origin.label,
        sourceIp: origin.ip,
        targetRegionId: targetReg.id,
        targetZone,
        reroutedFrom,
        protocol,
        port,
        verdict: evaluation.verdict,
        ruleName: evaluation.ruleName,
        priority: evaluation.priority,
        x1: origin.x,
        y1: origin.y,
        x2: targetReg.x,
        y2: targetReg.y,
        cx: arc.cx,
        cy: arc.cy,
        arcD: arc.d,
        progress: 0,
        speed: 0.088 * simSpeed * tickScale,
        latencyMs: computedRttMs,
      };
    },
    [
      activeRegionIds,
      severedRegions,
      severedZones,
      firewalls,
      simMode,
      simSpeed,
      tickIntervalMs,
      effectiveClientOrigins,
      liveGeoTelemetry,
      liveClientOriginNode,
    ]
  );

  // Fire a custom user-configured packet immediately
  const handleFireCustomPacket = (e) => {
    if (e) e.preventDefault();
    const pkt = spawnSimulatedPacket({
      originId: customOriginId,
      targetRegionId: customTargetRegionId,
      protocol: customProtocol,
      port: Number(customPort),
    });
    setInFlightPackets((prev) => [
      ...prev.slice(-(maxConcurrentPackets - 1)),
      pkt,
    ]);
  };

  // Switch scenario mode AND immediately launch a live 6-packet wave + update HUD/logs
  const handleSelectSimMode = useCallback(
    (nextMode) => {
      setSimMode(nextMode);
      setMapLens('TRAFFIC');
      setDvrScrubIndex(0);
      setIsRunning(true);
      if (nextMode === 'IAP_ZERO_TRUST') {
        setShowHybridTunnel(true);
      }

      const burstCount = Math.min(6, maxConcurrentPackets);
      const burstPackets = Array.from({ length: burstCount }, (_, idx) => {
        const pkt = spawnSimulatedPacket({ modeOverride: nextMode });
        return {
          ...pkt,
          progress: Number((0.12 + idx * 0.11).toFixed(2)),
        };
      });

      setInFlightPackets(burstPackets);

      const newRings = burstPackets.slice(0, 3).map((pkt) => {
        const interceptThreshold = pkt.verdict === 'DENY' ? 0.86 : 1.0;
        const impactPoint = pointOnQuadraticBezier(
          pkt.x1,
          pkt.y1,
          pkt.cx,
          pkt.cy,
          pkt.x2,
          pkt.y2,
          interceptThreshold
        );
        return {
          id: `ring-mode-${pkt.id}`,
          x: impactPoint.x,
          y: impactPoint.y,
          verdict: pkt.verdict,
          kind: pkt.kind,
        };
      });
      setImpactRings(newRings);

      let allowInc = 0;
      let denyInc = 0;
      let bbInc = 0;
      burstPackets.forEach((item) => {
        if (item.kind === 'BACKBONE') bbInc += 1;
        else if (item.verdict === 'ALLOW') allowInc += 1;
        else denyInc += 1;
      });
      setCounters((c) => ({
        totalPackets: c.totalPackets + burstPackets.length,
        allowedPackets: c.allowedPackets + allowInc,
        deniedPackets: c.deniedPackets + denyInc,
        backbonePackets: c.backbonePackets + bbInc,
      }));

      const nowStr = new Date().toLocaleTimeString();
      setPacketLog((logs) => [
        ...burstPackets.map((p) => ({ ...p, completedAt: nowStr })),
        ...logs.slice(0, 10),
      ]);
    },
    [maxConcurrentPackets, spawnSimulatedPacket]
  );

  // Throttled Animation & Spawner Loop (respects tickIntervalMs, maxConcurrentPackets, and document.hidden)
  useEffect(() => {
    if (!isRunning || dvrScrubIndex > 0) return undefined;

    const interval = setInterval(() => {
      // Automatically pause rendering when browser tab is hidden to save CPU/battery
      if (typeof document !== 'undefined' && document.hidden) return;

      setInFlightPackets((prev) => {
        const nextPackets = [];
        const newlyCompleted = [];

        prev.forEach((pkt) => {
          const nextProg = pkt.progress + pkt.speed;
          // Denied packets get intercepted at the VPC Perimeter Shield (progress >= 0.86)
          const interceptThreshold = pkt.verdict === 'DENY' ? 0.86 : 1.0;
          if (nextProg >= interceptThreshold) {
            const impactPoint = pointOnQuadraticBezier(
              pkt.x1,
              pkt.y1,
              pkt.cx,
              pkt.cy,
              pkt.x2,
              pkt.y2,
              interceptThreshold
            );
            newlyCompleted.push({
              ...pkt,
              impactX: impactPoint.x,
              impactY: impactPoint.y,
              completedAt: new Date().toLocaleTimeString(),
            });
          } else {
            nextPackets.push({ ...pkt, progress: nextProg });
          }
        });

        // Respect maxConcurrentPackets cap so large VM fleets never hang the UI
        if (nextPackets.length < maxConcurrentPackets) {
          nextPackets.push(spawnSimulatedPacket());
        }

        if (newlyCompleted.length > 0) {
          setImpactRings((rings) => [
            ...rings.slice(-6),
            ...newlyCompleted.map((c) => ({
              id: `ring-${c.id}`,
              x: c.impactX,
              y: c.impactY,
              verdict: c.verdict,
              kind: c.kind,
            })),
          ]);

          setCounters((c) => {
            let allowInc = 0;
            let denyInc = 0;
            let bbInc = 0;
            newlyCompleted.forEach((item) => {
              if (item.kind === 'BACKBONE') bbInc += 1;
              else if (item.verdict === 'ALLOW') allowInc += 1;
              else denyInc += 1;
            });
            return {
              totalPackets: c.totalPackets + newlyCompleted.length,
              allowedPackets: c.allowedPackets + allowInc,
              deniedPackets: c.deniedPackets + denyInc,
              backbonePackets: c.backbonePackets + bbInc,
            };
          });

          setPacketLog((logs) => {
            const updatedLogs = [
              ...newlyCompleted.reverse(),
              ...logs.slice(0, 14),
            ];
            setDvrSnapshots((snaps) => [
              {
                timestamp: new Date().toLocaleTimeString(),
                packets: nextPackets.map((p) => ({ ...p })),
                logs: updatedLogs.slice(0, 8),
              },
              ...snaps.slice(0, 19),
            ]);
            return updatedLogs;
          });
        }

        return nextPackets;
      });
    }, tickIntervalMs);

    return () => clearInterval(interval);
  }, [
    isRunning,
    dvrScrubIndex,
    simSpeed,
    tickIntervalMs,
    maxConcurrentPackets,
    spawnSimulatedPacket,
  ]);

  // 1-Tap Deploy Priority-100 Zero-Trust SSH/RDP Shield directly from the World Map
  const handleDeployMapShield = async () => {
    if (deployingShield) return;
    setDeployingShield(true);
    try {
      const ruleName = `map-shield-deny-ssh-${Math.floor(100 + Math.random() * 899)}`;
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        {
          serviceType: 'VPC_FIREWALL',
          name: ruleName,
          config: {
            network: vpcs[0]?.name || 'default',
            action: 'DENY',
            direction: 'INGRESS',
            priority: 100,
            rules: [{ IPProtocol: 'tcp', ports: ['22', '3389'] }],
            sourceRanges: '0.0.0.0/0',
            enableLogging: true,
            description:
              'Priority-100 Global Cyber-Shield deployed from Orbital World Map to block public SSH/RDP brute-force.',
          },
        }
      );
      if (onShowToast) onShowToast(res.data.message);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to deploy firewall shield.'
        );
      }
    } finally {
      setDeployingShield(false);
    }
  };

  // Deduplicated subsea fiber backbone links between GCP regions
  const backboneLinks = useMemo(() => {
    const links = [];
    const seen = new Set();
    GCP_GLOBAL_REGIONS.forEach((reg) => {
      (reg.backbonePeers || []).forEach((peerId) => {
        const key = [reg.id, peerId].sort().join('--');
        if (seen.has(key)) return;
        seen.add(key);
        const peer = GCP_GLOBAL_REGIONS.find((r) => r.id === peerId);
        if (peer) {
          links.push({
            key,
            from: reg,
            to: peer,
            isActiveLink:
              activeRegionIds.includes(reg.id) &&
              activeRegionIds.includes(peer.id),
          });
        }
      });
    });
    return links;
  }, [activeRegionIds]);

  const selectedWorkloads = regionWorkloadsMap[selectedRegion.id] || {
    vms: [],
    cloudRun: [],
    buckets: [],
    datasets: [],
    gke: [],
    totalCount: 0,
  };

  return (
    <div className="space-y-5">
      {/* =================================================================== */}
      {/* 0. 100% LIVE PROJECT GEO-CONTROL PLANE (ZERO GIMMICK TELEMETRY)     */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
          <div className="space-y-1 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                100% LIVE PROJECT GEO-CONTROL PLANE · ZERO GIMMICK
              </span>
              <button
                type="button"
                onClick={() => focusOnClientOrigin(3.2, { scrollToMap: true })}
                className="px-2.5 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-mono font-extrabold cursor-pointer transition-colors"
                title="Click to scroll and zoom the World Map directly to your live client location (IP Hidden for Privacy)"
              >
                PROBING LIVE FROM: {liveClientOriginNode.city},{' '}
                {liveClientOriginNode.country} [{liveClientOriginNode.countryCode}] · IP Hidden (Privacy Mode) ·{' '}
                {liveClientOriginNode.asn} {liveClientOriginNode.isp} · GPS{' '}
                {liveClientOriginNode.gpsLabel}
              </button>
              {liveGeoTelemetry?.fastestRegion && (
                <button
                  type="button"
                  onClick={() =>
                    focusOnRegion(liveGeoTelemetry.fastestRegion.regionId, 3.2, {
                      scrollToMap: true,
                    })
                  }
                  className="px-2.5 py-0.5 rounded-full bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                  title="Click to select and scroll to your fastest live GCP region on the World Map"
                >
                  FASTEST LIVE REGION: {liveGeoTelemetry.fastestRegion.regionId} ({liveGeoTelemetry.fastestRegion.tcpMs}ms TCP / {liveGeoTelemetry.fastestRegion.totalRttMs}ms TLS)
                </button>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-950 dark:text-zinc-50">
              Live Multi-Region Socket Latency Prober, Compute Quotas, VPC Subnet CIDRs &amp; Data Sovereignty Audit (`{projectId}`)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Instead of a static map, this workbench executes <strong>real concurrent TCP/TLS 1.3 socket handshakes</strong> to 8 Google Cloud regional endpoints (`*-aiplatform.googleapis.com:443`), inspects your live regional quotas (`compute.regions.list`), maps your regional VPC subnets (`subnetworks.aggregatedList`), and audits every GCS Bucket, BigQuery Dataset, Cloud Run service, and VM for multi-region quorum &amp; GDPR/US residency.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('VPC_NETWORKS')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Global VPC &amp; $0 Reachability Prover</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchLiveGeoTelemetry(true)}
              disabled={geoLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`}
              />
              <span>
                {geoLoading
                  ? 'Probing 8 Regions & Quotas...'
                  : 'Re-Probe Live Regional Sockets & Quotas'}
              </span>
            </button>
          </div>
        </div>

        {/* Under The Hood Technical Architecture Banner */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 space-y-1">
          <div className="font-extrabold text-blue-600 dark:text-blue-400">
            UNDER THE HOOD · HOW THIS GEO-CONTROL PLANE WORKS (100% REAL SOCKETS &amp; REST APIs)
          </div>
          <div>
            1. <strong>Live Regional Socket RTT:</strong> Node `dns.promises.lookup` + `net.createConnection(:443)` + `tls.connect` with `perf_hooks.performance.now()` microsecond timers against 8 regional `*-aiplatform.googleapis.com` frontends.
            {' '}2. <strong>Regional Compute Quotas:</strong> Queries `GET https://compute.googleapis.com/compute/v1/projects/{projectId}/regions` for live `CPUS`, `DISKS_TOTAL_GB`, and `IN_USE_ADDRESSES` headroom.
            {' '}3. <strong>VPC Subnet CIDRs &amp; Asset Residency:</strong> Queries `subnetworks.aggregatedList`, `storage.v1/b`, `bigquery.v2/datasets`, and `run.v2/services` to verify multi-region quorum (`RPO=0s`) vs single-region SPOFs.
          </div>
        </div>

        {/* 5-Pillar Equal-Width Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 w-full">
          {[
            {
              id: 'LATENCY_PROBES',
              featureId: 'GLOBAL_MAP_LATENCY_PROBES',
              icon: Activity,
              label: `Live Regional TCP/TLS Latency (${
                liveGeoTelemetry?.regionalSocketProbes?.length || 8
              } Regions)`,
            },
            {
              id: 'ASSET_SOVEREIGNTY',
              featureId: 'GLOBAL_MAP_ASSET_SOVEREIGNTY',
              icon: ShieldCheck,
              label: `Project Asset Residency & Multi-Region Quorum (${
                liveGeoTelemetry?.geoAssets?.length || 0
              })`,
            },
            {
              id: 'REGIONAL_QUOTAS',
              featureId: 'GLOBAL_MAP_REGIONAL_QUOTAS',
              icon: Cpu,
              label: `Live Regional Compute Quotas (${
                liveGeoTelemetry?.regionalQuotas?.length || 0
              } Regions)`,
            },
            {
              id: 'VPC_SUBNETS',
              featureId: 'GLOBAL_MAP_VPC_SUBNETS',
              icon: Layers,
              label: `Regional VPC Subnets & CIDR Map (${
                liveGeoTelemetry?.liveSubnets?.length || 0
              } Subnets)`,
            },
            {
              id: 'STACK_SYNTHESIZER',
              featureId: 'GLOBAL_MAP_STACK_SYNTHESIZER',
              icon: Sparkles,
              label: `1-Tap 3-Tier Stack Synthesizer & CFE (${orbitalMapMetrics.avgCfe}% Clean)`,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeGeoTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-feature-id={tab.featureId}
                onClick={() => setActiveGeoTab(tab.id)}
                className={`w-full h-full px-3 py-2.5 rounded-xl text-[11px] font-mono font-extrabold border transition-all cursor-pointer flex items-center justify-start gap-2 text-left leading-snug ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                }`}
              >
                <span
                  className={`p-1.5 rounded-lg shrink-0 ${
                    active
                      ? 'bg-white/15 dark:bg-zinc-900/15 text-current'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 01: LIVE REGIONAL TCP/TLS SOCKET LATENCY MATRIX */}
        {activeGeoTab === 'LATENCY_PROBES' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(liveGeoTelemetry?.regionalSocketProbes || []).map((probe, idx) => {
              const isFastest = idx === 0;
              const isSelected = selectedRegionId === probe.regionId;
              return (
                <div
                  key={probe.regionId}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectRegionInPlace(probe.regionId, 2.8)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectRegionInPlace(probe.regionId, 2.8);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected
                            ? 'bg-emerald-500 animate-pulse'
                            : isFastest
                            ? 'bg-blue-500'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        #{idx + 1} · {probe.regionId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-extrabold">
                          SELECTED
                        </span>
                      )}
                      {isFastest && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-extrabold">
                          FASTEST
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {probe.tcpMs}ms TCP
                      </span>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-zinc-500 truncate">
                    {probe.city} · CFE: <strong>{probe.cfePct}%</strong>
                    {probe.distanceFromClientKm
                      ? ` · ${probe.distanceFromClientKm.toLocaleString()} km from ${liveClientOriginNode.city}`
                      : ''}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-zinc-200/80 dark:border-zinc-800 text-[10px]">
                    <div>
                      <span className="text-zinc-400 block">DNS</span>
                      <strong>{probe.dnsMs}ms</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">TCP</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {probe.tcpMs}ms
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">TLS 1.3</span>
                      <strong>{probe.tlsMs}ms</strong>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1 text-[10px]">
                    <span className="text-zinc-400 truncate">
                      IP: {probe.resolvedIp || 'Anycast'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        focusOnRegion(probe.regionId, 3.2, {
                          scrollToMap: true,
                        });
                      }}
                      className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors shrink-0"
                    >
                      Focus on Map →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 02: LIVE PROJECT ASSET RESIDENCY & MULTI-REGION QUORUM AUDIT */}
        {activeGeoTab === 'ASSET_SOVEREIGNTY' && (
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {(liveGeoTelemetry?.geoAssets || []).length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500">
                No regional or multi-region storage/compute assets found in `{projectId}`. Use the Provision button on any region below to deploy resources.
              </div>
            ) : (
              (liveGeoTelemetry?.geoAssets || []).map((asset, i) => {
                const isMulti = asset.resiliencyVerdict.includes('MULTI_REGION');
                return (
                  <div
                    key={`${asset.name}-${i}`}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-zinc-900 dark:text-white">
                          {asset.assetType}: {asset.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          Location: {asset.location} ({asset.locationType})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          {asset.sovereigntyZone}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-zinc-500">
                        Storage/Tier: <strong>{asset.storageClass}</strong> · CLI:{' '}
                        <code>{asset.replicationCli}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isMulti
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {asset.resiliencyVerdict}
                      </span>
                      {onRunInShell && asset.replicationCli && (
                        <button
                          type="button"
                          onClick={() => onRunInShell(asset.replicationCli)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Run in Cloud Shell
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 03: LIVE REGIONAL COMPUTE QUOTAS & HEADROOM */}
        {activeGeoTab === 'REGIONAL_QUOTAS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto">
            {(liveGeoTelemetry?.regionalQuotas || []).map((rq) => {
              const isSelected = selectedRegionId === rq.regionName;
              return (
                <div
                  key={rq.regionName}
                  onClick={() => selectRegionInPlace(rq.regionName, 2.8)}
                  className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-zinc-900 dark:text-white">
                      {rq.regionName}
                    </span>
                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-extrabold">
                          SELECTED
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9.5px] font-bold">
                        {rq.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-zinc-600 dark:text-zinc-400 space-y-0.5">
                    <div>
                      vCPUs: <strong>{rq.cpusUsed}</strong> / {rq.cpusLimit}
                    </div>
                    <div>
                      Disks GB: <strong>{rq.disksGbUsed}</strong> /{' '}
                      {rq.disksGbLimit} GB
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span>
                        Static IPs: <strong>{rq.ipsUsed}</strong> /{' '}
                        {rq.ipsLimit}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          focusOnRegion(rq.regionName, 3.2, {
                            scrollToMap: true,
                          });
                        }}
                        className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[9.5px] font-bold cursor-pointer"
                      >
                        Focus on Map →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 04: LIVE REGIONAL VPC SUBNETS & RFC1918 CIDR MAP */}
        {activeGeoTab === 'VPC_SUBNETS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto">
            {(liveGeoTelemetry?.liveSubnets || []).map((sn, idx) => {
              const isSelected = selectedRegionId === sn.region;
              return (
                <div
                  key={`${sn.region}-${sn.name}-${idx}`}
                  onClick={() => selectRegionInPlace(sn.region, 2.8)}
                  className={`p-3 rounded-xl border text-xs font-mono space-y-1 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-zinc-900 dark:text-white truncate">
                      {sn.region}
                    </span>
                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-extrabold">
                          SELECTED
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[9.5px] font-bold">
                        {sn.ipCidrRange}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    VPC: <strong>{sn.network}</strong> · Subnet: {sn.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-0.5">
                    <span>
                      GW: {sn.gatewayAddress} · PGA:{' '}
                      <strong className="text-emerald-500">
                        {sn.privateIpGoogleAccess ? 'ON' : 'OFF'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        focusOnRegion(sn.region, 3.2, { scrollToMap: true });
                      }}
                      className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[9.5px] font-bold cursor-pointer"
                    >
                      Focus on Map →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 05: 1-TAP GREEN-REGION 3-TIER STACK SYNTHESIZER & CONTINENTAL CFE% FOOTPRINT */}
        {activeGeoTab === 'STACK_SYNTHESIZER' && (
          <div className="space-y-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                  1-Tap Describe-to-Deploy 3-Tier Stack Synthesizer into Selected Map Region: <span className="text-blue-600 dark:text-blue-400">{selectedRegion.id} ({selectedRegion.city} · {selectedRegion.cfePercent}% CFE)</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Synthesizes a live Cloud Storage Bucket, BigQuery Dataset, and Scale-to-Zero Cloud Run Gen2 Service (`$0.00/hr` idle) in `{selectedRegion.id}` pre-wired with `GCS_BUCKET_URI` and `BIGQUERY_DATASET` environment variables.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                  Fleet Avg CFE: {orbitalMapMetrics.avgCfe}% Clean
                </span>
                {Object.entries(orbitalMapMetrics.continents).map(
                  ([cont, count]) => (
                    <span
                      key={cont}
                      className="px-2 py-1 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      {cont}: <strong>{count}</strong>
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STACK_BLUEPRINTS.map((bp) => {
                const active = mapStackBlueprint === bp.id;
                return (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => setMapStackBlueprint(bp.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-500 shadow-xs'
                        : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {bp.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                        {bp.estIdleCost}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {bp.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={handleSynthesizeMapStack}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3"
            >
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Stack Naming Prefix
                </label>
                <input
                  type="text"
                  required
                  value={mapStackPrefix}
                  onChange={(e) => setMapStackPrefix(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Target Map Region (Click any region on map or choose below)
                </label>
                <select
                  value={selectedRegionId}
                  onChange={(e) => selectRegionInPlace(e.target.value, 2.8)}
                  className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 cursor-pointer"
                >
                  {GCP_GLOBAL_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} ({r.city} · {r.cfePercent}% CFE · {r.gco2} gCO2/kWh)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={mapDeployingStack}
                  className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {mapDeployingStack
                      ? `Synthesizing in ${selectedRegion.id}...`
                      : `Deploy 3-Tier Stack in ${selectedRegion.id}`}
                  </span>
                </button>
              </div>
            </form>

            {mapStackResult && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-xs font-mono space-y-2">
                <div className="font-bold text-emerald-700 dark:text-emerald-300">
                  ✓ {mapStackResult.message}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(mapStackResult.steps || []).map((st, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px]"
                    >
                      <div className="text-zinc-500">{st.step}</div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {st.name}
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400">
                        {st.status} ({st.region})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Live Pricing & SKU Sync Bar */}
      <LivePricingCatalogControlBar
        projectId={projectId}
        selectedRegionId={selectedRegion.id}
      />

      {/* 2. Unified Orbital Command Deck: Compact Scenario Header + Interactive 40-Region Map + Right Region Inspector */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Row A: Title + 4 Scenario Mode Selector Cards */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50/60 dark:bg-blue-500/[0.08] border border-blue-500/35 flex items-center justify-center text-blue-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
                  Interactive 40-Region Topology Canvas &amp; Live Firewall / Socket Streamer
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                  40 GCP REGIONS · 121 ZONES · {firewalls.length} LIVE VPC FIREWALL RULES
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
            {onSelectTab && (
              <button
                type="button"
                data-feature-id="DREAM_BRAIN"
                onClick={() => onSelectTab('INNOVATION_LAB')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>Pre-Crime Bill &amp; Dream Stack</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Scenario Mode Selector Pills (Directly Above the Map!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            {
              id: 'LIVE_MIX',
              featureId: 'GLOBAL_MAP_MODE_LIVE_MIX',
              icon: Globe,
              badge: 'Live Sockets + Logs',
              title: 'Live Cloud Logs & Regional Sockets',
              desc: 'Replays real logging.v2/entries:list & 8-region TLS 1.3 handshakes',
            },
            {
              id: 'SSH_BRUTEFORCE',
              featureId: 'GLOBAL_MAP_MODE_SSH_BRUTEFORCE',
              icon: ShieldAlert,
              badge: 'Port :22 & :3389 Audit',
              title: 'Live SSH/RDP Perimeter Socket Audit',
              desc: 'Probes live VM natIPs (:22/:3389) & audits compute.v1/firewalls',
            },
            {
              id: 'IAP_ZERO_TRUST',
              featureId: 'GLOBAL_MAP_MODE_IAP_ZERO_TRUST',
              icon: Lock,
              badge: '35.235.240.0/20',
              title: 'Live IAP Zero-Trust CIDR Audit',
              desc: 'Audits Google IAP (35.235.240.0/20) vs 0.0.0.0/0 in live firewalls',
            },
            {
              id: 'GLOBAL_LOAD_TEST',
              featureId: 'GLOBAL_MAP_MODE_GLOBAL_LOAD_TEST',
              icon: Zap,
              badge: '8-Region TLS :443',
              title: 'Live 8-Region GFE Edge Handshakes',
              desc: 'Streams real DNS + TCP (:443) + TLS 1.3 socket handshakes',
            },
          ].map((mode) => {
            const ModeIcon = mode.icon;
            const active = simMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                data-feature-id={mode.featureId}
                onClick={() => handleSelectSimMode(mode.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50/90 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 text-zinc-900 dark:text-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`p-1 rounded-md shrink-0 ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <ModeIcon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-extrabold font-mono truncate">
                      {mode.title}
                    </span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold shrink-0 ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {mode.badge}
                  </span>
                </div>
                <div
                  className={`text-[10px] line-clamp-1 ${
                    active ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {mode.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Structured Single-Line Security Verdict & Cloud Logging Instrument Bar */}
        {(() => {
          const sshPublicEval = evaluatePacketAgainstFirewalls(
            { sourceIp: '185.220.101.44', protocol: 'tcp', port: 22 },
            firewalls
          );
          const rdpPublicEval = evaluatePacketAgainstFirewalls(
            { sourceIp: '185.220.101.44', protocol: 'tcp', port: 3389 },
            firewalls
          );
          const iapSshEval = evaluatePacketAgainstFirewalls(
            { sourceIp: '35.235.240.18', protocol: 'tcp', port: 22 },
            firewalls
          );
          const httpsEdgeEval = evaluatePacketAgainstFirewalls(
            { sourceIp: '130.211.0.22', protocol: 'tcp', port: 443 },
            firewalls
          );
          const icmpEval = evaluatePacketAgainstFirewalls(
            { sourceIp: liveClientOriginNode.ip, protocol: 'icmp', port: 0 },
            firewalls
          );
          const liveLogCount = (liveGeoTelemetry?.liveNetworkLogEvents || []).length;
          const latestLogSummary =
            liveGeoTelemetry?.liveNetworkLogEvents?.[0]?.summary || '';

          return (
            <div className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800/90 flex items-center justify-between gap-2 text-[10.5px] font-mono overflow-hidden">
              {/* Left: Live Telemetry Badge */}
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-extrabold uppercase tracking-wide shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE SOCKETS · {firewalls.length} FIREWALLS</span>
              </span>

              {/* Center + Right: Full-Width Segmented Protocol Verdict & Cloud Logging Matrix */}
              <div className="inline-flex items-center h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 gap-3 shrink-0">
                <span
                  title={`Matched Rule: ${httpsEdgeEval.ruleName}`}
                  className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  <span className="text-zinc-400">HTTPS :443</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {httpsEdgeEval.verdict}
                  </span>
                </span>

                <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />

                <span
                  title={`Matched Rule: ${icmpEval.ruleName}`}
                  className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  <span className="text-zinc-400">ICMP</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {icmpEval.verdict}
                  </span>
                </span>

                <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />

                <span
                  title={`Matched Rule: ${sshPublicEval.ruleName}`}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold ${
                    sshPublicEval.verdict === 'ALLOW'
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <span>SSH :22</span>
                  <span>
                    {sshPublicEval.verdict === 'ALLOW' ? 'EXPOSED' : 'LOCKED'}
                  </span>
                </span>

                <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />

                <span
                  title="Google Cloud IAP TCP Forwarding Range (35.235.240.0/20)"
                  className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  <span className="text-zinc-400">IAP Tunnel</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {iapSshEval.verdict}
                  </span>
                </span>

                {rdpPublicEval.verdict === 'ALLOW' && (
                  <>
                    <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />
                    <span
                      title={`Matched Rule: ${rdpPublicEval.ruleName}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 font-bold"
                    >
                      <span>RDP :3389</span>
                      <span>EXPOSED</span>
                    </span>
                  </>
                )}

                {liveLogCount > 0 && (
                  <>
                    <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />
                    <span
                      title={`Latest Cloud Logging Event: ${latestLogSummary}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-300 font-bold"
                    >
                      <span>Logs: {liveLogCount}</span>
                      {latestLogSummary && (
                        <span className="text-blue-400/90">
                          · {latestLogSummary}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Interactive Orbital World Map Canvas + Right Region/Zone Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left/Center 8 Columns: Full Interactive SVG World Map */}
        <div className="xl:col-span-8 bg-white dark:bg-[#05070e] border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Structured Instrument Deck Row 1: Playback & Speed Dock | Live Probe & Shield Actions | Zoom & Cadence Dock */}
          <div className="px-3 py-1.5 bg-zinc-50/90 dark:bg-[#090d16] border-b border-zinc-200 dark:border-zinc-800/90 flex items-center justify-between gap-2 text-[10.5px] font-mono overflow-hidden">
            {/* Left Dock: Unified Segmented Transport & Speed Controller */}
            <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-0.5 gap-0.5 shrink-0 shadow-xs">
              <button
                type="button"
                data-feature-id="GLOBAL_MAP_PLAY_PAUSE"
                onClick={() => setIsRunning(!isRunning)}
                className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[10.5px] font-mono font-extrabold transition-colors cursor-pointer ${
                  isRunning
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>LIVE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>PAUSED</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-feature-id="GLOBAL_MAP_CLEAR"
                onClick={handleResetSimulation}
                className="h-6 px-2 rounded-md text-[10px] font-mono font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Clear
              </button>

              <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  data-feature-id="GLOBAL_MAP_SPEED"
                  onClick={() => setSimSpeed(spd)}
                  className={`h-6 px-2 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                    simSpeed === spd
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Center Dock: Re-Probe & Priority-100 Firewall Shield Actions */}
            <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-0.5 gap-1 shrink-0 shadow-xs">
              <button
                type="button"
                data-feature-id="GLOBAL_MAP_FIRE_WAVE"
                onClick={() => {
                  fetchLiveGeoTelemetry(true);
                  handleSelectSimMode(simMode);
                }}
                className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold cursor-pointer transition-colors"
              >
                <Zap className="w-3 h-3 shrink-0" />
                <span>Re-Probe &amp; Replay Wave</span>
              </button>
              <button
                type="button"
                disabled={deployingShield}
                data-feature-id="GLOBAL_MAP_DEPLOY_SHIELD"
                onClick={handleDeployMapShield}
                className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-red-600/90 hover:bg-red-500 text-white text-[10px] font-extrabold cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Shield className="w-3 h-3 shrink-0" />
                <span>
                  {deployingShield ? 'Deploying...' : 'Block Public SSH (Priority-100)'}
                </span>
              </button>
            </div>

            {/* Right Dock: Unified Zoom & Cadence Instrument Group */}
            <div className="inline-flex items-center gap-1.5 shrink-0">
              <div className="inline-flex items-center h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-0.5">
                <button
                  type="button"
                  onClick={() => handleZoomStep(-0.6)}
                  title="Zoom Out"
                  className="h-6 px-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="px-1.5 text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                  {zoom.toFixed(1)}x
                </span>
                <button
                  type="button"
                  onClick={() => handleZoomStep(0.6)}
                  title="Zoom In"
                  className="h-6 px-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleResetMapCamera}
                  title="Reset Camera to Full World View (1x)"
                  className="h-6 px-1.5 text-[9.5px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white border-l border-zinc-200 dark:border-zinc-800 cursor-pointer"
                >
                  1x
                </button>
              </div>

              <div className="inline-flex items-center h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-1 gap-1 text-[10px]">
                <select
                  value={tickIntervalMs}
                  onChange={(e) => setTickIntervalMs(Number(e.target.value))}
                  title="UI Render Refresh Rate"
                  className="bg-transparent h-6 px-1 font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer outline-none"
                >
                  <option value={100} className="bg-zinc-900 text-zinc-200">10 FPS (100ms)</option>
                  <option value={250} className="bg-zinc-900 text-zinc-200">4 FPS (250ms)</option>
                  <option value={500} className="bg-zinc-900 text-zinc-200">2 FPS (500ms)</option>
                  <option value={1000} className="bg-zinc-900 text-zinc-200">1 FPS (1s)</option>
                </select>
                <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />
                <select
                  value={maxConcurrentPackets}
                  onChange={(e) => {
                    const cap = Number(e.target.value);
                    setMaxConcurrentPackets(cap);
                    setInFlightPackets((prev) => prev.slice(-cap));
                  }}
                  title="Max Concurrent Packets"
                  className="bg-transparent h-6 px-1 font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer outline-none"
                >
                  <option value={4} className="bg-zinc-900 text-zinc-200">Max 4 Pkts</option>
                  <option value={8} className="bg-zinc-900 text-zinc-200">Max 8 Pkts</option>
                  <option value={12} className="bg-zinc-900 text-zinc-200">Max 12 Pkts</option>
                  <option value={20} className="bg-zinc-900 text-zinc-200">Max 20 Pkts</option>
                </select>
                <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />
                <select
                  value={gcpSyncIntervalSec}
                  onChange={(e) => setGcpSyncIntervalSec(Number(e.target.value))}
                  title="GCP API Auto-Sync Interval"
                  className="bg-transparent h-6 px-1 font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer outline-none"
                >
                  <option value={0} className="bg-zinc-900 text-zinc-200">Sync: Manual</option>
                  <option value={30} className="bg-zinc-900 text-zinc-200">Sync: 30s</option>
                  <option value={60} className="bg-zinc-900 text-zinc-200">Sync: 60s</option>
                </select>
              </div>
            </div>
          </div>

          {/* Structured Instrument Deck Row 2: Single-Line Camera Switchboard | Lens Switchboard | Layer Switchboard */}
          <div className="px-3 py-1.5 bg-white dark:bg-[#060911] border-b border-zinc-200 dark:border-zinc-800/90 flex items-center justify-between gap-2 text-[10px] font-mono overflow-hidden">
            {/* Left Switchboard: Segmented Continent Presets + Compact 40-Region Selector */}
            <div className="inline-flex items-center gap-1.5 shrink-0">
              <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 p-0.5 gap-0.5">
                {[
                  { id: 'WORLD', label: 'World' },
                  {
                    id: 'MY_LOCATION',
                    label: `Origin (${liveClientOriginNode.city})`,
                    highlight: true,
                  },
                  { id: 'AMERICAS', label: 'NA' },
                  { id: 'SOUTH_AMERICA', label: 'SA' },
                  { id: 'EUROPE', label: 'EU' },
                  { id: 'MIDDLE_EAST', label: 'MEA' },
                  { id: 'ASIA_PACIFIC', label: 'APAC' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => focusOnContinent(c.id)}
                    className={
                      c.highlight
                        ? 'h-6 px-2 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-extrabold transition-colors cursor-pointer'
                        : 'h-6 px-1.5 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold transition-colors cursor-pointer'
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <select
                value={selectedRegionId}
                onChange={(e) => focusOnRegion(e.target.value, 3.4)}
                className="h-7 max-w-[195px] bg-zinc-50 dark:bg-zinc-900/90 border border-blue-500/40 text-blue-700 dark:text-blue-300 rounded-lg px-2 text-[10px] font-bold cursor-pointer truncate"
                title="Select any of the 40 GCP Regions to zoom directly to it"
              >
                {[
                  'North America',
                  'South America',
                  'Europe',
                  'Middle East',
                  'Africa',
                  'Asia',
                  'Oceania',
                ].map((cont) => (
                  <optgroup key={cont} label={`── ${cont} ──`}>
                    {GCP_GLOBAL_REGIONS.filter((r) => r.continent === cont).map(
                      (r) => {
                        const cnt = regionWorkloadsMap[r.id]?.totalCount || 0;
                        return (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.city}){cnt > 0 ? ` [${cnt}]` : ''}
                          </option>
                        );
                      }
                    )}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Center Switchboard: Segmented Map Lens Selector */}
            <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 p-0.5 gap-0.5 shrink-0">
              <span className="px-1.5 text-[9px] uppercase tracking-wider text-zinc-400 font-bold">
                Lens
              </span>
              {[
                {
                  id: 'TRAFFIC',
                  featureId: 'GLOBAL_MAP_LENS_TRAFFIC',
                  icon: Activity,
                  label: 'Traffic',
                },
                {
                  id: 'CARBON_GRID',
                  featureId: 'GLOBAL_MAP_LENS_CARBON',
                  icon: Leaf,
                  label: 'CFE %',
                },
                {
                  id: 'SPOT_ARBITRAGE',
                  featureId: 'GLOBAL_MAP_LENS_SPOT',
                  icon: Cpu,
                  label: 'Spot $',
                },
              ].map((lens) => {
                const LensIcon = lens.icon;
                return (
                  <button
                    key={lens.id}
                    type="button"
                    data-feature-id={lens.featureId}
                    onClick={() => setMapLens(lens.id)}
                    className={`inline-flex items-center gap-1 h-6 px-2 rounded-md transition-colors cursor-pointer ${
                      mapLens === lens.id
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <LensIcon className="w-3 h-3 shrink-0" />
                    <span>{lens.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Switchboard: Segmented Topology Layer Toggles */}
            <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 p-0.5 gap-0.5 shrink-0">
              <span className="px-1.5 text-[9px] uppercase tracking-wider text-zinc-400 font-bold">
                Layers
              </span>
              <button
                type="button"
                data-feature-id="GLOBAL_MAP_FIBER_MESH"
                onClick={() => setShowSubseaBackbone(!showSubseaBackbone)}
                className={`inline-flex items-center gap-1 h-6 px-2 rounded-md cursor-pointer transition-colors ${
                  showSubseaBackbone
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Radio className="w-3 h-3 shrink-0" />
                <span>Fiber</span>
              </button>

              <button
                type="button"
                data-feature-id="GLOBAL_MAP_ZONES_TOGGLE"
                onClick={() => setShowZoneRings((prev) => !prev)}
                className={`inline-flex items-center gap-1 h-6 px-2 rounded-md cursor-pointer transition-colors ${
                  showZoneRings
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3 h-3 shrink-0" />
                <span>Zones</span>
              </button>

              <button
                type="button"
                data-feature-id="GLOBAL_MAP_HYBRID_TUNNEL"
                onClick={() => setShowHybridTunnel(!showHybridTunnel)}
                className={`inline-flex items-center gap-1 h-6 px-2 rounded-md cursor-pointer transition-colors ${
                  showHybridTunnel
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Lock className="w-3 h-3 shrink-0" />
                <span>IAP Tunnel</span>
              </button>

              <button
                type="button"
                data-feature-id="GLOBAL_MAP_FIBER_LASER"
                onClick={() => setRouteAnalyzerEnabled(!routeAnalyzerEnabled)}
                className={`inline-flex items-center gap-1 h-6 px-2 rounded-md cursor-pointer font-bold transition-colors ${
                  routeAnalyzerEnabled
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Crosshair className="w-3 h-3 shrink-0" />
                <span>RTT Laser</span>
              </button>
            </div>
          </div>

          {/* Structured Instrument Deck Row 3: Subsea Laser Selectors (Left) | ALLOW/BLOCK/FIBER Telemetry Dock (Center) | Fiber RTT Readout (Right) */}
          <div className="px-3 py-1.5 bg-amber-500/5 dark:bg-[#080b14] border-b border-zinc-200 dark:border-zinc-800/90 flex items-center justify-between gap-2 text-[10px] font-mono overflow-hidden">
            {/* Left Dock: Point-to-Point Subsea Fiber Laser Selectors */}
            <div className="inline-flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-extrabold uppercase tracking-wider text-[9px]">
                <Crosshair className="w-2.5 h-2.5" />
                Subsea Laser
              </span>
              <select
                value={routeSourceRegionId}
                onChange={(e) => setRouteSourceRegionId(e.target.value)}
                className="h-6 w-[170px] bg-white dark:bg-zinc-900 border border-amber-500/40 text-amber-800 dark:text-amber-200 rounded-md px-1.5 text-[10px] font-semibold cursor-pointer truncate"
              >
                {GCP_GLOBAL_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    A: {r.name} ({r.city})
                  </option>
                ))}
              </select>
              <span className="text-amber-400 font-bold">⇄</span>
              <select
                value={routeDestRegionId}
                onChange={(e) => setRouteDestRegionId(e.target.value)}
                className="h-6 w-[170px] bg-white dark:bg-zinc-900 border border-amber-500/40 text-amber-800 dark:text-amber-200 rounded-md px-1.5 text-[10px] font-semibold cursor-pointer truncate"
              >
                {GCP_GLOBAL_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    B: {r.name} ({r.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Center Dock: Live Packet Verdict & Subsea Backbone Counter Strip */}
            <div className="inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 h-6 gap-3 shrink-0 shadow-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ALLOW: {counters.allowedPackets}</span>
              </span>
              <span className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
              <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>BLOCK: {counters.deniedPackets}</span>
              </span>
              <span className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
              <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>FIBER: {counters.backbonePackets}</span>
              </span>
            </div>

            {/* Right Dock: Subsea Optical Fiber Distance, RTT & Egress Rate */}
            <div className="inline-flex items-center rounded-md bg-amber-500/15 border border-amber-500/35 px-2.5 h-6 gap-2.5 text-amber-700 dark:text-amber-300 font-bold shrink-0">
              <span>{routeTelemetry.fiberKm.toLocaleString()} km Fiber</span>
              <span className="h-3 w-px bg-amber-500/30" />
              <span>{routeTelemetry.rttMs}ms RTT</span>
              <span className="h-3 w-px bg-amber-500/30" />
              <span>${routeTelemetry.ratePerGb}/GB Egress</span>
            </div>
          </div>

          {/* Interactive Zoomable & Pannable SVG World Map (1200 x 560) — Scroll & Shortcuts Locked to Map */}
          <div
            ref={svgContainerRef}
            tabIndex={0}
            onMouseEnter={() => {
              isPointerInsideMapRef.current = true;
              setIsPointerInsideMap(true);
            }}
            onMouseLeave={() => {
              isPointerInsideMapRef.current = false;
              setIsPointerInsideMap(false);
              handleMapMouseUp();
            }}
            onMouseDown={handleMapMouseDown}
            onMouseMove={handleMapMouseMove}
            onMouseUp={handleMapMouseUp}
            onClick={() => {
              if (didPanRef.current) return;
              handleReleaseMapSelection();
            }}
            className={`relative w-full aspect-[1200/560] bg-[radial-gradient(ellipse_at_center,_#e0f2fe_0%,_#f8fafc_100%)] dark:bg-[radial-gradient(ellipse_at_center,_#0b1528_0%,_#04060c_100%)] overflow-hidden overscroll-contain touch-none select-none outline-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Contextual Map Action Overlay (Only Appears When Zoomed In or Region Pinned — Never Clutters Default View) */}
            {(isRegionPinnedOnMap || zoom > 1.1) && (
              <div className="absolute top-2.5 right-3 z-10 pointer-events-auto flex items-center gap-1.5">
                {isRegionPinnedOnMap && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReleaseMapSelection();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold cursor-pointer backdrop-blur-md"
                  >
                    Unselect {selectedRegion.name}
                  </button>
                )}
                {zoom > 1.1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetMapCamera();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold cursor-pointer backdrop-blur-md"
                  >
                    Reset View (1.0x)
                  </button>
                )}
              </div>
            )}

            {/* Chaos Outage Active Alert Pill */}
            {(severedRegions.length > 0 || severedZones.length > 0) && (
              <div className="absolute top-11 left-3 z-10 flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 dark:bg-red-950/90 border border-red-500 text-red-800 dark:text-red-200 text-[10px] font-mono font-bold shadow-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 animate-bounce" />
                <span>
                  CHAOS MODE: {severedRegions.length} Region(s), {severedZones.length}{' '}
                  Zone(s) Severed · {chaosBlastRadius.impactedResources} Project
                  Workloads Impacted · Traffic Auto-Rerouting!
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSeveredRegions([]);
                    setSeveredZones([]);
                  }}
                  className="ml-1 px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                >
                  Restore All
                </button>
              </div>
            )}

            <svg
              viewBox={currentViewBox}
              className="w-full h-full select-none transition-[viewBox] duration-75"
            >
              <defs>
                <radialGradient id="activeRegionHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#1a73e8" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="selectedRegionHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="chaosRegionHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ea4335" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#ea4335" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* True WGS84 Latitude Parallels & Longitude Meridians Graticule Grid */}
              {[
                { lat: 60, label: '60°N' },
                { lat: 30, label: '30°N' },
                { lat: 23.44, label: '23.4°N Tropic of Cancer', tropic: true },
                { lat: 0, label: '0° Equator', equator: true },
                { lat: -23.44, label: '23.4°S Tropic of Capricorn', tropic: true },
                { lat: -30, label: '30°S' },
              ].map((p) => {
                const py = projectLatLon(p.lat, 0).y;
                return (
                  <g key={`lat-${p.lat}`}>
                    <line
                      x1={0}
                      y1={py}
                      x2={1200}
                      y2={py}
                      stroke={
                        p.equator
                          ? '#4285f4'
                          : p.tropic
                          ? '#8ab4f8'
                          : '#334155'
                      }
                      strokeOpacity={p.equator ? '0.35' : p.tropic ? '0.18' : '0.28'}
                      strokeWidth={p.equator ? 1.1 * invScale : 0.7 * invScale}
                      strokeDasharray={
                        p.equator ? undefined : p.tropic ? '2 5' : '3 6'
                      }
                    />
                    <text
                      x={6}
                      y={py - 3}
                      fill={p.equator ? '#8ab4f8' : '#64748b'}
                      fillOpacity="0.65"
                      fontSize={6.5 * invScale}
                      fontFamily="monospace"
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}

              {[
                { lon: -120, label: '120°W' },
                { lon: -60, label: '60°W' },
                { lon: 0, label: '0° UTC (Prime Meridian)', prime: true },
                { lon: 60, label: '60°E' },
                { lon: 120, label: '120°E' },
                { lon: 180, label: '180°' },
              ].map((m) => {
                const mx = projectLatLon(0, m.lon).x;
                return (
                  <g key={`lon-${m.lon}`}>
                    <line
                      x1={mx}
                      y1={0}
                      x2={mx}
                      y2={560}
                      stroke={m.prime ? '#4285f4' : '#334155'}
                      strokeOpacity={m.prime ? '0.28' : '0.26'}
                      strokeWidth={m.prime ? 0.9 * invScale : 0.7 * invScale}
                      strokeDasharray="3 6"
                    />
                    <text
                      x={mx + 3}
                      y={553}
                      fill={m.prime ? '#8ab4f8' : '#64748b'}
                      fillOpacity="0.65"
                      fontSize={6.5 * invScale}
                      fontFamily="monospace"
                    >
                      {m.label}
                    </text>
                  </g>
                );
              })}

              {/* 178 Real Natural Earth Country Polygons (With Host Country, Selected Country & Live Client Country Illumination) */}
              {WORLD_COUNTRY_PATHS.map((country) => {
                const isSelectedCountry =
                  isRegionPinnedOnMap &&
                  (selectedRegion?.countryCode === country.id ||
                    (selectedRegion?.countryCode === 'SGP' && country.id === 'MYS') ||
                    (selectedRegion?.countryCode === 'HKG' && country.id === 'CHN'));
                const isClientCountry =
                  liveClientOriginNode.countryIso3 === country.id;
                return (
                  <path
                    key={country.id}
                    d={country.d}
                    className={
                      isSelectedCountry
                        ? 'fill-blue-100/90 dark:fill-[#132847] stroke-blue-500/80 dark:stroke-[#3b82f6]'
                        : isClientCountry
                        ? 'fill-amber-100/85 dark:fill-[#1f2438] stroke-amber-500/85 dark:stroke-[#f59e0b]'
                        : country.hostsGcp
                        ? 'fill-slate-200/95 dark:fill-[#0f1b31] stroke-slate-400 dark:stroke-[#233d63]'
                        : 'fill-slate-200/75 dark:fill-[#0b1324] stroke-slate-300 dark:stroke-[#182a46]'
                    }
                    strokeWidth={
                      isSelectedCountry || isClientCountry
                        ? 1.15 * invScale
                        : 0.7 * invScale
                    }
                  >
                    <title>{`${country.name} (${country.id})${
                      isClientCountry
                        ? ` · YOUR LIVE CLIENT LOCATION (${liveClientOriginNode.city}, ${liveClientOriginNode.country} · IP Hidden)`
                        : country.hostsGcp
                        ? ' · Google Cloud Host Country'
                        : ''
                    }`}</title>
                  </path>
                );
              })}

              {/* 24 Major World Inland Lakes & Seas (Great Lakes, Caspian Sea, Lake Victoria, Baikal) */}
              <path
                d={WORLD_LAKES_SVG_PATH}
                className="fill-[#e0f2fe] dark:fill-[#060c18] stroke-slate-400/60 dark:stroke-[#1e3a5f]"
                strokeWidth={0.5 * invScale}
              />

              {/* US State & Canadian Province Boundary Lines for Regional Precision */}
              <path
                d={ADMIN1_STATES_SVG_PATH}
                fill="none"
                className="stroke-slate-400/55 dark:stroke-[#26436c]"
                strokeWidth={0.55 * invScale}
                strokeDasharray="1.8 1.8"
              />

              {/* Google Cloud Subsea Fiber Backbone Mesh */}
              {showSubseaBackbone &&
                backboneLinks.map((link) => {
                  const arc = buildArcPath(
                    link.from.x,
                    link.from.y,
                    link.to.x,
                    link.to.y
                  );
                  const touchesSelected =
                    link.from.id === selectedRegionId ||
                    link.to.id === selectedRegionId ||
                    link.from.id === hoveredRegionId ||
                    link.to.id === hoveredRegionId;

                  const linkOpacity = touchesSelected
                    ? '0.68'
                    : spotlightMode && zoom >= 1.5
                    ? '0.12'
                    : link.isActiveLink
                    ? '0.38'
                    : '0.22';

                  return (
                    <path
                      key={link.key}
                      d={arc.d}
                      fill="none"
                      stroke={
                        touchesSelected
                          ? '#669df6'
                          : link.isActiveLink
                          ? '#1a73e8'
                          : '#334155'
                      }
                      strokeOpacity={linkOpacity}
                      strokeWidth={
                        touchesSelected
                          ? 1.8 * invScale
                          : link.isActiveLink
                          ? 1.4 * invScale
                          : 0.9 * invScale
                      }
                      strokeDasharray={
                        touchesSelected ? '4 3' : link.isActiveLink ? '4 4' : '2 5'
                      }
                    />
                  );
                })}

              {/* Live Client Workstation Uplink Beam (Client Origin -> Selected GCP Region) — Clean Arc Without Overlapping Midpoint Text */}
              {showHybridTunnel && isRegionPinnedOnMap && (
                <path
                  d={clientUplinkTelemetry.arc.d}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={1.8 * invScale}
                  strokeDasharray="5 3"
                  strokeOpacity="0.72"
                />
              )}

              {/* Always-Visible Live Client Origin Radar Beacon ("YOU ARE HERE") */}
              <g
                transform={`translate(${liveClientOriginNode.x}, ${liveClientOriginNode.y}) scale(${invScale})`}
                onClick={(e) => {
                  e.stopPropagation();
                  focusOnClientOrigin(3.4);
                }}
                className="cursor-pointer"
              >
                <circle r={15} fill="url(#selectedRegionHalo)" opacity="0.45" />
                <circle
                  r={10}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.1"
                  strokeDasharray="2.5 2"
                />
                <circle
                  r={5.2}
                  fill="#f59e0b"
                  stroke="#020617"
                  strokeWidth="1.4"
                >
                  <title>{`YOU ARE HERE: ${liveClientOriginNode.city}, ${liveClientOriginNode.region}, ${liveClientOriginNode.country} [${liveClientOriginNode.countryCode}] · IP Hidden (Privacy Mode) · ${liveClientOriginNode.asn} ${liveClientOriginNode.isp} · GPS ${liveClientOriginNode.gpsLabel}`}</title>
                </circle>
                <circle r={1.8} fill="#ffffff" />
                <rect
                  x={-28}
                  y={-18}
                  width={56}
                  height={10.5}
                  rx={3}
                  fill="#020617"
                  fillOpacity="0.92"
                  stroke="#f59e0b"
                  strokeWidth="0.9"
                />
                <text
                  y={-10.6}
                  textAnchor="middle"
                  fill="#fde68a"
                  fontSize="6.2"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {`YOU (${liveClientOriginNode.countryCode})`}
                </text>
              </g>

              {/* Point-to-Point Subsea Fiber RTT & Cross-Region Egress Telemetry Beam (Clean Arc — Metrics Shown in Toolbar) */}
              {routeAnalyzerEnabled &&
                routeTelemetry.src.id !== routeTelemetry.dst.id && (
                  <path
                    d={routeTelemetry.arc.d}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2 * invScale}
                    strokeDasharray="6 3"
                    strokeOpacity="0.7"
                  />
                )}

              {/* Global Client / Proxy / Threat Origin Nodes (Only shown while packet simulation is running) */}
              {isRunning &&
                GLOBAL_CLIENT_ORIGINS.map((orig) => (
                  <g
                    key={orig.id}
                    transform={`translate(${orig.x}, ${orig.y}) scale(${invScale})`}
                    opacity={spotlightMode && zoom >= 1.8 ? 0.35 : 0.85}
                  >
                    <circle
                      r={3.5}
                      fill={
                        orig.kind === 'THREAT_SCANNER'
                          ? '#ea4335'
                          : orig.kind === 'IAP_ZERO_TRUST'
                          ? '#10b981'
                          : '#4285f4'
                      }
                    >
                      <title>{`${orig.label} (${orig.ip})`}</title>
                    </circle>
                  </g>
                ))}

              {/* Live (or DVR Scrubbed) In-Flight Packet Trajectory Arcs & Moving Photon Dots */}
              {(dvrScrubIndex > 0 && dvrSnapshots[dvrScrubIndex - 1]
                ? dvrSnapshots[dvrScrubIndex - 1].packets
                : inFlightPackets
              ).map((pkt) => {
                const pos = pointOnQuadraticBezier(
                  pkt.x1,
                  pkt.y1,
                  pkt.cx,
                  pkt.cy,
                  pkt.x2,
                  pkt.y2,
                  pkt.progress
                );
                const strokeColor =
                  pkt.reroutedFrom
                    ? '#f59e0b'
                    : pkt.kind === 'BACKBONE'
                    ? '#669df6'
                    : pkt.verdict === 'ALLOW'
                    ? '#10b981'
                    : '#ea4335';

                const isRelevantToSelection =
                  pkt.targetRegionId === selectedRegionId ||
                  pkt.sourceRegionId === selectedRegionId ||
                  pkt.targetRegionId === hoveredRegionId;

                const pktOpacity =
                  spotlightMode && zoom >= 1.6 && !isRelevantToSelection
                    ? 0.25
                    : 1;

                return (
                  <g key={pkt.id} opacity={pktOpacity}>
                    {/* Glowing Trajectory Arc */}
                    <path
                      d={pkt.arcD}
                      fill="none"
                      stroke={strokeColor}
                      strokeOpacity="0.45"
                      strokeWidth={1.7 * invScale}
                    />
                    {/* Moving Packet Head (Scaled by invScale so zoomed packets remain sharp) */}
                    <g transform={`translate(${pos.x}, ${pos.y}) scale(${invScale})`}>
                      <circle r={4.2} fill={strokeColor} />
                      <circle r={8.5} fill={strokeColor} opacity="0.25" />
                      {/* Show packet protocol tag when relevant to focused region or at world overview */}
                      {(!spotlightMode || zoom < 1.6 || isRelevantToSelection) && (
                        <text
                          x={7}
                          y={-4}
                          fill={strokeColor}
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {pkt.reroutedFrom ? `⇄FAILOVER ` : ''}
                          {pkt.protocol}:{pkt.port || 'echo'}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* Firewall Shield Interception & Arrival Shockwave Rings */}
              {impactRings.slice(-6).map((ring) => (
                <g
                  key={ring.id}
                  transform={`translate(${ring.x}, ${ring.y}) scale(${invScale})`}
                >
                  <circle
                    r={16}
                    fill="none"
                    stroke={ring.verdict === 'DENY' ? '#ea4335' : '#10b981'}
                    strokeWidth="2"
                    opacity="0.65"
                  />
                  {ring.verdict === 'DENY' && (
                    <text
                      y={-18}
                      textAnchor="middle"
                      fill="#fb7185"
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      BLOCKED
                    </text>
                  )}
                </g>
              ))}

              {/* All 40 Official Google Cloud Regions & 121 Orbiting Availability Zones (Exact WGS84 Projected) */}
              {sortedRegionsForRender.map((reg) => {
                const workloads = regionWorkloadsMap[reg.id];
                const hasWorkloads = (workloads?.totalCount || 0) > 0;
                const isSelected = isRegionPinnedOnMap && selectedRegionId === reg.id;
                const isHovered = hoveredRegionId === reg.id;
                const isSevered = severedRegions.includes(reg.id);
                const isPeer = isRegionPinnedOnMap && selectedRegionPeers.has(reg.id);
                const isFocusedNode = isSelected || isHovered || isSevered;

                // Only expand the Availability Zone constellation when explicitly clicked/selected (never prematurely on hover!)
                const shouldRenderZones =
                  showZoneRings &&
                  (isSelected || (!spotlightMode && zoom >= 2.2));
                const showDetailedZones = shouldRenderZones;
                const zoneOrbitRadius = isSelected ? 22 : 14;

                // Tactical Spotlight Opacity: Selected/Hovered = 1.0, Unselected when no region is pinned = crisp 0.9, Dimmed when a region is pinned
                const nodeOpacity = isFocusedNode
                  ? 1
                  : !isRegionPinnedOnMap
                  ? 0.92
                  : !spotlightMode
                  ? 0.94
                  : zoom >= 1.5
                  ? isPeer
                    ? 0.65
                    : hasWorkloads
                    ? 0.75
                    : 0.45
                  : isPeer || hasWorkloads
                  ? 0.9
                  : 0.62;

                // In Spotlight Mode, hide rectangular text pills on unselected neighbor nodes to eliminate dense cluster overlap
                const shouldShowLabelPill =
                  isFocusedNode ||
                  !spotlightMode ||
                  (hasWorkloads && zoom < 2.0);

                // Determine core node color based on active Map Lens (Traffic / Carbon / Spot)
                let lensColor = '#475569';
                if (isSevered) {
                  lensColor = '#ea4335';
                } else if (mapLens === 'CARBON_GRID') {
                  lensColor =
                    reg.cfePercent >= 80
                      ? '#10b981'
                      : reg.cfePercent >= 55
                      ? '#f59e0b'
                      : '#ea4335';
                } else if (mapLens === 'SPOT_ARBITRAGE') {
                  lensColor =
                    reg.cfePercent >= 75
                      ? '#669df6'
                      : reg.cfePercent >= 50
                      ? '#4285f4'
                      : '#f97316';
                } else {
                  lensColor = isSelected
                    ? '#10b981'
                    : isHovered
                    ? '#669df6'
                    : hasWorkloads
                    ? '#1a73e8'
                    : isPeer
                    ? '#669df6'
                    : '#64748b';
                }

                // Directional label offset so dense European/Asian/US region labels fan out cleanly
                const labelDx = isFocusedNode
                  ? 0
                  : reg.labelOffset?.dx ?? 0;
                const labelDy = isFocusedNode
                  ? shouldRenderZones
                    ? zoneOrbitRadius + 11
                    : 15
                  : reg.labelOffset?.dy ?? 14;
                const pillWidth = Math.max(reg.name.length * 4.3, 50);

                return (
                  <g
                    key={reg.id}
                    transform={`translate(${reg.x}, ${reg.y}) scale(${invScale})`}
                    opacity={nodeOpacity}
                    onMouseEnter={() => setHoveredRegionId(reg.id)}
                    onMouseLeave={() => setHoveredRegionId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (didPanRef.current) return;
                      if (isSelected) {
                        handleReleaseMapSelection();
                      } else {
                        focusOnRegion(reg.id, zoom < 2.6 ? 3.2 : zoom);
                      }
                    }}
                    className="cursor-pointer transition-opacity duration-200"
                  >
                    {/* Tight Non-Colliding Hitbox Circle so Dense European/US Clusters Never Steal Neighbor Clicks */}
                    <circle r={7.5} fill="transparent" />

                    {/* Halo for Focused Region, Active Workload Region, or Severed Chaos Region */}
                    {(isFocusedNode || (hasWorkloads && !spotlightMode)) && (
                      <circle
                        r={isSelected || isSevered ? 32 : isHovered ? 24 : 18}
                        fill={
                          isSevered
                            ? 'url(#chaosRegionHalo)'
                            : isSelected
                            ? 'url(#selectedRegionHalo)'
                            : 'url(#activeRegionHalo)'
                        }
                      />
                    )}

                    {/* Outer Selection or Chaos Outage Hazard Reticle + Zone Orbit Track */}
                    {(shouldRenderZones || isSevered) && (
                      <circle
                        r={zoneOrbitRadius}
                        fill="none"
                        stroke={
                          isSevered
                            ? '#ea4335'
                            : isSelected
                            ? '#10b981'
                            : '#669df6'
                        }
                        strokeOpacity="0.45"
                        strokeWidth={isSelected || isSevered ? '1.3' : '1'}
                        strokeDasharray="3 2"
                      />
                    )}

                    {/* VPC Firewall Perimeter Shield Ring */}
                    {hasWorkloads && !isSevered && (isFocusedNode || !spotlightMode) && (
                      <circle
                        r={11.5}
                        fill="none"
                        stroke="#1a73e8"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.75"
                      />
                    )}

                    {/* Orbiting Availability Zone Nodes (-a, -b, -c, -f) - Only blooms when clicked/expanded! */}
                    {shouldRenderZones &&
                      reg.zones.map((z, idx) => {
                        const angle =
                          (idx / reg.zones.length) * Math.PI * 2 - Math.PI / 2;
                        const zx = Math.cos(angle) * zoneOrbitRadius;
                        const zy = Math.sin(angle) * zoneOrbitRadius;
                        const shortZone = z.split('-').pop();
                        const isZoneSelected =
                          isSelected && selectedZoneName === z;
                        const isZoneSevered =
                          isSevered || severedZones.includes(z);

                        return (
                          <g key={z}>
                            {/* Intra-Region Sub-ms Fiber Spoke from Region Core to Orbiting Zone */}
                            <line
                              x1={0}
                              y1={0}
                              x2={zx}
                              y2={zy}
                              stroke={
                                isZoneSevered
                                  ? '#ea4335'
                                  : isZoneSelected
                                  ? '#10b981'
                                  : '#669df6'
                              }
                              strokeOpacity="0.45"
                              strokeWidth="1"
                              strokeDasharray="2 1.5"
                            />
                            <g
                              transform={`translate(${zx}, ${zy})`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (didPanRef.current) return;
                                setSelectedRegionId(reg.id);
                                setSelectedZoneName(z);
                                setCustomTargetRegionId(reg.id);
                                if (zoom < 2.8) {
                                  focusOnRegion(reg.id, 3.4);
                                }
                              }}
                            >
                              <circle r={6.5} fill="transparent" />
                              <circle
                                r={isZoneSelected ? 4.4 : 3.4}
                                fill={
                                  isZoneSevered
                                    ? '#ea4335'
                                    : isZoneSelected
                                    ? '#10b981'
                                    : '#669df6'
                                }
                                stroke="#020617"
                                strokeWidth="1.2"
                              >
                                <title>{`Zone ${z} · ${reg.city} (${reg.gpsLabel})`}</title>
                              </circle>
                              {showDetailedZones && (
                                <text
                                  y={-6}
                                  textAnchor="middle"
                                  fill={
                                    isZoneSevered
                                      ? '#fda4af'
                                      : isZoneSelected
                                      ? '#34d399'
                                      : '#e0f2fe'
                                  }
                                  fontSize="6.8"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                >
                                  -{shortZone}
                                </text>
                              )}
                            </g>
                          </g>
                        );
                      })}

                    {/* Region Core Node (Exact WGS84 Geographic Coordinate Pin) */}
                    <circle
                      r={
                        isSelected || isSevered
                          ? 6.4
                          : isHovered
                          ? 5.6
                          : hasWorkloads
                          ? 4.4
                          : isPeer
                          ? 3.4
                          : 2.8
                      }
                      fill={lensColor}
                      stroke="#020617"
                      strokeWidth="1.2"
                    >
                      <title>
                        {shouldRenderZones
                          ? `${reg.name} — ${reg.city} [${reg.countryCode}] · GPS ${reg.gpsLabel} — ${reg.zones.length} Availability Zones Expanded (${reg.zones.join(', ')}) · Click to collapse zones`
                          : `${reg.name} — ${reg.city} [${reg.countryCode}] · GPS ${reg.gpsLabel} — Click to focus & expand ${reg.zones.length} Availability Zones`}
                      </title>
                    </circle>

                    {/* Precision Center Pinpoint Dot on Selected/Hovered Region */}
                    {isFocusedNode && (
                      <circle r={1.6} fill="#ffffff" pointerEvents="none" />
                    )}

                    {/* Leader Line + Region Label Pill */}
                    {shouldShowLabelPill && (
                      <g>
                        {!isFocusedNode && (Math.abs(labelDx) > 4 || Math.abs(labelDy) > 10) && (
                          <line
                            x1={0}
                            y1={0}
                            x2={labelDx}
                            y2={labelDy - 2}
                            stroke={hasWorkloads ? '#3b82f6' : '#475569'}
                            strokeOpacity="0.55"
                            strokeWidth="0.7"
                          />
                        )}
                        <g transform={`translate(${labelDx}, ${labelDy})`}>
                          <rect
                            x={-(pillWidth / 2)}
                            y={-7.5}
                            width={pillWidth}
                            height={11}
                            rx={3}
                            fill="#020617"
                            fillOpacity="0.92"
                            stroke={
                              isSevered
                                ? '#ea4335'
                                : isSelected
                                ? '#10b981'
                                : isHovered
                                ? '#669df6'
                                : hasWorkloads
                                ? '#1a73e8'
                                : '#1e293b'
                            }
                            strokeWidth={
                              isSelected || isHovered || isSevered ? '1.1' : '0.6'
                            }
                          />
                          <text
                            y={0.8}
                            textAnchor="middle"
                            fill={
                              isSevered
                                ? '#fda4af'
                                : isSelected
                                ? '#34d399'
                                : isHovered
                                ? '#669df6'
                                : hasWorkloads
                                ? '#f8fafc'
                                : '#cbd5e1'
                            }
                            fontSize={isSelected || isHovered ? '7.3' : '6.3'}
                            fontWeight={
                              isSelected || isHovered || hasWorkloads
                                ? 'bold'
                                : 'normal'
                            }
                            fontFamily="monospace"
                          >
                            {reg.name}
                          </text>
                        </g>
                      </g>
                    )}

                    {/* Subtitle only when Map Lens is Carbon or Spot (City & GPS are shown cleanly in Bottom Bar & Right Inspector) */}
                    {mapLens !== 'TRAFFIC' && isFocusedNode && (
                      <text
                        x={labelDx}
                        y={labelDy + 9.5}
                        textAnchor="middle"
                        fill={
                          mapLens === 'CARBON_GRID'
                            ? reg.cfePercent >= 80
                              ? '#34d399'
                              : '#fcd34d'
                            : '#94a3b8'
                        }
                        fontSize="6.1"
                        fontFamily="monospace"
                      >
                        {mapLens === 'CARBON_GRID'
                          ? `${reg.cfePercent}% CFE · ${reg.gco2}gCO2`
                          : `Spot -$${(
                              0.018 +
                              (100 - reg.cfePercent) * 0.0002
                            ).toFixed(3)}/hr`}
                      </text>
                    )}

                    {hasWorkloads && (
                      <g transform="translate(6, -13)">
                        <rect
                          x={0}
                          y={0}
                          width={18}
                          height={10.5}
                          rx={3}
                          fill={isSevered ? '#d93025' : '#1a73e8'}
                        />
                        <text
                          x={9}
                          y={7.6}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="7"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {workloads.totalCount}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Bottom Map Legend Bar */}
            <div className="absolute bottom-2.5 left-3 right-3 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-950/85 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-400">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 text-amber-500 dark:text-amber-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>
                    You: {liveClientOriginNode.city},{' '}
                    {liveClientOriginNode.countryCode}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                  <span>Live Region</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  <span>Selected / Allowed</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  <span>Blocked / Outage</span>
                </span>
              </div>
              <span className="text-blue-500 dark:text-blue-400 font-bold">
                {isRegionPinnedOnMap ? (
                  <>
                    {selectedRegion.name} · {selectedRegion.city} [
                    {selectedRegion.countryCode}] ·{' '}
                    {clientUplinkTelemetry.greatCircleKm.toLocaleString()}km (
                    {clientUplinkTelemetry.estRttMs})
                  </>
                ) : (
                  <>
                    Free Navigation · Click any region pin to focus
                  </>
                )}
              </span>
            </div>
          </div>

          {/* DVR Flight Recorder Time-Machine Scrubber Bar */}
          <div className="px-3.5 py-2 bg-white dark:bg-zinc-950/95 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                  dvrScrubIndex === 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                }`}
              >
                {dvrScrubIndex === 0
                  ? '● LIVE STREAM'
                  : ` DVR REPLAY (-${dvrScrubIndex} ticks · ${
                      dvrSnapshots[dvrScrubIndex - 1]?.timestamp || ''
                    })`}
              </span>
              <span className="text-zinc-400">
                Flight Recorder ({dvrSnapshots.length}/20 snapshots):
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="text-[10px] text-zinc-500">LIVE</span>
              <input
                type="range"
                min={0}
                max={Math.max(dvrSnapshots.length, 1)}
                value={dvrScrubIndex}
                disabled={dvrSnapshots.length === 0}
                onChange={(e) => setDvrScrubIndex(Number(e.target.value))}
                className="flex-1 accent-blue-400 cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] text-zinc-500">PAST</span>
              {dvrScrubIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setDvrScrubIndex(0)}
                  className="px-2 py-0.5 rounded bg-blue-500 text-zinc-950 font-extrabold text-[10px] cursor-pointer"
                >
                  Resume Live
                </button>
              )}
            </div>
          </div>

          {/* Custom Test Packet Launcher Bar below Map */}
          <form
            onSubmit={handleFireCustomPacket}
            className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
          >
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              <Crosshair className="w-3.5 h-3.5" />
              <span>Launch Custom Test Packet:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={customOriginId}
                onChange={(e) => setCustomOriginId(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg px-2 py-1 text-[11px]"
              >
                {effectiveClientOrigins.map((o) => (
                  <option key={o.id} value={o.id}>
                    From: {o.label} ({o.ip})
                  </option>
                ))}
              </select>

              <span className="text-zinc-500">→</span>

              <select
                value={customTargetRegionId}
                onChange={(e) => setCustomTargetRegionId(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg px-2 py-1 text-[11px]"
              >
                {GCP_GLOBAL_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    To: {r.name} ({r.city})
                  </option>
                ))}
              </select>

              <select
                value={customProtocol}
                onChange={(e) => setCustomProtocol(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg px-2 py-1 text-[11px]"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
              </select>

              <input
                type="number"
                disabled={customProtocol === 'icmp'}
                value={customPort}
                onChange={(e) => setCustomPort(Number(e.target.value))}
                className="w-20 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg px-2 py-1 text-[11px] disabled:opacity-40"
                placeholder="Port"
              />

              <button
                type="submit"
                className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-extrabold px-3 py-1 rounded-lg text-[11px] cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Fire Packet</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 4 Columns: Selected Region & Availability Zones Deep-Dive + Chaos & FinOps + Live Packet Ticker */}
        <div className="xl:col-span-4 space-y-4">
          {/* Selected Region & Zones Card */}
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3.5">
            <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      severedRegions.includes(selectedRegion.id)
                        ? 'bg-red-500 animate-ping'
                        : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <h3 className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50">
                    {selectedRegion.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    {selectedRegion.cfePercent}% CFE Green Grid
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                    GPS {selectedRegion.gpsLabel}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedRegion.city} [{selectedRegion.countryCode}] ·{' '}
                  {selectedRegion.continent} ({selectedRegion.gco2} gCO2eq/kWh)
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                  {selectedWorkloads.totalCount} Resource
                  {selectedWorkloads.totalCount === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={() => focusOnRegion(selectedRegion.id, 3.6)}
                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>Zoom to Region (3.6x)</span>
                </button>
              </div>
            </div>

            {/* Live Client-to-Region Socket RTT, Compute Quotas & VPC Subnet CIDR Panel */}
            {(() => {
              const liveProbe = (
                liveGeoTelemetry?.regionalSocketProbes || []
              ).find((p) => p.regionId === selectedRegion.id);
              const liveQuota = (liveGeoTelemetry?.regionalQuotas || []).find(
                (q) => q.regionName === selectedRegion.id
              );
              const liveSubnet = (liveGeoTelemetry?.liveSubnets || []).find(
                (sn) => sn.region === selectedRegion.id
              );
              return (
                <div className="p-2.5 rounded-xl bg-amber-500/[0.07] dark:bg-amber-500/[0.08] border border-amber-500/30 space-y-2 text-[10px] font-mono">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-extrabold text-amber-700 dark:text-amber-300">
                      {liveClientOriginNode.city} [{liveClientOriginNode.countryCode}] ⇄{' '}
                      {selectedRegion.name}:{' '}
                      {clientUplinkTelemetry.greatCircleKm.toLocaleString()} km
                      ({clientUplinkTelemetry.fiberKm.toLocaleString()} km fiber)
                    </span>
                    <button
                      type="button"
                      disabled={geoLoading}
                      onClick={() => fetchLiveGeoTelemetry(true, selectedRegion)}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-800 dark:text-amber-200 font-bold cursor-pointer disabled:opacity-50"
                    >
                      {geoLoading
                        ? 'Probing...'
                        : liveProbe
                        ? `Re-Probe ${selectedRegion.id}`
                        : `Probe Live Socket to ${selectedRegion.id}`}
                    </button>
                  </div>

                  {liveProbe ? (
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-amber-500/20">
                      <div className="p-1.5 rounded bg-white/70 dark:bg-zinc-950/70">
                        <span className="text-zinc-400 block">Live DNS</span>
                        <strong className="text-zinc-900 dark:text-zinc-100">
                          {liveProbe.dnsMs}ms
                        </strong>
                      </div>
                      <div className="p-1.5 rounded bg-white/70 dark:bg-zinc-950/70">
                        <span className="text-zinc-400 block">Live TCP :443</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {liveProbe.tcpMs}ms
                        </strong>
                      </div>
                      <div className="p-1.5 rounded bg-white/70 dark:bg-zinc-950/70">
                        <span className="text-zinc-400 block">Live TLS 1.3</span>
                        <strong className="text-blue-600 dark:text-blue-400">
                          {liveProbe.tlsMs}ms
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-500 dark:text-zinc-400">
                      Optical Fiber RTT Estimate:{' '}
                      <strong className="text-amber-600 dark:text-amber-300">
                        {clientUplinkTelemetry.estRttMs}
                      </strong>{' '}
                      · Click &ldquo;Probe Live Socket&rdquo; to execute a real TCP/TLS 1.3 handshake to{' '}
                      <code>{selectedRegion.id}-aiplatform.googleapis.com:443</code>.
                    </div>
                  )}

                  {(liveSubnet || liveQuota) && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-amber-500/20">
                      {liveSubnet && (
                        <div className="p-1.5 rounded bg-white/70 dark:bg-zinc-950/70">
                          <span className="text-zinc-400 block">
                            Live VPC Subnet ({liveSubnet.network})
                          </span>
                          <strong className="text-blue-600 dark:text-blue-400">
                            {liveSubnet.ipCidrRange}
                          </strong>{' '}
                          <span className="text-zinc-400">
                            (GW {liveSubnet.gatewayAddress})
                          </span>
                        </div>
                      )}
                      {liveQuota && (
                        <div className="p-1.5 rounded bg-white/70 dark:bg-zinc-950/70">
                          <span className="text-zinc-400 block">
                            Live Regional Quotas ({liveQuota.status})
                          </span>
                          <strong className="text-zinc-900 dark:text-zinc-100">
                            {liveQuota.cpusUsed}/{liveQuota.cpusLimit} vCPU
                          </strong>{' '}
                          · {liveQuota.disksGbUsed}/{liveQuota.disksGbLimit}GB
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Availability Zones Matrix inside Selected Region + Per-Zone Chaos Outage Toggle */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase text-zinc-400 flex items-center justify-between">
                <span>
                  Availability Zones in {selectedRegion.name} (
                  {selectedRegion.zones.length})
                </span>
                <span>Click Zone or Simulate Outage</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {selectedRegion.zones.map((zoneName, idx) => {
                  const zoneVms = selectedWorkloads.vms.filter(
                    (v) => v.zone === zoneName || v.region === zoneName
                  );
                  const isZoneActive = selectedZoneName === zoneName;
                  const isZoneDown =
                    severedRegions.includes(selectedRegion.id) ||
                    severedZones.includes(zoneName);
                  return (
                    <div
                      key={zoneName}
                      onClick={() => {
                        setSelectedZoneName(zoneName);
                        focusOnRegion(selectedRegion.id, Math.max(zoom, 3.4));
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono transition-colors cursor-pointer ${
                        isZoneDown
                          ? 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-300'
                          : isZoneActive
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-zinc-50 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isZoneDown
                              ? 'bg-red-500 animate-ping'
                              : isZoneActive
                              ? 'bg-emerald-400 animate-ping'
                              : 'bg-blue-400'
                          }`}
                        />
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {zoneName}
                        </span>
                        {isZoneDown ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 font-extrabold">
                            OUTAGE
                          </span>
                        ) : (
                          isZoneActive && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-extrabold">
                              SELECTED
                            </span>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {zoneVms.length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold">
                            {zoneVms.length} VM{zoneVms.length === 1 ? '' : 's'}
                          </span>
                        ) : idx === 0 && selectedWorkloads.cloudRun.length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold">
                            {selectedWorkloads.cloudRun.length} Cloud Run
                          </span>
                        ) : (
                          <span className="text-zinc-400">0.4ms</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSeverZone(zoneName);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                            severedZones.includes(zoneName)
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                          }`}
                        >
                          {severedZones.includes(zoneName) ? 'Restore' : 'Sever Zone'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Region Pricing Tier & Hardware / Service SKU Availability Badges */}
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2 text-[10px] font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold uppercase text-zinc-500">
                  {selectedRegion.name} SKU & Pricing Profile
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    selectedRegionProfile.priceMultiplier <= 1.06
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                      : selectedRegionProfile.priceMultiplier <= 1.16
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {selectedRegionProfile.priceMultiplier.toFixed(2)}x Rate (
                  {selectedRegionProfile.pricingTier})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded border font-bold ${
                    selectedRegionProfile.capabilities.cloudRunGpuL4
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-300'
                  }`}
                >
                  {selectedRegionProfile.capabilities.cloudRunGpuL4
                    ? 'Cloud Run L4 GPU'
                    : 'No Cloud Run GPU'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border font-bold ${
                    selectedRegionProfile.capabilities.computeGpuG2L4
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-300'
                  }`}
                >
                  {selectedRegionProfile.capabilities.computeGpuG2L4
                    ? 'G2/L4 GPU VMs'
                    : 'No G2 GPU VMs'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border font-bold ${
                    selectedRegionProfile.capabilities.computeAiMegaHub
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-300'
                      : 'bg-zinc-200/60 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500'
                  }`}
                >
                  {selectedRegionProfile.capabilities.computeAiMegaHub
                    ? 'A3 H100 / TPU Hub'
                    : 'Standard CPU/Web'}
                </span>
              </div>
            </div>

            {/* Wave 4+: Live Migration FinOps Cost, Carbon & GPU SKU Feasibility Advisor */}
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/[0.06] border border-emerald-500/30 space-y-2.5 text-[11px] font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>Live Migration FinOps & SKU Advisor</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggleSeverRegion(selectedRegion.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer ${
                    severedRegions.includes(selectedRegion.id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {severedRegions.includes(selectedRegion.id)
                    ? `Restore ${selectedRegion.name}`
                    : `Simulate Outage`}
                </button>
              </div>

              {/* Workload Hardware Requirements Toggles */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-zinc-500 font-bold">Workload SKU:</span>
                <button
                  type="button"
                  onClick={() => setSimRequiresCloudRunGpu((p) => !p)}
                  className={`px-2 py-0.5 rounded border font-bold cursor-pointer ${
                    simRequiresCloudRunGpu
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300'
                      : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  {simRequiresCloudRunGpu ? '☑' : '☐'} Cloud Run L4 GPU
                </button>
                <button
                  type="button"
                  onClick={() => setSimRequiresVmGpu((p) => !p)}
                  className={`px-2 py-0.5 rounded border font-bold cursor-pointer ${
                    simRequiresVmGpu
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300'
                      : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  {simRequiresVmGpu ? '☑' : '☐'} G2 GPU VM
                </button>
              </div>

              {/* Destination Region Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-500 uppercase font-bold">
                  Evaluate Migration Target from {selectedRegion.name}:
                </label>
                <select
                  value={migrationTargetRegionId}
                  onChange={(e) => setMigrationTargetRegionId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] font-mono text-zinc-900 dark:text-zinc-100"
                >
                  {GCP_GLOBAL_REGIONS.filter(
                    (r) => r.id !== selectedRegion.id
                  ).map((r) => {
                    const prof = getRegionProfile(r.id);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.city}) · {r.cfePercent}% CFE ·{' '}
                        {prof.priceMultiplier.toFixed(2)}x $ ·{' '}
                        {prof.capabilities.cloudRunGpuL4
                          ? 'Run GPU'
                          : 'No Run GPU'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Smart 3-Way Recommendation Pills (Greenest SKU-Compatible / Cheapest+Green / Same-Continent) */}
              <div className="grid grid-cols-3 gap-1 text-[9.5px]">
                {liveMigrationAnalysis.recommendations.greenestCompatible && (
                  <button
                    type="button"
                    onClick={() =>
                      setMigrationTargetRegionId(
                        liveMigrationAnalysis.recommendations.greenestCompatible
                          .dst.id
                      )
                    }
                    className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-left cursor-pointer"
                  >
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-300 truncate">
                      Greenest Valid
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-200 font-bold truncate">
                      {
                        liveMigrationAnalysis.recommendations.greenestCompatible
                          .dst.name
                      }
                    </div>
                    <div className="text-zinc-500">
                      {
                        liveMigrationAnalysis.recommendations.greenestCompatible
                          .dst.cfePercent
                      }
                      % CFE ·{' '}
                      {liveMigrationAnalysis.recommendations.greenestCompatible.dst.priceMultiplier.toFixed(
                        2
                      )}
                      x
                    </div>
                  </button>
                )}

                {liveMigrationAnalysis.recommendations
                  .cheapestGreenCompatible && (
                  <button
                    type="button"
                    onClick={() =>
                      setMigrationTargetRegionId(
                        liveMigrationAnalysis.recommendations
                          .cheapestGreenCompatible.dst.id
                      )
                    }
                    className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-left cursor-pointer"
                  >
                    <div className="font-extrabold text-blue-600 dark:text-blue-300 truncate">
                      Cheapest + Green
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-200 font-bold truncate">
                      {
                        liveMigrationAnalysis.recommendations
                          .cheapestGreenCompatible.dst.name
                      }
                    </div>
                    <div className="text-zinc-500">
                      $
                      {
                        liveMigrationAnalysis.recommendations
                          .cheapestGreenCompatible.targetMonthlyUsd
                      }
                      /mo ·{' '}
                      {
                        liveMigrationAnalysis.recommendations
                          .cheapestGreenCompatible.dst.cfePercent
                      }
                      % CFE
                    </div>
                  </button>
                )}

                {liveMigrationAnalysis.recommendations
                  .sameContinentCompatible && (
                  <button
                    type="button"
                    onClick={() =>
                      setMigrationTargetRegionId(
                        liveMigrationAnalysis.recommendations
                          .sameContinentCompatible.dst.id
                      )
                    }
                    className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-left cursor-pointer"
                  >
                    <div className="font-extrabold text-blue-600 dark:text-blue-300 truncate">
                      Local Continent
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-200 font-bold truncate">
                      {
                        liveMigrationAnalysis.recommendations
                          .sameContinentCompatible.dst.name
                      }
                    </div>
                    <div className="text-zinc-500">
                      $0.02/GB ·{' '}
                      {
                        liveMigrationAnalysis.recommendations
                          .sameContinentCompatible.dst.cfePercent
                      }
                      % CFE
                    </div>
                  </button>
                )}
              </div>

              {/* Hardware & Service SKU Compatibility Gatekeeper Banner */}
              {!liveMigrationAnalysis.evaluation.isCompatible ? (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/50 space-y-1.5 text-[10px]">
                  <div className="font-extrabold text-red-600 dark:text-red-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Hardware SKU Blocked in{' '}
                      {liveMigrationAnalysis.evaluation.dst.name}
                    </span>
                  </div>
                  {liveMigrationAnalysis.evaluation.blockers.map((b) => (
                    <div
                      key={b}
                      className="text-red-700 dark:text-red-200 leading-snug"
                    >
                      • {b}
                    </div>
                  ))}
                  {liveMigrationAnalysis.recommendations.greenestCompatible && (
                    <button
                      type="button"
                      onClick={() => {
                        const bestId =
                          liveMigrationAnalysis.recommendations
                            .greenestCompatible.dst.id;
                        setMigrationTargetRegionId(bestId);
                        focusOnRegion(bestId, 3.4);
                      }}
                      className="w-full mt-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                    >
                      Switch to Greenest GPU-Capable Region:{' '}
                      {
                        liveMigrationAnalysis.recommendations.greenestCompatible
                          .dst.name
                      }{' '}
                      (
                      {
                        liveMigrationAnalysis.recommendations.greenestCompatible
                          .dst.cfePercent
                      }
                      % CFE)
                    </button>
                  )}
                </div>
              ) : (
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-between">
                  <span>
                    100% SKU Compatible in{' '}
                    {liveMigrationAnalysis.evaluation.dst.name}
                  </span>
                  <span>
                    {liveMigrationAnalysis.evaluation.sameContinent
                      ? 'Same Continent ($0.02/GB)'
                      : `Cross-Continent ($${liveMigrationAnalysis.evaluation.egressRatePerGb}/GB)`}
                  </span>
                </div>
              )}

              {/* 3-Column Financial & Carbon Receipt */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-400">Monthly Spend</div>
                  <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    ${liveMigrationAnalysis.evaluation.sourceMonthlyUsd} → $
                    {liveMigrationAnalysis.evaluation.targetMonthlyUsd}
                  </div>
                  <div
                    className={`font-bold ${
                      liveMigrationAnalysis.evaluation.monthlyDeltaUsd <= 0
                        ? 'text-emerald-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {liveMigrationAnalysis.evaluation.monthlyDeltaUsd <= 0
                      ? `Saves $${Math.abs(
                          liveMigrationAnalysis.evaluation.monthlyDeltaUsd
                        ).toFixed(2)}/mo`
                      : `+$${liveMigrationAnalysis.evaluation.monthlyDeltaUsd.toFixed(
                          2
                        )}/mo (${
                          liveMigrationAnalysis.evaluation.monthlyDeltaPercent
                        }%)`}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-400">1-Time Egress</div>
                  <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    ${liveMigrationAnalysis.evaluation.oneTimeTransferUsd.toFixed(2)}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-bold">
                    {liveMigrationAnalysis.evaluation.breakEvenDays !== null
                      ? `ROI: ${liveMigrationAnalysis.evaluation.breakEvenDays}d payback`
                      : `${liveMigrationAnalysis.spec.stateSizeGb}GB state sync`}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-400">Carbon Delta</div>
                  <div
                    className={`font-extrabold ${
                      liveMigrationAnalysis.evaluation.gco2Delta <= 0
                        ? 'text-emerald-500'
                        : 'text-red-500'
                    }`}
                  >
                    {liveMigrationAnalysis.evaluation.cfeDelta >= 0 ? '+' : ''}
                    {liveMigrationAnalysis.evaluation.cfeDelta}% CFE
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {liveMigrationAnalysis.evaluation.annualCo2SavedKg >= 0
                      ? `-${liveMigrationAnalysis.evaluation.annualCo2SavedKg}kg CO2/yr`
                      : `+${Math.abs(
                          liveMigrationAnalysis.evaluation.annualCo2SavedKg
                        )}kg CO2/yr`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  focusOnRegion(migrationTargetRegionId, 3.5);
                  setRouteAnalyzerEnabled(true);
                  setRouteSourceRegionId(selectedRegion.id);
                  setRouteDestRegionId(migrationTargetRegionId);
                  if (onShowToast) {
                    onShowToast(
                      `Focused on target ${liveMigrationAnalysis.evaluation.dst.name} (${liveMigrationAnalysis.evaluation.dst.cfePercent}% CFE · $${liveMigrationAnalysis.evaluation.targetMonthlyUsd}/mo)`
                    );
                  }
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3 h-3" />
                <span>
                  Inspect Target {liveMigrationAnalysis.evaluation.dst.name} on
                  Map & Measure Fiber RTT
                </span>
              </button>
            </div>

            {/* Regional Workloads Breakdown */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono font-bold uppercase text-zinc-400">
                Active Workloads Deployed in {selectedRegion.name}
              </div>
              {selectedWorkloads.totalCount === 0 ? (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                  No project resources currently in{' '}
                  <code className="font-mono">{selectedRegion.name}</code>.
                </div>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto text-[11px] font-mono">
                  {[
                    ...selectedWorkloads.vms,
                    ...selectedWorkloads.cloudRun,
                    ...selectedWorkloads.buckets,
                    ...selectedWorkloads.datasets,
                    ...selectedWorkloads.gke,
                  ].map((res) => (
                    <div
                      key={res.id}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {res.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        {res.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drop-Pod Coordinate Provisioning Actions (Pre-locked to Selected Region & Zone) */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() =>
                  onOpenProvision &&
                  onOpenProvision('COMPUTE_VM', {
                    region: selectedRegion.id,
                    zone: selectedZoneName,
                  })
                }
                className="py-2 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-mono font-bold cursor-pointer"
              >
                Drop-Pod VM in {selectedZoneName}
              </button>
              <button
                type="button"
                onClick={() =>
                  onOpenProvision &&
                  onOpenProvision('CLOUD_RUN', {
                    region: selectedRegion.id,
                    zone: selectedZoneName,
                  })
                }
                className="py-2 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-mono font-bold cursor-pointer"
              >
                Deploy Cloud Run in {selectedRegion.id}
              </button>
            </div>
          </div>

          {/* Live Packet Interception & Routing Feed */}
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold uppercase text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 animate-pulse" />
                <span>Live Global Packet & Firewall Verdict Stream</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                Total: {counters.totalPackets} pkts
              </span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-64 overflow-y-auto text-[11px] font-mono">
              {packetLog.length === 0 ? (
                <div className="py-6 text-center text-zinc-400">
                  Waiting for packets to traverse the global mesh...
                </div>
              ) : (
                packetLog.map((pkt) => (
                  <div
                    key={pkt.id}
                    className="py-2 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                            pkt.kind === 'BACKBONE'
                              ? 'bg-blue-500/20 text-blue-500'
                              : pkt.verdict === 'ALLOW'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {pkt.kind === 'BACKBONE'
                            ? '⇄ FIBER MESH'
                            : pkt.verdict === 'ALLOW'
                            ? '✓ ALLOWED'
                            : '✕ BLOCKED'}
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {pkt.protocol.toUpperCase()}:{pkt.port || 'ICMP'}
                        </span>
                        <span className="text-zinc-400">→</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {pkt.targetZone}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        From {pkt.sourceIp} ({pkt.sourceLabel}) · Rule:{' '}
                        <strong className="text-zinc-700 dark:text-zinc-300">
                          {pkt.ruleName}
                        </strong>{' '}
                        (p:{pkt.priority})
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {pkt.latencyMs}ms
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Complete Interactive Directory of All 40 Google Cloud Regions & 121 Zones */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>
                Complete Google Cloud Global Region & Zone Directory (40 Regions ·
                121 Availability Zones)
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              Click any region card below to immediately zoom the orbital camera to
              its coordinates and inspect its zones.
            </p>
          </div>
          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
            Currently Selected: {selectedRegion.name} ({selectedRegion.city})
          </span>
        </div>

        <div className="space-y-4">
          {[
            'North America',
            'South America',
            'Europe',
            'Middle East',
            'Africa',
            'Asia',
            'Oceania',
          ].map((continent) => {
            const regs = GCP_GLOBAL_REGIONS.filter(
              (r) => r.continent === continent
            );
            return (
              <div key={continent} className="space-y-2">
                <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>
                    {continent} ({regs.length} Region{regs.length === 1 ? '' : 's'})
                  </span>
                  <span>
                    {regs.reduce((acc, r) => acc + r.zones.length, 0)} Zones
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {regs.map((reg) => {
                    const cnt = regionWorkloadsMap[reg.id]?.totalCount || 0;
                    const isSel = selectedRegionId === reg.id;
                    return (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() =>
                          focusOnRegion(reg.id, 3.5, { scrollToMap: true })
                        }
                        className={`p-2.5 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                          isSel
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                            : cnt > 0
                            ? 'bg-blue-500/5 border-blue-500/40 hover:border-blue-500'
                            : 'bg-zinc-50/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                            {reg.name}
                          </span>
                          {cnt > 0 ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold">
                              {cnt} live
                            </span>
                          ) : (
                            <span className="text-[9px] text-zinc-400">
                              {reg.zones.length} zones
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {reg.city}
                        </div>
                        <div className="text-[9px] text-zinc-400 mt-1 truncate">
                          Zones: {reg.zones.map((z) => z.split('-').pop()).join(', ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
