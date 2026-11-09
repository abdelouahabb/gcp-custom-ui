import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  Globe,
  Lock,
  Key,
  HardDrive,
  Rocket,
  Server,
  Database,
  RefreshCw,
  Play,
  Check,
  Copy,
  AlertTriangle,
  Eye,
  FileWarning,
  Layers,
  Activity,
  DollarSign,
  ArrowRight,
  Terminal,
  Trash2,
  Download,
} from 'lucide-react';
import {
  addOrSelectCustomGeminiModel,
  getAllAvailableGeminiModels,
} from './ZeroSniffingWebCryptoEnclaveBar';
import {
  GCP_GLOBAL_REGIONS,
  getRegionProfile,
  useLivePricingCatalog,
  LivePricingCatalogControlBar,
} from './GlobalNetworkWorldMap';
import SecretManagerVaultExplorer from './SecretManagerVaultExplorer';

// 12 Global User Population Metropolises for X5 Speed-of-Light Latency Matrix
const GLOBAL_CLIENT_HUBS = [
  {
    id: 'nyc',
    city: 'New York, USA',
    flag: '',
    lat: 40.71,
    lon: -74.01,
    nearestEdgeMs: 9,
  },
  {
    id: 'sfo',
    city: 'Silicon Valley, USA',
    flag: '',
    lat: 37.39,
    lon: -122.08,
    nearestEdgeMs: 8,
  },
  {
    id: 'gru',
    city: 'São Paulo, Brazil',
    flag: '',
    lat: -23.55,
    lon: -46.63,
    nearestEdgeMs: 11,
  },
  {
    id: 'lhr',
    city: 'London, UK',
    flag: '',
    lat: 51.51,
    lon: -0.13,
    nearestEdgeMs: 8,
  },
  {
    id: 'fra',
    city: 'Frankfurt, Germany',
    flag: '',
    lat: 50.11,
    lon: 8.68,
    nearestEdgeMs: 7,
  },
  {
    id: 'cdg',
    city: 'Paris, France',
    flag: '',
    lat: 48.86,
    lon: 2.35,
    nearestEdgeMs: 8,
  },
  {
    id: 'dxb',
    city: 'Dubai / Doha, MENA',
    flag: '',
    lat: 25.2,
    lon: 55.27,
    nearestEdgeMs: 14,
  },
  {
    id: 'jnb',
    city: 'Johannesburg, ZA',
    flag: '',
    lat: -26.2,
    lon: 28.05,
    nearestEdgeMs: 13,
  },
  {
    id: 'bom',
    city: 'Mumbai, India',
    flag: '',
    lat: 19.08,
    lon: 72.88,
    nearestEdgeMs: 10,
  },
  {
    id: 'sin',
    city: 'Singapore, APAC',
    flag: '',
    lat: 1.35,
    lon: 103.82,
    nearestEdgeMs: 8,
  },
  {
    id: 'nrt',
    city: 'Tokyo, Japan',
    flag: '',
    lat: 35.68,
    lon: 139.77,
    nearestEdgeMs: 8,
  },
  {
    id: 'syd',
    city: 'Sydney, Australia',
    flag: '',
    lat: -33.87,
    lon: 151.21,
    nearestEdgeMs: 10,
  },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function EngineerMoonshotsWave3({
  activeTab,
  projectId,
  overview,
  initialBucketName = '',
  onSelectBucket,
  onOpenObjectInWorkbench,
  onRefreshGlobal,
  onRunInShell,
  onSelectStudioTab,
  onOpenBigQuerySql,
  onShowToast,
  onShowError,
}) {
  const { version: pricingVersion, unitPricing } = useLivePricingCatalog();
  const [copiedKey, setCopiedKey] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleDownloadFile = (filename, content, mimeType = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ==========================================================================
  // X1 STATE: Cloud Storage DLP, Secret Leak & PII X-Ray Scanner
  // ==========================================================================
  const [buckets, setBuckets] = useState(() => overview?.buckets || []);
  const [selectedDlpBucket, setSelectedDlpBucket] = useState(
    () => initialBucketName || overview?.buckets?.[0]?.name || ''
  );
  const [dlpScanEngine, setDlpScanEngine] = useState('LOCAL_RAM_REGEX_LUHN'); // LOCAL_RAM_REGEX_LUHN | CLOUD_DLP_VISION_OCR
  const [showDlpArchitectureDocs, setShowDlpArchitectureDocs] = useState(true);
  const [dlpScanResult, setDlpScanResult] = useState(null);
  const [canaryInjectReceipt, setCanaryInjectReceipt] = useState(null);
  const [dlpRedactionReceipt, setDlpRedactionReceipt] = useState(null);
  const [showDlpSecretManagerExplorer, setShowDlpSecretManagerExplorer] =
    useState(false);
  const [dlpInlineError, setDlpInlineError] = useState(null);
  const [scanningDlp, setScanningDlp] = useState(false);

  useEffect(() => {
    if (initialBucketName && initialBucketName !== selectedDlpBucket) {
      setSelectedDlpBucket(initialBucketName);
      setDlpScanResult(null);
      setCanaryInjectReceipt(null);
      setDlpRedactionReceipt(null);
      setDlpInlineError(null);
    } else if (!selectedDlpBucket && overview?.buckets?.length > 0) {
      setSelectedDlpBucket(overview.buckets[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBucketName, overview?.buckets]);

  const fetchBucketsForMoonshots = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/storage/buckets`
      );
      const list = res.data?.buckets || [];
      setBuckets(list);
      if (list.length > 0 && !selectedDlpBucket) {
        setSelectedDlpBucket(list[0].name);
      }
    } catch {
      // Fallback to overview buckets if detailed storage call fails
    }
  }, [projectId, selectedDlpBucket]);

  useEffect(() => {
    fetchBucketsForMoonshots();
  }, [fetchBucketsForMoonshots]);

  const handleRunDlpScan = async (
    bucketToScan = selectedDlpBucket,
    engineOverride = dlpScanEngine
  ) => {
    if (!projectId || !bucketToScan) return;
    setScanningDlp(true);
    setDlpInlineError(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(bucketToScan)}/dlp-scan`,
        { scanEngine: engineOverride }
      );
      setDlpScanResult(res.data);
      if (onShowToast) {
        onShowToast(
          `DLP X-Ray (${
            res.data.scanEngine === 'CLOUD_DLP_VISION_OCR'
              ? 'Cloud DLP v2 + Vision OCR'
              : '$0.00 In-Memory Regex + Luhn/Entropy'
          }) scanned ${res.data.scannedObjectsCount} object(s) in gs://${bucketToScan}: ${res.data.totalMatches} secret/PII pattern(s) detected.`
        );
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.error || `Failed to run DLP scan on gs://${bucketToScan}`;
      setDlpInlineError(errMsg);
      if (onShowError) {
        onShowError(errMsg);
      }
    } finally {
      setScanningDlp(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'X1' && projectId && selectedDlpBucket) {
      handleRunDlpScan(selectedDlpBucket, dlpScanEngine);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, projectId, selectedDlpBucket]);

  const handleInjectCanaryLeakObject = async () => {
    if (!projectId) return;
    setBusyKey('inject-canary');
    setDlpInlineError(null);
    try {
      const targetBucket =
        selectedDlpBucket ||
        buckets[0]?.name ||
        overview?.buckets?.[0]?.name ||
        '_auto_canary_';

      const syntheticGcpKey = [
        'AIza',
        'SyD9canaryTestKeyForCloudPulseDlpXray99123',
      ].join('');
      const syntheticAwsKey = ['AKIA', 'IOSFODNN7EXAMPLE'].join('');
      const syntheticGhPat = [
        'ghp',
        '_1234567890abcdefABCDEF1234567890abcd',
      ].join('');
      const syntheticSk = [
        'sk-proj-',
        'canaryTestSecretKeyForCloudPulse2026ScannerDemo99',
      ].join('');
      const syntheticPan = ['4532', '0151', '1283', '0366'].join('-'); // Luhn Mod-10 valid test PAN
      const canaryPayload = `# CANARY DLP TEST ARTIFACT (SAFE SYNTHETIC TOKENS FOR X-RAY VERIFICATION)
SERVICE_ENVIRONMENT=staging
GCP_TEST_API_KEY=${syntheticGcpKey}
AWS_BACKUP_ACCESS_KEY=${syntheticAwsKey}
GITHUB_AUTOMATION_PAT=${syntheticGhPat}
OPENAI_INFERENCE_KEY=${syntheticSk}
DB_PASSWORD="SyntheticCanaryDemoVaultValue_000!"
TEST_BILLING_CARD_PAN=${syntheticPan}
CUSTOMER_CONTACT_EMAIL=sre-compliance-audit@enterprise-example.org
EU_TREASURY_IBAN=DE89370400440532013000
US_TAXPAYER_SSN=123-45-6789
`;
      const uploadRes = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(targetBucket)}/objects`,
        {
          objectName: 'canary-audit/leaked-staging-secrets.env',
          content: canaryPayload,
          textContent: canaryPayload,
          contentType: 'text/plain; charset=utf-8',
          storageClass: 'STANDARD',
          autoFallbackWritableBucket: true,
        }
      );

      const resolvedBucket =
        uploadRes.data?.bucket ||
        uploadRes.data?.object?.bucket ||
        (targetBucket !== '_auto_canary_' ? targetBucket : '');

      if (resolvedBucket) {
        setBuckets((prev) => {
          if (prev.some((b) => b.name === resolvedBucket)) return prev;
          return [
            {
              name: resolvedBucket,
              location: uploadRes.data?.bucketLocation || 'US',
            },
            ...prev,
          ];
        });
        setSelectedDlpBucket(resolvedBucket);
      }

      setCanaryInjectReceipt({
        bucket: resolvedBucket,
        owningProjectId: uploadRes.data?.owningProjectId || projectId,
        autoRoutedFromClosedBilling: Boolean(
          uploadRes.data?.autoRoutedFromClosedBilling
        ),
        autoRoutedReason: uploadRes.data?.autoRoutedReason || null,
        objectName: 'canary-audit/leaked-staging-secrets.env',
        sizeBytes: Number(uploadRes.data?.object?.size || canaryPayload.length),
        generation: uploadRes.data?.object?.generation || 'latest',
        md5Hash: uploadRes.data?.object?.md5Hash || '',
        crc32c: uploadRes.data?.object?.crc32c || '',
        injectedAt: new Date().toISOString(),
        injectedPatternsCount: 9,
      });

      if (onShowToast) {
        onShowToast(
          `Uploaded synthetic canary file gs://${resolvedBucket}/canary-audit/leaked-staging-secrets.env (${canaryPayload.length} bytes) — running DLP X-Ray now!`
        );
      }
      if (resolvedBucket) {
        await handleRunDlpScan(resolvedBucket, dlpScanEngine);
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.error || 'Failed to upload canary test file.';
      setDlpInlineError(errMsg);
      if (onShowError) {
        onShowError(errMsg);
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleRedactObjectInPlace = async (
    objectName,
    purgePreviousGeneration = false,
    redactionMode = 'VAULT_TO_SECRET_MANAGER'
  ) => {
    if (!projectId || !selectedDlpBucket || !objectName) return;
    setBusyKey(`redact-${objectName}`);
    setDlpInlineError(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(selectedDlpBucket)}/dlp-redact`,
        {
          objectName,
          scanEngine: dlpScanEngine,
          redactionMode,
          purgePreviousGeneration,
        }
      );
      setDlpRedactionReceipt(res.data);
      if (Number(res.data?.vaultedSecretsCount || 0) > 0) {
        setShowDlpSecretManagerExplorer(true);
      }
      if (onShowToast) {
        onShowToast(res.data?.message || `Sanitized ${objectName} in-place!`);
      }
      await handleRunDlpScan(selectedDlpBucket, dlpScanEngine);
    } catch (err) {
      if (err?.isDestructiveCancelled || err?.message === 'DESTRUCTIVE_ACTION_CANCELLED') {
        return;
      }
      const errMsg =
        err.response?.data?.error || `Failed to redact ${objectName}`;
      setDlpInlineError(errMsg);
      if (onShowError) {
        onShowError(errMsg);
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleRehydrateFromSecretManager = async (bucketName, objectName) => {
    if (!projectId || !bucketName || !objectName) return;
    setBusyKey(`rehydrate-${objectName}`);
    setDlpInlineError(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          bucketName
        )}/dlp-rehydrate-from-secret-manager`,
        { objectName, writeBackToGcs: true }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Rehydrated credentials from Secret Manager into gs://${bucketName}/${objectName}!`
        );
      }
      await handleRunDlpScan(bucketName, dlpScanEngine);
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        `Failed to rehydrate sm:// secrets for ${objectName}`;
      setDlpInlineError(errMsg);
      if (onShowError) {
        onShowError(errMsg);
      }
    } finally {
      setBusyKey(null);
    }
  };

  // ==========================================================================
  // X2 STATE: Serverless Cold-Start Profiler & Container Diet Surgeon
  // ==========================================================================
  const cloudRunServices = overview?.cloudRun || [];
  const [selectedRunService, setSelectedRunService] = useState('');
  const [simBaseImage, setSimBaseImage] = useState('python-full-1.1gb'); // python-full-1.1gb | node-debian-920mb | distroless-48mb

  useEffect(() => {
    if (cloudRunServices.length > 0 && !selectedRunService) {
      setSelectedRunService(cloudRunServices[0].name);
    }
  }, [cloudRunServices, selectedRunService]);

  const activeRunObj = useMemo(
    () =>
      cloudRunServices.find((s) => s.name === selectedRunService) ||
      cloudRunServices[0] || {
        name: 'ai-inference-gateway',
        region: 'us-central1',
        cpu: '1',
        memory: '512Mi',
        minScale: 0,
        maxScale: 10,
        startupCpuBoost: false,
        executionEnvironment: 'EXECUTION_ENVIRONMENT_GEN1',
        gpuType: null,
      },
    [cloudRunServices, selectedRunService]
  );

  const coldStartProfile = useMemo(() => {
    const hasBoost = Boolean(activeRunObj.startupCpuBoost);
    const isGen2 =
      activeRunObj.executionEnvironment === 'EXECUTION_ENVIRONMENT_GEN2';
    const hasWarmPool = Number(activeRunObj.minScale || 0) > 0;
    const hasGpu = Boolean(activeRunObj.gpuType);

    const imagePullMs =
      simBaseImage === 'distroless-48mb'
        ? 140
        : simBaseImage === 'node-debian-920mb'
        ? 980
        : 1320;
    const unpackMs = isGen2
      ? Math.round(imagePullMs * 0.28)
      : Math.round(imagePullMs * 0.55);
    const runtimeInitMs = hasBoost ? 310 : 1140;
    const gpuDriverInitMs = hasGpu ? 2100 : 0;
    const tlsHandshakeMs = 65;
    const totalColdStartMs = hasWarmPool
      ? 42
      : imagePullMs + unpackMs + runtimeInitMs + gpuDriverInitMs + tlsHandshakeMs;

    const optimizedTotalMs =
      140 + Math.round(140 * 0.28) + 310 + (hasGpu ? 1200 : 0) + 65;

    return {
      hasBoost,
      isGen2,
      hasWarmPool,
      hasGpu,
      imagePullMs,
      unpackMs,
      runtimeInitMs,
      gpuDriverInitMs,
      tlsHandshakeMs,
      totalColdStartMs,
      optimizedTotalMs,
      speedupPct: Math.max(
        12,
        Math.round(
          ((totalColdStartMs - optimizedTotalMs) / Math.max(1, totalColdStartMs)) *
            100
        )
      ),
    };
  }, [activeRunObj, simBaseImage]);

  const handleApplyColdStartSurgery = async () => {
    if (!projectId || !activeRunObj?.name || cloudRunServices.length === 0) {
      if (onShowToast) {
        onShowToast(
          'Simulated Startup CPU Boost + Gen2 Execution Environment patch (Create a live Cloud Run service to patch in production)!'
        );
      }
      return;
    }
    setBusyKey(`coldstart-${activeRunObj.name}`);
    try {
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(
          activeRunObj.region || 'us-central1'
        )}/${encodeURIComponent(activeRunObj.name)}/scale`,
        {
          minInstances: Number(activeRunObj.minScale || 0),
          maxInstances: Number(activeRunObj.maxScale || 10),
          cpu: activeRunObj.cpu || '1',
          memory: activeRunObj.memory || '512Mi',
          startupCpuBoost: true,
          executionEnvironment: 'EXECUTION_ENVIRONMENT_GEN2',
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Applied Startup CPU Boost + Gen2 Execution Environment to ${activeRunObj.name}!`
        );
      }
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to apply Cold-Start Surgery to ${activeRunObj.name}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // ==========================================================================
  // X3 STATE: Cross-Service Egress & Hidden Data-Gravity Tollbooth
  // ==========================================================================
  const [monthlyTrafficGbPerLink, setMonthlyTrafficGbPerLink] = useState(850);

  const dataGravityMatrix = useMemo(() => {
    const vms = (overview?.vms || []).map((v) => ({
      type: 'Compute VM',
      name: v.name,
      region: (v.zone || 'us-central1-a').split('-').slice(0, 2).join('-'),
    }));
    const runs = (overview?.cloudRun || []).map((r) => ({
      type: 'Cloud Run',
      name: r.name,
      region: (r.region || 'us-central1').toLowerCase(),
    }));
    const stBuckets = (buckets.length > 0 ? buckets : overview?.buckets || []).map(
      (b) => ({
        type: 'Storage Bucket',
        name: `gs://${b.name}`,
        region: String(b.location || 'us-east1').toLowerCase(),
      })
    );
    const bqDatasets = (overview?.bigquery || []).map((d) => ({
      type: 'BigQuery Dataset',
      name: d.datasetId || d.name,
      region: String(d.location || 'US').toLowerCase(),
    }));

    const computeNodes = [...vms, ...runs];
    const dataNodes = [...stBuckets, ...bqDatasets];

    // If user has fewer than 1 compute or data node, synthesize representative pairs alongside live ones
    const effCompute =
      computeNodes.length > 0
        ? computeNodes
        : [
            { type: 'Cloud Run', name: 'api-gateway-prod', region: 'us-west1' },
            { type: 'Compute VM', name: 'worker-etl-node-1', region: 'europe-west1' },
          ];
    const effData =
      dataNodes.length > 0
        ? dataNodes
        : [
            { type: 'Storage Bucket', name: 'gs://raw-lakehouse-vault', region: 'us-east1' },
            { type: 'BigQuery Dataset', name: 'analytics_warehouse', region: 'eu' },
          ];

    const interRegionRate = Number(unitPricing.interRegionEgressPerGbUsd || 0.02);
    const interContinentRate = Number(
      unitPricing.interContinentEgressPerGbUsd || 0.08
    );

    const links = [];
    let totalMonthlyEgressTaxUsd = 0;

    effCompute.forEach((comp) => {
      effData.forEach((dat) => {
        const cReg = comp.region.toLowerCase();
        const dReg = dat.region.toLowerCase();
        const cCont = cReg.split('-')[0];
        const dCont =
          dReg === 'us' || dReg === 'nam4'
            ? 'us'
            : dReg === 'eu' || dReg === 'eur4'
            ? 'europe'
            : dReg === 'asia' || dReg === 'asia1'
            ? 'asia'
            : dReg.split('-')[0];

        let tier = 'SAME_REGION_FREE';
        let ratePerGb = 0;
        if (cReg === dReg) {
          tier = 'SAME_REGION_FREE';
          ratePerGb = 0;
        } else if (cCont === dCont) {
          tier = 'CROSS_REGION_SAME_CONTINENT';
          ratePerGb = interRegionRate;
        } else {
          tier = 'CROSS_CONTINENT_TRANSOCEANIC';
          ratePerGb = interContinentRate;
        }

        const monthlyTollUsd = +(ratePerGb * monthlyTrafficGbPerLink).toFixed(2);
        totalMonthlyEgressTaxUsd += monthlyTollUsd;

        links.push({
          id: `${comp.name}->${dat.name}`,
          compute: comp,
          data: dat,
          tier,
          ratePerGb,
          monthlyTollUsd,
          annualTollUsd: +(monthlyTollUsd * 12).toFixed(2),
        });
      });
    });

    return {
      links,
      totalMonthlyEgressTaxUsd: +totalMonthlyEgressTaxUsd.toFixed(2),
      totalAnnualEgressTaxUsd: +(totalMonthlyEgressTaxUsd * 12).toFixed(2),
      taxedLinksCount: links.filter((l) => l.ratePerGb > 0).length,
    };
  }, [overview, buckets, monthlyTrafficGbPerLink, pricingVersion, unitPricing]);

  // ==========================================================================
  // X4 STATE: Cryptographic Ransomware Air-Gap & Clean-Room Recovery Auditor
  // ==========================================================================
  const [selectedRansomwareBucket, setSelectedRansomwareBucket] = useState(
    initialBucketName || ''
  );
  const [deepRansomwareAudit, setDeepRansomwareAudit] = useState(null);
  const [loadingDeepRansomware, setLoadingDeepRansomware] = useState(false);
  const [ransomwareDrillReceipt, setRansomwareDrillReceipt] = useState(null);
  const [runningRansomwareDrill, setRunningRansomwareDrill] = useState(false);

  const ransomwareAudit = useMemo(() => {
    const list = buckets.length > 0 ? buckets : overview?.buckets || [];
    const auditedBuckets = list.map((b) => {
      const pap = b.publicAccessPrevention === 'enforced';
      const ubla = Boolean(b.uniformBucketLevelAccess);
      const softDelDays = Number(b.softDeleteDays ?? 7);
      const versioning = Boolean(b.versioningEnabled);
      const wormDays = Number(b.retentionPeriodDays || 0);
      const wormLocked = Boolean(b.retentionIsLocked);
      const defaultEventHold = Boolean(b.defaultEventBasedHold);
      const cmek = Boolean(b.kmsKeyName);
      const kmsKeyShort = b.kmsKeyName
        ? String(b.kmsKeyName).split('/').pop()
        : null;
      const privilegedPrincipalsCount = Number(
        b.privilegedIamPrincipalsCount || 0
      );

      let score = 0;
      if (pap) score += 20;
      if (ubla) score += 20;
      if (softDelDays >= 30) score += 25;
      else if (softDelDays >= 14) score += 18;
      else if (softDelDays >= 7) score += 10;
      if (versioning || wormDays > 0) score += 25;
      if (wormDays >= 7 || defaultEventHold) score += 5;
      if (cmek) score += 5;

      return {
        name: b.name,
        location: b.location || 'US',
        storageClass: b.storageClass || 'STANDARD',
        pap,
        ubla,
        softDelDays,
        versioning,
        wormDays,
        wormLocked,
        defaultEventHold,
        cmek,
        kmsKeyShort,
        privilegedPrincipalsCount,
        survivalScore: Math.min(100, score),
      };
    });

    const overallScore =
      auditedBuckets.length > 0
        ? Math.round(
            auditedBuckets.reduce((s, b) => s + b.survivalScore, 0) /
              auditedBuckets.length
          )
        : 85;

    return {
      auditedBuckets,
      overallScore,
      rtoMinutes: overallScore >= 85 ? 1 : overallScore >= 65 ? 15 : 95,
      rpoMinutes: overallScore >= 85 ? 0 : 15,
    };
  }, [buckets, overview]);

  useEffect(() => {
    if (initialBucketName && initialBucketName !== selectedRansomwareBucket) {
      setSelectedRansomwareBucket(initialBucketName);
      setRansomwareDrillReceipt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBucketName]);

  useEffect(() => {
    const list = ransomwareAudit.auditedBuckets;
    if (
      list.length > 0 &&
      (!selectedRansomwareBucket ||
        !list.some((b) => b.name === selectedRansomwareBucket))
    ) {
      setSelectedRansomwareBucket(initialBucketName || list[0].name);
    }
  }, [ransomwareAudit.auditedBuckets, selectedRansomwareBucket, initialBucketName]);

  const handleRunDeepRansomwareAudit = async (bucketNameOverride = null) => {
    const targetBkt =
      bucketNameOverride ||
      selectedRansomwareBucket ||
      ransomwareAudit.auditedBuckets[0]?.name;
    if (!projectId || !targetBkt) return;
    setLoadingDeepRansomware(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          targetBkt
        )}/ransomware-deep-audit`
      );
      setDeepRansomwareAudit(res.data);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to run deep ransomware audit on gs://${targetBkt}`
        );
      }
    } finally {
      setLoadingDeepRansomware(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'X4' && projectId && selectedRansomwareBucket) {
      handleRunDeepRansomwareAudit(selectedRansomwareBucket);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, projectId, selectedRansomwareBucket]);

  const handleAirGapLockBucket = async (bucketName, patchOverride = null) => {
    if (!projectId || !bucketName) return;
    setBusyKey(`airgap-${bucketName}`);
    try {
      const payload = patchOverride || {
        publicAccessPrevention: 'enforced',
        uniformBucketLevelAccess: true,
        versioningEnabled: true,
        softDeleteDays: 30,
      };
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(bucketName)}`,
        payload
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Updated Ransomware Air-Gap policy on gs://${bucketName}!`
        );
      }
      await fetchBucketsForMoonshots();
      if (bucketName === selectedRansomwareBucket) {
        await handleRunDeepRansomwareAudit(bucketName);
      }
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to apply Air-Gap Vault policy on gs://${bucketName}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleRunRansomwareDrill = async (bucketNameOverride = null) => {
    const targetBkt =
      bucketNameOverride ||
      selectedRansomwareBucket ||
      ransomwareAudit.auditedBuckets[0]?.name;
    if (!projectId || !targetBkt) return;
    setRunningRansomwareDrill(true);
    setBusyKey(`drill-${targetBkt}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(targetBkt)}/ransomware-drill`,
        {}
      );
      setRansomwareDrillReceipt(res.data);
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Completed Clean-Room Ransomware Rollback Drill on gs://${targetBkt}!`
        );
      }
      await fetchBucketsForMoonshots();
      await handleRunDeepRansomwareAudit(targetBkt);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to run Clean-Room Ransomware Drill on gs://${targetBkt}`
        );
      }
    } finally {
      setRunningRansomwareDrill(false);
      setBusyKey(null);
    }
  };

  const handleRollbackNoncurrentGeneration = async (
    bucketName,
    objectName,
    sourceGeneration
  ) => {
    if (!projectId || !bucketName || !objectName || !sourceGeneration) return;
    setBusyKey(`rollback-${objectName}-${sourceGeneration}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(bucketName)}/objects/rewrite`,
        {
          objectName,
          sourceGeneration: String(sourceGeneration),
          destinationBucket: bucketName,
          destinationObjectName: objectName,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Restored generation #${sourceGeneration} as the live version of gs://${bucketName}/${objectName}!`
        );
      }
      await handleRunDeepRansomwareAudit(bucketName);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to restore generation #${sourceGeneration} for ${objectName}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // ==========================================================================
  // X5 STATE: Global Anycast User-Experience & Edge Latency Matrix
  // ==========================================================================
  const [enableGlobalAnycastCdn, setEnableGlobalAnycastCdn] = useState(false);
  const [selectedOriginRegion, setSelectedOriginRegion] = useState('us-east1');

  const latencyMatrix = useMemo(() => {
    const originProfile = getRegionProfile(selectedOriginRegion);
    const oLat = originProfile?.lat ?? 33.19;
    const oLon = originProfile?.lon ?? -80.01;

    const rows = GLOBAL_CLIENT_HUBS.map((hub) => {
      const distKm = Math.round(haversineKm(hub.lat, hub.lon, oLat, oLon));
      // Speed of light in fiber is ~200 km/ms (round-trip ~100 km/ms with routing hops)
      const fiberRttMs = Math.max(6, Math.round(distKm / 92));
      const directTlsHandshakeMs = Math.round(fiberRttMs * 1.5);
      const computeWarmMs = 18;
      const directTotalMs = fiberRttMs + directTlsHandshakeMs + computeWarmMs;

      // With Google Global Anycast Edge Load Balancer + Cloud CDN:
      // TLS terminates at the nearest Google PoP (hub.nearestEdgeMs), and cached/proxied backbone rides Jupiter optical fabric
      const anycastEdgeHitMs = hub.nearestEdgeMs * 2 + 6;
      const anycastDynamicBackboneMs =
        hub.nearestEdgeMs + Math.round(fiberRttMs * 0.62) + computeWarmMs;

      const activeLatencyMs = enableGlobalAnycastCdn
        ? anycastEdgeHitMs
        : directTotalMs;

      return {
        ...hub,
        distKm,
        fiberRttMs,
        directTotalMs,
        anycastEdgeHitMs,
        anycastDynamicBackboneMs,
        activeLatencyMs,
        savedMs: Math.max(0, directTotalMs - anycastEdgeHitMs),
      };
    });

    const avgLatencyMs = Math.round(
      rows.reduce((s, r) => s + r.activeLatencyMs, 0) / rows.length
    );

    return { rows, avgLatencyMs, originProfile };
  }, [selectedOriginRegion, enableGlobalAnycastCdn]);

  // ==========================================================================
  // X6 STATE: ZERO-SNIFFING WEBCRYPTO VAULT (DIRECT TLS 1.3 + RSA-OAEP-256 WIRE)
  // ==========================================================================
  const [vaultStatus, setVaultStatus] = useState({
    configured: false,
    maskedKey: null,
    keyFingerprint: null,
    rsaPublicKeySpkiBase64: null,
    rsaKeyFingerprint: null,
    transportCipher: null,
    model: 'gemini-3.8-flash',
    cipher:
      'WebCrypto Non-Extractable AES-256-GCM + Direct Browser->Google HTTPS TLS 1.3',
  });
  // Default to Direct Browser->Google HTTPS TLS 1.3 on http://localhost so 0 bytes of key or prompt ever cross local HTTP!
  const [transportMode, setTransportMode] = useState('BROWSER_DIRECT_TLS13');
  const browserVaultRef = useRef(null); // Holds { cryptoKey (extractable:false), iv, ciphertext, maskedKey, keyFingerprint }
  const [browserVaultConfigured, setBrowserVaultConfigured] = useState(false);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [aiPreferredProvider, setAiPreferredProvider] = useState('AUTO');
  const [selectedGeminiModel, setSelectedGeminiModel] =
    useState('gemini-3.8-flash');
  const [customModelId, setCustomModelId] = useState('');
  const [availableModels, setAvailableModels] = useState([
    {
      id: 'gemini-3.8-flash',
      label: 'gemini-3.8-flash (2026 Ultra-Fast SRE & FinOps Engine)',
    },
    {
      id: 'gemini-3.1-pro',
      label: 'gemini-3.1-pro (2026 Deep Architecture & Security Reasoning)',
    },
  ]);
  const [discoveringModels, setDiscoveringModels] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(
    'Analyze my live GCP resources, identify top security/compliance risks and FinOps savings, and give me the exact gcloud CLI remediation commands.'
  );
  const [aiResponse, setAiResponse] = useState(null);
  const [askingAi, setAskingAi] = useState(false);
  const [missingKeyBanner, setMissingKeyBanner] = useState(false);
  const apiKeyInputRef = useRef(null);

  const isAnyVaultConfigured =
    browserVaultConfigured || Boolean(vaultStatus.configured);

  // WebCrypto Helper 1: Seal API Key in Browser Non-Extractable AES-256-GCM Enclave (0 network packets!)
  const sealKeyInBrowserWebCrypto = async (rawKey) => {
    const clean = String(rawKey || '').trim();
    const enc = new TextEncoder();
    const keyBytes = enc.encode(clean);
    const cryptoKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable hardware/browser enclave key!
      ['encrypt', 'decrypt']
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      keyBytes
    );
    const digestBuf = await window.crypto.subtle.digest('SHA-256', keyBytes);
    const hashHex = Array.from(new Uint8Array(digestBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 12);
    const maskedKey =
      clean.length > 8
        ? `${clean.slice(0, 4)}••••••••••••${clean.slice(-4)}`
        : 'AIza••••••••';

    browserVaultRef.current = {
      cryptoKey,
      iv,
      ciphertext,
      maskedKey,
      keyFingerprint: `SHA256:${hashHex}`,
    };
    setBrowserVaultConfigured(true);
    return {
      maskedKey,
      keyFingerprint: `SHA256:${hashHex}`,
    };
  };

  const decryptKeyFromBrowserWebCrypto = async () => {
    const v = browserVaultRef.current;
    if (!v || !v.cryptoKey || !v.ciphertext || !v.iv) return null;
    const plainBuf = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: v.iv },
      v.cryptoKey,
      v.ciphertext
    );
    return new TextDecoder().decode(plainBuf);
  };

  // WebCrypto Helper 2: Encrypt API Key with Server's Ephemeral 2048-bit RSA-OAEP-256 Public Key BEFORE sending over HTTP
  const encryptKeyWithServerRsaPublicKey = async (rawKey, spkiBase64) => {
    const binaryDer = window.atob(spkiBase64);
    const derBytes = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i += 1) {
      derBytes[i] = binaryDer.charCodeAt(i);
    }
    const rsaPubKey = await window.crypto.subtle.importKey(
      'spki',
      derBytes.buffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
    const payloadBytes = new TextEncoder().encode(
      JSON.stringify({
        apiKey: String(rawKey || '').trim(),
        nonce: Math.random().toString(36).slice(2),
        ts: Date.now(),
      })
    );
    const encryptedBuf = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      rsaPubKey,
      payloadBytes
    );
    const bytes = new Uint8Array(encryptedBuf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const focusAndHighlightKeyInput = () => {
    setMissingKeyBanner(true);
    if (apiKeyInputRef.current) {
      apiKeyInputRef.current.focus();
      apiKeyInputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const fetchVaultStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/ai-vault/status');
      if (res.data) {
        setVaultStatus((prev) => ({
          ...prev,
          ...res.data,
          configured:
            Boolean(res.data.configured) || Boolean(browserVaultRef.current),
          maskedKey:
            browserVaultRef.current?.maskedKey || res.data.maskedKey || null,
          keyFingerprint:
            browserVaultRef.current?.keyFingerprint ||
            res.data.keyFingerprint ||
            null,
        }));
        if (res.data.configured || browserVaultRef.current) {
          setMissingKeyBanner(false);
        }
        if (res.data.model) setSelectedGeminiModel(res.data.model);
        if (res.data.availableModels?.length) {
          setAvailableModels(res.data.availableModels);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchVaultStatus();
  }, [fetchVaultStatus]);

  const handleDiscoverLiveModels = async () => {
    setDiscoveringModels(true);
    try {
      // If sealed in Browser Direct TLS 1.3 Enclave, query https://generativelanguage.googleapis.com directly over HTTPS!
      const browserKey = await decryptKeyFromBrowserWebCrypto().catch(
        () => null
      );
      if (browserKey) {
        const listRes = await axios.get(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
            browserKey
          )}`,
          { timeout: 8000 }
        );
        const liveModels = (listRes.data?.models || [])
          .filter(
            (m) =>
              String(m.name || '').includes('gemini') &&
              (m.supportedGenerationMethods || []).includes('generateContent')
          )
          .map((m) => {
            const cleanId = String(m.name || '').replace(/^models\//, '');
            return {
              id: cleanId,
              label: `${cleanId} (${
                m.displayName || 'Live AI Studio Model'
              })`,
            };
          });
        const mergedMap = new Map();
        availableModels.forEach((m) => mergedMap.set(m.id, m));
        liveModels.forEach((m) => mergedMap.set(m.id, m));
        const mergedList = Array.from(mergedMap.values());
        setAvailableModels(mergedList);
        if (onShowToast) {
          onShowToast(
            `Synced ${mergedList.length} Gemini models directly over HTTPS TLS 1.3 (0 local HTTP packets)!`
          );
        }
        return;
      }

      const res = await axios.get('/api/ai-vault/models');
      if (res.data?.models?.length) {
        setAvailableModels(res.data.models);
        if (onShowToast) {
          onShowToast(
            `Synced ${res.data.models.length} Gemini models (${res.data.source})!`
          );
        }
      }
    } catch {
      // ignore
    } finally {
      setDiscoveringModels(false);
    }
  };

  const sealApiKeyInternal = async (rawKeyToSeal, targetModel) => {
    const clean = String(rawKeyToSeal || '').trim();
    // 1. Always seal in Browser's Non-Extractable WebCrypto AES-256-GCM Enclave first!
    const browserMeta = await sealKeyInBrowserWebCrypto(clean);

    // 2. If user also enabled Server RSA-OAEP Vault (or if server RSA public key is available), encrypt with 2048-bit RSA-OAEP-256 BEFORE sending over HTTP so plaintext NEVER crosses localhost HTTP!
    let spki = vaultStatus.rsaPublicKeySpkiBase64;
    if (!spki) {
      const st = await axios.get('/api/ai-vault/status').catch(() => null);
      spki = st?.data?.rsaPublicKeySpkiBase64;
    }

    if (transportMode === 'RSA_OAEP_SERVER_VAULT' && spki) {
      const encryptedKeyBase64 = await encryptKeyWithServerRsaPublicKey(
        clean,
        spki
      );
      const res = await axios.post('/api/ai-vault/configure', {
        encryptedKeyBase64,
        model: targetModel,
      });
      setVaultStatus({
        ...res.data,
        configured: true,
      });
      return {
        mode: 'RSA_OAEP_SERVER_VAULT',
        message:
          res.data?.message ||
          `Encrypted key in browser via RSA-OAEP-256 & sealed in Server AES-256-GCM RAM (Zero plaintext over HTTP)!`,
      };
    }

    // In BROWSER_DIRECT_TLS13 mode, zero bytes of the key are even sent to the local server!
    setVaultStatus((prev) => ({
      ...prev,
      configured: true,
      maskedKey: browserMeta.maskedKey,
      keyFingerprint: browserMeta.keyFingerprint,
      transportCipher:
        'Browser Non-Extractable WebCrypto AES-256-GCM -> Direct Google HTTPS TLS 1.3 (0 Local HTTP Packets)',
      model: targetModel,
    }));
    return {
      mode: 'BROWSER_DIRECT_TLS13',
      message: `Sealed in Browser Non-Extractable WebCrypto Enclave (${browserMeta.keyFingerprint}) — Direct Browser->Google HTTPS TLS 1.3 (0 bytes sent over local HTTP)!`,
    };
  };

  const handleSealApiKey = async (e) => {
    if (e) e.preventDefault();
    if (!apiKeyInput.trim()) {
      focusAndHighlightKeyInput();
      if (onShowToast) {
        onShowToast(
          'Paste your Google AI Studio API Key (AIzaSy...) into the input box first!'
        );
      }
      return;
    }
    setBusyKey('seal-key');
    const targetModel =
      selectedGeminiModel === 'CUSTOM' && customModelId.trim()
        ? customModelId.trim()
        : selectedGeminiModel;
    try {
      const result = await sealApiKeyInternal(apiKeyInput.trim(), targetModel);
      setApiKeyInput('');
      setMissingKeyBanner(false);
      if (onShowToast) {
        onShowToast(result.message);
      }
      await handleDiscoverLiveModels();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to seal API key in vault.'
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleClearVault = async () => {
    setBusyKey('clear-key');
    try {
      browserVaultRef.current = null;
      setBrowserVaultConfigured(false);
      const res = await axios.delete('/api/ai-vault/clear').catch(() => null);
      setVaultStatus((prev) => ({
        ...prev,
        configured: false,
        maskedKey: null,
        keyFingerprint: null,
        transportCipher: null,
        model: 'gemini-3.8-flash',
      }));
      if (onShowToast) {
        onShowToast(
          res?.data?.message ||
            'Wiped API key from Browser WebCrypto Enclave & Server RAM Vault.'
        );
      }
    } catch {
      // ignore
    } finally {
      setBusyKey(null);
    }
  };

  const handleAskGeminiArchitect = async (customPrompt = aiPrompt) => {
    const activeModel =
      selectedGeminiModel === 'CUSTOM' && customModelId.trim()
        ? customModelId.trim()
        : selectedGeminiModel;
    if (selectedGeminiModel === 'CUSTOM' && customModelId.trim()) {
      addOrSelectCustomGeminiModel(customModelId.trim());
    }

    // Convenience: if user pasted a key into the input box and clicked "Ask" directly without clicking "Seal", auto-seal it via WebCrypto first!
    if (!isAnyVaultConfigured && apiKeyInput.trim().length >= 12) {
      try {
        const sealResult = await sealApiKeyInternal(
          apiKeyInput.trim(),
          activeModel
        );
        setApiKeyInput('');
        setMissingKeyBanner(false);
        if (onShowToast) {
          onShowToast(sealResult.message);
        }
      } catch (sealErr) {
        if (onShowError) {
          onShowError(
            sealErr.response?.data?.error ||
              sealErr.message ||
              'Invalid Google AI Studio API Key format.'
          );
        }
        return;
      }
    } else if (
      aiPreferredProvider === 'AI_STUDIO_KEY' &&
      !isAnyVaultConfigured &&
      !browserVaultRef.current
    ) {
      focusAndHighlightKeyInput();
      if (onShowToast) {
        onShowToast(
          `Path B (AI Studio Key Only) is selected — please paste an AIzaSy... key above or switch to Path A (Keyless Vertex AI)!`
        );
      }
      return;
    }

    setAskingAi(true);
    try {
      const telemetrySummary = {
        projectId,
        vmsCount: overview?.vms?.length || 0,
        cloudRunCount: overview?.cloudRun?.length || 0,
        bucketsCount: buckets.length || overview?.buckets?.length || 0,
        vpcsCount: overview?.vpcs?.length || 0,
        firewallsCount: overview?.firewalls?.length || 0,
        vms: (overview?.vms || []).map((v) => ({
          name: v.name,
          zone: v.zone,
          machineType: v.machineType,
          status: v.status,
        })),
        cloudRun: (overview?.cloudRun || []).map((r) => ({
          name: r.name,
          region: r.region,
          cpu: r.cpu,
          memory: r.memory,
          minScale: r.minScale,
        })),
        buckets: (buckets.length > 0 ? buckets : overview?.buckets || []).map(
          (b) => ({
            name: b.name,
            location: b.location,
            storageClass: b.storageClass,
            pap: b.publicAccessPrevention,
            uniformAccess: b.uniformBucketLevelAccess,
          })
        ),
      };

      // PATH A: Direct Browser -> Google HTTPS TLS 1.3 (Zero local HTTP packets!)
      const browserDecryptedKey = await decryptKeyFromBrowserWebCrypto().catch(
        () => null
      );
      if (
        aiPreferredProvider !== 'VERTEX_AI_OAUTH' &&
        browserDecryptedKey &&
        transportMode === 'BROWSER_DIRECT_TLS13'
      ) {
        const systemContext = `You are the CloudPulse 2026 Principal Google Cloud SRE, Security & FinOps Architect (powered by ${activeModel}) for GCP project "${projectId}".
Live Project Telemetry Snapshot:
${JSON.stringify(telemetrySummary, null, 2)}
Provide concise, actionable, production-grade guidance with exact gcloud CLI commands or JSON/Terraform snippets where helpful.`;

        const candidateModels = Array.from(
          new Set([
            activeModel,
            'gemini-3.8-flash',
            'gemini-3.1-pro',
          ])
        );

        let lastErr = null;
        for (const candidateModel of candidateModels) {
          try {
            const geminiRes = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
                candidateModel
              )}:generateContent?key=${encodeURIComponent(browserDecryptedKey)}`,
              {
                contents: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: `${systemContext}\n\nEngineer Request: ${customPrompt}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.25,
                  maxOutputTokens: 8192,
                },
              },
              { timeout: 60000 }
            );

            const candidate = geminiRes.data?.candidates?.[0] || {};
            const rawParts = candidate?.content?.parts || [];
            const visibleParts = rawParts.filter(
              (p) => !p.thought && typeof p.text === 'string'
            );
            const answer =
              (visibleParts.length > 0 ? visibleParts : rawParts)
                .map((p) => p.text)
                .filter(Boolean)
                .join('\n') || 'No response generated.';
            const usage = geminiRes.data?.usageMetadata || {};

            setAiResponse({
              ok: true,
              source:
                candidateModel === activeModel
                  ? `DIRECT_BROWSER_HTTPS_TLS1.3 (${activeModel})`
                  : `DIRECT_BROWSER_HTTPS_TLS1.3 (${activeModel} → routed via ${candidateModel})`,
              cipherUsed:
                'WebCrypto Non-Extractable AES-256-GCM -> Direct HTTPS TLS 1.3 (0 Local HTTP Packets)',
              finishReason: candidate.finishReason || 'STOP',
              tokenUsage: {
                promptTokens: usage.promptTokenCount || 0,
                outputTokens: usage.candidatesTokenCount || 0,
                thoughtTokens: usage.thoughtsTokenCount || 0,
                totalTokens: usage.totalTokenCount || 0,
              },
              answer,
            });
            return;
          } catch (err) {
            lastErr = err;
          }
        }
        throw (
          lastErr ||
          new Error('Direct Browser HTTPS call to Google AI Studio failed.')
        );
      }

      // PATH B: Server Vault (RSA-OAEP-256 Wire Envelope -> Server AES-256-GCM RAM -> Outbound HTTPS TLS 1.3) or Keyless Vertex AI OAuth2
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/ai-vault/ask`,
        {
          prompt: customPrompt,
          model: activeModel,
          preferredProvider: aiPreferredProvider,
          telemetrySummary,
        }
      );
      setAiResponse(res.data);
      if (res.data?.missingApiKey) {
        setMissingKeyBanner(true);
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error?.message ||
            err.response?.data?.error ||
            err.message ||
            'Failed to run Gemini SRE Co-Architect.'
        );
      }
    } finally {
      setAskingAi(false);
    }
  };

  // ==========================================================================
  // RENDER X1: CLOUD STORAGE DLP, SECRET LEAK & PII X-RAY SCANNER
  // ==========================================================================
  if (activeTab === 'X1') {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-red-50/50 dark:bg-red-500/[0.06] border border-red-500/30 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/40">
                  MOONSHOT X1 · DUAL-ENGINE DLP &amp; SECRET LEAK X-RAY
                </span>
                <button
                  type="button"
                  data-feature-id="DLP_XRAY_TOGGLE_ARCH_DOCS_BTN"
                  onClick={() => setShowDlpArchitectureDocs((v) => !v)}
                  title="Toggle the technical breakdown explaining how Engine 1 scans UTF-8 byte streams without OCR vs. how Engine 2 uses Google Cloud Sensitive Data Protection (dlp.googleapis.com/v2) built-in Vision OCR for images"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>
                    {showDlpArchitectureDocs
                      ? 'Hide Architecture: How It Works Without Local OCR'
                      : 'How Does This Work Without Local OCR?'}
                  </span>
                </button>
              </div>
              <h3 className="text-base font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1 flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                <span>
                  Cloud Storage Secret, Credential &amp; Regulated PII X-Ray Scanner
                  + 1-Tap In-Place Redactor
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Choose between the $0.00 Zero-Dependency In-Memory UTF-8 + Luhn/Shannon Entropy
                Engine (for text, code, and configs) or Google Cloud Sensitive Data Protection
                API (`dlp.googleapis.com/v2`) with server-side Vision OCR &amp; `.png`/`.jpg`
                pixel bounding-box redaction (`image:redact`).
              </p>
            </div>

            <div className="w-full pt-2 border-t border-red-500/20 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 items-center">
              <select
                value={selectedDlpBucket}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDlpBucket(val);
                  if (typeof onSelectBucket === 'function') {
                    onSelectBucket(val);
                  }
                }}
                title="Select a live Cloud Storage bucket in your project to stream objects into the ephemeral DLP X-Ray scanner"
                className="w-full h-9 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-3 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                {buckets.length === 0 && (
                  <option value="">No buckets found in project</option>
                )}
                {buckets.map((b) => (
                  <option key={b.name} value={b.name}>
                    gs://{b.name} ({b.location})
                  </option>
                ))}
              </select>

              <button
                type="button"
                data-feature-id="DLP_XRAY_RUN_SCAN_BTN"
                disabled={!selectedDlpBucket || scanningDlp}
                onClick={() => handleRunDlpScan(selectedDlpBucket, dlpScanEngine)}
                title="Stream live objects from the selected GCS bucket and scan using your selected DLP engine (Engine 1 In-Memory UTF-8 Regex/Luhn/Entropy or Engine 2 Cloud DLP v2 + Vision OCR)"
                className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold shadow-sm cursor-pointer disabled:opacity-50 truncate"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 shrink-0 ${scanningDlp ? 'animate-spin' : ''}`}
                />
                <span className="truncate">
                  {scanningDlp
                    ? 'Scanning Objects...'
                    : dlpScanEngine === 'CLOUD_DLP_VISION_OCR'
                    ? 'Run Cloud DLP v2 + OCR'
                    : 'Run $0.00 In-Memory DLP'}
                </span>
              </button>

              <button
                type="button"
                data-feature-id="DLP_XRAY_INJECT_CANARY_BTN"
                disabled={busyKey === 'inject-canary' || scanningDlp}
                onClick={handleInjectCanaryLeakObject}
                title="Upload a safe, synthetic canary test file (canary-audit/leaked-staging-secrets.env) into your bucket and trigger an immediate DLP X-Ray scan so you can test live detection & 1-Tap Redaction"
                className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-mono font-bold cursor-pointer disabled:opacity-50 truncate"
              >
                <Sparkles
                  className={`w-3.5 h-3.5 shrink-0 ${
                    busyKey === 'inject-canary' ? 'animate-spin' : ''
                  }`}
                />
                <span className="truncate">
                  {busyKey === 'inject-canary'
                    ? 'Injecting Canary...'
                    : '+ Inject Canary Leak File'}
                </span>
              </button>

              {onOpenObjectInWorkbench && selectedDlpBucket && (
                <button
                  type="button"
                  data-feature-id="DLP_XRAY_OPEN_WORKBENCH_BTN"
                  onClick={() => onOpenObjectInWorkbench(selectedDlpBucket, '')}
                  title={`Open gs://${selectedDlpBucket} in the Cloud Storage Multi-Format Object Workbench (M02)`}
                  className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded bg-zinc-100 dark:bg-[#1a2130] text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-[#323d56] text-xs font-mono font-bold cursor-pointer truncate"
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Object Workbench (M02) →</span>
                </button>
              )}

              <button
                type="button"
                data-feature-id="DLP_XRAY_OPEN_SM_STUDIO_BTN"
                onClick={() => setShowDlpSecretManagerExplorer((v) => !v)}
                title="Open the interactive Google Cloud Secret Manager Explorer & Lifecycle Studio to inspect, reveal (:access), rotate (:addVersion), disable, or delete vaulted secrets"
                className={`w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded text-xs font-mono font-bold cursor-pointer truncate ${
                  showDlpSecretManagerExplorer
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {showDlpSecretManagerExplorer
                    ? 'Hide Secret Manager UI'
                    : 'Secret Manager UI'}
                </span>
              </button>
            </div>
          </div>

          {/* 2-Mode Engine Choice Bar */}
          <div className="p-3 rounded-xl bg-white/90 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-mono font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Select Inspection &amp; Redaction Engine Mode:</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Zero local OCR binaries required on your machine in either mode
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                type="button"
                data-feature-id="DLP_XRAY_ENGINE_LOCAL_BTN"
                onClick={() => setDlpScanEngine('LOCAL_RAM_REGEX_LUHN')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  dlpScanEngine === 'LOCAL_RAM_REGEX_LUHN'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/70 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-extrabold">
                    Engine 1 (Default): $0.00 In-Memory UTF-8 + Luhn &amp; Entropy
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      dlpScanEngine === 'LOCAL_RAM_REGEX_LUHN'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    $0.00 API COST · ZERO OCR
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-1 leading-relaxed ${
                    dlpScanEngine === 'LOCAL_RAM_REGEX_LUHN'
                      ? 'text-blue-50'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  Streams structured text/code objects (`.env`, `.json`, `.yaml`, `.csv`, `.log`,
                  `.pem`, `.sql`, `.tfstate`) via `?alt=media` into Node.js RAM and runs 11
                  credential/PII regex detectors + Luhn Mod-10 PAN checksum + Shannon Entropy
                  (`H(X)`). Overwrites sanitized UTF-8 generations in-place.
                </p>
              </button>

              <button
                type="button"
                data-feature-id="DLP_XRAY_ENGINE_CLOUD_OCR_BTN"
                onClick={() => setDlpScanEngine('CLOUD_DLP_VISION_OCR')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  dlpScanEngine === 'CLOUD_DLP_VISION_OCR'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/70 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-extrabold">
                    Engine 2 (Optional): Google Cloud DLP v2 + Vision OCR (`image:redact`)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      dlpScanEngine === 'CLOUD_DLP_VISION_OCR'
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    TEXT + .PNG/.JPG OCR PIXEL REDACTION
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-1 leading-relaxed ${
                    dlpScanEngine === 'CLOUD_DLP_VISION_OCR'
                      ? 'text-blue-50'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  Calls Google Cloud Sensitive Data Protection (`dlp.googleapis.com/v2`)
                  `content:inspect` &amp; `content:deidentify` for text AND scans `.png`/`.jpg`
                  images using Google’s cloud-hosted Vision OCR—burning opaque black bounding boxes
                  over leaked keys/PII inside images via `projects.image.redact`.
                </p>
              </button>
            </div>
          </div>

          {/* Collapsible Architecture Explainer: How It Works Without Local OCR */}
          {showDlpArchitectureDocs && (
            <div className="p-3.5 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-800 space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between gap-2 text-blue-400 font-bold">
                <span>
                  Architecture Deep-Dive: How Secret &amp; PII Detection Works Without Installing OCR Tools
                </span>
                <span className="text-[10px] text-zinc-400">
                  server/index.js · GcsObjectWorkbench.jsx
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10.5px] leading-relaxed text-zinc-300">
                <div className="p-2.5 rounded-lg bg-zinc-950/90 border border-zinc-800">
                  <div className="font-bold text-emerald-400 mb-1">
                    1. Ephemeral ?alt=media RAM Stream
                  </div>
                  95%+ of cloud credential leaks in GCS live in structured text artifacts (`.env`,
                  `service-account.json`, `.tfstate`, `.yaml`, `.csv`, `.log`). Engine 1 streams up
                  to 128 KB per object via `GET /storage/v1/b/:b/o/:o?alt=media` straight into RAM
                  with zero `/tmp` disk writes.
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/90 border border-zinc-800">
                  <div className="font-bold text-amber-400 mb-1">
                    2. 11 Signatures + Luhn + Entropy
                  </div>
                  Instead of OCR, Engine 1 evaluates 11 compiled regex AST signatures (`AIza...`,
                  `AKIA...`, `ghp_...`, `sk-proj-...`, RSA PEM blocks, JWTs, SSNs, IBANs), verifies
                  16-digit PANs with the Luhn Mod-10 checksum, and measures Shannon Entropy
                  (`H(X)` bits/char).
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/90 border border-zinc-800">
                  <div className="font-bold text-blue-400 mb-1">
                    3. Optional Cloud Vision OCR (Engine 2)
                  </div>
                  When you need to scan screenshots or photos (`.png`/`.jpg`), switching to Engine 2
                  sends base64 `byteItem` payloads to `dlp.googleapis.com/v2/.../content:inspect`
                  and `image:redact`—using Google’s server-side OCR to paint black pixel boxes over
                  secrets!
                </div>
              </div>
            </div>
          )}

          {dlpInlineError && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs font-mono text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{dlpInlineError}</span>
              </div>
              <button
                type="button"
                data-feature-id="DLP_XRAY_DISMISS_ERROR_BTN"
                onClick={() => setDlpInlineError(null)}
                className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-[10px] font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {canaryInjectReceipt && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs font-mono text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-extrabold">
                    CANARY ARTIFACT STAGED IN GCS
                  </span>
                  <span className="font-bold">
                    gs://{canaryInjectReceipt.bucket}/{canaryInjectReceipt.objectName}
                  </span>
                  <span className="text-[11px] opacity-80">
                    ({canaryInjectReceipt.sizeBytes} bytes · Gen #{String(canaryInjectReceipt.generation).slice(-6)} · {canaryInjectReceipt.injectedPatternsCount} synthetic secret/PII tokens{canaryInjectReceipt.crc32c ? ` · CRC32C ${canaryInjectReceipt.crc32c}` : ''})
                  </span>
                </div>
                <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
                  Ready below: Click &quot;1-Tap Redact &amp; Mask in GCS&quot; to test live in-place sanitization
                </span>
              </div>
              {canaryInjectReceipt.autoRoutedReason && (
                <div className="text-[11px] text-amber-800 dark:text-amber-300/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
                  <strong>Multi-Project Active-Billing Auto-Router:</strong>{' '}
                  {canaryInjectReceipt.autoRoutedReason}
                </div>
              )}
            </div>
          )}

          {dlpScanResult?.cloudDlpApiNote && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-700 dark:text-amber-300">
              {dlpScanResult.cloudDlpApiNote}
            </div>
          )}

          {dlpScanResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] uppercase text-zinc-400">
                  Scanned Objects ({dlpScanResult.scanEngine === 'CLOUD_DLP_VISION_OCR' ? 'Cloud DLP + OCR' : 'RAM Engine'})
                </div>
                <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {dlpScanResult.scannedObjectsCount} /{' '}
                  {dlpScanResult.totalObjectsInBucket}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] uppercase text-zinc-400">
                  Affected Objects
                </div>
                <div
                  className={`text-base font-extrabold mt-0.5 ${
                    dlpScanResult.affectedObjectsCount > 0
                      ? 'text-red-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {dlpScanResult.affectedObjectsCount}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] uppercase text-zinc-400">
                  Secret / PII Matches
                </div>
                <div
                  className={`text-base font-extrabold mt-0.5 ${
                    dlpScanResult.totalMatches > 0
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {dlpScanResult.totalMatches}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] uppercase text-zinc-400">
                  Est. Breach Exposure
                </div>
                <div
                  className={`text-base font-extrabold mt-0.5 ${
                    dlpScanResult.totalExposureUsd > 0
                      ? 'text-red-500'
                      : 'text-emerald-500'
                  }`}
                >
                  ${Number(dlpScanResult.totalExposureUsd || 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {dlpScanResult?.objectFindings?.length > 0 ? (
            <div className="space-y-2.5">
              {dlpScanResult.objectFindings.map((obj) => (
                <div
                  key={obj.objectName}
                  className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-red-500/40 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-500 border border-red-500/30">
                        {obj.highestSeverity} LEAK
                      </span>
                      {obj.isImageObject && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">
                          VISION OCR IMAGE
                        </span>
                      )}
                      <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                        gs://{dlpScanResult.bucket}/{obj.objectName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {onOpenObjectInWorkbench && (
                        <button
                          type="button"
                          data-feature-id="DLP_XRAY_OPEN_WORKBENCH_BTN"
                          onClick={() =>
                            onOpenObjectInWorkbench(
                              dlpScanResult.bucket,
                              obj.objectName
                            )
                          }
                          title={`Open gs://${dlpScanResult.bucket}/${obj.objectName} in the Line-Numbered Object Workbench (M02) to inspect lines, diff versions, or selectively redact`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open &amp; Edit in Object Workbench (M02) →</span>
                        </button>
                      )}
                      {(obj.isImageObject ||
                        (obj.findings.some((f) => f.category === 'CREDENTIAL_LEAK') &&
                          !(
                            dlpRedactionReceipt?.objectName === obj.objectName &&
                            dlpRedactionReceipt?.vaultedSecretsCount > 0
                          ))) ? (
                        <button
                          type="button"
                          data-feature-id="DLP_XRAY_VAULT_SECRET_MANAGER_BTN"
                          disabled={busyKey === `redact-${obj.objectName}`}
                          onClick={() =>
                            handleRedactObjectInPlace(
                              obj.objectName,
                              false,
                              'VAULT_TO_SECRET_MANAGER'
                            )
                          }
                          title={
                            obj.isImageObject
                              ? `Burn solid black pixel bounding boxes over OCR-detected secrets/PII inside image gs://${dlpScanResult.bucket}/${obj.objectName} via dlp.googleapis.com/v2/projects/${projectId}/image:redact`
                              : `RECOMMENDED ZERO-LOSS REMEDIATION: Automatically vaults every leaked credential into Google Cloud Secret Manager (secretmanager.googleapis.com/v1), rewrites the file value to sm://projects/<projectId>/secrets/<secretId>/versions/<ver>, and masks regulated PII in-place so zero keys are ever lost!`
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>
                            {busyKey === `redact-${obj.objectName}`
                              ? 'Vaulting to Secret Manager & Sanitizing...'
                              : obj.isImageObject
                              ? '1-Tap Burn Black Pixel Boxes in GCS (image:redact)'
                              : '1-Tap Vault Keys to Secret Manager (sm://) + Mask PII'}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-feature-id="DLP_XRAY_OPEN_SM_STUDIO_BTN"
                          onClick={() =>
                            setShowDlpSecretManagerExplorer((prev) => !prev)
                          }
                          title="Secrets from this object have already been vaulted into Google Cloud Secret Manager! Open the interactive Secret Manager UI to reveal, rotate, disable, or delete them."
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold cursor-pointer ${
                            showDlpSecretManagerExplorer
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                          }`}
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>
                            {showDlpSecretManagerExplorer
                              ? 'Hide Secret Manager Explorer'
                              : 'Explore, Rotate & Delete in Secret Manager UI'}
                          </span>
                        </button>
                      )}
                      {!obj.isImageObject && (
                        <>
                          <button
                            type="button"
                            data-feature-id="DLP_XRAY_REDACT_IN_PLACE_BTN"
                            disabled={busyKey === `redact-${obj.objectName}`}
                            onClick={() =>
                              handleRedactObjectInPlace(
                                obj.objectName,
                                false,
                                'MASK_ONLY'
                              )
                            }
                            title={`DESTRUCTIVE MASK-ONLY MODE: Overwrites all matched credentials & PII with [REDACTED_<TYPE>_BY_CLOUDPULSE_DLP] WITHOUT vaulting credentials into Google Cloud Secret Manager (triggers confirmation warning)`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Mask Only ([REDACTED])</span>
                          </button>
                          {obj.findings.some(
                            (f) => f.category === 'CREDENTIAL_LEAK'
                          ) &&
                            !(
                              dlpRedactionReceipt?.objectName ===
                                obj.objectName &&
                              dlpRedactionReceipt?.vaultedSecretsCount > 0
                            ) && (
                              <button
                                type="button"
                                data-feature-id="DLP_XRAY_REDACT_AND_PURGE_GEN_BTN"
                                disabled={busyKey === `redact-${obj.objectName}`}
                                onClick={() =>
                                  handleRedactObjectInPlace(
                                    obj.objectName,
                                    true,
                                    'VAULT_TO_SECRET_MANAGER'
                                  )
                                }
                                title={`Vault credentials into Google Cloud Secret Manager (sm://), write the sanitized file into a new GCS generation, AND delete the previous noncurrent generation (?generation=...) so plaintext keys are removed from bucket history while safely preserved in Secret Manager`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Vault to SM + Purge Old GCS Gen</span>
                              </button>
                            )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Credential Preservation Policy Banner */}
                  {!obj.isImageObject && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/25 text-[10.5px] font-mono text-zinc-700 dark:text-zinc-300 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                          Zero-Loss Secret Manager Migration Policy:
                        </span>{' '}
                        Application credentials (<code>AIza...</code>,{' '}
                        <code>AKIA...</code>, <code>ghp_...</code>,{' '}
                        <code>sk-proj-...</code>, <code>DB_PASSWORD</code>) are
                        never blindly destroyed — clicking{' '}
                        <strong>
                          1-Tap Vault Keys to Secret Manager (sm://) + Mask PII
                        </strong>{' '}
                        migrates each key into{' '}
                        <code>secretmanager.googleapis.com/v1</code> and replaces
                        the plaintext value with its live{' '}
                        <code>
                          sm://projects/&lt;project&gt;/secrets/&lt;id&gt;/versions/&lt;ver&gt;
                        </code>{' '}
                        URI reference, while masking regulated customer PII (PAN,
                        SSN, IBAN, Email) in-place.
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {obj.findings.map((f) => (
                      <div
                        key={f.detectorId}
                        className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {f.label}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {f.count} match(es) · ${f.exposureUsd.toLocaleString()}{' '}
                            risk
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1 flex flex-wrap items-center justify-between gap-1">
                          <span>
                            Masked Sample: <code>{f.maskedSamples.join(', ')}</code>
                          </span>
                          {typeof f.shannonEntropyBits === 'number' && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-[9.5px] font-bold">
                              H(X)={f.shannonEntropyBits} bits/char
                              {f.luhnVerified === true ? ' · Luhn OK' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            dlpScanResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <span>
                  Zero plaintext credentials, API keys, or regulated PII
                  detected across {dlpScanResult.scannedObjectsCount} inspected
                  object(s) in gs://{dlpScanResult.bucket}.
                </span>
                <span className="text-[10px] opacity-80">
                  Tip: Click &quot;+ Inject Canary Leak File&quot; above to test live
                  detection &amp; redaction!
                </span>
              </div>
            )
          )}

          {/* Glass-Box DevSecOps Redaction Execution Receipt & Secret Manager Vault Ledger */}
          {dlpRedactionReceipt && (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/40 space-y-3 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-extrabold">
                    {dlpRedactionReceipt.vaultedSecretsCount > 0
                      ? `SECRET MANAGER VAULT + DLP RECEIPT (${dlpRedactionReceipt.vaultedSecretsCount} VAULTED TO sm://)`
                      : 'GLASS-BOX REDACTION RECEIPT'}
                  </span>
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    gs://{dlpRedactionReceipt.bucket}/{dlpRedactionReceipt.objectName}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    ({dlpRedactionReceipt.redactedCount} token(s) processed · Gen #
                    {String(dlpRedactionReceipt.previousGeneration || 'prev').slice(-6)}{' '}
                    → Gen #
                    {String(dlpRedactionReceipt.newGeneration || 'new').slice(-6)} ·
                    CRC32C {dlpRedactionReceipt.newCrc32c || 'verified'}
                    {dlpRedactionReceipt.previousGenerationPurged
                      ? ' · Old Gen Purged'
                      : ''}
                    )
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-feature-id="DLP_XRAY_OPEN_SM_STUDIO_BTN"
                    onClick={() =>
                      setShowDlpSecretManagerExplorer((prev) => !prev)
                    }
                    title="Open the interactive Google Cloud Secret Manager Explorer UI to reveal decrypted secret payloads (:access), rotate keys (:addVersion), disable old versions ($0.00/mo), or delete secrets"
                    className={`px-2.5 py-1 rounded text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1 ${
                      showDlpSecretManagerExplorer
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    }`}
                  >
                    <Key className="w-3 h-3" />
                    <span>
                      {showDlpSecretManagerExplorer
                        ? 'Hide Secret Manager Explorer'
                        : 'Explore, Rotate & Delete in Secret Manager UI'}
                    </span>
                  </button>
                  {dlpRedactionReceipt.vaultedSecretsCount > 0 && (
                    <button
                      type="button"
                      data-feature-id="DLP_XRAY_REHYDRATE_SM_BTN"
                      disabled={
                        busyKey ===
                        `rehydrate-${dlpRedactionReceipt.objectName}`
                      }
                      onClick={() =>
                        handleRehydrateFromSecretManager(
                          dlpRedactionReceipt.bucket,
                          dlpRedactionReceipt.objectName
                        )
                      }
                      title="Reads each sm://projects/.../secrets/.../versions/... reference from Google Cloud Secret Manager (:access) and restores the original plaintext credentials back into the Cloud Storage file"
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>
                        {busyKey ===
                        `rehydrate-${dlpRedactionReceipt.objectName}`
                          ? 'Rehydrating from Secret Manager...'
                          : '1-Click Rehydrate Keys from Secret Manager (sm:// → Plaintext)'}
                      </span>
                    </button>
                  )}
                  {onOpenObjectInWorkbench && (
                    <button
                      type="button"
                      data-feature-id="DLP_XRAY_OPEN_WORKBENCH_BTN"
                      onClick={() =>
                        onOpenObjectInWorkbench(
                          dlpRedactionReceipt.bucket,
                          dlpRedactionReceipt.objectName
                        )
                      }
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect Sanitized File in Object Workbench (M02) →</span>
                    </button>
                  )}
                </div>
              </div>

              {showDlpSecretManagerExplorer && (
                <SecretManagerVaultExplorer
                  projectId={projectId}
                  targetSecretProject={
                    dlpRedactionReceipt?.secretManagerTargetProject || ''
                  }
                  vaultedSecretsHint={dlpRedactionReceipt?.vaultedSecrets || []}
                  rehydrateContext={
                    dlpRedactionReceipt?.bucket &&
                    dlpRedactionReceipt?.objectName
                      ? {
                          bucket: dlpRedactionReceipt.bucket,
                          objectName: dlpRedactionReceipt.objectName,
                        }
                      : null
                  }
                  onRehydrated={() => {
                    fetchDlpScan();
                  }}
                  onShowToast={onShowToast}
                  onClose={() => setShowDlpSecretManagerExplorer(false)}
                />
              )}

              {/* Vaulted Secret Manager Inventory Table */}
              {Array.isArray(dlpRedactionReceipt.vaultedSecrets) &&
                dlpRedactionReceipt.vaultedSecrets.length > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        <span>
                          Where Your Secrets Went — Vaulted in Google Cloud
                          Secret Manager (
                          <code>
                            projects/
                            {dlpRedactionReceipt.secretManagerTargetProject}
                            /secrets/*
                          </code>
                          )
                        </span>
                      </div>
                      {dlpRedactionReceipt.cloudRunSetSecretsCli && (
                        <button
                          type="button"
                          data-feature-id="DLP_XRAY_COPY_CLOUDRUN_SECRETS_CLI_BTN"
                          onClick={() => {
                            navigator.clipboard?.writeText(
                              dlpRedactionReceipt.cloudRunSetSecretsCli
                            );
                            if (onShowToast) {
                              onShowToast(
                                'Copied Cloud Run --set-secrets CLI command to clipboard!'
                              );
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy Cloud Run --set-secrets CLI</span>
                        </button>
                      )}
                    </div>
                    <div className="overflow-x-auto rounded border border-emerald-500/20">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-emerald-950/20 text-zinc-500 uppercase">
                          <tr>
                            <th className="px-2 py-1">Line / Key</th>
                            <th className="px-2 py-1">
                              Secret Manager Reference Rewritten into File
                            </th>
                            <th className="px-2 py-1">
                              Retrieve Plaintext Value Anytime (CLI)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-500/15">
                          {dlpRedactionReceipt.vaultedSecrets.map((vs, idx) => (
                            <tr key={`${vs.secretId}-${idx}`}>
                              <td className="px-2 py-1 font-bold text-zinc-900 dark:text-zinc-100">
                                L{vs.lineNumber} · <code>{vs.envKey}</code>
                              </td>
                              <td className="px-2 py-1 text-emerald-700 dark:text-emerald-400 font-bold">
                                <code>{vs.smUri}</code>
                              </td>
                              <td className="px-2 py-1 text-zinc-500">
                                <code>{vs.gcloudAccessCmd}</code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {Array.isArray(dlpRedactionReceipt.redactionAuditLines) &&
                dlpRedactionReceipt.redactionAuditLines.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left text-[10.5px]">
                      <thead className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 uppercase">
                        <tr>
                          <th className="px-2.5 py-1.5">Line #</th>
                          <th className="px-2.5 py-1.5">Detector &amp; Action</th>
                          <th className="px-2.5 py-1.5">Entropy H(X) / Checksum</th>
                          <th className="px-2.5 py-1.5">
                            Masked Original → Secret Manager URI / Sanitized Token
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {dlpRedactionReceipt.redactionAuditLines.map((row, idx) => (
                          <tr
                            key={`${row.detectorId}-${row.lineNumber}-${idx}`}
                            className="bg-white dark:bg-zinc-900/60"
                          >
                            <td className="px-2.5 py-1.5 font-extrabold text-blue-600 dark:text-blue-400">
                              L{row.lineNumber}
                            </td>
                            <td className="px-2.5 py-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                              {row.detectorId} ({row.severity}) ·{' '}
                              <span
                                className={
                                  row.actionTaken === 'VAULTED_TO_SECRET_MANAGER'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }
                              >
                                {row.actionTaken || 'MASKED_IN_PLACE'}
                              </span>
                            </td>
                            <td className="px-2.5 py-1.5 text-zinc-500">
                              H(X)={row.shannonEntropyBits} bits/char
                              {row.luhnVerified !== null
                                ? ` · Luhn:${row.luhnVerified ? 'VALID' : 'NO'}`
                                : ''}
                            </td>
                            <td className="px-2.5 py-1.5">
                              <span className="line-through text-red-500 mr-1.5">
                                {row.maskedBefore}
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                → {row.replacedWith}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              {Array.isArray(dlpRedactionReceipt.restApiTrace) &&
                dlpRedactionReceipt.restApiTrace.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-zinc-950 text-emerald-400 border border-zinc-800 space-y-1 text-[10px]">
                    <div className="font-bold text-zinc-300">
                      Verified Google Cloud Storage &amp; Secret Manager REST API
                      Execution Trace:
                    </div>
                    {dlpRedactionReceipt.restApiTrace.map((step, idx) => (
                      <div key={idx}>{step}</div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {showDlpSecretManagerExplorer && !dlpRedactionReceipt && (
            <SecretManagerVaultExplorer
              projectId={projectId}
              targetSecretProject=""
              vaultedSecretsHint={[]}
              rehydrateContext={null}
              onRehydrated={() => {
                fetchDlpScan();
              }}
              onShowToast={onShowToast}
              onClose={() => setShowDlpSecretManagerExplorer(false)}
            />
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER X2: SERVERLESS COLD-START PROFILER & CONTAINER DIET SURGEON
  // ==========================================================================
  if (activeTab === 'X2') {
    const dockerfilePatch = `# CloudPulse 2026 Multi-Stage Distroless Container Diet Patch
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .

# Stage 2: Google Distroless Non-Root Runtime (48 MB vs 980 MB -> -78% Cold Start)
FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
COPY --from=builder /app /app
USER nonroot
EXPOSE 8080
CMD ["server/index.js"]`;

    return (
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-500/[0.08] border border-blue-500/30 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40">
                MOONSHOT X2 · SUB-100MS SERVERLESS COLD-START SURGEON
              </span>
              <h3 className="text-base font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1 flex items-center gap-2">
                <Zap className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                <span>
                  Cloud Run Cold-Start Phase Dissector &amp; 1-Tap Startup CPU
                  Boost Surgeon
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Breaks down container cold-start latency across Image Pull, Layer
                Decompression, Runtime Init, and TLS Handshake, then patches live
                Cloud Run services with Startup CPU Boost + Gen2 Linux microVM.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={activeRunObj.name}
                onChange={(e) => setSelectedRunService(e.target.value)}
                title="Select a Cloud Run service to profile its P99 cold-start phases and apply Startup CPU Boost"
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                {cloudRunServices.length === 0 ? (
                  <option value={activeRunObj.name}>
                    {activeRunObj.name} (Simulated Baseline)
                  </option>
                ) : (
                  cloudRunServices.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.region})
                    </option>
                  ))
                )}
              </select>

              <select
                value={simBaseImage}
                onChange={(e) => setSimBaseImage(e.target.value)}
                title="Compare container base image sizes (1.1 GB full OS vs 48 MB Google Distroless) to preview Image Pull & Layer Decompression latency savings"
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                <option value="python-full-1.1gb">
                  Base Image: python:3.12-full (1.1 GB)
                </option>
                <option value="node-debian-920mb">
                  Base Image: node:22-bookworm (920 MB)
                </option>
                <option value="distroless-48mb">
                  Base Image: gcr.io/distroless (48 MB)
                </option>
              </select>

              <button
                type="button"
                data-feature-id="MOONSHOT_X2_PATCH_COLDSTART_BOOST_BTN"
                disabled={busyKey === `coldstart-${activeRunObj.name}`}
                onClick={handleApplyColdStartSurgery}
                title={`Patch Cloud Run service "${activeRunObj.name}" via GCP Cloud Run v2 API to enable startupCpuBoost=true and EXECUTION_ENVIRONMENT_GEN2`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-extrabold shadow-sm cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  1-Tap Patch Startup CPU Boost + Gen2 (-
                  {coldStartProfile.speedupPct}% Cold Start)
                </span>
              </button>
            </div>
          </div>

          {/* Cold-Start Phase Breakdown Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
            {[
              {
                label: '1. Image Pull',
                ms: coldStartProfile.imagePullMs,
                sub: simBaseImage,
              },
              {
                label: '2. Layer Unpack',
                ms: coldStartProfile.unpackMs,
                sub: coldStartProfile.isGen2 ? 'Gen2 Fast FS' : 'Gen1 Sandbox',
              },
              {
                label: '3. Runtime Init',
                ms: coldStartProfile.runtimeInitMs,
                sub: coldStartProfile.hasBoost
                  ? 'CPU Boost Active'
                  : 'Throttled vCPU',
              },
              {
                label: '4. TLS + HTTP/2',
                ms: coldStartProfile.tlsHandshakeMs,
                sub: 'Google Front End',
              },
              {
                label: 'Total P99 Cold Start',
                ms: coldStartProfile.totalColdStartMs,
                sub: `Target: ${coldStartProfile.optimizedTotalMs} ms (-${coldStartProfile.speedupPct}%)`,
                highlight: true,
              },
            ].map((phase) => (
              <div
                key={phase.label}
                className={`p-3 rounded-xl border ${
                  phase.highlight
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300'
                    : 'bg-white/80 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="text-[10px] uppercase opacity-75">
                  {phase.label}
                </div>
                <div className="text-base font-extrabold mt-0.5">
                  {phase.ms} ms
                </div>
                <div className="text-[10px] opacity-70 mt-0.5">{phase.sub}</div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-400">
              <span className="text-emerald-400 font-bold">
                Synthesized Multi-Stage Distroless Container Diet Patch &amp; Gen2 CPU Boost CLI
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {onRunInShell && activeService && (
                  <button
                    type="button"
                    data-feature-id="MOONSHOT_X2_RUN_CPU_BOOST_SHELL_BTN"
                    onClick={() =>
                      onRunInShell(
                        `gcloud run services update ${activeService.name} --region=${activeService.region || 'us-central1'} --cpu-boost --execution-environment=gen2 --project=${projectId}`
                      )
                    }
                    className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>$ Run CPU Boost + Gen2 in Cloud Shell</span>
                  </button>
                )}
                <button
                  type="button"
                  data-feature-id="MOONSHOT_X2_DOWNLOAD_DOCKERFILE_BTN"
                  onClick={() =>
                    handleDownloadFile(
                      `Dockerfile.${activeService?.name || 'cloudrun'}.distroless`,
                      dockerfilePatch
                    )
                  }
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Dockerfile.distroless</span>
                </button>
                {onSelectStudioTab && (
                  <button
                    type="button"
                    data-feature-id="MOONSHOT_X2_OPEN_CLOUDRUN_STUDIO_BTN"
                    onClick={() => onSelectStudioTab('CLOUD_RUN')}
                    className="px-2.5 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    Open Cloud Run Studio →
                  </button>
                )}
                <button
                  type="button"
                  data-feature-id="MOONSHOT_X2_COPY_DOCKERFILE_BTN"
                  onClick={() => handleCopy(dockerfilePatch, 'dockerfile')}
                  title="Copy this multi-stage Google Distroless Dockerfile to shrink container image size from ~980 MB to 48 MB (-78% cold-start pull time)"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  {copiedKey === 'dockerfile' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Dockerfile</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Distroless Dockerfile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto">
              {dockerfilePatch}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER X3: CROSS-SERVICE EGRESS & HIDDEN DATA-GRAVITY TOLLBOOTH
  // ==========================================================================
  if (activeTab === 'X3') {
    const primaryTaxedLink =
      dataGravityMatrix.links.find((l) => l.ratePerGb > 0) ||
      dataGravityMatrix.links[0];
    const targetColocateRegion =
      primaryTaxedLink?.data?.region?.toLowerCase() || 'us-central1';
    const zeroEgressRunbookSh = [
      '#!/usr/bin/env bash',
      `# CloudPulse Data-Gravity Tollbooth — Zero-Egress Co-Location & Private Google Access Runbook`,
      `# Project: ${projectId} | Est. Annual Egress Savings: $${dataGravityMatrix.totalAnnualEgressTaxUsd}/yr`,
      'set -euo pipefail',
      '',
      '# 1. Enable Private Google Access on primary subnet so Compute/Run reaches GCS & BigQuery over internal backbone ($0 egress)',
      `gcloud compute networks subnets update default --region=${targetColocateRegion} --enable-private-ip-google-access --project=${projectId}`,
      '',
      ...dataGravityMatrix.links
        .filter((l) => l.ratePerGb > 0)
        .slice(0, 5)
        .map((l) =>
          l.compute.type === 'Cloud Run'
            ? `# Co-locate Cloud Run service '${l.compute.name}' (${l.compute.region}) into '${l.data.region}' alongside ${l.data.type} '${l.data.name}' (-$${l.monthlyTollUsd}/mo)\ngcloud run services describe ${l.compute.name} --region=${l.compute.region} --project=${projectId} --format=export > /tmp/${l.compute.name}.yaml`
            : `# Snapshot & migrate Compute VM '${l.compute.name}' (${l.compute.region}) into '${l.data.region}' alongside ${l.data.type} '${l.data.name}' (-$${l.monthlyTollUsd}/mo)\ngcloud compute disks list --filter="name~${l.compute.name}" --project=${projectId}`
        ),
    ].join('\n');

    const egressAuditBigQuerySql = `-- CloudPulse Data-Gravity Tollbooth — BigQuery Cloud Billing Export Egress SKU Audit
-- Identifies Inter-Region & Inter-Continental Network Egress SKUs across Compute Engine, Cloud Run, Cloud Storage, and BigQuery
SELECT
  service.description AS gcp_service,
  sku.description AS egress_sku,
  location.region AS source_region,
  ROUND(SUM(usage.amount_in_pricing_units), 2) AS total_gb_transferred,
  ROUND(SUM(cost), 2) AS total_egress_tax_usd
FROM \`${projectId}.billing_export.gcp_billing_export_v1\`
WHERE LOWER(sku.description) LIKE '%egress%'
   OR LOWER(sku.description) LIKE '%network%inter%region%'
   OR LOWER(sku.description) LIKE '%data transfer%'
GROUP BY 1, 2, 3
HAVING total_egress_tax_usd > 0
ORDER BY total_egress_tax_usd DESC
LIMIT 50;`;

    return (
      <div className="space-y-4">
        <LivePricingCatalogControlBar compact />
        <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-500/[0.06] border border-amber-500/30 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40">
                MOONSHOT X3 · HIDDEN BANDWIDTH TAX &amp; DATA-GRAVITY RADAR
              </span>
              <h3 className="text-base font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                <span>
                  Cross-Region Egress Tollbooth &amp; Zero-Egress Co-Location
                  Planner
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Exposes invisible $/GB bandwidth taxes between your Compute VMs,
                Cloud Run services, Cloud Storage buckets, and BigQuery datasets
                when deployed across mismatched regions or continents.
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
              <span>Monthly Data Transfer per Link:</span>
              <input
                type="number"
                min={10}
                max={100000}
                value={monthlyTrafficGbPerLink}
                onChange={(e) =>
                  setMonthlyTrafficGbPerLink(
                    Math.max(10, Number(e.target.value || 100))
                  )
                }
                title="Adjust estimated monthly GB transferred per Compute-to-Storage link to simulate cross-region and inter-continental egress fees"
                className="w-24 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
              <span>GB/mo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400">
                Cross-Region Taxed Links
              </div>
              <div className="text-base font-extrabold text-amber-500 mt-0.5">
                {dataGravityMatrix.taxedLinksCount} /{' '}
                {dataGravityMatrix.links.length} links paying egress
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400">
                Hidden Monthly Egress Tax
              </div>
              <div className="text-base font-extrabold text-red-500 mt-0.5">
                ${dataGravityMatrix.totalMonthlyEgressTaxUsd.toLocaleString()}/mo
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400">
                Annual Co-Location Savings
              </div>
              <div className="text-base font-extrabold text-emerald-500 mt-0.5">
                ${dataGravityMatrix.totalAnnualEgressTaxUsd.toLocaleString()}/yr
                saved if co-located
              </div>
            </div>
          </div>

          {/* 10X Zero-Egress Co-Location & Private Google Access Toolbar */}
          <div className="p-3.5 rounded-xl bg-white/90 dark:bg-zinc-950/90 border border-amber-500/30 space-y-2.5 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-amber-600 dark:text-amber-300 font-bold">
                Zero-Egress Co-Location &amp; Private Google Access Remediation Runbook
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {onRunInShell && (
                  <button
                    type="button"
                    data-feature-id="MOONSHOT_X3_ENABLE_PGA_SHELL_BTN"
                    onClick={() =>
                      onRunInShell(
                        `gcloud compute networks subnets update default --region=${targetColocateRegion} --enable-private-ip-google-access --project=${projectId}`
                      )
                    }
                    className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>$ Enable Private Google Access in Cloud Shell</span>
                  </button>
                )}
                <button
                  type="button"
                  data-feature-id="MOONSHOT_X3_DOWNLOAD_COLOCATE_SH_BTN"
                  onClick={() =>
                    handleDownloadFile(
                      `zero-egress-colocate-${projectId}.sh`,
                      zeroEgressRunbookSh,
                      'text/x-shellscript;charset=utf-8'
                    )
                  }
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download zero-egress-colocate.sh</span>
                </button>
                {onOpenBigQuerySql && (
                  <button
                    type="button"
                    data-feature-id="MOONSHOT_X3_QUERY_EGRESS_BQ_BTN"
                    onClick={() => onOpenBigQuerySql(egressAuditBigQuerySql)}
                    className="px-2.5 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer"
                  >
                    Query Egress SKUs in BigQuery Studio →
                  </button>
                )}
                {onSelectStudioTab && (
                  <button
                    type="button"
                    data-feature-id="MOONSHOT_X3_OPEN_VPC_STUDIO_BTN"
                    onClick={() => onSelectStudioTab('VPC_FIREWALL')}
                    className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                  >
                    Open VPC &amp; Subnets Studio →
                  </button>
                )}
              </div>
            </div>
            <pre className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-emerald-700 dark:text-emerald-300 overflow-x-auto max-h-36">
              {zeroEgressRunbookSh}
            </pre>
          </div>

          <div className="space-y-2">
            {dataGravityMatrix.links.slice(0, 8).map((link) => {
              const targetComputeStudio =
                link.compute.type === 'Cloud Run' ? 'CLOUD_RUN' : 'VM_FLEET';
              const targetDataStudio =
                link.data.type === 'BigQuery'
                  ? 'BIGQUERY_ANALYTICS'
                  : 'STORAGE_DLP';
              return (
                <div
                  key={link.id}
                  className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">
                      {link.compute.type}: {link.compute.name} ({link.compute.region})
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">
                      {link.data.type}: {link.data.name} ({link.data.region})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        link.ratePerGb === 0
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : link.tier === 'CROSS_CONTINENT_TRANSOCEANIC'
                          ? 'bg-red-500/15 text-red-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {link.ratePerGb === 0
                        ? '$0.00/GB (Co-Located)'
                        : `$${link.ratePerGb}/GB · $${link.monthlyTollUsd}/mo Tax`}
                    </span>
                    {onSelectStudioTab && (
                      <>
                        <button
                          type="button"
                          data-feature-id="MOONSHOT_X3_OPEN_COMPUTE_NODE_BTN"
                          onClick={() => onSelectStudioTab(targetComputeStudio)}
                          className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                        >
                          {link.compute.type} →
                        </button>
                        <button
                          type="button"
                          data-feature-id="MOONSHOT_X3_OPEN_DATA_NODE_BTN"
                          onClick={() => onSelectStudioTab(targetDataStudio)}
                          className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                        >
                          {link.data.type} →
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER X4: CRYPTOGRAPHIC RANSOMWARE AIR-GAP & CLEAN-ROOM AUDITOR
  // ==========================================================================
  if (activeTab === 'X4') {
    const activeAuditBkt =
      ransomwareAudit.auditedBuckets.find(
        (b) => b.name === selectedRansomwareBucket
      ) || ransomwareAudit.auditedBuckets[0];

    return (
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/[0.06] border border-emerald-500/30 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-emerald-500/20 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40">
                  MOONSHOT X4 · 4-PILLAR RANSOMWARE SURVIVAL &amp; CLEAN-ROOM AUDITOR
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 text-emerald-400 border border-emerald-500/30">
                  NIST SP 800-209 · SEC Rule 17a-4 (WORM) · GCS Generation Time-Machine
                </span>
              </div>
              <h3 className="text-base font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" />
                <span>
                  Cryptographic Ransomware Air-Gap Resilience, 6-Gate X-Ray &amp;
                  Live Clean-Room Rollback Studio
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Inspects live bucket immutability gates (`PAP`, `Uniform IAM`, `Soft-Delete 7d–90d`, `Object Versioning` vs `SEC 17a-4 WORM Retention`, `CMEK`, and `Destructive IAM Principals`), runs a live 3-step ransomware overwrite &amp; rollback drill (`v1 -&gt; v2 -&gt; v3`), and restores noncurrent generations in 1 click.
              </p>
            </div>

            <div className="flex items-center gap-2.5 font-mono flex-wrap">
              <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/40 text-right">
                <div className="text-[10px] uppercase text-zinc-400">
                  Fleet Survival Score
                </div>
                <div className="text-base font-extrabold text-emerald-500">
                  {ransomwareAudit.overallScore}/100 · RTO{' '}
                  {deepRansomwareAudit?.estimatedRtoSeconds
                    ? `${deepRansomwareAudit.estimatedRtoSeconds}s`
                    : `${ransomwareAudit.rtoMinutes}m`}
                </div>
              </div>
            </div>
          </div>

          {/* PILLAR 1: BUCKET FLEET & 1-TAP IMMUTABILITY / WORM / SOFT-DELETE CONTROLS */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                1. Select Bucket to Inspect &amp; Harden ({ransomwareAudit.auditedBuckets.length} Buckets)
              </span>
              {activeAuditBkt && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    data-feature-id="RANSOMWARE_X4_DEEP_AUDIT_BTN"
                    disabled={loadingDeepRansomware}
                    onClick={() =>
                      handleRunDeepRansomwareAudit(activeAuditBkt.name)
                    }
                    className="h-8 px-3 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-sans font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        loadingDeepRansomware ? 'animate-spin' : ''
                      }`}
                    />
                    <span>
                      {loadingDeepRansomware
                        ? 'Scanning 6 Gates & Generations...'
                        : `Deep-Audit gs://${activeAuditBkt.name}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-feature-id="RANSOMWARE_X4_RUN_CLEANROOM_DRILL_BTN"
                    disabled={runningRansomwareDrill}
                    onClick={() => handleRunRansomwareDrill(activeAuditBkt.name)}
                    title="Writes a clean JSON ledger (v1), simulates a ransomware overwrite (v2), and executes a live GCS rewriteTo rollback from noncurrent generation v1 -> v3 while verifying CRC32C & SHA-256"
                    className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {runningRansomwareDrill
                        ? 'Running v1 -> v2 Attack -> v3 Rollback Drill...'
                        : 'Run Live Clean-Room Rollback Drill (v1 -> v2 -> v3)'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {ransomwareAudit.auditedBuckets.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500">
                No Cloud Storage buckets found yet — provision a compliant bucket
                to audit its live ransomware survival score.
              </div>
            ) : (
              [...ransomwareAudit.auditedBuckets]
                .sort((a, b) =>
                  a.name === activeAuditBkt?.name
                    ? -1
                    : b.name === activeAuditBkt?.name
                    ? 1
                    : 0
                )
                .map((b) => {
                const isSelected = activeAuditBkt?.name === b.name;
                return (
                  <div
                    key={b.name}
                    onClick={() => {
                      setSelectedRansomwareBucket(b.name);
                      if (typeof onSelectBucket === 'function') {
                        onSelectBucket(b.name);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 text-xs font-mono cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-900 border-amber-500 ring-1 ring-amber-500/40 shadow-sm'
                        : 'bg-white/90 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                            gs://{b.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {b.location.toUpperCase()} · {b.storageClass}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 font-bold">
                              ACTIVE X-RAY TARGET
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              b.pap
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/15 text-red-500'
                            }`}
                          >
                            PAP: {b.pap ? 'Enforced' : 'Inherited'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              b.ubla
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-500'
                            }`}
                          >
                            IAM: {b.ubla ? 'Uniform' : 'Legacy ACL'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">
                            Soft-Delete: {b.softDelDays}d
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              b.versioning || b.wormDays > 0
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-500'
                            }`}
                          >
                            {b.wormDays > 0
                              ? `WORM Retention: ${b.wormDays}d (${
                                  b.wormLocked ? 'LOCKED' : 'Unlocked'
                                })`
                              : b.versioning
                              ? 'Versioning: ON'
                              : 'Versioning: OFF'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold">
                            {b.cmek
                              ? `CMEK: ${b.kmsKeyShort}`
                              : 'Google AES-256'}
                          </span>
                          {b.privilegedPrincipalsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold">
                              {b.privilegedPrincipalsCount} Admin Principal(s)
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className="flex flex-wrap items-center gap-2 font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-sm font-mono font-extrabold text-emerald-500 mr-1">
                          {b.survivalScore}%
                        </span>
                        {onOpenObjectInWorkbench && (
                          <button
                            type="button"
                            data-feature-id="RANSOMWARE_X4_OPEN_WORKBENCH_BTN"
                            onClick={() => onOpenObjectInWorkbench(b.name, '')}
                            title={`Open gs://${b.name} in the Object Workbench (M02) to inspect noncurrent object versions, restore soft-deleted generations, or toggle temporaryHold / eventBasedHold`}
                            className="h-8 px-3 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:border-blue-500/50 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
                          >
                            Version Time-Machine (M02) →
                          </button>
                        )}
                        <button
                          type="button"
                          data-feature-id="RANSOMWARE_X4_AIRGAP_30D_SHIELD_BTN"
                          disabled={busyKey === `airgap-${b.name}`}
                          onClick={() => handleAirGapLockBucket(b.name)}
                          title={`Harden gs://${b.name} in 1 click via Google Cloud Storage API: enforces publicAccessPrevention='enforced', uniformBucketLevelAccess=true, versioningEnabled=true, and a 30-day Soft-Delete recovery window`}
                          className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                        >
                          {busyKey === `airgap-${b.name}`
                            ? 'Hardening...'
                            : '1-Tap Air-Gap Shield (30d Soft-Delete)'}
                        </button>
                        <button
                          type="button"
                          data-feature-id="RANSOMWARE_X4_MAX_90D_SOFT_DELETE_BTN"
                          disabled={busyKey === `airgap-${b.name}`}
                          onClick={() =>
                            handleAirGapLockBucket(b.name, {
                              publicAccessPrevention: 'enforced',
                              uniformBucketLevelAccess: true,
                              versioningEnabled: true,
                              softDeleteDays: 90,
                            })
                          }
                          title={`Configure maximum 90-day Google Cloud Storage Soft-Delete retention window + Object Versioning on gs://${b.name}`}
                          className="h-8 px-2.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold cursor-pointer disabled:opacity-50"
                        >
                          Max 90d Soft-Delete
                        </button>
                        <button
                          type="button"
                          data-feature-id="RANSOMWARE_X4_WORM_LOCK_30D_BTN"
                          disabled={busyKey === `airgap-${b.name}` || b.wormLocked}
                          onClick={() =>
                            handleAirGapLockBucket(
                              b.name,
                              b.wormDays > 0
                                ? {
                                    retentionPeriodDays: 0,
                                    versioningEnabled: true,
                                  }
                                : {
                                    retentionPeriodDays: 30,
                                    defaultEventBasedHold: true,
                                  }
                            )
                          }
                          title={
                            b.wormDays > 0
                              ? `Switch gs://${b.name} from Unlocked WORM Retention back to Object Versioning mode`
                              : `Enable 30-Day SEC 17a-4 Unlocked WORM Retention Policy + Default Event-Based Hold on gs://${b.name} (automatically disables Object Versioning per GCS API spec)`
                          }
                          className="h-8 px-2.5 rounded-md bg-amber-500/15 hover:bg-amber-600 hover:text-white text-amber-700 dark:text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer disabled:opacity-50"
                        >
                          {b.wormDays > 0
                            ? 'Switch WORM -> Versioning'
                            : '30d WORM Lock (SEC 17a-4)'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PILLAR 2: LIVE 3-STEP RANSOMWARE OVERWRITE & CLEAN-ROOM ROLLBACK DRILL RECEIPT */}
          {ransomwareDrillReceipt && (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-blue-500/40 space-y-3 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-extrabold">
                    LIVE CLEAN-ROOM ROLLBACK DRILL VERIFIED
                  </span>
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    gs://{ransomwareDrillReceipt.bucketName}/
                    {ransomwareDrillReceipt.objectName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    Measured RTO: {ransomwareDrillReceipt.rollbackRtoMs} ms
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    RPO: 0 Bytes Lost (CRC32C Verified)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {(ransomwareDrillReceipt.timeline || []).map((step) => (
                  <div
                    key={step.step}
                    className={`p-3 rounded-xl border space-y-1 ${
                      step.step === 2
                        ? 'bg-red-500/5 border-red-500/30'
                        : 'bg-emerald-500/5 border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-zinc-100">
                        Step {step.step}: {step.phase}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 font-bold">
                        Gen #{String(step.generation).slice(-6)}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-zinc-600 dark:text-zinc-300">
                      {step.summary}
                    </div>
                    <div className="text-[10px] text-zinc-500 pt-1">
                      CRC32C: <code>{step.crc32c}</code> · SHA256:{' '}
                      <code>{String(step.sha256 || '').slice(0, 12)}…</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PILLAR 3: 6-GATE CRYPTOGRAPHIC SURVIVAL MATRIX FOR ACTIVE BUCKET */}
          {deepRansomwareAudit && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  2. 6-Gate Cryptographic Survival Matrix — gs://
                  {deepRansomwareAudit.bucketName} ({deepRansomwareAudit.survivalScore}
                  /100)
                </span>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span>
                    Live Objects:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100">
                      {deepRansomwareAudit.telemetry?.liveObjectsCount || 0}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Noncurrent Gens:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {deepRansomwareAudit.telemetry?.noncurrentGenerationsCount || 0}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Soft-Deleted in Trash:{' '}
                    <strong className="text-blue-600 dark:text-blue-400">
                      {deepRansomwareAudit.telemetry?.softDeletedObjectsCount || 0}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono">
                {(deepRansomwareAudit.gates || []).map((gate) => (
                  <div
                    key={gate.id}
                    className={`p-3 rounded-xl border space-y-1 ${
                      gate.passed
                        ? 'bg-white dark:bg-zinc-900 border-emerald-500/35'
                        : 'bg-white dark:bg-zinc-900 border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                        {gate.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          gate.passed
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {gate.pointsEarned}/{gate.maxPoints} pts
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {gate.statusLabel}
                    </div>
                    <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                      {gate.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* PILLAR 4: NONCURRENT GENERATION TIME-MACHINE & IAM BLAST-RADIUS LEDGER */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 font-mono text-xs">
                {/* Left: Noncurrent Object Generations Ready for 1-Tap Rollback */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                      3. Noncurrent Generation Rollback Ledger (
                      {(deepRansomwareAudit.versionedObjectChains || []).length})
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      1-Click Point-in-Time Restore
                    </span>
                  </div>

                  {(deepRansomwareAudit.versionedObjectChains || []).length ===
                  0 ? (
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500">
                      No overwritten/noncurrent object generations found in{' '}
                      <code>gs://{deepRansomwareAudit.bucketName}</code> yet.
                      Click{' '}
                      <strong>
                        Run Live Clean-Room Rollback Drill (v1 -&gt; v2 -&gt; v3)
                      </strong>{' '}
                      above to test real GCS generation preservation &amp;
                      point-in-time recovery!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {deepRansomwareAudit.versionedObjectChains.map((chain) => {
                        const prevGen = chain.noncurrentGenerations?.[0];
                        return (
                          <div
                            key={chain.objectName}
                            className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {chain.objectName}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                {chain.totalGenerations} total gen(s) · Live
                                Gen #{String(chain.liveGeneration?.generation || '').slice(-6)}{' '}
                                {prevGen
                                  ? `· Previous Gen #${String(prevGen.generation).slice(-6)} (${prevGen.size} B, CRC32C ${prevGen.crc32c})`
                                  : ''}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 font-sans">
                              {prevGen && (
                                <button
                                  type="button"
                                  data-feature-id="RANSOMWARE_X4_RESTORE_GEN_BTN"
                                  disabled={
                                    busyKey ===
                                    `rollback-${chain.objectName}-${prevGen.generation}`
                                  }
                                  onClick={() =>
                                    handleRollbackNoncurrentGeneration(
                                      deepRansomwareAudit.bucketName,
                                      chain.objectName,
                                      prevGen.generation
                                    )
                                  }
                                  className="h-7 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                                >
                                  {busyKey ===
                                  `rollback-${chain.objectName}-${prevGen.generation}`
                                    ? 'Restoring...'
                                    : `Restore Gen #${String(
                                        prevGen.generation
                                      ).slice(-6)}`}
                                </button>
                              )}
                              {onOpenObjectInWorkbench && (
                                <button
                                  type="button"
                                  data-feature-id="RANSOMWARE_X4_INSPECT_CHAIN_BTN"
                                  onClick={() =>
                                    onOpenObjectInWorkbench(
                                      deepRansomwareAudit.bucketName,
                                      chain.objectName
                                    )
                                  }
                                  className="h-7 px-2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold cursor-pointer"
                                >
                                  Inspect →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Destructive IAM Principal Blast-Radius Audit */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                      4. IAM Delete / Overwrite Blast-Radius Principals (
                      {(deepRansomwareAudit.destructivePrincipals || []).length})
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      storage.admin / objectAdmin
                    </span>
                  </div>

                  {(deepRansomwareAudit.destructivePrincipals || []).length ===
                  0 ? (
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500">
                      Zero direct bucket-level destructive IAM principals found.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {deepRansomwareAudit.destructivePrincipals.map(
                        (p, idx) => (
                          <div
                            key={`${p.role}-${p.member}-${idx}`}
                            className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {p.member}
                              </div>
                              <div className="text-[10px] text-zinc-500 truncate">
                                {p.role}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold shrink-0 ${
                                p.riskVector === 'CRITICAL_PUBLIC_WRITE_DELETE'
                                  ? 'bg-red-500/20 text-red-500'
                                  : p.riskVector ===
                                    'SERVICE_ACCOUNT_KEY_COMPROMISE_VECTOR'
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {p.riskVector ===
                              'SERVICE_ACCOUNT_KEY_COMPROMISE_VECTOR'
                                ? 'SA Key Vector'
                                : p.riskVector ===
                                  'CRITICAL_PUBLIC_WRITE_DELETE'
                                ? 'PUBLIC WRITE!'
                                : 'Admin Identity'}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER X5: GLOBAL ANYCAST USER-EXPERIENCE & EDGE LATENCY MATRIX
  // ==========================================================================
  if (activeTab === 'X5') {
    const anycastCdnProvisionSh = [
      '#!/usr/bin/env bash',
      `# CloudPulse X5 Global Anycast Cloud CDN + Serverless NEG Provisioning Script`,
      `# Origin Region: ${selectedOriginRegion} | Project: ${projectId}`,
      'set -euo pipefail',
      `gcloud compute network-endpoint-groups create cloudpulse-edge-neg-${selectedOriginRegion} --region=${selectedOriginRegion} --network-endpoint-type=serverless --cloud-run-service=${activeService?.name || 'cloudpulse-api'} --project=${projectId}`,
      `gcloud compute backend-services create cloudpulse-anycast-backend --global --enable-cdn --cache-mode=CACHE_ALL_STATIC --project=${projectId}`,
      `gcloud compute backend-services add-backend cloudpulse-anycast-backend --global --network-endpoint-group=cloudpulse-edge-neg-${selectedOriginRegion} --network-endpoint-group-region=${selectedOriginRegion} --project=${projectId}`,
    ].join('\n');

    return (
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-500/[0.08] border border-blue-500/30 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40">
                MOONSHOT X5 · 12-METROPOLIS SPEED-OF-LIGHT UX MATRIX
              </span>
              <h3 className="text-base font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1 flex items-center gap-2">
                <Globe className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                <span>
                  Global Client-to-Region Fiber RTT + Anycast Edge Load Balancer
                  Simulator
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Calculates real optical-fiber round-trip time, TLS 1.3 handshake,
                and compute TTFB from 12 world population hubs to your active
                GCP region—and previews the instant speedup from Google Global
                Anycast Cloud CDN.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={selectedOriginRegion}
                onChange={(e) => setSelectedOriginRegion(e.target.value)}
                title="Select the primary GCP origin region hosting your backend service to calculate fiber-optic round-trip latency from 12 global cities"
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                {GCP_GLOBAL_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    Origin: {r.id} ({r.name})
                  </option>
                ))}
              </select>

              <button
                type="button"
                data-feature-id="MOONSHOT_X5_TOGGLE_ANYCAST_CDN_BTN"
                onClick={() => setEnableGlobalAnycastCdn((v) => !v)}
                title="Simulate terminating client TLS 1.3 handshakes at Google's nearest Global Anycast Edge PoP (Cloud Load Balancing + Cloud CDN) instead of traversing transoceanic fiber to the origin"
                className={`px-3.5 py-2 rounded-md text-xs font-mono font-extrabold border cursor-pointer transition-all ${
                  enableGlobalAnycastCdn
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {enableGlobalAnycastCdn
                  ? 'Global Anycast Edge CDN: ENABLED'
                  : 'Toggle Global Anycast Edge CDN'}
              </button>

              {onRunInShell && (
                <button
                  type="button"
                  data-feature-id="MOONSHOT_X5_INSPECT_ANYCAST_SHELL_BTN"
                  onClick={() =>
                    onRunInShell(
                      `gcloud compute backend-services list --global --project=${projectId}`
                    )
                  }
                  className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>$ Inspect Anycast CDN in Cloud Shell</span>
                </button>
              )}

              <button
                type="button"
                data-feature-id="MOONSHOT_X5_DOWNLOAD_ANYCAST_SH_BTN"
                onClick={() =>
                  handleDownloadFile(
                    `anycast-cdn-${selectedOriginRegion}-${projectId}.sh`,
                    anycastCdnProvisionSh,
                    'text/x-shellscript;charset=utf-8'
                  )
                }
                className="px-3 py-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download anycast-cdn.sh</span>
              </button>

              {onSelectStudioTab && (
                <button
                  type="button"
                  data-feature-id="MOONSHOT_X5_OPEN_GLOBAL_MAP_BTN"
                  onClick={() => onSelectStudioTab('GLOBAL_MAP')}
                  className="px-3 py-2 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-mono font-bold cursor-pointer"
                >
                  Open 40-Region Global Map →
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
            {latencyMatrix.rows.map((hub) => (
              <div
                key={hub.id}
                className="p-3 rounded-xl bg-white/85 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>
                    {hub.flag} {hub.city}
                  </span>
                  <span
                    className={
                      hub.activeLatencyMs <= 35
                        ? 'text-emerald-500'
                        : hub.activeLatencyMs <= 110
                        ? 'text-blue-500'
                        : 'text-amber-500'
                    }
                  >
                    {hub.activeLatencyMs} ms
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                  <span>{hub.distKm.toLocaleString()} km</span>
                  <span>
                    {enableGlobalAnycastCdn
                      ? `Saved -${hub.savedMs} ms via Edge PoP`
                      : `Direct RTT (${hub.fiberRttMs} ms fiber)`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER X6: AES-256-GCM ENCRYPTED AI STUDIO BYOK VAULT (OPTION 3)
  // ==========================================================================
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/[0.06] border border-emerald-500/30 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40">
                MOONSHOT X6 · OPTION 3 AES-256-GCM AI STUDIO BYOK VAULT
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 text-emerald-400 border border-emerald-500/30">
                {vaultStatus.configured
                  ? `SEALED IN RAM (${vaultStatus.maskedKey} · ${vaultStatus.keyFingerprint})`
                  : 'ZERO-KEY DETERMINISTIC MODE (SEAL KEY TO UNLOCK LIVE GEMINI 3.8 FLASH / 3.1 PRO)'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/15 text-blue-500 border border-blue-500/30">
                ACTIVE ENGINE:{' '}
                {selectedGeminiModel === 'CUSTOM' && customModelId.trim()
                  ? customModelId.trim()
                  : selectedGeminiModel}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/15 text-blue-500 border border-blue-500/30">
                {transportMode === 'BROWSER_DIRECT_TLS13'
                  ? 'ZERO LOCAL HTTP HOP: Direct Browser -> Google HTTPS TLS 1.3'
                  : `RSA-OAEP-256 WIRE ENVELOPE (${
                      vaultStatus.rsaKeyFingerprint || 'RSA2048-OAEP-SHA256'
                    })`}
              </span>
            </div>
            <h3 className="text-base font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              <span>
                Zero-Sniffing WebCrypto Enclave &amp; Live Gemini 3.8 Flash /
                3.1 Pro SRE Co-Architect
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Even when running on plain <code>http://localhost</code>, a packet
              sniffer (<code>Wireshark</code> / <code>tcpdump</code>) can{' '}
              <strong>never</strong> intercept your API key: in{' '}
              <strong>Direct Browser HTTPS TLS 1.3 Mode</strong>, your key is
              sealed inside a non-extractable Browser WebCrypto{' '}
              <code>AES-256-GCM</code> key and talks directly to{' '}
              <code>https://generativelanguage.googleapis.com</code> over{' '}
              <strong>TLS 1.3</strong> (0 packets over local HTTP); in{' '}
              <strong>RSA-OAEP-256 Server Vault Mode</strong>, the browser
              encrypts your key with the server&apos;s ephemeral 2048-bit RSA
              public key before sending it over HTTP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={aiPreferredProvider}
              onChange={(e) => setAiPreferredProvider(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100"
              title="Choose which engine executes live Gemini inference"
            >
              <option value="AUTO">Engine: Auto (Vertex AI OAuth2 + AI Studio Key)</option>
              <option value="VERTEX_AI_OAUTH">Engine: Path A · Keyless Vertex AI Only (No Key)</option>
              <option value="AI_STUDIO_KEY">Engine: Path B · AI Studio Key Only (AIzaSy...)</option>
            </select>
            <button
              type="button"
              data-feature-id="MOONSHOT_X6_SYNC_AI_MODELS_BTN"
              onClick={handleDiscoverLiveModels}
              disabled={discoveringModels}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-600 dark:text-blue-300 text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              title="Query Google AI Studio /v1beta/models over HTTPS TLS 1.3 to auto-discover newly released Gemini models"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${discoveringModels ? 'animate-spin' : ''}`}
              />
              <span>
                {discoveringModels
                  ? 'Syncing Models...'
                  : 'Sync Live AI Studio Models'}
              </span>
            </button>
          </div>
        </div>

        {/* When Keyless Vertex AI Only is selected, show Path A Card and hide Path B API Key Vault */}
        {aiPreferredProvider === 'VERTEX_AI_OAUTH' && (
          <div className="p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="space-y-1">
              <div className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Path A Active · Keyless Google Cloud Vertex AI OAuth2 (No API Key Needed)</span>
              </div>
              <div className="text-zinc-600 dark:text-zinc-300 text-[11px]">
                Authenticates directly with your active Google Cloud login token against{' '}
                <code>aiplatform.googleapis.com/v1/projects/{projectId}/locations/global</code>. API Key Vault inputs are hidden.
              </div>
            </div>
            <button
              type="button"
              data-feature-id="MOONSHOT_X6_SWITCH_PATH_B_BTN"
              onClick={() => setAiPreferredProvider('AI_STUDIO_KEY')}
              className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
            >
              Switch to Path B (AIzaSy... Key) →
            </button>
          </div>
        )}

        {/* Anti-Sniffing Transport & Wire-Encryption Mode Selector — only shown when Path B (AI Studio Key) is active */}
        {aiPreferredProvider !== 'VERTEX_AI_OAUTH' && (
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/95 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <Lock className="w-4 h-4 shrink-0" />
            <span className="font-bold">
              Anti-Sniffing Wire Protection (Safe on <code>http://localhost</code>
              ):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-feature-id="ANTI_SNIFFING_MODE1_DIRECT_TLS13"
              onClick={() => setTransportMode('BROWSER_DIRECT_TLS13')}
              title="Mode 1 (Recommended on http://localhost): Seals your API key inside a non-extractable Browser WebCrypto AES-256-GCM enclave and calls https://generativelanguage.googleapis.com directly over HTTPS TLS 1.3. Zero bytes of your API key or prompt ever traverse local HTTP!"
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                transportMode === 'BROWSER_DIRECT_TLS13'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/50'
              }`}
            >
              Mode 1: Direct Browser → Google HTTPS TLS 1.3 (0 Local HTTP
              Packets)
            </button>
            <button
              type="button"
              data-feature-id="ANTI_SNIFFING_MODE2_RSA_OAEP_VAULT"
              onClick={() => setTransportMode('RSA_OAEP_SERVER_VAULT')}
              title="Mode 2 (Asymmetric Wire Envelope): Browser encrypts your API key with the Node.js server's ephemeral 2048-bit RSA-OAEP-SHA256 public key BEFORE sending over HTTP, then the server re-seals it in an AES-256-GCM RAM Vault. Packet sniffers on localhost only see 256 bytes of RSA ciphertext!"
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                transportMode === 'RSA_OAEP_SERVER_VAULT'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-blue-500/50'
              }`}
            >
              Mode 2: Browser RSA-OAEP-256 Ciphertext → Server AES-256-GCM
              RAM
            </button>
          </div>
        </div>
        )}

        {/* 3-Step Interactive Onboarding Guide when no API key is sealed yet and Path B is visible */}
        {aiPreferredProvider !== 'VERTEX_AI_OAUTH' && !vaultStatus.configured && (
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              missingKeyBanner
                ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-amber-500/[0.08] border-amber-500/30'
            } space-y-2`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-amber-600 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <span>
                  {`Keyless Vertex AI OAuth2 (${
                    selectedGeminiModel === 'CUSTOM' && customModelId.trim()
                      ? customModelId.trim()
                      : selectedGeminiModel
                  } / gemini-3.1-pro) is active out-of-the-box! Or optionally seal a Google AI Studio key below:`}
                </span>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                title="Open Google AI Studio in a new tab to create or copy a free Gemini API key (AIzaSy...)"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[11px] font-mono font-extrabold shadow-sm cursor-pointer"
              >
                <span>↗ 1. Get Free Key at aistudio.google.com/apikey</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/90 border border-amber-500/30 flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-extrabold">
                  STEP 1
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  Open{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open Google AI Studio API Key dashboard"
                    className="text-blue-500 underline font-bold"
                  >
                    aistudio.google.com/apikey
                  </a>{' '}
                  and copy your <code className="text-emerald-500">AIzaSy...</code>{' '}
                  key.
                </span>
              </div>
              <button
                type="button"
                data-feature-id="MOONSHOT_X6_FOCUS_VAULT_BOX_BTN"
                onClick={focusAndHighlightKeyInput}
                title="Click to jump directly to the encrypted API key input box below"
                className="p-2 rounded-md bg-white/80 dark:bg-zinc-900/90 border border-amber-500/30 hover:border-amber-500 flex items-start gap-2 text-left cursor-pointer"
              >
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-extrabold">
                  STEP 2
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  <strong>Click here</strong> to focus the Vault box below and
                  paste your <code className="text-emerald-500">AIzaSy...</code>{' '}
                  key.
                </span>
              </button>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/90 border border-amber-500/30 flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-extrabold">
                  STEP 3
                </span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  Click <strong>Seal in RAM Vault</strong> (or just click{' '}
                  <strong>Ask</strong> — we auto-seal it for you!).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AES-256-GCM Key Vault Bar */}
        <form
          onSubmit={handleSealApiKey}
          className={`p-3.5 rounded-xl bg-white dark:bg-zinc-900 border transition-all ${
            missingKeyBanner && !vaultStatus.configured
              ? 'border-amber-500 ring-2 ring-amber-500/40'
              : 'border-zinc-200 dark:border-zinc-800'
          } space-y-2.5`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            {aiPreferredProvider !== 'VERTEX_AI_OAUTH' && (
              <div className="sm:col-span-5">
                <input
                  ref={apiKeyInputRef}
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    if (e.target.value.trim()) setMissingKeyBanner(false);
                  }}
                  title="Paste your Google AI Studio API key (starts with AIzaSy...). Never written to disk, localStorage, or git."
                  placeholder={
                    vaultStatus.configured
                      ? `Sealed: ${vaultStatus.maskedKey} (Enter new key to rotate)`
                      : 'Paste Google AI Studio Key here (AIzaSy...) to unlock live Gemini 3.8 / 3.1'
                  }
                  className={`w-full bg-zinc-50 dark:bg-zinc-950 border rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 transition-all ${
                    missingKeyBanner && !vaultStatus.configured
                      ? 'border-amber-500 ring-2 ring-amber-500/50 placeholder:text-amber-500'
                      : 'border-zinc-300 dark:border-zinc-700'
                  }`}
                />
              </div>
            )}
            <div
              className={
                aiPreferredProvider === 'VERTEX_AI_OAUTH'
                  ? 'sm:col-span-12'
                  : 'sm:col-span-4'
              }
            >
              <select
                value={selectedGeminiModel}
                onChange={(e) => setSelectedGeminiModel(e.target.value)}
                title="Choose which Gemini model powers the SRE Co-Architect (gemini-3.8-flash or gemini-3.1-pro)"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100"
              >
                {Array.from(
                  new Map(
                    [
                      ...availableModels,
                      ...getAllAvailableGeminiModels(),
                    ].map((m) => [m.id, m])
                  ).values()
                ).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label || m.id}
                  </option>
                ))}
                <option value="CUSTOM">
                  Custom / Future Gemini Model ID...
                </option>
              </select>
            </div>
            {aiPreferredProvider !== 'VERTEX_AI_OAUTH' && (
              <div className="sm:col-span-3 flex items-center gap-2">
                <button
                  type="submit"
                  data-feature-id="MOONSHOT_X6_SEAL_KEY_BTN"
                  disabled={busyKey === 'seal-key'}
                  title={
                    transportMode === 'BROWSER_DIRECT_TLS13'
                      ? 'Encrypt and seal your API key inside a non-extractable Browser WebCrypto AES-256-GCM enclave (0 bytes sent over local HTTP)'
                      : 'Encrypt your API key in the browser with RSA-OAEP-256 and seal it inside the Node.js server AES-256-GCM RAM Vault'
                  }
                  className={`flex-1 px-3 py-2 rounded-md text-white text-xs font-mono font-bold cursor-pointer transition-all ${
                    apiKeyInput.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                      : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-600'
                  }`}
                >
                  {transportMode === 'BROWSER_DIRECT_TLS13'
                    ? 'Seal in Browser WebCrypto'
                    : 'Seal via RSA-OAEP-256'}
                </button>
                {vaultStatus.configured && (
                  <button
                    type="button"
                    data-feature-id="MOONSHOT_X6_CLEAR_VAULT_BTN"
                    onClick={handleClearVault}
                    className="px-2.5 py-2 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-500 text-xs font-mono font-bold cursor-pointer"
                    title="Zero-fill and wipe the encrypted API key from Browser WebCrypto memory and Server RAM Vault"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick-Switch Pill Bar for 3.8-flash & 3.1-pro + Custom Model Input */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400">
                1-Tap Model Switch:
              </span>
              {[
                {
                  id: 'gemini-3.8-flash',
                  badge: 'gemini-3.8-flash (Ultra-Fast SRE)',
                  tip: 'Switch to gemini-3.8-flash: High-speed 2026 SRE, FinOps & gcloud CLI synthesis engine',
                },
                {
                  id: 'gemini-3.1-pro',
                  badge: 'gemini-3.1-pro (Deep Architecture)',
                  tip: 'Switch to gemini-3.1-pro: Deep multi-layer cloud architecture, IAM security & compliance reasoning',
                },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  data-feature-id="MOONSHOT_X6_MODEL_PRESET_BTN"
                  onClick={() => setSelectedGeminiModel(preset.id)}
                  title={preset.tip}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                    selectedGeminiModel === preset.id
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/50'
                      : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500/40'
                  }`}
                >
                  {preset.badge}
                </button>
              ))}
            </div>

            {selectedGeminiModel === 'CUSTOM' && (
              <input
                type="text"
                value={customModelId}
                onChange={(e) => setCustomModelId(e.target.value)}
                title="Enter any custom or newly released Google AI Studio Gemini model identifier"
                placeholder="Enter custom model ID (e.g. gemini-3.8-flash)"
                className="w-72 bg-zinc-50 dark:bg-zinc-950 border border-blue-500/50 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            )}
          </div>
        </form>

        {/* Prompt Studio */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              'Audit my Cloud Storage buckets for SEC 17a-4 & GDPR compliance and give gcloud commands',
              'How can I cut my Cloud Run & Compute VM monthly burn rate by 40%?',
              'Design a Zero-Trust VPC firewall & Cloud Armor perimeter for this project',
            ].map((q) => (
              <button
                key={q}
                type="button"
                data-feature-id="MOONSHOT_X6_PROMPT_PRESET_BTN"
                onClick={() => {
                  setAiPrompt(q);
                  handleAskGeminiArchitect(q);
                }}
                title={`Run this SRE prompt against your live ${projectId} telemetry: "${q}"`}
                className="text-[10.5px] font-mono px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              title="Enter any architecture, security, FinOps, or gcloud CLI question for the Gemini SRE Co-Architect"
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              data-feature-id="MOONSHOT_X6_ASK_ARCHITECT_BTN"
              disabled={askingAi}
              onClick={() => handleAskGeminiArchitect(aiPrompt)}
              title={`Send your prompt + live ${projectId} resource telemetry to ${
                selectedGeminiModel === 'CUSTOM' && customModelId.trim()
                  ? customModelId.trim()
                  : selectedGeminiModel
              } via Keyless Vertex AI OAuth2 or Sealed AI Studio Key (8,192 output token budget)`}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
            >
              {askingAi
                ? `Synthesizing (${selectedGeminiModel === 'CUSTOM' && customModelId.trim() ? customModelId.trim() : selectedGeminiModel})...`
                : vaultStatus.configured || apiKeyInput.trim().length >= 12
                ? `Ask Live ${selectedGeminiModel === 'CUSTOM' && customModelId.trim() ? customModelId.trim() : selectedGeminiModel} (AI Studio Vault)`
                : `Ask Live ${selectedGeminiModel === 'CUSTOM' && customModelId.trim() ? customModelId.trim() : selectedGeminiModel} (Keyless Vertex AI)`}
            </button>
          </div>

          {aiResponse && (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              {!aiResponse.isLiveLlm && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/40 space-y-1.5 text-xs font-mono text-rose-600 dark:text-rose-300">
                  <div className="font-extrabold">
                    Live Gemini Inference Did Not Complete (Zero Synthetic Fallback Policy)
                  </div>
                  {(aiResponse.diagnostics || []).map((d, idx) => (
                    <div key={idx} className="text-zinc-700 dark:text-zinc-300">
                      • {d}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-emerald-400 pb-1 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    Engine: {aiResponse.source} · Cipher:{' '}
                    {aiResponse.cipherUsed}
                  </span>
                  {aiResponse.finishReason && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full border ${
                        aiResponse.finishReason === 'STOP'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      }`}
                    >
                      Status: {aiResponse.finishReason} (8,192 Token Budget)
                    </span>
                  )}
                  {aiResponse.tokenUsage &&
                    aiResponse.tokenUsage.totalTokens > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                        Out: {aiResponse.tokenUsage.outputTokens} tok
                        {aiResponse.tokenUsage.thoughtTokens > 0
                          ? ` · Thinking: ${aiResponse.tokenUsage.thoughtTokens} tok`
                          : ''}
                      </span>
                    )}
                </div>
                <button
                  type="button"
                  data-feature-id="MOONSHOT_X6_COPY_RESPONSE_BTN"
                  onClick={() => handleCopy(aiResponse.answer, 'ai-ans')}
                  title="Copy the entire Markdown SRE architecture response to your clipboard"
                  className="px-2.5 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 cursor-pointer font-bold"
                >
                  {copiedKey === 'ai-ans'
                    ? '✓ Copied Full Answer!'
                    : 'Copy Full Response'}
                </button>
              </div>

              <div className="max-h-[580px] overflow-y-auto pr-1 space-y-2.5">
                {String(aiResponse.answer || '')
                  .split(/(```[\s\S]*?```)/g)
                  .filter(Boolean)
                  .map((segment, idx) => {
                    if (segment.startsWith('```') && segment.endsWith('```')) {
                      const lines = segment.slice(3, -3).trim().split('\n');
                      const firstLine = lines[0]?.trim() || '';
                      const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
                      const lang = hasLang ? firstLine : 'bash';
                      const codeBody = hasLang
                        ? lines.slice(1).join('\n')
                        : lines.join('\n');
                      const blockKey = `code-${idx}`;
                      return (
                        <div
                          key={blockKey}
                          className="rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 overflow-hidden"
                        >
                          <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800/90 border-b border-zinc-300 dark:border-zinc-700/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                            <span className="uppercase font-bold text-blue-400">
                              {lang}
                            </span>
                            <button
                              type="button"
                              data-feature-id="MOONSHOT_X6_COPY_SNIPPET_BTN"
                              onClick={() => handleCopy(codeBody, blockKey)}
                              title={`Copy this ${lang} command/code snippet to your clipboard`}
                              className="text-emerald-400 hover:underline cursor-pointer font-bold"
                            >
                              {copiedKey === blockKey
                                ? '✓ Copied Snippet'
                                : 'Copy Snippet'}
                            </button>
                          </div>
                          <pre className="p-3 text-xs font-mono text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                            {codeBody}
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <pre
                        key={`txt-${idx}`}
                        className="text-xs font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed"
                      >
                        {segment.trim()}
                      </pre>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
