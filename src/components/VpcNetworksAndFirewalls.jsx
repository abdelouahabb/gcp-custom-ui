import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Network,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  PlusCircle,
  Trash2,
  RefreshCw,
  Globe,
  Lock,
  Unlock,
  Layers,
  Edit3,
  Power,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  Play,
  X,
  Plus,
  FileText,
  Terminal,
} from 'lucide-react';

// Helper: Check if an IPv4 address matches a CIDR range (e.g., "35.235.240.10" in "35.235.240.0/20")
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

// Helper: Check if a port matches a GCP port specification like "80", "443", "8000-9000"
function portMatchesSpec(portNum, portSpecs = []) {
  if (!portSpecs || portSpecs.length === 0) return true; // all ports for this protocol
  return portSpecs.some((spec) => {
    const clean = String(spec).trim();
    if (clean.includes('-')) {
      const [start, end] = clean.split('-').map(Number);
      return portNum >= start && portNum <= end;
    }
    return Number(clean) === portNum;
  });
}

// Helper: Evaluate risk level of a firewall rule
function analyzeFirewallRuleRisk(fw) {
  const isDeny =
    fw.action === 'DENY' || (Array.isArray(fw.denied) && fw.denied.length > 0);
  if (isDeny || fw.disabled || fw.direction === 'EGRESS') {
    return { level: 'SAFE', label: isDeny ? 'Protective Block' : 'Scoped' };
  }
  const sources = fw.sourceRanges || [];
  const isPublic = sources.includes('0.0.0.0/0') || sources.includes('::/0');
  if (!isPublic) {
    const isIap = sources.includes('35.235.240.0/20');
    return {
      level: 'SAFE',
      label: isIap ? 'IAP Zero-Trust' : 'Restricted CIDR',
    };
  }

  const allowedSpecs = fw.allowed || [];
  const sensitivePorts = [
    { port: 22, name: 'SSH (22)' },
    { port: 3389, name: 'RDP (3389)' },
    { port: 3306, name: 'MySQL (3306)' },
    { port: 5432, name: 'Postgres (5432)' },
    { port: 6379, name: 'Redis (6379)' },
    { port: 27017, name: 'MongoDB (27017)' },
  ];

  const exposedSensitive = [];
  let allowsAll = false;
  allowedSpecs.forEach((spec) => {
    const proto = String(spec.IPProtocol || '').toLowerCase();
    if (proto === 'all') {
      allowsAll = true;
    } else if (proto === 'tcp' || proto === 'udp') {
      if (!spec.ports || spec.ports.length === 0) {
        allowsAll = true;
      } else {
        sensitivePorts.forEach((sp) => {
          if (portMatchesSpec(sp.port, spec.ports)) {
            exposedSensitive.push(sp.name);
          }
        });
      }
    }
  });

  if (allowsAll) {
    return {
      level: 'CRITICAL',
      label: 'All Ports Open to 0.0.0.0/0',
      detail: 'Exposes all ports to the public internet.',
    };
  }
  if (exposedSensitive.length > 0) {
    return {
      level: 'HIGH',
      label: `Public ${exposedSensitive.join(', ')}`,
      detail: `${exposedSensitive.join(', ')} open to 0.0.0.0/0. Recommend locking down to IAP (35.235.240.0/20).`,
    };
  }
  return {
    level: 'MODERATE',
    label: 'Public Ingress (0.0.0.0/0)',
    detail: 'Public internet ingress enabled on specified ports.',
  };
}

const ZERO_TRUST_TEMPLATES = [
  {
    id: 'iap-zero-trust-ssh',
    featureId: 'VPC_TPL_IAP_ZERO_TRUST',
    title: 'Allow IAP Zero-Trust SSH & RDP',
    subtitle: 'ALLOW INGRESS · tcp:22,3389 · Source 35.235.240.0/20 · Priority 90',
    badge: 'RECOMMENDED',
    config: {
      name: 'allow-iap-zero-trust-tunnel',
      action: 'ALLOW',
      direction: 'INGRESS',
      priority: 90,
      network: 'default',
      rules: [{ IPProtocol: 'tcp', ports: '22,3389' }],
      sourceRanges: '35.235.240.0/20',
      targetTags: '',
      enableLogging: true,
      description:
        'Zero-Trust Identity-Aware Proxy (IAP) TCP forwarding tunnel for SSH and RDP without public IPs.',
    },
  },
  {
    id: 'block-public-ssh-rdp',
    featureId: 'VPC_TPL_BLOCK_SSH_RDP',
    title: 'Block Public SSH & RDP Brute-Force',
    subtitle: 'DENY INGRESS · tcp:22,3389 · Source 0.0.0.0/0 · Priority 100',
    badge: 'HARDENING',
    config: {
      name: 'deny-public-ssh-rdp-bruteforce',
      action: 'DENY',
      direction: 'INGRESS',
      priority: 100,
      network: 'default',
      rules: [{ IPProtocol: 'tcp', ports: '22,3389' }],
      sourceRanges: '0.0.0.0/0',
      targetTags: '',
      enableLogging: true,
      description:
        'Blocks direct public internet SSH (22) and RDP (3389) brute-force traffic while higher-priority rule 90 allows IAP.',
    },
  },
  {
    id: 'allow-gclb-health-checks',
    featureId: 'VPC_TPL_ALLOW_GCLB',
    title: 'Allow Google Load Balancer Health Checks',
    subtitle: 'ALLOW INGRESS · tcp:80,443,8080 · Google Probers · Priority 500',
    badge: 'INFRA',
    config: {
      name: 'allow-gclb-health-check-probers',
      action: 'ALLOW',
      direction: 'INGRESS',
      priority: 500,
      network: 'default',
      rules: [{ IPProtocol: 'tcp', ports: '80,443,8080' }],
      sourceRanges: '130.211.0.0/22, 35.191.0.0/16',
      targetTags: 'web-server,lb-backend',
      enableLogging: false,
      description:
        'Allows Google Front End (GFE) and Cloud Load Balancing health check ranges.',
    },
  },
  {
    id: 'deny-malicious-egress',
    featureId: 'VPC_TPL_BLOCK_EGRESS',
    title: 'Block Risky Egress Ports (SMTP/SMB)',
    subtitle: 'DENY EGRESS · tcp:25,135-139,445 · Dest 0.0.0.0/0 · Priority 200',
    badge: 'EGRESS LOCK',
    config: {
      name: 'deny-egress-smtp-smb-exfil',
      action: 'DENY',
      direction: 'EGRESS',
      priority: 200,
      network: 'default',
      rules: [
        { IPProtocol: 'tcp', ports: '25,135-139,445' },
        { IPProtocol: 'udp', ports: '135-139,445' },
      ],
      destinationRanges: '0.0.0.0/0',
      targetTags: '',
      enableLogging: true,
      description:
        'Prevents outbound spam (port 25) and SMB lateral movement/exfiltration (ports 135-139, 445).',
    },
  },
];

export default function VpcNetworksAndFirewalls({
  projectId,
  vpcs: propVpcs = [],
  firewalls = [],
  initialRuleSeed,
  onOpenProvisionVpc,
  onTestOnGlobalMap,
  onOpenLogsExplorer,
  onDeleteResource,
  onRefresh,
  loading = false,
  onShowToast,
  onShowError,
  onSelectTab,
}) {
  // Local optimistic VPC & firewall lists so creates, edits, toggles, deletes, and direct API syncs reflect immediately
  const [localVpcs, setLocalVpcs] = useState(propVpcs);
  const [localFirewalls, setLocalFirewalls] = useState(firewalls);
  const [directFetching, setDirectFetching] = useState(false);
  const [focusedSeedRuleName, setFocusedSeedRuleName] = useState(null);
  const vpcs = localVpcs;

  useEffect(() => {
    if (Array.isArray(propVpcs) && propVpcs.length > 0) {
      setLocalVpcs(propVpcs);
    }
  }, [propVpcs]);

  useEffect(() => {
    if (Array.isArray(firewalls) && firewalls.length > 0) {
      setLocalFirewalls(firewalls);
    }
  }, [firewalls]);

  const fetchDirectVpcAndFirewalls = async () => {
    if (!projectId) return;
    setDirectFetching(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/vpc-firewalls`,
        { timeout: 10000 }
      );
      if (Array.isArray(res.data?.vpcs)) {
        setLocalVpcs(res.data.vpcs);
      }
      if (Array.isArray(res.data?.firewalls)) {
        setLocalFirewalls(res.data.firewalls);
      }
    } catch {
      // Fallback to parent overview props
    } finally {
      setDirectFetching(false);
    }
  };

  useEffect(() => {
    fetchDirectVpcAndFirewalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null);
  // Real-time GCP Global Operation trackers keyed by firewall/VPC name
  const [operationTrackers, setOperationTrackers] = useState({});

  // Filtering & Search state for Firewall Command Center
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ALLOW' | 'DENY' | 'INGRESS' | 'EGRESS' | 'EXPOSED' | 'DISABLED'
  const [selectedVpcFilter, setSelectedVpcFilter] = useState('ALL');
  const [activeSubPanel, setActiveSubPanel] = useState('NONE'); // 'NONE' | 'STUDIO' | 'SIMULATOR'

  // Firewall Studio (Create / In-Place Edit) state
  const [editingRuleName, setEditingRuleName] = useState(null); // null = Create Mode, string = Edit Mode
  const [ruleName, setRuleName] = useState('allow-https-web-ingress');
  const [ruleNetwork, setRuleNetwork] = useState('default');
  const [ruleAction, setRuleAction] = useState('ALLOW'); // 'ALLOW' | 'DENY'
  const [ruleDirection, setRuleDirection] = useState('INGRESS'); // 'INGRESS' | 'EGRESS'
  const [rulePriority, setRulePriority] = useState(1000);
  const [ruleDisabled, setRuleDisabled] = useState(false);
  const [ruleEnableLogging, setRuleEnableLogging] = useState(false);
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleSourceRanges, setRuleSourceRanges] = useState('0.0.0.0/0');
  const [ruleDestinationRanges, setRuleDestinationRanges] = useState('0.0.0.0/0');
  const [ruleTargetTags, setRuleTargetTags] = useState('');
  const [ruleSourceTags, setRuleSourceTags] = useState('');
  const [ruleTargetServiceAccounts, setRuleTargetServiceAccounts] = useState('');
  const [ruleProtocolRows, setRuleProtocolRows] = useState([
    { IPProtocol: 'tcp', ports: '80,443' },
  ]);
  const [submittingStudio, setSubmittingStudio] = useState(false);

  // Packet Flow & Firewall Rule Match Simulator state
  const [simDirection, setSimDirection] = useState('INGRESS');
  const [simProtocol, setSimProtocol] = useState('tcp');
  const [simPort, setSimPort] = useState(22);
  const [simIp, setSimIp] = useState('198.51.100.1');
  const [simTag, setSimTag] = useState('');
  const [simNetwork, setSimNetwork] = useState('default');

  useEffect(() => {
    if (!initialRuleSeed?.nonce) return;
    // Never set searchQuery to filter out the Live VPC Firewall Rules list!
    // Instead, keep all Live VPC Firewall Rules visible and highlight the seeded rule.
    setSearchQuery('');
    setFilterMode('ALL');
    setSelectedVpcFilter('ALL');
    if (initialRuleSeed.ruleName) {
      setFocusedSeedRuleName(initialRuleSeed.ruleName);
    }
    if (initialRuleSeed.protocol) {
      setSimProtocol(String(initialRuleSeed.protocol).toLowerCase());
    }
    if (initialRuleSeed.port !== undefined) {
      setSimPort(Number(initialRuleSeed.port));
    }
    if (
      initialRuleSeed.sourceIp &&
      /^\d+\.\d+\.\d+\.\d+$/.test(initialRuleSeed.sourceIp)
    ) {
      setSimIp(initialRuleSeed.sourceIp);
    }
    setActiveSubPanel('SIMULATOR');
    setTimeout(() => {
      const el = document.getElementById('live-vpc-firewall-rules-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, [
    initialRuleSeed?.nonce,
    initialRuleSeed?.ruleName,
    initialRuleSeed?.protocol,
    initialRuleSeed?.port,
    initialRuleSeed?.sourceIp,
  ]);

  const extractRuleTestSpec = (fw) => {
    const firstSpec = (fw.specs || [])[0] || { IPProtocol: 'tcp', ports: ['22'] };
    const proto = String(firstSpec.IPProtocol || 'tcp').toLowerCase();
    const protocol = proto === 'udp' || proto === 'icmp' ? proto : 'tcp';
    const firstPortRaw = String(firstSpec.ports?.[0] || '22').split('-')[0];
    const port = protocol === 'icmp' ? 0 : Number(firstPortRaw) || 22;
    const ranges = fw.sourceRanges || [];
    let originId = 'my-live-client';
    let testIp = '198.51.100.1';
    if (ranges.includes('35.235.240.0/20')) {
      originId = 'gcp-iap-proxy';
      testIp = '35.235.240.12';
    } else if (
      ranges.includes('130.211.0.0/22') ||
      ranges.includes('35.191.0.0/16')
    ) {
      originId = 'gcp-gfe-healthcheck';
      testIp = '130.211.0.22';
    } else if (port === 22 || port === 3389) {
      originId = 'scanner-botnet-east';
      testIp = '185.220.101.44';
    }
    return {
      ruleName: fw.name,
      protocol,
      port,
      originId,
      sourceIp: testIp,
    };
  };

  const handleTestRuleOnMap = (fw) => {
    const spec = extractRuleTestSpec(fw);
    if (onTestOnGlobalMap) {
      onTestOnGlobalMap(spec);
    } else if (onSelectTab) {
      onSelectTab('GLOBAL_MAP');
    }
  };

  const handleOpenRuleLogs = (fw) => {
    const spec = extractRuleTestSpec(fw);
    const lqlFilter = `jsonPayload.rule_details.reference:"${fw.name}" OR jsonPayload.connection.dest_port=${spec.port}`;
    const gcloudCommand = `gcloud logging read '${lqlFilter}' --project=${projectId} --limit=15 --format=json`;
    if (onOpenLogsExplorer) {
      onOpenLogsExplorer({
        id: `fw-log-${fw.name}`,
        regionId: 'global',
        category: `VPC Firewall (${fw.name})`,
        summary: `${fw.action} ${fw.direction} P-${fw.priority ?? 1000}`,
        verdict: fw.action,
        lqlFilter,
        nlQuery: `show firewall logs for rule ${fw.name}`,
        gcloudCommand,
      });
    } else if (onSelectTab) {
      onSelectTab('LOGS_SHELL');
    }
  };

  // Helper to poll live GCP Global Operation status (`GET /api/project/:projectId/operation-status`)
  const pollGcpOperation = async (trackerKey, operationUrl, operationName, doneLabel) => {
    if (operationUrl) {
      let attempts = 0;
      let isDone = false;
      while (attempts < 14 && !isDone) {
        attempts += 1;
        const pct = Math.min(30 + attempts * 14, 92);
        setOperationTrackers((prev) => ({
          ...prev,
          [trackerKey]: {
            status: 'RUNNING',
            progress: pct,
            operationName: operationName || 'compute#operation',
            stepLabel: `Polling GCP Global Firewall Operation (${operationName?.slice(0, 16) || 'RUNNING'}) · ${pct}%...`,
          },
        }));
        await new Promise((r) => setTimeout(r, 850));
        try {
          const pollRes = await axios.get(
            `/api/project/${encodeURIComponent(projectId)}/operation-status`,
            { params: { operationUrl } }
          );
          const opStatus = pollRes.data?.status || 'RUNNING';
          if (opStatus === 'DONE') {
            isDone = true;
          }
        } catch {
          isDone = true;
        }
      }
    }

    setOperationTrackers((prev) => ({
      ...prev,
      [trackerKey]: {
        status: 'DONE',
        progress: 100,
        operationName: operationName || 'DONE',
        stepLabel: doneLabel,
      },
    }));
    await new Promise((r) => setTimeout(r, 700));
    setOperationTrackers((prev) => {
      const next = { ...prev };
      delete next[trackerKey];
      return next;
    });
  };

  // Open Firewall Studio in Create Mode
  const handleOpenCreateStudio = (seedConfig = null) => {
    setEditingRuleName(null);
    if (seedConfig) {
      setRuleName(`${seedConfig.name}-${Math.floor(100 + Math.random() * 899)}`);
      setRuleNetwork(seedConfig.network || vpcs[0]?.name || 'default');
      setRuleAction(seedConfig.action || 'ALLOW');
      setRuleDirection(seedConfig.direction || 'INGRESS');
      setRulePriority(seedConfig.priority ?? 1000);
      setRuleDisabled(Boolean(seedConfig.disabled));
      setRuleEnableLogging(Boolean(seedConfig.enableLogging));
      setRuleDescription(seedConfig.description || '');
      setRuleSourceRanges(seedConfig.sourceRanges || '0.0.0.0/0');
      setRuleDestinationRanges(seedConfig.destinationRanges || '0.0.0.0/0');
      setRuleTargetTags(seedConfig.targetTags || '');
      setRuleSourceTags(seedConfig.sourceTags || '');
      setRuleTargetServiceAccounts(seedConfig.targetServiceAccounts || '');
      setRuleProtocolRows(
        seedConfig.rules || [{ IPProtocol: 'tcp', ports: '80,443' }]
      );
    } else {
      setRuleName(`fw-rule-${Math.floor(100 + Math.random() * 899)}`);
      setRuleNetwork(vpcs[0]?.name || 'default');
      setRuleAction('ALLOW');
      setRuleDirection('INGRESS');
      setRulePriority(1000);
      setRuleDisabled(false);
      setRuleEnableLogging(false);
      setRuleDescription('');
      setRuleSourceRanges('0.0.0.0/0');
      setRuleDestinationRanges('0.0.0.0/0');
      setRuleTargetTags('');
      setRuleSourceTags('');
      setRuleTargetServiceAccounts('');
      setRuleProtocolRows([{ IPProtocol: 'tcp', ports: '80,443' }]);
    }
    setActiveSubPanel('STUDIO');
  };

  // Open Firewall Studio in Edit Mode for an existing rule
  const handleOpenEditStudio = (fw) => {
    const isDeny =
      fw.action === 'DENY' || (Array.isArray(fw.denied) && fw.denied.length > 0);
    const rawSpecs = isDeny ? fw.denied || [] : fw.allowed || [];
    setEditingRuleName(fw.name);
    setRuleName(fw.name);
    setRuleNetwork(fw.network || 'default');
    setRuleAction(isDeny ? 'DENY' : 'ALLOW');
    setRuleDirection(fw.direction || 'INGRESS');
    setRulePriority(fw.priority ?? 1000);
    setRuleDisabled(Boolean(fw.disabled));
    setRuleEnableLogging(Boolean(fw.logConfig?.enable));
    setRuleDescription(fw.description || '');
    setRuleSourceRanges((fw.sourceRanges || []).join(', ') || '0.0.0.0/0');
    setRuleDestinationRanges(
      (fw.destinationRanges || []).join(', ') || '0.0.0.0/0'
    );
    setRuleTargetTags((fw.targetTags || []).join(', '));
    setRuleSourceTags((fw.sourceTags || []).join(', '));
    setRuleTargetServiceAccounts((fw.targetServiceAccounts || []).join(', '));
    setRuleProtocolRows(
      rawSpecs.length > 0
        ? rawSpecs.map((r) => ({
            IPProtocol: r.IPProtocol || 'tcp',
            ports: (r.ports || []).join(','),
          }))
        : [{ IPProtocol: 'tcp', ports: '80,443' }]
    );
    setActiveSubPanel('STUDIO');
  };

  // Submit Create or Edit Firewall Rule
  const handleStudioSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submittingStudio) return;
    setSubmittingStudio(true);

    const trackerKey = `fw:${editingRuleName || ruleName}`;
    setOperationTrackers((prev) => ({
      ...prev,
      [trackerKey]: {
        status: 'DISPATCHING',
        progress: 20,
        operationName: editingRuleName
          ? 'compute.firewalls.patch'
          : 'compute.firewalls.insert',
        stepLabel: editingRuleName
          ? `Dispatching PATCH /global/firewalls/${editingRuleName} to Google Cloud...`
          : `Dispatching POST /global/firewalls (${ruleName}) to Google Cloud...`,
      },
    }));

    try {
      const formattedRules = ruleProtocolRows.map((r) => ({
        IPProtocol: r.IPProtocol,
        ports:
          r.IPProtocol === 'icmp' || r.IPProtocol === 'all'
            ? []
            : String(r.ports || '')
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean),
      }));

      if (editingRuleName) {
        // PATCH existing rule
        const res = await axios.patch(
          `/api/project/${encodeURIComponent(
            projectId
          )}/firewalls/${encodeURIComponent(editingRuleName)}`,
          {
            action: ruleAction,
            direction: ruleDirection,
            priority: Number(rulePriority),
            disabled: ruleDisabled,
            enableLogging: ruleEnableLogging,
            description: ruleDescription,
            rules: formattedRules,
            sourceRanges: ruleSourceRanges,
            destinationRanges: ruleDestinationRanges,
            targetTags: ruleTargetTags,
            sourceTags: ruleSourceTags,
            targetServiceAccounts: ruleTargetServiceAccounts,
          }
        );

        await pollGcpOperation(
          trackerKey,
          res.data?.operationUrl,
          res.data?.operationName,
          `Confirmed Updated on GCP (100%) — ${editingRuleName}`
        );

        // Optimistically update localFirewalls
        setLocalFirewalls((prev) =>
          prev.map((item) =>
            item.name === editingRuleName
              ? {
                  ...item,
                  action: ruleAction,
                  direction: ruleDirection,
                  priority: Number(rulePriority),
                  disabled: ruleDisabled,
                  description: ruleDescription,
                  allowed: ruleAction === 'ALLOW' ? formattedRules : [],
                  denied: ruleAction === 'DENY' ? formattedRules : [],
                  sourceRanges:
                    ruleDirection === 'INGRESS'
                      ? ruleSourceRanges
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : item.sourceRanges,
                  destinationRanges:
                    ruleDirection === 'EGRESS'
                      ? ruleDestinationRanges
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : item.destinationRanges,
                  targetTags: ruleTargetTags
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  sourceTags: ruleSourceTags
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  logConfig: { enable: ruleEnableLogging },
                }
              : item
          )
        );
        if (onShowToast) onShowToast(res.data.message);
      } else {
        // POST new rule via /provision
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/provision`,
          {
            serviceType: 'VPC_FIREWALL',
            name: ruleName,
            config: {
              network: ruleNetwork,
              action: ruleAction,
              direction: ruleDirection,
              priority: Number(rulePriority),
              disabled: ruleDisabled,
              enableLogging: ruleEnableLogging,
              description: ruleDescription,
              rules: formattedRules,
              sourceRanges: ruleSourceRanges,
              destinationRanges: ruleDestinationRanges,
              targetTags: ruleTargetTags,
              sourceTags: ruleSourceTags,
              targetServiceAccounts: ruleTargetServiceAccounts,
            },
          }
        );

        await pollGcpOperation(
          trackerKey,
          res.data?.operationUrl,
          res.data?.operationName,
          `Confirmed Created on GCP (100%) — ${ruleName}`
        );

        const cleanCreatedName = ruleName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-_]/g, '-');
        setLocalFirewalls((prev) => [
          {
            id: `fw-${cleanCreatedName}`,
            name: cleanCreatedName,
            network: ruleNetwork,
            action: ruleAction,
            direction: ruleDirection,
            priority: Number(rulePriority),
            disabled: ruleDisabled,
            description: ruleDescription,
            allowed: ruleAction === 'ALLOW' ? formattedRules : [],
            denied: ruleAction === 'DENY' ? formattedRules : [],
            sourceRanges:
              ruleDirection === 'INGRESS'
                ? ruleSourceRanges
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
            destinationRanges:
              ruleDirection === 'EGRESS'
                ? ruleDestinationRanges
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
            targetTags: ruleTargetTags
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            sourceTags: ruleSourceTags
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            logConfig: { enable: ruleEnableLogging },
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        if (onShowToast) onShowToast(res.data.message);
      }

      setActiveSubPanel('NONE');
      if (onRefresh) onRefresh();
    } catch (err) {
      setOperationTrackers((prev) => {
        const next = { ...prev };
        delete next[trackerKey];
        return next;
      });
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to apply firewall rule on Google Cloud.'
        );
      }
    } finally {
      setSubmittingStudio(false);
    }
  };

  // 1-Tap Toggle Enable / Disable on a live Firewall Rule
  const handleToggleRuleDisabled = async (fw) => {
    const nextDisabled = !fw.disabled;
    const trackerKey = `fw:${fw.name}`;
    setOperationTrackers((prev) => ({
      ...prev,
      [trackerKey]: {
        status: 'DISPATCHING',
        progress: 22,
        operationName: 'compute.firewalls.patch',
        stepLabel: `${
          nextDisabled ? 'Disabling' : 'Enabling'
        } rule ${fw.name} on GCP...`,
      },
    }));

    try {
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/firewalls/${encodeURIComponent(fw.name)}`,
        { disabled: nextDisabled }
      );
      await pollGcpOperation(
        trackerKey,
        res.data?.operationUrl,
        res.data?.operationName,
        `Rule ${fw.name} is now ${nextDisabled ? 'DISABLED' : 'ENABLED'} (100%)`
      );
      setLocalFirewalls((prev) =>
        prev.map((item) =>
          item.name === fw.name ? { ...item, disabled: nextDisabled } : item
        )
      );
      if (onShowToast) {
        onShowToast(
          `Firewall rule "${fw.name}" ${
            nextDisabled ? 'DISABLED (paused)' : 'ENABLED (enforced)'
          } on Google Cloud.`
        );
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setOperationTrackers((prev) => {
        const next = { ...prev };
        delete next[trackerKey];
        return next;
      });
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to toggle firewall rule state.'
        );
      }
    }
  };

  // 1-Tap Lock Down Exposed 0.0.0.0/0 Rule to Google Cloud IAP (35.235.240.0/20)
  const [pendingIapLockdownFw, setPendingIapLockdownFw] = useState(null);

  const handleLockdownToIap = async (fw) => {
    setPendingIapLockdownFw(null);
    const trackerKey = `fw:${fw.name}`;
    setOperationTrackers((prev) => ({
      ...prev,
      [trackerKey]: {
        status: 'DISPATCHING',
        progress: 25,
        operationName: 'compute.firewalls.patch',
        stepLabel: `Locking ${fw.name} sourceRanges from 0.0.0.0/0 → 35.235.240.0/20 (IAP)...`,
      },
    }));

    try {
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/firewalls/${encodeURIComponent(fw.name)}`,
        {
          direction: 'INGRESS',
          sourceRanges: ['35.235.240.0/20'],
          description: `${
            fw.description ? fw.description + ' · ' : ''
          }[Locked down to Google Cloud IAP 35.235.240.0/20]`,
        }
      );
      await pollGcpOperation(
        trackerKey,
        res.data?.operationUrl,
        res.data?.operationName,
        `Locked down ${fw.name} to IAP 35.235.240.0/20 (100%)!`
      );
      setLocalFirewalls((prev) =>
        prev.map((item) =>
          item.name === fw.name
            ? { ...item, sourceRanges: ['35.235.240.0/20'] }
            : item
        )
      );
      if (onShowToast) {
        onShowToast(
          `Zero-Trust Lockdown complete: "${fw.name}" now only accepts traffic from Google Cloud IAP (35.235.240.0/20)! (Use --tunnel-through-iap in bash CLI)`
        );
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setOperationTrackers((prev) => {
        const next = { ...prev };
        delete next[trackerKey];
        return next;
      });
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to lock down firewall rule to IAP.'
        );
      }
    }
  };

  // 1-Tap Restore IAP-Locked Rule (35.235.240.0/20) back to Public Ingress (0.0.0.0/0)
  const handleRestoreFromIap = async (fw) => {
    const trackerKey = `fw:${fw.name}`;
    setOperationTrackers((prev) => ({
      ...prev,
      [trackerKey]: {
        status: 'DISPATCHING',
        progress: 25,
        operationName: 'compute.firewalls.patch',
        stepLabel: `Restoring ${fw.name} sourceRanges from 35.235.240.0/20 → 0.0.0.0/0...`,
      },
    }));

    try {
      const cleanDesc = String(fw.description || '')
        .replace(/\s*·?\s*\[Locked down to Google Cloud IAP 35\.235\.240\.0\/20\]/g, '')
        .trim();
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/firewalls/${encodeURIComponent(fw.name)}`,
        {
          direction: 'INGRESS',
          sourceRanges: ['0.0.0.0/0'],
          description: cleanDesc || 'Restored to 0.0.0.0/0 direct public ingress',
        }
      );
      await pollGcpOperation(
        trackerKey,
        res.data?.operationUrl,
        res.data?.operationName,
        `Restored ${fw.name} to 0.0.0.0/0 (100%)!`
      );
      setLocalFirewalls((prev) =>
        prev.map((item) =>
          item.name === fw.name
            ? { ...item, sourceRanges: ['0.0.0.0/0'] }
            : item
        )
      );
      if (onShowToast) {
        onShowToast(
          `Restored "${fw.name}" to 0.0.0.0/0! Direct bash 'gcloud compute ssh' now works without '--tunnel-through-iap'.`
        );
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setOperationTrackers((prev) => {
        const next = { ...prev };
        delete next[trackerKey];
        return next;
      });
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to restore firewall rule to 0.0.0.0/0.'
        );
      }
    }
  };

  // Delete VPC or Firewall Rule with real-time GCP Global Operation progress bar
  const handleConfirmDelete = async (resourceType, name) => {
    const isFw = resourceType === 'VPC Firewall Rule';
    const trackerKey = isFw ? `fw:${name}` : `vpc:${name}`;
    setConfirmDeleteKey(null);
    setOperationTrackers((prev) => ({
      ...prev,
      [trackerKey]: {
        status: 'DISPATCHING',
        progress: 20,
        operationName: isFw
          ? 'compute.firewalls.delete'
          : 'compute.networks.delete',
        stepLabel: `Dispatching DELETE ${name} to Google Cloud...`,
      },
    }));

    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(projectId)}/resource`,
        {
          data: {
            type: resourceType,
            name,
            region: 'global',
            confirmName: name,
          },
        }
      );

      await pollGcpOperation(
        trackerKey,
        res.data?.operationUrl,
        res.data?.operationName,
        `Confirmed Deleted on GCP (100%) — ${name}`
      );

      if (isFw) {
        setLocalFirewalls((prev) => prev.filter((f) => f.name !== name));
      }
      if (onShowToast) onShowToast(res.data?.message || `Deleted ${name}.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      // Fallback to parent handler if needed
      if (onDeleteResource) {
        await onDeleteResource({ type: resourceType, name, region: 'global' });
      } else if (onShowError) {
        onShowError(err.response?.data?.error || `Failed to delete ${name}.`);
      }
      setOperationTrackers((prev) => {
        const next = { ...prev };
        delete next[trackerKey];
        return next;
      });
    }
  };

  // Enrich and sort firewall rules by priority (0 -> 65535)
  const enrichedFirewalls = useMemo(() => {
    return (localFirewalls || [])
      .map((fw) => {
        const isDeny =
          fw.action === 'DENY' ||
          (Array.isArray(fw.denied) && fw.denied.length > 0);
        const action = isDeny ? 'DENY' : 'ALLOW';
        const direction = (fw.direction || 'INGRESS').toUpperCase();
        const specs = isDeny ? fw.denied || [] : fw.allowed || [];
        const protocolsFormatted = specs.map(
          (r) =>
            `${r.IPProtocol}${r.ports?.length ? ':' + r.ports.join(',') : ''}`
        );
        const risk = analyzeFirewallRuleRisk({ ...fw, action, direction });
        return {
          ...fw,
          action,
          direction,
          specs,
          protocolsFormatted,
          risk,
        };
      })
      .sort((a, b) => (a.priority ?? 1000) - (b.priority ?? 1000));
  }, [localFirewalls]);

  // Security KPI counters
  const stats = useMemo(() => {
    const total = enrichedFirewalls.length;
    const allowCount = enrichedFirewalls.filter((f) => f.action === 'ALLOW').length;
    const denyCount = enrichedFirewalls.filter((f) => f.action === 'DENY').length;
    const ingressCount = enrichedFirewalls.filter(
      (f) => f.direction === 'INGRESS'
    ).length;
    const egressCount = enrichedFirewalls.filter(
      (f) => f.direction === 'EGRESS'
    ).length;
    const disabledCount = enrichedFirewalls.filter((f) => f.disabled).length;
    const exposedHighRisk = enrichedFirewalls.filter(
      (f) => f.risk.level === 'CRITICAL' || f.risk.level === 'HIGH'
    );
    return {
      total,
      allowCount,
      denyCount,
      ingressCount,
      egressCount,
      disabledCount,
      exposedHighRisk,
    };
  }, [enrichedFirewalls]);

  // Filtered firewall rules
  const filteredFirewalls = useMemo(() => {
    return enrichedFirewalls.filter((fw) => {
      if (selectedVpcFilter !== 'ALL' && fw.network !== selectedVpcFilter) {
        return false;
      }
      if (filterMode === 'ALLOW' && fw.action !== 'ALLOW') return false;
      if (filterMode === 'DENY' && fw.action !== 'DENY') return false;
      if (filterMode === 'INGRESS' && fw.direction !== 'INGRESS') return false;
      if (filterMode === 'EGRESS' && fw.direction !== 'EGRESS') return false;
      if (
        filterMode === 'EXPOSED' &&
        fw.risk.level !== 'CRITICAL' &&
        fw.risk.level !== 'HIGH' &&
        fw.risk.level !== 'MODERATE'
      ) {
        return false;
      }
      if (filterMode === 'DISABLED' && !fw.disabled) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          fw.name,
          fw.network,
          fw.action,
          fw.direction,
          fw.description || '',
          ...(fw.protocolsFormatted || []),
          ...(fw.sourceRanges || []),
          ...(fw.destinationRanges || []),
          ...(fw.targetTags || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedFirewalls, selectedVpcFilter, filterMode, searchQuery]);

  // Packet Flow & Firewall Match Simulator evaluation (tracks ★ WINNER + SHADOWED rules)
  const simulationResult = useMemo(() => {
    const candidateRules = enrichedFirewalls.filter(
      (fw) =>
        !fw.disabled &&
        fw.network === simNetwork &&
        fw.direction === simDirection
    );

    const portNum = Number(simPort);
    let winningRule = null;
    const shadowedRules = [];

    for (const fw of candidateRules) {
      // 1. Check Target Tag match if rule restricts to specific targetTags
      if (Array.isArray(fw.targetTags) && fw.targetTags.length > 0) {
        const cleanSimTag = simTag.trim();
        if (!cleanSimTag || !fw.targetTags.includes(cleanSimTag)) {
          continue;
        }
      }

      // 2. Check IP CIDR match
      const ranges =
        simDirection === 'EGRESS'
          ? fw.destinationRanges?.length
            ? fw.destinationRanges
            : ['0.0.0.0/0']
          : fw.sourceRanges?.length
          ? fw.sourceRanges
          : [];
      if (ranges.length > 0 && !ranges.some((cidr) => ipMatchesCidr(simIp, cidr))) {
        continue;
      }

      // 3. Check Protocol + Port match
      const protoMatched = (fw.specs || []).some((spec) => {
        const p = String(spec.IPProtocol || '').toLowerCase();
        if (p === 'all') return true;
        if (p !== simProtocol.toLowerCase()) return false;
        if (p === 'icmp') return true;
        return portMatchesSpec(portNum, spec.ports);
      });

      if (protoMatched) {
        if (!winningRule) {
          winningRule = fw;
        } else {
          shadowedRules.push(fw);
        }
      }
    }

    if (winningRule) {
      return {
        verdict: winningRule.action,
        matchedRule: winningRule.name,
        priority: winningRule.priority ?? 1000,
        isDefaultImplied: false,
        shadowedRules,
        reason: `★ WINNER (1st Match): Matched explicit ${winningRule.action} rule "${winningRule.name}" at priority P-${
          winningRule.priority ?? 1000
        } on VPC "${simNetwork}".${
          shadowedRules.length > 0
            ? ` Shadows ${shadowedRules.length} lower-priority rule(s): ${shadowedRules
                .map((s) => `${s.name} (P-${s.priority ?? 1000})`)
                .join(', ')}.`
            : ''
        }`,
      };
    }

    // Fallback to Google Cloud Implied Default Firewall Rules (Priority 65535)
    if (simDirection === 'EGRESS') {
      return {
        verdict: 'ALLOW',
        matchedRule: 'default-allow-egress (Implied GCP Rule)',
        priority: 65535,
        isDefaultImplied: true,
        shadowedRules: [],
        reason:
          'No custom EGRESS rule matched; fell through to Google Cloud implied default-allow-egress (priority P-65535).',
      };
    }
    return {
      verdict: 'DENY',
      matchedRule: 'default-deny-ingress (Implied GCP Rule)',
      priority: 65535,
      isDefaultImplied: true,
      shadowedRules: [],
      reason:
        'No custom INGRESS rule matched; blocked by Google Cloud implied default-deny-ingress (priority P-65535).',
    };
  }, [
    enrichedFirewalls,
    simNetwork,
    simDirection,
    simProtocol,
    simPort,
    simIp,
    simTag,
  ]);

  return (
    <div className="space-y-5">
      {/* 1. Top Enterprise VPC & Firewall Security Command Center Header */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50/60 dark:bg-blue-500/[0.08] border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2 flex-wrap">
                <span>Enterprise VPC Networks & Zero-Trust Firewall Center</span>
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                  {vpcs.length} VPC{vpcs.length === 1 ? '' : 's'} · {stats.total}{' '}
                  Firewall Rule{stats.total === 1 ? '' : 's'}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Full <code className="font-mono">ALLOW</code> &{' '}
                <code className="font-mono">DENY</code> policy control,{' '}
                <code className="font-mono">INGRESS</code> /{' '}
                <code className="font-mono">EGRESS</code> priority matrix, 1-tap
                IAP lockdown, and live packet match simulation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              data-feature-id="VPC_FW_SYNC_GCP"
              disabled={loading || directFetching}
              onClick={() => {
                fetchDirectVpcAndFirewalls();
                if (onRefresh) onRefresh();
              }}
              className="inline-flex items-center gap-1.5 bg-white dark:bg-[#202124] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loading || directFetching ? 'animate-spin' : ''
                }`}
              />
              <span>Sync GCP</span>
            </button>

            <button
              type="button"
              data-feature-id="VPC_FW_JUMP_RULES"
              onClick={() => {
                setFilterMode('ALL');
                setSearchQuery('');
                setSelectedVpcFilter('ALL');
                const el = document.getElementById(
                  'live-vpc-firewall-rules-section'
                );
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 rounded-lg px-3 py-2 text-xs font-mono font-extrabold transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Live VPC Firewall Rules ({stats.total}) ↓</span>
            </button>

            <button
              type="button"
              data-feature-id="VPC_FW_PACKET_TESTER"
              onClick={() =>
                setActiveSubPanel(
                  activeSubPanel === 'SIMULATOR' ? 'NONE' : 'SIMULATOR'
                )
              }
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-mono font-bold border transition-colors cursor-pointer ${
                activeSubPanel === 'SIMULATOR'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Packet Tester</span>
            </button>

            <button
              type="button"
              data-feature-id="VPC_FW_CREATE_RULE"
              onClick={() => handleOpenCreateStudio(null)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 py-2 text-xs font-mono font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>+ Create Firewall Rule (ALLOW / DENY)</span>
            </button>

            <button
              type="button"
              data-feature-id="VPC_FW_NEW_VPC"
              onClick={onOpenProvisionVpc}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3.5 py-2 text-xs font-mono font-bold transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ New VPC</span>
            </button>
          </div>
        </div>

        {/* Security Posture KPI Strip (Clickable Filter Cards with Hover Explainers) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            type="button"
            data-feature-id="VPC_FW_KPI_ALLOW"
            onClick={() =>
              setFilterMode(filterMode === 'ALLOW' ? 'ALL' : 'ALLOW')
            }
            className={`p-2.5 rounded-lg bg-emerald-500/[0.07] hover:bg-emerald-500/15 border text-left transition-all cursor-pointer ${
              filterMode === 'ALLOW'
                ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                : 'border-emerald-500/25'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400">
              ✓ ALLOW Rules
            </div>
            <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {stats.allowCount}
            </div>
          </button>

          <button
            type="button"
            data-feature-id="VPC_FW_KPI_DENY"
            onClick={() =>
              setFilterMode(filterMode === 'DENY' ? 'ALL' : 'DENY')
            }
            className={`p-2.5 rounded-lg bg-red-500/[0.07] hover:bg-red-500/15 border text-left transition-all cursor-pointer ${
              filterMode === 'DENY'
                ? 'border-red-500 ring-1 ring-red-500/40'
                : 'border-red-500/25'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-red-600 dark:text-red-400">
              ✕ DENY Rules
            </div>
            <div className="text-lg font-extrabold font-mono text-red-600 dark:text-red-400">
              {stats.denyCount}
            </div>
          </button>

          <button
            type="button"
            data-feature-id="VPC_FW_KPI_INGRESS"
            onClick={() =>
              setFilterMode(filterMode === 'INGRESS' ? 'ALL' : 'INGRESS')
            }
            className={`p-2.5 rounded-lg bg-blue-500/[0.07] hover:bg-blue-500/15 border text-left transition-all cursor-pointer ${
              filterMode === 'INGRESS'
                ? 'border-blue-500 ring-1 ring-blue-500/40'
                : 'border-blue-500/25'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400">
              ↙ INGRESS (Inbound)
            </div>
            <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400">
              {stats.ingressCount}
            </div>
          </button>

          <button
            type="button"
            data-feature-id="VPC_FW_KPI_EGRESS"
            onClick={() =>
              setFilterMode(filterMode === 'EGRESS' ? 'ALL' : 'EGRESS')
            }
            className={`p-2.5 rounded-lg bg-blue-500/[0.07] hover:bg-blue-500/15 border text-left transition-all cursor-pointer ${
              filterMode === 'EGRESS'
                ? 'border-blue-500 ring-1 ring-blue-500/40'
                : 'border-blue-500/25'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400">
              ↗ EGRESS (Outbound)
            </div>
            <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400">
              {stats.egressCount}
            </div>
          </button>

          <button
            type="button"
            data-feature-id="VPC_FW_KPI_DISABLED"
            onClick={() =>
              setFilterMode(filterMode === 'DISABLED' ? 'ALL' : 'DISABLED')
            }
            className={`p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 border text-left transition-all cursor-pointer ${
              filterMode === 'DISABLED'
                ? 'border-blue-500 ring-1 ring-blue-500/40'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              Paused / Disabled
            </div>
            <div className="text-lg font-extrabold font-mono text-zinc-700 dark:text-zinc-300">
              {stats.disabledCount}
            </div>
          </button>

          <button
            type="button"
            data-feature-id="VPC_FW_KPI_EXPOSED"
            onClick={() =>
              setFilterMode(filterMode === 'EXPOSED' ? 'ALL' : 'EXPOSED')
            }
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              filterMode === 'EXPOSED'
                ? 'ring-1 ring-amber-500/50 border-amber-500 bg-amber-500/15'
                : stats.exposedHighRisk.length > 0
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400">
              0.0.0.0/0 Sensitive
            </div>
            <div
              className={`text-lg font-extrabold font-mono ${
                stats.exposedHighRisk.length > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {stats.exposedHighRisk.length === 0
                ? '0 Exposed'
                : `${stats.exposedHighRisk.length} At Risk`}
            </div>
          </button>
        </div>

        {/* High-Risk Public Port Exposure Alert Banner */}
        {stats.exposedHighRisk.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  Security Advisory:{' '}
                  {stats.exposedHighRisk.map((f) => f.name).join(', ')}
                </span>{' '}
                <span className="text-zinc-600 dark:text-zinc-300">
                  exposes sensitive management ports (SSH 22 / RDP 3389 / DB) to{' '}
                  <code className="font-mono font-bold">0.0.0.0/0</code>. Click{' '}
                  <strong>Lock to IAP (35.235.240.0/20)</strong> on any flagged rule
                  below or deploy a priority-100 <code className="font-mono">DENY</code>{' '}
                  guardrail.
                </span>
              </div>
            </div>
            <button
              type="button"
              data-feature-id="VPC_FW_KPI_EXPOSED"
              onClick={() => setFilterMode('EXPOSED')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-mono font-bold text-xs shrink-0 cursor-pointer"
            >
              Inspect {stats.exposedHighRisk.length} Flagged Rule
              {stats.exposedHighRisk.length === 1 ? '' : 's'}
            </button>
          </div>
        )}

        {/* 1-Tap Zero-Trust Security Templates Bar */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>1-Tap Zero-Trust & Hardening Rule Templates (ALLOW & DENY)</span>
            <span className="text-[10px] text-zinc-500">
              Loads into Firewall Studio for instant review & deployment
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {ZERO_TRUST_TEMPLATES.map((tpl) => {
              const TplIcon =
                tpl.config.action === 'DENY'
                  ? ShieldOff
                  : tpl.id.includes('iap')
                  ? Lock
                  : tpl.id.includes('internal')
                  ? Network
                  : Globe;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  data-feature-id={tpl.featureId}
                  onClick={() => handleOpenCreateStudio(tpl.config)}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 hover:bg-blue-500/[0.08] border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`p-1 rounded-md shrink-0 ${
                          tpl.config.action === 'DENY'
                            ? 'bg-red-500/15 text-red-500'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        <TplIcon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 truncate">
                        {tpl.title}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        tpl.config.action === 'DENY'
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-emerald-500/20 text-emerald-500'
                      }`}
                    >
                      {tpl.config.action}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 line-clamp-1">
                    {tpl.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Firewall Rule Studio Drawer (Create OR Edit Live Rule) */}
      {activeSubPanel === 'STUDIO' && (
        <div className="bg-white dark:bg-[#202124] border-2 border-blue-500/50 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>
                  {editingRuleName
                    ? `Edit Live Firewall Rule: ${editingRuleName}`
                    : 'Create Enterprise VPC Firewall Rule (ALLOW / DENY · INGRESS / EGRESS)'}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                {editingRuleName
                  ? `Executes PATCH https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls/${editingRuleName}`
                  : `Executes POST https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubPanel('NONE')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleStudioSubmit} className="space-y-4">
            {/* Row 1: Rule Name, VPC Network, Priority, Enforcement State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Firewall Rule Name
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingRuleName)}
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Target VPC Network
                </label>
                <select
                  disabled={Boolean(editingRuleName)}
                  value={ruleNetwork}
                  onChange={(e) => setRuleNetwork(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono disabled:opacity-60"
                >
                  {vpcs.length > 0 ? (
                    vpcs.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.routingMode})
                      </option>
                    ))
                  ) : (
                    <option value="default">default</option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono font-bold text-zinc-500">
                    Priority (0 = Highest)
                  </label>
                  <div className="flex gap-1">
                    {[90, 100, 500, 1000, 65534].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setRulePriority(p)}
                        className="text-[9px] font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-blue-500 cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={65535}
                  value={rulePriority}
                  onChange={(e) => setRulePriority(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Enforcement & Audit Logs
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleDisabled(!ruleDisabled)}
                    className={`flex-1 py-2 px-2.5 rounded-lg border text-xs font-mono font-bold cursor-pointer ${
                      !ruleDisabled
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-zinc-500/15 border-zinc-500/40 text-zinc-500'
                    }`}
                  >
                    {!ruleDisabled ? '● ENABLED' : '○ DISABLED'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleEnableLogging(!ruleEnableLogging)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold cursor-pointer ${
                      ruleEnableLogging
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {ruleEnableLogging ? 'Logs: ON' : 'Logs: OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Action (ALLOW vs DENY) and Direction (INGRESS vs EGRESS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Action on Match (ALLOW vs DENY)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-feature-id="VPC_STUDIO_ALLOW"
                    onClick={() => setRuleAction('ALLOW')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      ruleAction === 'ALLOW'
                        ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>✓ ALLOW TRAFFIC</span>
                  </button>
                  <button
                    type="button"
                    data-feature-id="VPC_STUDIO_DENY"
                    onClick={() => setRuleAction('DENY')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      ruleAction === 'DENY'
                        ? 'bg-red-500/15 border-2 border-red-500 text-red-600 dark:text-red-300 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <ShieldOff className="w-4 h-4" />
                    <span>✕ DENY (BLOCK) TRAFFIC</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Traffic Direction (INGRESS vs EGRESS)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-feature-id="VPC_STUDIO_INGRESS"
                    disabled={Boolean(editingRuleName)}
                    onClick={() => setRuleDirection('INGRESS')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${
                      ruleDirection === 'INGRESS'
                        ? 'bg-blue-500/15 border-2 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>↙ INGRESS (Inbound)</span>
                  </button>
                  <button
                    type="button"
                    data-feature-id="VPC_STUDIO_EGRESS"
                    disabled={Boolean(editingRuleName)}
                    onClick={() => setRuleDirection('EGRESS')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${
                      ruleDirection === 'EGRESS'
                        ? 'bg-blue-500/15 border-2 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>↗ EGRESS (Outbound)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Multi-Protocol & Port Matrix Builder */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200">
                  Protocols & Ports Matrix ({ruleAction === 'DENY' ? 'Denied' : 'Allowed'}{' '}
                  Specs)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRuleProtocolRows((prev) => [
                      ...prev,
                      { IPProtocol: 'udp', ports: '53,443' },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Protocol Row (TCP/UDP/ICMP/ALL)</span>
                </button>
              </div>

              <div className="space-y-2">
                {ruleProtocolRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-4">
                      <select
                        value={row.IPProtocol}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRuleProtocolRows((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, IPProtocol: val } : r
                            )
                          );
                        }}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono"
                      >
                        <option value="tcp">tcp (Transmission Control Protocol)</option>
                        <option value="udp">udp (User Datagram Protocol)</option>
                        <option value="icmp">icmp (Ping / Diagnostics)</option>
                        <option value="sctp">sctp (Stream Control)</option>
                        <option value="esp">esp (IPsec ESP)</option>
                        <option value="all">all (All IP Protocols)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        disabled={
                          row.IPProtocol === 'icmp' ||
                          row.IPProtocol === 'all' ||
                          row.IPProtocol === 'esp'
                        }
                        value={row.ports}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRuleProtocolRows((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, ports: val } : r
                            )
                          );
                        }}
                        placeholder={
                          row.IPProtocol === 'icmp' || row.IPProtocol === 'all'
                            ? 'All ports / messages'
                            : 'e.g. 22, 80, 443, 8000-8090 (leave blank for all ports)'
                        }
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono disabled:opacity-40"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {ruleProtocolRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setRuleProtocolRows((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4: Source / Destination CIDR Filter + Target Tags & Service Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  {ruleDirection === 'EGRESS'
                    ? 'Destination IPv4/IPv6 CIDR Ranges'
                    : 'Source IPv4/IPv6 CIDR Ranges'}
                </label>
                <input
                  type="text"
                  value={
                    ruleDirection === 'EGRESS'
                      ? ruleDestinationRanges
                      : ruleSourceRanges
                  }
                  onChange={(e) =>
                    ruleDirection === 'EGRESS'
                      ? setRuleDestinationRanges(e.target.value)
                      : setRuleSourceRanges(e.target.value)
                  }
                  placeholder="0.0.0.0/0 or 35.235.240.0/20"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    { label: 'IAP (35.235.240.0/20)', cidr: '35.235.240.0/20' },
                    {
                      label: 'GCLB Probers',
                      cidr: '130.211.0.0/22, 35.191.0.0/16',
                    },
                    { label: 'Internal VPC', cidr: '10.128.0.0/9' },
                    { label: 'Public (0.0.0.0/0)', cidr: '0.0.0.0/0' },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() =>
                        ruleDirection === 'EGRESS'
                          ? setRuleDestinationRanges(p.cidr)
                          : setRuleSourceRanges(p.cidr)
                      }
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-500/20 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Target Network Tags (Blank = All Instances in VPC)
                </label>
                <input
                  type="text"
                  value={ruleTargetTags}
                  onChange={(e) => setRuleTargetTags(e.target.value)}
                  placeholder="e.g. web-server, https-server, ssh-bastion"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Scopes this rule only to VMs carrying matching network tags.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Description / Security Justification
                </label>
                <input
                  type="text"
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="Explain why this rule exists..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveSubPanel('NONE')}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingStudio}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-extrabold text-white shadow-sm cursor-pointer disabled:opacity-50 ${
                  ruleAction === 'DENY'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submittingStudio ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Shield className="w-3.5 h-3.5" />
                )}
                <span>
                  {submittingStudio
                    ? 'Applying on Google Cloud...'
                    : editingRuleName
                    ? `Save Changes to ${editingRuleName} (PATCH)`
                    : `Deploy ${ruleAction} ${ruleDirection} Rule`}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Interactive Packet Flow & Firewall Rule Match Simulator ("Packet Tester") */}
      {activeSubPanel === 'SIMULATOR' && (
        <div className="bg-white dark:bg-[#202124] border-2 border-blue-500/40 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold font-mono text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>
                  Interactive Packet Flow & Firewall Priority Match Simulator
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Simulates Google Cloud VPC firewall evaluation in priority order (
                <code className="font-mono">0 → 65535</code>) across your live{' '}
                <code className="font-mono">{projectId}</code> rules.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubPanel('NONE')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                VPC Network
              </label>
              <select
                value={simNetwork}
                onChange={(e) => setSimNetwork(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              >
                {vpcs.length > 0 ? (
                  vpcs.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))
                ) : (
                  <option value="default">default</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                Direction
              </label>
              <select
                value={simDirection}
                onChange={(e) => setSimDirection(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="INGRESS">↙ INGRESS</option>
                <option value="EGRESS">↗ EGRESS</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                IP Protocol
              </label>
              <select
                value={simProtocol}
                onChange={(e) => setSimProtocol(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="tcp">tcp</option>
                <option value="udp">udp</option>
                <option value="icmp">icmp</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                Destination Port
              </label>
              <input
                type="number"
                disabled={simProtocol === 'icmp'}
                value={simPort}
                onChange={(e) => setSimPort(Number(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono disabled:opacity-40"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                {simDirection === 'EGRESS' ? 'Dest IPv4' : 'Source IPv4'}
              </label>
              <input
                type="text"
                value={simIp}
                onChange={(e) => setSimIp(e.target.value)}
                placeholder="203.0.113.50"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                VM Network Tag
              </label>
              <input
                type="text"
                value={simTag}
                onChange={(e) => setSimTag(e.target.value)}
                placeholder="(Optional)"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              simulationResult.verdict === 'ALLOW'
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-red-500/10 border-red-500/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold ${
                  simulationResult.verdict === 'ALLOW'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {simulationResult.verdict === 'ALLOW'
                  ? '✓ PACKET ALLOWED'
                  : '✕ PACKET DENIED'}
              </span>
              <div className="text-xs font-mono">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  Winning Rule: {simulationResult.matchedRule} (Priority{' '}
                  {simulationResult.priority})
                </div>
                <div className="text-zinc-500 text-[11px]">
                  {simulationResult.reason}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSimIp('35.235.240.12');
                  setSimPort(22);
                  setSimProtocol('tcp');
                }}
                className="px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-[10px] font-mono font-bold cursor-pointer"
              >
                Test IAP SSH (35.235.240.12:22)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimIp('198.51.100.1');
                  setSimPort(22);
                  setSimProtocol('tcp');
                }}
                className="px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-[10px] font-mono font-bold cursor-pointer"
              >
                Test Public SSH (:22)
              </button>
              {onTestOnGlobalMap && (
                <button
                  type="button"
                  onClick={() =>
                    onTestOnGlobalMap({
                      ruleName: simulationResult.matchedRule,
                      protocol: simProtocol,
                      port: simPort,
                      originId: simIp.startsWith('35.235.240.')
                        ? 'gcp-iap-proxy'
                        : simIp.startsWith('130.211.')
                        ? 'gcp-gfe-healthcheck'
                        : 'my-live-client',
                    })
                  }
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-extrabold cursor-pointer"
                >
                  🌐 Launch &amp; X-Ray on Global Map ↗
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Layout: Left Column VPC Networks (4 cols) + Right Column Full Firewall Rules Matrix (8 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live VPC Networks & Regional Subnets */}
        <div className="xl:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1 flex items-center justify-between">
            <span>VPC Networks ({vpcs.length})</span>
            <span className="font-mono text-[11px]">global/networks</span>
          </div>

          {vpcs.length === 0 ? (
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center space-y-2">
              <Network className="w-6 h-6 text-zinc-400 mx-auto" />
              <div className="text-sm font-bold">
                No VPC Networks Found in{' '}
                <span className="font-mono text-blue-500">{projectId}</span>
              </div>
              <p className="text-xs text-zinc-500">
                Click <strong>+ New VPC</strong> above to create a VPC network.
              </p>
            </div>
          ) : (
            vpcs.map((vpc) => {
              const delKey = `VPC Network:${vpc.name}`;
              const tracker = operationTrackers[`vpc:${vpc.name}`];
              const isSelectedFilter = selectedVpcFilter === vpc.name;
              const rulesForVpc = enrichedFirewalls.filter(
                (f) => f.network === vpc.name
              ).length;

              return (
                <div
                  key={vpc.id}
                  className={`bg-white dark:bg-[#202124] border rounded-xl p-4 shadow-sm transition-all space-y-3 ${
                    isSelectedFilter
                      ? 'border-blue-500 ring-1 ring-blue-500/30'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span className="text-sm font-bold font-mono text-zinc-950 dark:text-zinc-50">
                          {vpc.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {vpc.autoCreateSubnetworks
                            ? 'AUTO SUBNETS'
                            : 'CUSTOM SUBNETS'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-zinc-500">
                        <span>BGP: {vpc.routingMode}</span>
                        <span>·</span>
                        <span>MTU: {vpc.mtu}</span>
                        <span>·</span>
                        <button
                          type="button"
                          data-feature-id="VPC_NET_FILTER_RULES"
                          onClick={() =>
                            setSelectedVpcFilter(
                              isSelectedFilter ? 'ALL' : vpc.name
                            )
                          }
                          className="text-blue-500 hover:underline font-bold cursor-pointer"
                        >
                          {rulesForVpc} Firewall Rules{' '}
                          {isSelectedFilter ? '(Filtered)' : ''}
                        </button>
                      </div>
                    </div>

                    <div>
                      {confirmDeleteKey === delKey ? (
                        <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-1">
                          <button
                            type="button"
                            data-feature-id="VPC_NET_DELETE"
                            onClick={() =>
                              handleConfirmDelete('VPC Network', vpc.name)
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKey(null)}
                            className="text-[11px] text-zinc-500 px-1 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          data-feature-id="VPC_NET_DELETE"
                          onClick={() => setConfirmDeleteKey(delKey)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 px-2 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {tracker && (
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-blue-400">
                        <span>{tracker.stepLabel}</span>
                        <span>{tracker.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${tracker.progress}%` }}
                          className="h-full bg-blue-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                  )}

                  {/* Regional Subnets Pills */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="text-[11px] text-zinc-500 mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      <span>
                        Attached Subnetworks ({vpc.subnetsCount || 0} regional
                        subnets):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {(vpc.subnetworks || []).slice(0, 12).map((sub, i) => (
                        <span
                          key={`${sub.region}-${i}`}
                          className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded"
                        >
                          {sub.region}
                        </span>
                      ))}
                      {(vpc.subnetworks || []).length > 12 && (
                        <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5">
                          +{(vpc.subnetworks || []).length - 12} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Full-Fledged Firewall Policy Matrix (ALLOW & DENY, INGRESS & EGRESS) */}
        <div
          id="live-vpc-firewall-rules-section"
          className="xl:col-span-8 space-y-3"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1 flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-extrabold">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>
                Live VPC Firewall Rules ({enrichedFirewalls.length})
              </span>
            </span>
            <span className="font-mono text-[11px]">
              compute.v1/projects/{projectId}/global/firewalls (Priority 0 → 65535)
            </span>
          </div>

          {focusedSeedRuleName && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-sky-600 text-white text-[10px] font-extrabold">
                  🎯 FOCUSED FROM GLOBAL MAP X-RAY
                </span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  Rule:{' '}
                  <strong className="text-sky-600 dark:text-sky-300">
                    {focusedSeedRuleName}
                  </strong>
                  {!enrichedFirewalls.some(
                    (f) => f.name === focusedSeedRuleName
                  ) && (
                    <span className="text-zinc-500 ml-1.5">
                      (Google Cloud Implied Priority-65535 Fallback Rule — all{' '}
                      {enrichedFirewalls.length} explicit Live VPC Firewall Rules
                      are shown below)
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFocusedSeedRuleName(null)}
                className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold cursor-pointer"
              >
                ✕ Clear Focus
              </button>
            </div>
          )}

          {/* Compact Firewall Search + Rule Filter Dropdown Toolbar */}
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search firewall rule, port (22, 443), CIDR, network tag..."
                className="w-full h-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-bold uppercase text-zinc-500">
                Filter Rules:
              </span>
              <select
                aria-label="Filter Firewall Rules"
                data-feature-id="VPC_FW_FILTER_SELECT"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="h-8 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                {[
                  { id: 'ALL', label: `All Rules (${enrichedFirewalls.length})` },
                  { id: 'ALLOW', label: `✓ ALLOW (${stats.allowCount})` },
                  { id: 'DENY', label: `✕ DENY (${stats.denyCount})` },
                  { id: 'INGRESS', label: `↙ INGRESS (${stats.ingressCount})` },
                  { id: 'EGRESS', label: `↗ EGRESS (${stats.egressCount})` },
                  {
                    id: 'EXPOSED',
                    label: `0.0.0.0/0 Sensitive (${stats.exposedHighRisk.length})`,
                  },
                  { id: 'DISABLED', label: `Paused / Disabled (${stats.disabledCount})` },
                ].map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>

              {(filterMode !== 'ALL' || selectedVpcFilter !== 'ALL' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('ALL');
                    setSelectedVpcFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="h-8 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-bold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Firewall Rules List */}
          {filteredFirewalls.length === 0 ? (
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center space-y-2">
              <Shield className="w-7 h-7 text-zinc-400 mx-auto" />
              <div className="text-sm font-bold">
                No Matching Firewall Rules Found
              </div>
              <p className="text-xs text-zinc-500">
                Click <strong>+ Create Firewall Rule (ALLOW / DENY)</strong> or
                choose one of the 1-Tap Zero-Trust templates above.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredFirewalls.map((fw) => {
                const delKey = `VPC Firewall Rule:${fw.name}`;
                const tracker = operationTrackers[`fw:${fw.name}`];
                const isDeny = fw.action === 'DENY';
                const isEgress = fw.direction === 'EGRESS';
                const ranges = isEgress
                  ? fw.destinationRanges?.length
                    ? fw.destinationRanges
                    : ['0.0.0.0/0']
                  : fw.sourceRanges?.length
                  ? fw.sourceRanges
                  : ['0.0.0.0/0'];
                const isPublicAllowIngress =
                  !isDeny &&
                  !isEgress &&
                  !fw.disabled &&
                  ranges.includes('0.0.0.0/0');
                const isIapProtected = ranges.includes('35.235.240.0/20');
                const isFocusedFromMap = focusedSeedRuleName === fw.name;

                return (
                  <div
                    key={fw.id || fw.name}
                    className={`bg-white dark:bg-[#202124] border rounded-xl p-4 shadow-sm transition-all space-y-3 ${
                      isFocusedFromMap
                        ? 'border-sky-500 ring-2 ring-sky-500/40 bg-sky-500/[0.04]'
                        : fw.disabled
                        ? 'border-zinc-200 dark:border-zinc-800 opacity-65'
                        : isDeny
                        ? 'border-red-500/35 hover:border-red-500/60'
                        : fw.risk.level === 'CRITICAL' ||
                          fw.risk.level === 'HIGH'
                        ? 'border-amber-500/45 hover:border-amber-500/70'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        {/* Badges Row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isFocusedFromMap && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-sky-600 text-white">
                              🎯 FOCUSED RULE
                            </span>
                          )}
                          {/* ALLOW vs DENY Badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border ${
                              isDeny
                                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isDeny ? (
                              <ShieldOff className="w-3 h-3" />
                            ) : (
                              <ShieldCheck className="w-3 h-3" />
                            )}
                            <span>{fw.action}</span>
                          </span>

                          {/* Direction Badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              isEgress
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {isEgress ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownLeft className="w-3 h-3" />
                            )}
                            <span>{fw.direction}</span>
                          </span>

                          {/* Rule Name */}
                          <span
                            className={`text-xs font-extrabold font-mono ${
                              fw.disabled
                                ? 'line-through text-zinc-400'
                                : 'text-zinc-950 dark:text-zinc-50'
                            }`}
                          >
                            {fw.name}
                          </span>

                          {/* Priority Pill */}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold">
                            Priority: {fw.priority ?? 1000}
                          </span>

                          {/* VPC Network Pill */}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            vpc:{fw.network}
                          </span>

                          {/* Security Posture Pill */}
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              fw.risk.level === 'CRITICAL' ||
                              fw.risk.level === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                            }`}
                          >
                            {fw.risk.label}
                          </span>

                          {fw.logConfig?.enable && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                              Logs: ON
                            </span>
                          )}
                        </div>

                        {/* Protocols, Ranges, and Target Tags */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-500">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>
                              {isDeny ? 'Denied Ports:' : 'Allowed Ports:'}
                            </span>
                            {(fw.protocolsFormatted || []).map((p, idx) => (
                              <span
                                key={idx}
                                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                  isDeny
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-300'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {p}
                              </span>
                            ))}
                          </div>

                          <div>
                            <span>{isEgress ? 'Dest CIDR:' : 'Source CIDR:'}</span>{' '}
                            <strong className="text-zinc-800 dark:text-zinc-200">
                              {ranges.join(', ')}
                            </strong>
                          </div>

                          <div>
                            <span>Targets:</span>{' '}
                            <strong className="text-zinc-800 dark:text-zinc-200">
                              {fw.targetTags?.length
                                ? `tags: ${fw.targetTags.join(', ')}`
                                : fw.targetServiceAccounts?.length
                                ? `sa: ${fw.targetServiceAccounts.join(', ')}`
                                : 'All instances in VPC'}
                            </strong>
                          </div>
                        </div>

                        {fw.description && (
                          <p className="text-[11px] text-zinc-400">
                            {fw.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons Column: X-Ray on Map, Rule Logs, Lock to IAP, Restore Public, Enable/Disable Toggle, Edit, Delete */}
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        <button
                          type="button"
                          data-feature-id="VPC_FW_XRAY_ON_MAP"
                          onClick={() => handleTestRuleOnMap(fw)}
                          title="Launch a live packet for this rule's protocol/port on the Global World Map and inspect its Priority 0 -> 65535 X-Ray evaluation"
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-300 border border-sky-500/35 transition-colors cursor-pointer"
                        >
                          <Globe className="w-3 h-3" />
                          <span>🔬 X-Ray on Map</span>
                        </button>

                        <button
                          type="button"
                          data-feature-id="VPC_FW_RULE_LOGS"
                          onClick={() => handleOpenRuleLogs(fw)}
                          title="Open Cloud Logs Explorer & Shell Studio pre-filtered to this firewall rule"
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Logs ↗</span>
                        </button>

                        {isPublicAllowIngress && (
                          <button
                            type="button"
                            data-feature-id="VPC_FW_LOCK_TO_IAP"
                            disabled={Boolean(tracker)}
                            onClick={() => setPendingIapLockdownFw(fw)}
                            title="Replace 0.0.0.0/0 with Google Cloud IAP Zero-Trust CIDR (35.235.240.0/20) — opens impact warning first"
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Lock to IAP</span>
                          </button>
                        )}

                        {!isDeny && !isEgress && isIapProtected && !ranges.includes('0.0.0.0/0') && (
                          <button
                            type="button"
                            data-feature-id="VPC_FW_RESTORE_PUBLIC"
                            disabled={Boolean(tracker)}
                            onClick={() => handleRestoreFromIap(fw)}
                            title="Restore sourceRanges back to 0.0.0.0/0 so direct gcloud compute ssh / public IP connections work without --tunnel-through-iap"
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Restore 0.0.0.0/0</span>
                          </button>
                        )}

                        <button
                          type="button"
                          data-feature-id="VPC_FW_TOGGLE_PAUSE"
                          disabled={Boolean(tracker)}
                          onClick={() => handleToggleRuleDisabled(fw)}
                          title={
                            fw.disabled
                              ? 'Enable firewall rule on GCP'
                              : 'Pause / disable firewall rule without deleting it'
                          }
                          className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border transition-colors cursor-pointer disabled:opacity-50 ${
                            fw.disabled
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{fw.disabled ? 'Enable' : 'Pause'}</span>
                        </button>

                        <button
                          type="button"
                          data-feature-id="VPC_FW_EDIT_RULE"
                          disabled={Boolean(tracker)}
                          onClick={() => handleOpenEditStudio(fw)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {confirmDeleteKey === delKey ? (
                          <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-0.5">
                            <button
                              type="button"
                              data-feature-id="VPC_FW_DELETE_RULE"
                              onClick={() =>
                                handleConfirmDelete('VPC Firewall Rule', fw.name)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(null)}
                              className="text-[10px] font-mono text-zinc-500 px-1 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            data-feature-id="VPC_FW_DELETE_RULE"
                            disabled={Boolean(tracker)}
                            onClick={() => setConfirmDeleteKey(delKey)}
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live GCP Global Operation Progress Bar per Firewall Card */}
                    {tracker && (
                      <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span
                            className={`font-bold ${
                              tracker.status === 'DONE'
                                ? 'text-emerald-400'
                                : 'text-blue-400'
                            }`}
                          >
                            {tracker.status === 'DONE'
                              ? '✓ GCP GLOBAL FIREWALL OPERATION DONE'
                              : `GCP GLOBAL OPERATION: ${tracker.status}`}
                          </span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                            {tracker.progress}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-50 dark:bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${tracker.progress}%` }}
                            className={`h-full transition-all duration-300 rounded-full ${
                              tracker.status === 'DONE'
                                ? 'bg-emerald-500'
                                : 'bg-blue-600 animate-pulse'
                            }`}
                          />
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 truncate">
                          {tracker.stepLabel}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Google Cloud Implied Default Firewall Rules Reference Footer */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    <strong>Google Cloud Implied Fallback Rules (Priority 65535):</strong>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    ✓ default-allow-egress (EGRESS · 0.0.0.0/0 · all · 65535)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">
                    ✕ default-deny-ingress (INGRESS · 0.0.0.0/0 · all · 65535)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zero-Trust IAP Hardening Behavioral Impact Warning Modal */}
      {pendingIapLockdownFw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border-2 border-amber-500/50 bg-zinc-950 text-zinc-100 shadow-2xl p-5 space-y-4 font-mono">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                    Zero-Trust IAP Hardening · Important CLI &amp; Network Behavior Warning
                  </div>
                  <h4 className="text-sm font-extrabold text-white">
                    Lock &ldquo;{pendingIapLockdownFw.name}&rdquo; to Google Cloud IAP (`35.235.240.0/20`)?
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingIapLockdownFw(null)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 text-xs leading-relaxed">
              <p className="text-amber-200 font-bold">
                Before hardening this rule, please review how your future SSH &amp; network connections will behave:
              </p>
              <ul className="space-y-2 text-[11px] text-zinc-200 list-disc pl-4">
                <li>
                  <strong className="text-white">Direct Bash `gcloud compute ssh` Without Flag Will Time Out:</strong>{' '}
                  Replacing <code className="text-red-300">0.0.0.0/0</code> with <code className="text-emerald-300">35.235.240.0/20</code> blocks direct internet packets to your VM&apos;s public IP on port 22. Running plain{' '}
                  <code className="text-amber-300">gcloud compute ssh &lt;vm-name&gt;</code> in your local bash terminal will stall/time out unless you add{' '}
                  <code className="text-emerald-300 font-bold">--tunnel-through-iap</code>:
                  <div className="mt-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-emerald-300 select-all">
                    gcloud compute ssh &lt;vm-name&gt; --zone=&lt;zone&gt; --project={projectId} --tunnel-through-iap
                  </div>
                </li>
                <li>
                  <strong className="text-white">CloudPulse Built-In Xterm.js SSH Auto-Adapts:</strong>{' '}
                  Inside this app, CloudPulse automatically detects the IAP firewall rule and tunnels via <code className="text-emerald-300">--tunnel-through-iap</code>.
                </li>
                {(pendingIapLockdownFw.protocolsFormatted || []).some((p) =>
                  /\b(80|443|8080|3000|8888)\b/.test(p)
                ) && (
                  <li className="text-red-300 font-bold">
                    Web Traffic Warning (HTTP/HTTPS Ports Detected): This rule permits web ports ({(pendingIapLockdownFw.protocolsFormatted || []).join(', ')}). Locking it to <code className="text-amber-300">35.235.240.0/20</code> will block public web browsers from opening your VM&apos;s external IP directly!
                  </li>
                )}
              </ul>
              <p className="text-[11px] text-zinc-400">
                You can revert this rule back to <code className="text-emerald-300">0.0.0.0/0</code> at any time using the <strong>Restore 0.0.0.0/0</strong> button on the firewall card.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingIapLockdownFw(null);
                    onSelectTab('VM_SSH');
                  }}
                  className="mr-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Open Xterm.js SSH Studio</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPendingIapLockdownFw(null)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Cancel (Keep 0.0.0.0/0)
              </button>
              <button
                type="button"
                onClick={() => handleLockdownToIap(pendingIapLockdownFw)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>I Understand — Lock to IAP (35.235.240.0/20)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
