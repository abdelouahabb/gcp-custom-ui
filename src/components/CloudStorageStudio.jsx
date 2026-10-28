import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  HardDrive,
  FolderOpen,
  FileText,
  Upload,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  Trash2,
  Sparkles,
  Globe,
  Leaf,
  DollarSign,
  Layers,
  Eye,
  Save,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Terminal,
  AlertTriangle,
} from 'lucide-react';
import {
  GCP_GLOBAL_REGIONS,
  getRegionProfile,
  evaluateMigrationFeasibility,
  findBestMigrationTargets,
  useLivePricingCatalog,
  LivePricingCatalogControlBar,
} from './GlobalNetworkWorldMap';
import EngineerMoonshotsWave3 from './EngineerMoonshotsWave3';
import GcsObjectWorkbench from './GcsObjectWorkbench';

function formatBytes(bytes = 0) {
  const b = Number(bytes || 0);
  if (b === 0) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const STORAGE_CLASS_RATES_PER_GB = {
  STANDARD: {
    rate: 0.02,
    retrievalPerGb: 0.0,
    minDays: 0,
    badge: 'Hot (0d min · $0.020/GB)',
  },
  NEARLINE: {
    rate: 0.01,
    retrievalPerGb: 0.01,
    minDays: 30,
    badge: 'Warm (30d min · $0.010/GB)',
  },
  COLDLINE: {
    rate: 0.004,
    retrievalPerGb: 0.02,
    minDays: 90,
    badge: 'Cold (90d min · $0.004/GB)',
  },
  ARCHIVE: {
    rate: 0.0012,
    retrievalPerGb: 0.05,
    minDays: 365,
    badge: 'Deep Archive (365d min · $0.0012/GB)',
  },
};

export default function CloudStorageStudio({
  projectId,
  initialSubTab = 'BUCKETS',
  initialBucketName = '',
  initialObjectName = '',
  onOpenProvision,
  onSelectTab,
  onOpenBigQuerySql,
  onRunInShell,
  onRefreshGlobal,
  onShowToast,
  onShowError,
}) {
  const { version: pricingVersion, unitPricing } = useLivePricingCatalog();

  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'BUCKETS');
  const [buckets, setBuckets] = useState([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const [selectedBucketName, setSelectedBucketName] = useState(initialBucketName || '');
  const [busyKey, setBusyKey] = useState(null);

  // Object Browser & Editor State
  const [objects, setObjects] = useState([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [objectPrefixFilter, setObjectPrefixFilter] = useState('');
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [inspectedObject, setInspectedObject] = useState(null);
  const [editedTextContent, setEditedTextContent] = useState('');
  const [loadingInspect, setLoadingInspect] = useState(false);

  // New Object Composer / File Uploader State
  const [newObjectPath, setNewObjectPath] = useState('config/runtime-manifest.json');
  const [newObjectContentType, setNewObjectContentType] = useState('application/json');
  const [newObjectStorageClass, setNewObjectStorageClass] = useState('STANDARD');
  const [newObjectBody, setNewObjectBody] = useState(
    JSON.stringify(
      {
        service: 'cloudpulse-2026',
        environment: 'production',
        zeroTrustEnforced: true,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  const [uploadingFile, setUploadingFile] = useState(false);

  // FinOps Lifecycle Time-Crystal Simulator State
  const [simDatasetGb, setSimDatasetGb] = useState(2500); // 2.5 TB default
  const [simHotPercent, setSimHotPercent] = useState(15);
  const [simWarmPercent, setSimWarmPercent] = useState(25);
  const [simColdPercent, setSimColdPercent] = useState(30);
  const [simMonthlyReadsGb, setSimMonthlyReadsGb] = useState(120);

  // Cross-Region Bucket Teleporter State
  const [teleportTargetRegion, setTeleportTargetRegion] = useState('europe-north1');
  const [teleportStorageClass, setTeleportStorageClass] = useState('STANDARD');
  const [teleportNewBucketName, setTeleportNewBucketName] = useState('');
  const [teleportCopyObjects, setTeleportCopyObjects] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState(null);

  // S3 / MinIO / Ceph RGW Multi-Cloud Importer & Federation State
  const [s3ProviderType, setS3ProviderType] = useState('MINIO'); // MINIO | CEPH_RGW | AWS_S3 | S3_COMPATIBLE
  const [s3Endpoint, setS3Endpoint] = useState('http://minio.corp.internal:9000');
  const [s3Region, setS3Region] = useState('us-east-1');
  const [s3RemoteBucket, setS3RemoteBucket] = useState('minio-edge-ai-lakehouse');
  const [s3Prefix, setS3Prefix] = useState('');
  const [s3TargetPrefix, setS3TargetPrefix] = useState('imported-s3/');
  const [s3AccessKeyId, setS3AccessKeyId] = useState('');
  const [s3SecretAccessKey, setS3SecretAccessKey] = useState('');
  const [s3PathStyle, setS3PathStyle] = useState(true);
  const [s3UseSandboxDemo, setS3UseSandboxDemo] = useState(false);
  const [s3RemoteBuckets, setS3RemoteBuckets] = useState([]);
  const [s3RemoteObjects, setS3RemoteObjects] = useState([]);
  const [s3SelectedKeys, setS3SelectedKeys] = useState([]);
  const [s3LoadingList, setS3LoadingList] = useState(false);
  const [s3Importing, setS3Importing] = useState(false);
  const [s3ImportedResults, setS3ImportedResults] = useState([]);
  const [s3TransferSpec, setS3TransferSpec] = useState(null);

  const fetchBuckets = useCallback(
    async ({ silent = false } = {}) => {
      if (!projectId) return;
      if (!silent) setLoadingBuckets(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/storage/buckets`
        );
        const list = res.data?.buckets || [];
        setBuckets(list);
        if (
          list.length > 0 &&
          !list.some((b) => b.name === selectedBucketName)
        ) {
          setSelectedBucketName(list[0].name);
        }
      } catch (err) {
        if (onShowError) {
          onShowError(
            err.response?.data?.error || 'Failed to load Cloud Storage buckets.'
          );
        }
      } finally {
        if (!silent) setLoadingBuckets(false);
      }
    },
    [projectId, selectedBucketName, onShowError]
  );

  useEffect(() => {
    fetchBuckets();
  }, [projectId]);

  const selectedBucket = useMemo(
    () => buckets.find((b) => b.name === selectedBucketName) || buckets[0] || null,
    [buckets, selectedBucketName]
  );

  const fetchObjects = useCallback(
    async (bucketName = selectedBucket?.name, { silent = false } = {}) => {
      if (!projectId || !bucketName) {
        setObjects([]);
        return;
      }
      if (!silent) setLoadingObjects(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/storage/buckets/${encodeURIComponent(
            bucketName
          )}/objects?versions=${showAllVersions}&prefix=${encodeURIComponent(
            objectPrefixFilter
          )}`
        );
        setObjects(res.data?.objects || []);
      } catch (err) {
        if (onShowError) {
          onShowError(
            err.response?.data?.error ||
              `Failed to list objects in gs://${bucketName}`
          );
        }
      } finally {
        if (!silent) setLoadingObjects(false);
      }
    },
    [projectId, selectedBucket?.name, showAllVersions, objectPrefixFilter, onShowError]
  );

  useEffect(() => {
    if (selectedBucket?.name) {
      fetchObjects(selectedBucket.name);
    }
  }, [selectedBucket?.name, showAllVersions, fetchObjects]);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
      if (
        initialSubTab === 'S3_COMPATIBLE_IMPORT' &&
        s3RemoteObjects.length === 0
      ) {
        handleListS3Compatible(true, s3ProviderType);
      }
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (initialBucketName) {
      setSelectedBucketName(initialBucketName);
    }
  }, [initialBucketName]);

  useEffect(() => {
    if (initialObjectName && (initialBucketName || selectedBucket?.name)) {
      const targetBucket = initialBucketName || selectedBucket?.name;
      setActiveSubTab('OBJECTS');
      handleInspectObject(
        { name: initialObjectName },
        { bucketNameOverride: targetBucket }
      );
    }
  }, [initialObjectName, initialBucketName]);

  useEffect(() => {
    if (
      activeSubTab === 'OBJECTS' &&
      objects.length > 0 &&
      !inspectedObject &&
      !loadingInspect
    ) {
      handleInspectObject(objects[0]);
    }
  }, [activeSubTab, objects, inspectedObject, loadingInspect]);

  // Fleet KPI Totals
  const fleetStats = useMemo(() => {
    const totalBuckets = buckets.length;
    const totalSampleObjects = buckets.reduce(
      (s, b) => s + Number(b.objectCountSample || 0),
      0
    );
    const totalSampleBytes = buckets.reduce(
      (s, b) => s + Number(b.totalBytesSample || 0),
      0
    );
    const avgPosture =
      totalBuckets > 0
        ? Math.round(
            buckets.reduce((s, b) => s + Number(b.postureScore || 80), 0) /
              totalBuckets
          )
        : 100;
    const unhardenedCount = buckets.filter(
      (b) => b.publicAccessPrevention !== 'enforced' || !b.uniformBucketLevelAccess
    ).length;
    const noLifecycleCount = buckets.filter(
      (b) => (b.lifecycleRules?.length || 0) === 0 && !b.autoclassEnabled
    ).length;

    return {
      totalBuckets,
      totalSampleObjects,
      totalSampleBytes,
      avgPosture,
      unhardenedCount,
      noLifecycleCount,
    };
  }, [buckets]);

  // 1-Tap Zero-Trust Hardening Shield on a Bucket
  const handleHardenBucket = async (bucket) => {
    setBusyKey(`harden-${bucket.name}`);
    try {
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(bucket.name)}`,
        {
          publicAccessPrevention: 'enforced',
          uniformBucketLevelAccess: true,
          versioningEnabled: true,
          softDeleteDays: 7,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Hardened gs://${bucket.name} (Enforced PAP + Uniform IAM + Versioning + 7d Soft-Delete)!`
        );
      }
      await fetchBuckets({ silent: true });
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || `Failed to harden gs://${bucket.name}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // 1-Tap Smart FinOps Lifecycle Policy Deployment
  const handleApplySmartLifecycle = async (bucket) => {
    setBusyKey(`lifecycle-${bucket.name}`);
    try {
      const smartRules = [
        {
          action: { type: 'SetStorageClass', storageClass: 'NEARLINE' },
          condition: { age: 30, matchesStorageClass: ['STANDARD'] },
        },
        {
          action: { type: 'SetStorageClass', storageClass: 'COLDLINE' },
          condition: { age: 90, matchesStorageClass: ['NEARLINE', 'STANDARD'] },
        },
        {
          action: { type: 'SetStorageClass', storageClass: 'ARCHIVE' },
          condition: { age: 365, matchesStorageClass: ['COLDLINE'] },
        },
        {
          action: { type: 'Delete' },
          condition: { isLive: false, daysSinceNoncurrentTime: 14 },
        },
      ];
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(bucket.name)}`,
        {
          lifecycleRules: smartRules,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Applied 4-Stage FinOps Lifecycle Tiering (30d Nearline → 90d Coldline → 365d Archive) to gs://${bucket.name}!`
        );
      }
      await fetchBuckets({ silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to apply lifecycle policy to gs://${bucket.name}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // 1-Tap Change Default Storage Class of Bucket
  const handleChangeBucketStorageClass = async (bucket, newClass) => {
    setBusyKey(`class-${bucket.name}`);
    try {
      await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(bucket.name)}`,
        {
          storageClass: newClass,
        }
      );
      if (onShowToast) {
        onShowToast(
          `Updated default storage class of gs://${bucket.name} to ${newClass}!`
        );
      }
      await fetchBuckets({ silent: true });
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to change storage class on gs://${bucket.name}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // 1-Tap Enable Browser CORS Policy on Bucket
  const handleEnableCors = async (bucket) => {
    setBusyKey(`cors-${bucket.name}`);
    try {
      await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(bucket.name)}`,
        {
          corsRules: [
            {
              origin: ['*'],
              method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
              responseHeader: [
                'Content-Type',
                'Authorization',
                'Content-Length',
                'x-goog-resumable',
              ],
              maxAgeSeconds: 3600,
            },
          ],
        }
      );
      if (onShowToast) {
        onShowToast(
          `Enabled Web CORS policy (GET/PUT/POST/DELETE) on gs://${bucket.name}!`
        );
      }
      await fetchBuckets({ silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || `Failed to set CORS on gs://${bucket.name}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // 1-Tap Empty All Objects & Force-Delete Bucket
  const handleEmptyAndDeleteBucket = async (bucket) => {
    setBusyKey(`delete-${bucket.name}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(bucket.name)}/empty-and-delete`
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Deleted bucket gs://${bucket.name} and all objects!`
        );
      }
      await fetchBuckets();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || `Failed to delete gs://${bucket.name}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Inspect an Object's Content & Metadata
  const handleInspectObject = async (
    obj,
    { silent = false, bucketNameOverride = null } = {}
  ) => {
    const targetBucketName = bucketNameOverride || selectedBucket?.name;
    if (!targetBucketName || !obj?.name) return;
    if (!silent) setLoadingInspect(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          targetBucketName
        )}/objects/content?name=${encodeURIComponent(obj.name)}`
      );
      setInspectedObject(res.data);
      setEditedTextContent(res.data?.textPreview || '');
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || `Failed to read object ${obj.name}`
        );
      }
    } finally {
      if (!silent) setLoadingInspect(false);
    }
  };

  // Save Edited Object Content as a New Generation in GCS
  const handleSaveEditedObject = async () => {
    if (!selectedBucket || !inspectedObject) return;
    setBusyKey(`save-obj-${inspectedObject.objectName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(selectedBucket.name)}/objects`,
        {
          objectName: inspectedObject.objectName,
          content: editedTextContent,
          contentType:
            inspectedObject.metadata?.contentType || 'text/plain; charset=utf-8',
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Saved new generation of gs://${selectedBucket.name}/${inspectedObject.objectName}!`
        );
      }
      // Update inspectedObject in place so the editor never unmounts or flashes
      setInspectedObject((prev) =>
        prev
          ? {
              ...prev,
              textPreview: editedTextContent,
              metadata: {
                ...(prev.metadata || {}),
                ...(res.data?.object || {}),
              },
            }
          : prev
      );
      fetchObjects(selectedBucket.name, { silent: true });
      fetchBuckets({ silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to save edited object.'
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Create / Upload New Object from Text Editor
  const handleCreateTextObject = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBucket || !newObjectPath.trim()) return;
    setUploadingFile(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(selectedBucket.name)}/objects`,
        {
          objectName: newObjectPath.trim(),
          content: newObjectBody,
          contentType: newObjectContentType,
          storageClass: newObjectStorageClass,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Created gs://${selectedBucket.name}/${newObjectPath.trim()}!`
        );
      }
      await fetchObjects(selectedBucket.name);
      await fetchBuckets();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to upload object to bucket.'
        );
      }
    } finally {
      setUploadingFile(false);
    }
  };

  // Upload Local File from Browser Disk via FileReader Base64
  const handleBrowserFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBucket) return;
    setUploadingFile(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const commaIdx = result.indexOf(',');
          resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(selectedBucket.name)}/objects`,
        {
          objectName: file.name,
          base64Content: base64,
          contentType: file.type || 'application/octet-stream',
          storageClass: newObjectStorageClass,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Uploaded file ${file.name} (${formatBytes(file.size)}) to gs://${selectedBucket.name}!`
        );
      }
      await fetchObjects(selectedBucket.name);
      await fetchBuckets();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || `Failed to upload file ${file.name}`
        );
      }
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  // Rewrite Object Storage Class in Place
  const handleRewriteObjectClass = async (obj, targetClass) => {
    if (!selectedBucket) return;
    setBusyKey(`obj-class-${obj.name}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/rewrite`,
        {
          objectName: obj.name,
          targetStorageClass: targetClass,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Rewrote ${obj.name} storage class to ${targetClass}!`
        );
      }
      setInspectedObject((prev) =>
        prev && prev.objectName === obj.name
          ? {
              ...prev,
              metadata: {
                ...(prev.metadata || {}),
                storageClass: targetClass,
              },
            }
          : prev
      );
      fetchObjects(selectedBucket.name, { silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to rewrite object storage class.'
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Delete a Single Object
  const handleDeleteObject = async (obj) => {
    if (!selectedBucket) return;
    setBusyKey(`obj-del-${obj.name}-${obj.generation}`);
    try {
      await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects?name=${encodeURIComponent(obj.name)}${
          showAllVersions && obj.generation
            ? `&generation=${encodeURIComponent(obj.generation)}`
            : ''
        }`
      );
      if (onShowToast) {
        onShowToast(`Deleted gs://${selectedBucket.name}/${obj.name}`);
      }
      if (inspectedObject?.objectName === obj.name) {
        setInspectedObject(null);
      }
      await fetchObjects(selectedBucket.name, { silent: true });
      fetchBuckets({ silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || `Failed to delete object ${obj.name}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // FinOps Lifecycle Time-Crystal Calculations
  const lifecycleSimulation = useMemo(() => {
    const archivePercent = Math.max(
      0,
      100 - simHotPercent - simWarmPercent - simColdPercent
    );
    const regionLoc = selectedBucket?.location || 'us-central1';
    const regionProf = getRegionProfile(
      GCP_GLOBAL_REGIONS.some((r) => r.id === regionLoc)
        ? regionLoc
        : 'us-central1'
    );
    const mult = regionProf.priceMultiplier || 1.0;
    const cudScale = Math.max(
      0.45,
      1 - (Number(unitPricing.cudDiscountPercent) || 0) / 100
    );
    const baseStandardRate =
      Number(unitPricing.storageStandardGbPerMonthUsd || 0.02) * mult * cudScale;

    // 1. 100% Standard Storage Monthly Cost
    const allStandardMonthlyUsd = simDatasetGb * baseStandardRate;

    // 2. Smart 4-Tier Lifecycle Monthly Cost (including retrieval fees)
    const hotGb = (simDatasetGb * simHotPercent) / 100;
    const warmGb = (simDatasetGb * simWarmPercent) / 100;
    const coldGb = (simDatasetGb * simColdPercent) / 100;
    const archiveGb = (simDatasetGb * archivePercent) / 100;

    const tieredStorageUsd =
      hotGb * baseStandardRate +
      warmGb * (baseStandardRate * 0.5) + // Nearline ~50% of Standard
      coldGb * (baseStandardRate * 0.2) + // Coldline ~20% of Standard
      archiveGb * (baseStandardRate * 0.06); // Archive ~6% of Standard

    const retrievalFeeUsd = simMonthlyReadsGb * 0.012; // blended retrieval cost
    const smartLifecycleMonthlyUsd = tieredStorageUsd + retrievalFeeUsd;
    const monthlySavingsUsd = Math.max(
      0,
      allStandardMonthlyUsd - smartLifecycleMonthlyUsd
    );
    const annualSavingsUsd = monthlySavingsUsd * 12;
    const savingsPercent =
      allStandardMonthlyUsd > 0
        ? Math.round((monthlySavingsUsd / allStandardMonthlyUsd) * 100)
        : 0;

    return {
      archivePercent,
      regionProf,
      baseStandardRate: Number(baseStandardRate.toFixed(4)),
      allStandardMonthlyUsd: Number(allStandardMonthlyUsd.toFixed(2)),
      smartLifecycleMonthlyUsd: Number(smartLifecycleMonthlyUsd.toFixed(2)),
      retrievalFeeUsd: Number(retrievalFeeUsd.toFixed(2)),
      monthlySavingsUsd: Number(monthlySavingsUsd.toFixed(2)),
      annualSavingsUsd: Number(annualSavingsUsd.toFixed(2)),
      savingsPercent,
    };
  }, [
    simDatasetGb,
    simHotPercent,
    simWarmPercent,
    simColdPercent,
    simMonthlyReadsGb,
    selectedBucket?.location,
    pricingVersion,
    unitPricing,
  ]);

  // Cross-Region Bucket Teleporter Feasibility
  const bucketTeleportAnalysis = useMemo(() => {
    const rawLoc = (selectedBucket?.location || 'us-east1').toLowerCase();
    const srcRegionId = GCP_GLOBAL_REGIONS.some((r) => r.id === rawLoc)
      ? rawLoc
      : rawLoc.startsWith('eu')
      ? 'europe-west1'
      : rawLoc.startsWith('asia')
      ? 'asia-east1'
      : 'us-east1';

    const stateSizeGb = Math.max(
      10,
      Number((selectedBucket?.totalBytesSample || 0) / (1024 * 1024 * 1024)) ||
        50
    );
    const baseMonthlyUsd = Math.max(
      8.5,
      stateSizeGb * Number(unitPricing.storageStandardGbPerMonthUsd || 0.02)
    );

    const spec = {
      baseMonthlyUsd,
      stateSizeGb,
      requiresCloudRunGpu: false,
      requiresVmGpu: false,
      serviceCount: 1,
    };

    const evaluation = evaluateMigrationFeasibility(
      srcRegionId,
      teleportTargetRegion,
      spec
    );
    const recommendations = findBestMigrationTargets(srcRegionId, spec);

    return {
      srcRegionId,
      stateSizeGb: Number(stateSizeGb.toFixed(2)),
      evaluation,
      recommendations,
    };
  }, [
    selectedBucket,
    teleportTargetRegion,
    pricingVersion,
    unitPricing,
  ]);

  const handleTeleportBucket = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBucket) return;
    setBusyKey(`teleport-${selectedBucket.name}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(selectedBucket.name)}/teleport`,
        {
          targetLocation: teleportTargetRegion,
          targetStorageClass: teleportStorageClass,
          newBucketName: teleportNewBucketName.trim(),
          copyObjects: teleportCopyObjects,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Teleported bucket gs://${selectedBucket.name} to ${teleportTargetRegion}!`
        );
      }
      await fetchBuckets();
      if (res.data?.newBucketName) {
        setSelectedBucketName(res.data.newBucketName);
      }
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to teleport Cloud Storage bucket.'
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  // Apply Provider Preset for S3 / MinIO / Ceph Importer
  const handleSelectS3ProviderPreset = (presetId) => {
    setS3ProviderType(presetId);
    setS3TransferSpec(null);
    if (presetId === 'MINIO') {
      setS3Endpoint('http://minio.corp.internal:9000');
      setS3Region('us-east-1');
      setS3RemoteBucket('minio-edge-ai-lakehouse');
      setS3TargetPrefix('imported-minio/');
      setS3PathStyle(true);
    } else if (presetId === 'CEPH_RGW') {
      setS3Endpoint('https://ceph-rgw.datacenter.local:7480');
      setS3Region('default');
      setS3RemoteBucket('ceph-rgw-financial-ledger');
      setS3TargetPrefix('imported-ceph/');
      setS3PathStyle(true);
    } else if (presetId === 'AWS_S3') {
      setS3Endpoint('https://s3.us-east-1.amazonaws.com');
      setS3Region('us-east-1');
      setS3RemoteBucket('aws-prod-datalake-us-east-1');
      setS3TargetPrefix('imported-aws-s3/');
      setS3PathStyle(false);
    } else {
      setS3Endpoint('https://account-id.r2.cloudflarestorage.com');
      setS3Region('auto');
      setS3RemoteBucket('r2-edge-artifacts');
      setS3TargetPrefix('imported-s3-compat/');
      setS3PathStyle(true);
    }
  };

  // List Remote Buckets / Objects via Native AWS4-HMAC-SHA256 Signer
  const handleListS3Compatible = async (forceSandbox = false, overrideProvider = null) => {
    const activeProvider = overrideProvider || s3ProviderType;
    setS3LoadingList(true);
    setS3UseSandboxDemo(Boolean(forceSandbox));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/storage/s3-compatible/list`,
        {
          providerType: activeProvider,
          endpoint: s3Endpoint,
          region: s3Region,
          remoteBucket: s3RemoteBucket,
          prefix: s3Prefix,
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
          pathStyle: s3PathStyle,
          useSandboxDemo: Boolean(forceSandbox),
        }
      );
      const list = res.data?.objects || [];
      setS3RemoteObjects(list);
      setS3RemoteBuckets(res.data?.remoteBuckets || []);
      if (res.data?.remoteBucket && !s3RemoteBucket) {
        setS3RemoteBucket(res.data.remoteBucket);
      }
      setS3SelectedKeys(list.map((o) => o.key));
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Connected to ${activeProvider} and listed ${list.length} object(s).`
        );
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            'Failed to list objects from S3/MinIO/Ceph endpoint.'
        );
      }
    } finally {
      setS3LoadingList(false);
    }
  };

  // Stream-Import Selected S3 / MinIO / Ceph Objects into Active GCS Bucket
  const handleImportS3Compatible = async () => {
    if (!selectedBucket) {
      if (onShowError) onShowError('Select or create a destination GCS bucket first.');
      return;
    }
    if (s3SelectedKeys.length === 0) {
      if (onShowError) onShowError('Select at least one remote object to import.');
      return;
    }
    setS3Importing(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/s3-compatible/import`,
        {
          providerType: s3ProviderType,
          endpoint: s3Endpoint,
          region: s3Region,
          remoteBucket: s3RemoteBucket,
          keys: s3SelectedKeys,
          targetPrefix: s3TargetPrefix,
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
          pathStyle: s3PathStyle,
          useSandboxDemo: s3UseSandboxDemo,
        }
      );
      setS3ImportedResults(res.data?.importedObjects || []);
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Imported ${res.data?.importedCount || 0} object(s) into gs://${selectedBucket.name}!`
        );
      }
      await fetchObjects(selectedBucket.name, { silent: true });
      await fetchBuckets({ silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            'Failed to import S3/MinIO/Ceph objects into GCS.'
        );
      }
    } finally {
      setS3Importing(false);
    }
  };

  // Generate GCP Storage Transfer Service Spec (awsS3DataSource / awsS3CompatibleDataSource)
  const handleGenerateS3TransferJob = async () => {
    if (!selectedBucket) return;
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/s3-compatible/transfer-job`,
        {
          providerType: s3ProviderType,
          endpoint: s3Endpoint,
          region: s3Region,
          remoteBucket: s3RemoteBucket,
          prefix: s3Prefix,
          targetPrefix: s3TargetPrefix,
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
          pathStyle: s3PathStyle,
        }
      );
      setS3TransferSpec(res.data);
      if (onShowToast) {
        onShowToast(res.data?.message || 'Generated Storage Transfer Service spec!');
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to generate transfer spec.'
        );
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Hero Banner + Sub-Navigation */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
                <HardDrive className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Google Cloud Storage Fleet &amp; Object Intelligence Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                CLOUD STORAGE &amp; OBJECT INTELLIGENCE STUDIO
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Project: <strong className="text-zinc-900 dark:text-zinc-100">{projectId}</strong>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Inspect, edit, sign, version, and upload live objects in-browser, enforce Zero-Trust PAP &amp; Uniform IAM, simulate 4-tier lifecycle savings, or teleport buckets across 40 regions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0 sm:w-[430px]">
            <button
              type="button"
              data-feature-id="GCS_CREATE_BUCKET_BTN"
              onClick={() => onOpenProvision && onOpenProvision('GCS_BUCKET')}
              className="w-full h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span>+ Create Bucket</span>
            </button>

            <button
              type="button"
              data-feature-id="GCS_IMPORT_S3_BTN"
              onClick={() => {
                setActiveSubTab('S3_COMPATIBLE_IMPORT');
                if (s3RemoteObjects.length === 0) {
                  handleListS3Compatible(true, s3ProviderType);
                }
              }}
              className="w-full h-9 px-3 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:border-blue-500/50 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>Import S3 / MinIO</span>
            </button>

            <button
              type="button"
              data-feature-id="GCS_REFRESH_FLEET_BTN"
              onClick={() => fetchBuckets()}
              disabled={loadingBuckets}
              className="w-full h-9 px-3 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 shrink-0 ${loadingBuckets ? 'animate-spin text-zinc-500 dark:text-zinc-400' : ''}`}
              />
              <span>Refresh Fleet</span>
            </button>
          </div>
        </div>

        {/* Fleet KPI Strip (5 Equal Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#16171a] border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-400">Live Buckets</div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {fleetStats.totalBuckets}
            </div>
            <div className="text-[10px] text-zinc-500">storage.googleapis.com</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#16171a] border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-400">
              Objects Sampled
            </div>
            <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {fleetStats.totalSampleObjects}
            </div>
            <div className="text-[10px] text-zinc-500">
              {formatBytes(fleetStats.totalSampleBytes)} indexed
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#16171a] border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-400">
              Zero-Trust Score
            </div>
            <div
              className={`text-base font-extrabold mt-0.5 ${
                fleetStats.avgPosture >= 85
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-500'
              }`}
            >
              {fleetStats.avgPosture}/100
            </div>
            <div className="text-[10px] text-zinc-500">
              {fleetStats.unhardenedCount} bucket(s) need PAP/UBLA
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#16171a] border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-400">
              Lifecycle Coverage
            </div>
            <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {fleetStats.totalBuckets - fleetStats.noLifecycleCount} /{' '}
              {fleetStats.totalBuckets}
            </div>
            <div className="text-[10px] text-zinc-500">
              Auto-tiering to Cold/Archive
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#16171a] border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-400">
              Standard Rate
            </div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ${unitPricing.storageStandardGbPerMonthUsd}/GB
            </div>
            <div className="text-[10px] text-zinc-500">
              Live Billing Catalog synced
            </div>
          </div>
        </div>

        {/* 6 Equal-Width Studio Sub-Tabs + Active Bucket Selector */}
        <div className="space-y-2.5 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400">
              Studio Workspace Mode (7 Equal-Width Modules):
            </span>
            {buckets.length > 0 && (
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-zinc-500 font-bold">Active Bucket:</span>
                <select
                  data-feature-id="GCS_ACTIVE_BUCKET_SELECT"
                  value={selectedBucket?.name || ''}
                  onChange={(e) => {
                    setSelectedBucketName(e.target.value);
                    setInspectedObject(null);
                  }}
                  className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 font-bold cursor-pointer"
                >
                  {buckets.map((b) => (
                    <option key={b.name} value={b.name}>
                      gs://{b.name} ({b.location.toUpperCase()} · {b.storageClass})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 font-mono text-xs">
            {[
              {
                id: 'BUCKETS',
                icon: HardDrive,
                label: `Bucket Governance (${buckets.length})`,
              },
              {
                id: 'OBJECTS',
                icon: FolderOpen,
                label: `Object Workbench (${objects.length})`,
              },
              {
                id: 'S3_COMPATIBLE_IMPORT',
                icon: Globe,
                label: 'S3 / MinIO / Ceph',
              },
              {
                id: 'FINOPS_LIFECYCLE',
                icon: DollarSign,
                label: 'Lifecycle FinOps',
              },
              {
                id: 'TELEPORT',
                icon: Sparkles,
                label: 'Region Teleporter (40)',
              },
              {
                id: 'DLP_XRAY',
                icon: ShieldAlert,
                label: 'DLP Secret & PII X-Ray',
              },
              {
                id: 'RANSOMWARE_AIRGAP',
                icon: Lock,
                label: 'Ransomware Auditor',
              },
            ].map((t) => {
              const Icon = t.icon || HardDrive;
              const active = activeSubTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  data-feature-id={`GCS_TAB_${t.id}`}
                  onClick={() => {
                    setActiveSubTab(t.id);
                    if (
                      t.id === 'S3_COMPATIBLE_IMPORT' &&
                      s3RemoteObjects.length === 0
                    ) {
                      handleListS3Compatible(true, s3ProviderType);
                    }
                  }}
                  title={t.label}
                  className={`w-full h-10 px-2.5 rounded-md font-bold border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-zinc-50 dark:bg-[#16171a] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`p-1 rounded-md shrink-0 ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate">{t.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live GCP Billing Catalog & Variable Rate Bar */}
      <LivePricingCatalogControlBar
        projectId={projectId}
        selectedRegionId={
          GCP_GLOBAL_REGIONS.some((r) => r.id === selectedBucket?.location)
            ? selectedBucket.location
            : 'us-central1'
        }
      />

      {/* ==================================================================== */}
      {/* SUB-TAB 1: LIVE BUCKET FLEET & ZERO-TRUST GOVERNANCE                 */}
      {/* ==================================================================== */}
      {activeSubTab === 'BUCKETS' && (
        <div className="space-y-4">
          {buckets.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center space-y-3 font-mono">
              <HardDrive className="w-8 h-8 text-zinc-500 dark:text-zinc-400 mx-auto" />
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                No Cloud Storage Buckets Provisioned in {projectId} Yet
              </div>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Provision a real regional or multi-region bucket with enforced
                Public Access Prevention and Uniform Bucket-Level Access in 1
                click.
              </p>
              <button
                type="button"
                onClick={() => onOpenProvision && onOpenProvision('GCS_BUCKET')}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer"
              >
                + Provision First Cloud Storage Bucket
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {buckets.map((b) => {
                const isSelected = selectedBucket?.name === b.name;
                const isHardened =
                  b.publicAccessPrevention === 'enforced' &&
                  b.uniformBucketLevelAccess &&
                  b.versioningEnabled;
                return (
                  <div
                    key={b.name}
                    onClick={() => setSelectedBucketName(b.name)}
                    className={`p-4 rounded-2xl border transition-all space-y-3 font-mono cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/[0.05] border-blue-500 shadow-md'
                        : 'bg-white dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                            gs://{b.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 font-bold uppercase">
                            {b.location} ({b.locationType})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 font-bold">
                            {b.storageClass}
                          </span>
                          {(b.name?.includes('-vmdisk-') ||
                            b.labels?.migrated_from_vm) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectTab) onSelectTab('CLOUD_RUN');
                              }}
                              title="Persistent Cloud Storage FUSE Disk Bucket attached via volumes[].gcs to Cloud Run Gen2. Click to inspect attached Cloud Run services."
                              className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/35 font-bold cursor-pointer"
                            >
                              CLOUD RUN GEN2 PERSISTENT FUSE DISK (volumes[].gcs) →
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          {b.objectCountSample} object(s) sampled ({formatBytes(b.totalBytesSample)}) · Created{' '}
                          {b.timeCreated
                            ? new Date(b.timeCreated).toLocaleDateString()
                            : 'Live'}
                        </div>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${
                          b.postureScore >= 85
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {b.postureScore}/100
                      </div>
                    </div>

                    {/* Governance Badges */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded-full border font-bold ${
                          b.publicAccessPrevention === 'enforced'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        {b.publicAccessPrevention === 'enforced'
                          ? 'PAP Enforced'
                          : 'PAP Inherited'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full border font-bold ${
                          b.uniformBucketLevelAccess
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        {b.uniformBucketLevelAccess
                          ? 'Uniform IAM'
                          : 'Legacy ACLs'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full border font-bold ${
                          b.versioningEnabled
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-300'
                            : 'bg-zinc-200/60 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500'
                        }`}
                      >
                        {b.versioningEnabled
                          ? 'Versioning ON'
                          : 'Versioning OFF'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full border font-bold ${
                          b.softDeleteDays > 0
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                            : 'bg-zinc-200/60 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500'
                        }`}
                      >
                        {b.softDeleteDays > 0
                          ? ` ${b.softDeleteDays}d Soft-Delete`
                          : 'No Soft-Delete'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full border font-bold ${
                          b.lifecycleRules?.length > 0 || b.autoclassEnabled
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        {b.autoclassEnabled
                          ? 'Autoclass ON'
                          : b.lifecycleRules?.length > 0
                          ? `${b.lifecycleRules.length} Lifecycle Rule(s)`
                          : 'No Lifecycle Rules'}
                      </span>
                    </div>

                    {/* Storage Class Quick Switcher (Equal-Width Grid) */}
                    <div
                      className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 pt-1.5 border-t border-zinc-200/70 dark:border-zinc-800/80 text-[10px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="sm:col-span-8 grid grid-cols-4 gap-1.5">
                        {['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE'].map(
                          (sc) => (
                            <button
                              key={sc}
                              type="button"
                              disabled={busyKey === `class-${b.name}`}
                              onClick={() =>
                                handleChangeBucketStorageClass(b, sc)
                              }
                              className={`w-full h-7 px-2 rounded-md border font-bold cursor-pointer inline-flex items-center justify-center truncate ${
                                b.storageClass === sc
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800 hover:border-blue-500/40'
                              }`}
                            >
                              {sc}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBucketName(b.name);
                          setActiveSubTab('OBJECTS');
                        }}
                        className="sm:col-span-4 w-full h-7 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer inline-flex items-center justify-center truncate"
                      >
                        Browse & Upload Objects →
                      </button>
                    </div>

                    {/* 1-Tap Equal-Width Action Bar */}
                    <div
                      className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={isHardened || busyKey === `harden-${b.name}`}
                        onClick={() => handleHardenBucket(b)}
                        className="w-full h-8 px-2 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:border-blue-500/60 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 disabled:opacity-50 truncate"
                      >
                        <Lock className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {busyKey === `harden-${b.name}`
                            ? 'Hardening...'
                            : isHardened
                            ? 'PAP + UBLA Active'
                            : '1-Tap Harden'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={busyKey === `lifecycle-${b.name}`}
                        onClick={() => handleApplySmartLifecycle(b)}
                        className="w-full h-8 px-2 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:border-blue-500/60 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 disabled:opacity-50 truncate"
                      >
                        <Leaf className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {busyKey === `lifecycle-${b.name}`
                            ? 'Applying...'
                            : '4-Tier Lifecycle'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={busyKey === `cors-${b.name}`}
                        onClick={() => handleEnableCors(b)}
                        className="w-full h-8 px-2 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:border-blue-500/60 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 disabled:opacity-50 truncate"
                      >
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">Enable Web CORS</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyKey === `delete-${b.name}`}
                        onClick={() => handleEmptyAndDeleteBucket(b)}
                        className="w-full h-8 px-2 rounded-md bg-red-500/10 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 truncate"
                        title="Empties all object versions and deletes bucket without 409 BucketNotEmpty error"
                      >
                        <Trash2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {busyKey === `delete-${b.name}`
                            ? 'Purging...'
                            : 'Empty & Delete'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: OBJECT BROWSER, LIVE CODE/JSON EDITOR & FILE UPLOADER     */}
      {/* ==================================================================== */}
      {activeSubTab === 'OBJECTS' && (
        <GcsObjectWorkbench
          projectId={projectId}
          buckets={buckets}
          selectedBucket={selectedBucket}
          onSelectBucket={(bName) => setSelectedBucketName(bName)}
          objects={objects}
          loadingObjects={loadingObjects}
          objectPrefixFilter={objectPrefixFilter}
          setObjectPrefixFilter={setObjectPrefixFilter}
          showAllVersions={showAllVersions}
          setShowAllVersions={setShowAllVersions}
          inspectedObject={inspectedObject}
          setInspectedObject={setInspectedObject}
          editedTextContent={editedTextContent}
          setEditedTextContent={setEditedTextContent}
          loadingInspect={loadingInspect}
          handleInspectObject={handleInspectObject}
          handleSaveEditedObject={handleSaveEditedObject}
          handleDeleteObject={handleDeleteObject}
          handleRewriteObjectClass={handleRewriteObjectClass}
          fetchObjects={fetchObjects}
          fetchBuckets={fetchBuckets}
          busyKey={busyKey}
          setBusyKey={setBusyKey}
          onOpenBigQuerySql={onOpenBigQuerySql}
          onNavigateStudio={onSelectTab}
          onSwitchStorageSubTab={(modId) => {
            setActiveSubTab(modId);
            if (
              modId === 'S3_COMPATIBLE_IMPORT' &&
              s3RemoteObjects.length === 0
            ) {
              handleListS3Compatible(true, s3ProviderType);
            }
          }}
          onShowToast={onShowToast}
          onShowError={onShowError}
        />
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2B: S3 / MINIO / CEPH BUCKET IMPORTER & MULTI-CLOUD BRIDGE   */}
      {/* ==================================================================== */}
      {activeSubTab === 'S3_COMPATIBLE_IMPORT' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-5 font-mono text-xs">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">
                  AWS4-HMAC-SHA256
                </span>
                <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  S3 / MinIO / Ceph RADOS Gateway (RGW) Bucket Importer &amp; Multi-Cloud Bridge
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Connect any Amazon S3, on-prem MinIO Object Store, Ceph RGW, or S3-compatible endpoint using Path-Style or Virtual-Hosted addressing, browse remote objects, and stream-import them directly into{' '}
                <strong className="text-blue-600 dark:text-blue-400">
                  gs://{selectedBucket?.name || '(select bucket)'}
                </strong>
                .
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  s3UseSandboxDemo
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                }`}
              >
                {s3UseSandboxDemo
                  ? 'MODE: DEMO S3 / MINIO / CEPH MANIFEST'
                  : 'MODE: LIVE AWS4-HMAC-SHA256 CONNECTOR'}
              </span>
            </div>
          </div>

          {/* 4 Equal-Width Provider Presets */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase text-zinc-500">
              1. Select S3-Compatible Storage Engine Preset (4 Equal-Width Profiles):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                {
                  id: 'MINIO',
                  code: 'P01',
                  label: 'MinIO Object Store',
                  sub: 'Path-Style · Port 9000',
                },
                {
                  id: 'CEPH_RGW',
                  code: 'P02',
                  label: 'Ceph RADOS Gateway',
                  sub: 'Path-Style · RGW 7480',
                },
                {
                  id: 'AWS_S3',
                  code: 'P03',
                  label: 'Amazon S3 (AWS)',
                  sub: 's3.<region>.amazonaws.com',
                },
                {
                  id: 'S3_COMPATIBLE',
                  code: 'P04',
                  label: 'Cloudflare R2 / Custom S3',
                  sub: 'Custom S3 v4 Endpoint',
                },
              ].map((p) => {
                const active = s3ProviderType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      handleSelectS3ProviderPreset(p.id);
                      if (s3UseSandboxDemo) {
                        handleListS3Compatible(true, p.id);
                      }
                    }}
                    className={`w-full p-3 rounded-md border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#16171a] text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold truncate">{p.label}</span>
                    </div>
                    <div
                      className={`text-[10px] mt-1 truncate ${
                        active ? 'text-blue-100' : 'text-zinc-500'
                      }`}
                    >
                      {p.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connection & Credentials Grid */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#16171a] border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                  S3 / MinIO / Ceph Endpoint URL
                </label>
                <input
                  type="text"
                  value={s3Endpoint}
                  onChange={(e) => setS3Endpoint(e.target.value)}
                  placeholder="http://minio.local:9000 or https://s3.us-east-1.amazonaws.com"
                  className="w-full h-9 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                  Signing Region
                </label>
                <input
                  type="text"
                  value={s3Region}
                  onChange={(e) => setS3Region(e.target.value)}
                  placeholder="us-east-1"
                  className="w-full h-9 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                  Source Bucket Name (Leave blank to list all buckets)
                </label>
                <input
                  type="text"
                  value={s3RemoteBucket}
                  onChange={(e) => setS3RemoteBucket(e.target.value)}
                  placeholder="my-minio-or-s3-bucket"
                  className="w-full h-9 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                  Addressing Style (MinIO/Ceph = Path-Style)
                </label>
                <div className="grid grid-cols-2 gap-1.5 h-9">
                  <button
                    type="button"
                    onClick={() => setS3PathStyle(true)}
                    className={`w-full h-full rounded-md font-bold border text-[10px] cursor-pointer ${
                      s3PathStyle
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800'
                    }`}
                  >
                    Path-Style (MinIO/Ceph)
                  </button>
                  <button
                    type="button"
                    onClick={() => setS3PathStyle(false)}
                    className={`w-full h-full rounded-md font-bold border text-[10px] cursor-pointer ${
                      !s3PathStyle
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800'
                    }`}
                  >
                    Virtual-Hosted (AWS)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                  Access Key ID (Optional for public buckets)
                </label>
                <input
                  type="text"
                  value={s3AccessKeyId}
                  onChange={(e) => setS3AccessKeyId(e.target.value)}
                  placeholder="AKIA... or minioadmin"
                  className="w-full h-9 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                  Secret Access Key (Signed via AWS4-HMAC-SHA256)
                </label>
                <input
                  type="password"
                  value={s3SecretAccessKey}
                  onChange={(e) => setS3SecretAccessKey(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full h-9 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                  Source Prefix Filter (Optional)
                </label>
                <input
                  type="text"
                  value={s3Prefix}
                  onChange={(e) => setS3Prefix(e.target.value)}
                  placeholder="e.g. logs/2026/"
                  className="w-full h-9 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                  Destination Prefix in gs://{selectedBucket?.name}
                </label>
                <input
                  type="text"
                  value={s3TargetPrefix}
                  onChange={(e) => setS3TargetPrefix(e.target.value)}
                  placeholder="imported-minio/"
                  className="w-full h-9 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold"
                />
              </div>
            </div>

            {/* 3 Equal-Width Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                disabled={s3LoadingList}
                onClick={() => handleListS3Compatible(false)}
                className="w-full h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 shrink-0 ${
                    s3LoadingList && !s3UseSandboxDemo ? 'animate-spin' : ''
                  }`}
                />
                <span className="truncate">
                  Connect &amp; List Live Endpoint (AWS4-HMAC-SHA256)
                </span>
              </button>

              <button
                type="button"
                disabled={s3LoadingList}
                onClick={() => handleListS3Compatible(true)}
                className="w-full h-9 px-3 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Load Sample {s3ProviderType} Cluster (Test Import Now)
                </span>
              </button>

              <button
                type="button"
                onClick={handleGenerateS3TransferJob}
                className="w-full h-9 px-3 rounded-md bg-white dark:bg-zinc-950 hover:border-blue-500/60 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-800 font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="truncate">
                  Generate GCP Storage Transfer Spec &amp; CLI
                </span>
              </button>
            </div>
          </div>

          {/* Remote Buckets Quick Switcher (if multiple buckets returned) */}
          {s3RemoteBuckets.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase text-zinc-500">
                Discovered Remote Buckets:
              </span>
              {s3RemoteBuckets.map((rb) => (
                <button
                  key={rb.name}
                  type="button"
                  onClick={() => {
                    setS3RemoteBucket(rb.name);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border cursor-pointer ${
                    s3RemoteBucket === rb.name
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  s3://{rb.name}
                </button>
              ))}
            </div>
          )}

          {/* Remote Object List & 1-Tap Stream Import Bar */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#16171a] border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  Remote Objects in s3://{s3RemoteBucket || '(root)'} ({s3RemoteObjects.length})
                </span>
                {s3RemoteObjects.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setS3SelectedKeys(
                          s3SelectedKeys.length === s3RemoteObjects.length
                            ? []
                            : s3RemoteObjects.map((o) => o.key)
                        )
                      }
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-[10px] font-bold cursor-pointer"
                    >
                      {s3SelectedKeys.length === s3RemoteObjects.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                    <span className="text-[11px] text-zinc-500">
                      {s3SelectedKeys.length} selected for import
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                disabled={
                  !selectedBucket ||
                  s3SelectedKeys.length === 0 ||
                  s3Importing
                }
                onClick={handleImportS3Compatible}
                className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer inline-flex items-center gap-2 disabled:opacity-40 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {s3Importing
                    ? `Streaming ${s3SelectedKeys.length} Object(s) to GCS...`
                    : `1-Tap Import Selected (${s3SelectedKeys.length}) -> gs://${selectedBucket?.name}/${s3TargetPrefix}`}
                </span>
              </button>
            </div>

            {s3RemoteObjects.length > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                {s3RemoteObjects.map((obj) => {
                  const checked = s3SelectedKeys.includes(obj.key);
                  const destKey = `${String(s3TargetPrefix || '').replace(
                    /^\/+/,
                    ''
                  )}${obj.key}`;
                  return (
                    <div
                      key={obj.key}
                      onClick={() =>
                        setS3SelectedKeys((prev) =>
                          prev.includes(obj.key)
                            ? prev.filter((k) => k !== obj.key)
                            : [...prev, obj.key]
                        )
                      }
                      className={`p-3 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors ${
                        checked
                          ? 'bg-blue-600/[0.06] dark:bg-blue-500/[0.08]'
                          : 'bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            s3://{s3RemoteBucket}/{obj.key}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Target: <code className="text-blue-600 dark:text-blue-400">gs://{selectedBucket?.name}/{destKey}</code> · ETag: {obj.etag || 'n/a'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[10px]">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold">
                          {formatBytes(obj.size)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500">
                          {obj.storageClass || 'STANDARD'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Imported Objects Confirmation & Direct Jump to Object Workbench, DLP X-Ray & BigQuery */}
            {s3ImportedResults.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-300">
                    Successfully Imported {s3ImportedResults.length} Object(s) from {s3ProviderType} into gs://{selectedBucket?.name}!
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        const first = s3ImportedResults[0];
                        if (first?.gcsObjectName) {
                          await handleInspectObject({ name: first.gcsObjectName });
                        }
                        setActiveSubTab('OBJECTS');
                      }}
                      className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open in Object Workbench (M02) →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('DLP_XRAY')}
                      className="h-8 px-3 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Scan Imported Files with RAM DLP (M06) →</span>
                    </button>
                    {onOpenBigQuerySql && selectedBucket?.name && (
                      <button
                        type="button"
                        onClick={() => {
                          const firstKey =
                            s3ImportedResults[0]?.gcsObjectName ||
                            `${s3TargetPrefix}*`;
                          const ext = firstKey.split('.').pop()?.toLowerCase();
                          const bqFmt =
                            ext === 'parquet'
                              ? 'PARQUET'
                              : ext === 'csv'
                              ? 'CSV'
                              : 'NEWLINE_DELIMITED_JSON';
                          const sql = `-- Federated Query on Imported ${s3ProviderType} Objects in gs://${selectedBucket.name}\nCREATE OR REPLACE EXTERNAL TABLE \`${projectId}.analytics_lakehouse.imported_${s3ProviderType.toLowerCase()}_ext\`\nOPTIONS (\n  format = '${bqFmt}',\n  uris = ['gs://${selectedBucket.name}/${firstKey}']\n);\n\nSELECT * FROM \`${projectId}.analytics_lakehouse.imported_${s3ProviderType.toLowerCase()}_ext\` LIMIT 100;`;
                          onOpenBigQuerySql(sql);
                        }}
                        className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>Query Imported Data in BigQuery SQL →</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s3ImportedResults.map((it) => (
                    <button
                      key={it.gcsObjectName}
                      type="button"
                      onClick={async () => {
                        await handleInspectObject({ name: it.gcsObjectName });
                        setActiveSubTab('OBJECTS');
                      }}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-950 border border-emerald-500/40 text-[10px] font-bold text-zinc-800 dark:text-zinc-200 hover:border-blue-500 cursor-pointer"
                    >
                      gs://{selectedBucket?.name}/{it.gcsObjectName} ({formatBytes(it.bytes)}) →
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generated Google Cloud Storage Transfer Service Spec & CLI */}
          {s3TransferSpec && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#16171a] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  Google Cloud Storage Transfer Service (awsS3CompatibleDataSource) &amp; Rclone Sync CLI
                </span>
                <button
                  type="button"
                  onClick={() => setS3TransferSpec(null)}
                  className="text-[10px] text-zinc-500 font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      gcloud transfer jobs create (Managed Petabyte Transfer)
                    </div>
                    <code className="text-[11px] text-zinc-800 dark:text-zinc-200 truncate block">
                      {s3TransferSpec.gcloudCli}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(s3TransferSpec.gcloudCli, 's3-gcloud-cli')
                    }
                    className="h-7 px-2.5 rounded bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold cursor-pointer shrink-0 inline-flex items-center gap-1"
                  >
                    {copiedCmd === 's3-gcloud-cli' ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy CLI</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-zinc-500">
                      rclone sync (MinIO / Ceph / S3 Direct Pipe)
                    </div>
                    <code className="text-[11px] text-zinc-800 dark:text-zinc-200 truncate block">
                      {s3TransferSpec.rcloneCli}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(s3TransferSpec.rcloneCli, 's3-rclone-cli')
                    }
                    className="h-7 px-2.5 rounded bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold cursor-pointer shrink-0 inline-flex items-center gap-1"
                  >
                    {copiedCmd === 's3-rclone-cli' ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy Rclone</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 3: STORAGE TEMPERATURE & LIFECYCLE FINOPS TIME-CRYSTAL       */}
      {/* ==================================================================== */}
      {activeSubTab === 'FINOPS_LIFECYCLE' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-5 font-mono">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold uppercase text-blue-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>
                  FinOps Time-Crystal — Storage Class &amp; 4-Tier Lifecycle Cost Forecaster
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Model how much your bucket spends across Hot, Warm (Nearline
                30d), Cold (Coldline 90d), and Deep Archive (365d) tiers —
                accounting for live regional multipliers, CUD discounts, and
                retrieval fees.
              </p>
            </div>

            {selectedBucket && (
              <button
                type="button"
                onClick={() => handleApplySmartLifecycle(selectedBucket)}
                disabled={busyKey === `lifecycle-${selectedBucket.name}`}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer shadow-sm"
              >
                1-Tap Deploy Smart Lifecycle to gs://{selectedBucket.name}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/85 dark:bg-zinc-950/85 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold">
                  <span>Total Bucket Volume:</span>
                  <span className="text-blue-500">
                    {simDatasetGb} GB ({(simDatasetGb / 1024).toFixed(2)} TB)
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={50000}
                  step={50}
                  value={simDatasetGb}
                  onChange={(e) => setSimDatasetGb(Number(e.target.value))}
                  className="w-full accent-blue-500 mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold">
                  <span>Hot Data (0–30d Standard):</span>
                  <span className="text-red-400">{simHotPercent}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={simHotPercent}
                  onChange={(e) => setSimHotPercent(Number(e.target.value))}
                  className="w-full accent-red-500 mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold">
                  <span>Warm Data (30–90d Nearline):</span>
                  <span className="text-amber-400">{simWarmPercent}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={simWarmPercent}
                  onChange={(e) => setSimWarmPercent(Number(e.target.value))}
                  className="w-full accent-amber-500 mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold">
                  <span>Cold Data (90–365d Coldline):</span>
                  <span className="text-blue-400">{simColdPercent}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={simColdPercent}
                  onChange={(e) => setSimColdPercent(Number(e.target.value))}
                  className="w-full accent-blue-500 mt-1"
                />
              </div>

              <div className="flex justify-between text-[11px] text-blue-400 font-bold pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span>Deep Archive (&gt;365d):</span>
                <span>{lifecycleSimulation.archivePercent}%</span>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white/85 dark:bg-zinc-950/85 border border-red-500/30 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase text-zinc-400">
                    100% Standard Tier (No Lifecycle)
                  </div>
                  <div className="text-2xl font-extrabold text-red-500 mt-1">
                    ${lifecycleSimulation.allStandardMonthlyUsd}/mo
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 mt-3">
                  Rate: ${lifecycleSimulation.baseStandardRate}/GB-mo in{' '}
                  {lifecycleSimulation.regionProf.id} (
                  {lifecycleSimulation.regionProf.priceMultiplier.toFixed(2)}x)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/85 dark:bg-zinc-950/85 border border-emerald-500/40 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase text-emerald-500 font-bold">
                    4-Stage Smart Lifecycle Cost
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-500 mt-1">
                    ${lifecycleSimulation.smartLifecycleMonthlyUsd}/mo
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 mt-3">
                  Includes ${lifecycleSimulation.retrievalFeeUsd}/mo retrieval
                  allowance ({simMonthlyReadsGb} GB read/mo)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/50 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase text-emerald-600 dark:text-emerald-300 font-extrabold">
                    Verified Annual FinOps Savings
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300 mt-1">
                    +${lifecycleSimulation.annualSavingsUsd}/yr
                  </div>
                </div>
                <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-300 mt-3">
                  -{lifecycleSimulation.savingsPercent}% Storage Bill Reduction
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 4: 1-TAP CROSS-REGION BUCKET TELEPORTER & CFE% ARBITRAGE     */}
      {/* ==================================================================== */}
      {activeSubTab === 'TELEPORT' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4 font-mono">
          <div>
            <div className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>
                1-Tap Cross-Region Bucket Teleporter · Carbon CFE% & Egress
                Break-Even Calculator (All 40 Regions)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Clone <code>gs://{selectedBucket?.name}</code> and rewrite all its
              objects into a greener, lower-cost Tier-1 region with automatic
              Zero-Trust Public Access Prevention & Uniform IAM.
            </p>
          </div>

          {/* 3 Smart Destination Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {bucketTeleportAnalysis.recommendations.greenestCompatible && (
              <button
                type="button"
                onClick={() =>
                  setTeleportTargetRegion(
                    bucketTeleportAnalysis.recommendations.greenestCompatible.dst
                      .id
                  )
                }
                className="p-3 rounded-md bg-white/85 dark:bg-zinc-950/80 border border-emerald-500/40 text-left cursor-pointer hover:border-emerald-500"
              >
                <div className="text-[10px] font-extrabold text-emerald-500">
                  GREENEST REGION ({bucketTeleportAnalysis.recommendations.greenestCompatible.dst.cfePercent}% CFE)
                </div>
                <div className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {bucketTeleportAnalysis.recommendations.greenestCompatible.dst.id} (
                  {bucketTeleportAnalysis.recommendations.greenestCompatible.dst.city})
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {bucketTeleportAnalysis.recommendations.greenestCompatible.dst.priceMultiplier.toFixed(2)}x rate ·{' '}
                  {bucketTeleportAnalysis.recommendations.greenestCompatible.dst.gco2}g CO₂/kWh
                </div>
              </button>
            )}

            {bucketTeleportAnalysis.recommendations.cheapestGreenCompatible && (
              <button
                type="button"
                onClick={() =>
                  setTeleportTargetRegion(
                    bucketTeleportAnalysis.recommendations
                      .cheapestGreenCompatible.dst.id
                  )
                }
                className="p-3 rounded-md bg-white/85 dark:bg-zinc-950/80 border border-blue-500/40 text-left cursor-pointer hover:border-blue-500"
              >
                <div className="text-[10px] font-extrabold text-blue-500">
                  LOWEST COST + CLEAN TIER-1 (1.00x)
                </div>
                <div className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {bucketTeleportAnalysis.recommendations.cheapestGreenCompatible.dst.id} (
                  {bucketTeleportAnalysis.recommendations.cheapestGreenCompatible.dst.city})
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  ${bucketTeleportAnalysis.recommendations.cheapestGreenCompatible.targetMonthlyUsd}/mo ·{' '}
                  {bucketTeleportAnalysis.recommendations.cheapestGreenCompatible.dst.cfePercent}% CFE
                </div>
              </button>
            )}

            {bucketTeleportAnalysis.recommendations.sameContinentCompatible && (
              <button
                type="button"
                onClick={() =>
                  setTeleportTargetRegion(
                    bucketTeleportAnalysis.recommendations
                      .sameContinentCompatible.dst.id
                  )
                }
                className="p-3 rounded-md bg-white/85 dark:bg-zinc-950/80 border border-blue-500/40 text-left cursor-pointer hover:border-blue-500"
              >
                <div className="text-[10px] font-extrabold text-blue-400">
                  SAME-CONTINENT LOW-EGRESS ($0.02/GB)
                </div>
                <div className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {bucketTeleportAnalysis.recommendations.sameContinentCompatible.dst.id} (
                  {bucketTeleportAnalysis.recommendations.sameContinentCompatible.dst.city})
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  One-time replication: $
                  {bucketTeleportAnalysis.recommendations.sameContinentCompatible.oneTimeTransferUsd}
                </div>
              </button>
            )}
          </div>

          <form
            onSubmit={handleTeleportBucket}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pt-2"
          >
            <div>
              <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                Destination Region (All 40 Regions)
              </label>
              <select
                value={teleportTargetRegion}
                onChange={(e) => setTeleportTargetRegion(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold"
              >
                {GCP_GLOBAL_REGIONS.map((r) => {
                  const prof = getRegionProfile(r.id);
                  return (
                    <option key={r.id} value={r.id}>
                      {r.id} ({r.city}) · {r.cfePercent}% CFE ·{' '}
                      {prof.priceMultiplier.toFixed(2)}x
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                Target Storage Class
              </label>
              <select
                value={teleportStorageClass}
                onChange={(e) => setTeleportStorageClass(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="STANDARD">STANDARD</option>
                <option value="NEARLINE">NEARLINE (30d)</option>
                <option value="COLDLINE">COLDLINE (90d)</option>
                <option value="ARCHIVE">ARCHIVE (365d)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                New Cloned Bucket Name (Optional)
              </label>
              <input
                type="text"
                value={teleportNewBucketName}
                onChange={(e) => setTeleportNewBucketName(e.target.value)}
                placeholder={`${selectedBucket?.name || 'bucket'}-${teleportTargetRegion}`}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={
                !selectedBucket || busyKey === `teleport-${selectedBucket?.name}`
              }
              className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer shadow-sm disabled:opacity-50"
            >
              {busyKey === `teleport-${selectedBucket?.name}`
                ? 'Teleporting Bucket & Objects...'
                : `1-Tap Teleport to ${teleportTargetRegion}`}
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'DLP_XRAY' && (
        <EngineerMoonshotsWave3
          activeTab="X1"
          projectId={projectId}
          overview={{ buckets }}
          initialBucketName={selectedBucket?.name}
          onOpenObjectInWorkbench={(bucketName, objName) => {
            if (bucketName) setSelectedBucketName(bucketName);
            setActiveSubTab('OBJECTS');
            if (objName) {
              handleInspectObject(
                { name: objName },
                { bucketNameOverride: bucketName || selectedBucket?.name }
              );
            }
          }}
          onRefreshGlobal={() => {
            fetchBuckets();
            if (onRefreshGlobal) onRefreshGlobal();
          }}
          onShowToast={onShowToast}
          onShowError={onShowError}
        />
      )}

      {activeSubTab === 'RANSOMWARE_AIRGAP' && (
        <EngineerMoonshotsWave3
          activeTab="X4"
          projectId={projectId}
          overview={{ buckets }}
          initialBucketName={selectedBucket?.name}
          onOpenObjectInWorkbench={(bucketName, objName) => {
            if (bucketName) setSelectedBucketName(bucketName);
            setActiveSubTab('OBJECTS');
            if (objName) {
              handleInspectObject(
                { name: objName },
                { bucketNameOverride: bucketName || selectedBucket?.name }
              );
            }
          }}
          onRefreshGlobal={() => {
            fetchBuckets();
            if (onRefreshGlobal) onRefreshGlobal();
          }}
          onShowToast={onShowToast}
          onShowError={onShowError}
        />
      )}
    </div>
  );
}
