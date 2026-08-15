/**
 * iconResolver.ts
 *
 * Comprehensive mapping for AWS Architecture & Resource icons.
 * Covers all major service categories available in the public AWS icon pack.
 */

export type IconEntry = {
  path: string;
  tier: 'aws' | 'gcp' | 'generic';
  confidence: number;
};

// ─── AWS Icon Map ─────────────────────────────────────────────────────────────
// Keys are lowercase keywords the AI or user might use.
// Paths are relative to the /public root.

const AWS_ARCH = 'icons/aws/Architecture-Service-Icons_01302026'
const AWS_RES  = 'icons/aws/Resource-Icons_01302026'

const AWS_ICON_MAP: Record<string, string> = {
  // ── Compute ──────────────────────────────────────────────────────────────
  'lambda':             `${AWS_ARCH}/Arch_Compute/32/Arch_AWS-Lambda_32.svg`,
  'ec2':                `${AWS_ARCH}/Arch_Compute/32/Arch_Amazon-EC2_32.svg`,
  'ecs':                `${AWS_ARCH}/Arch_Compute/32/Arch_Amazon-Elastic-Container-Service_32.svg`,
  'eks':                `${AWS_ARCH}/Arch_Compute/32/Arch_Amazon-Elastic-Kubernetes-Service_32.svg`,
  'fargate':            `${AWS_ARCH}/Arch_Compute/32/Arch_AWS-Fargate_32.svg`,
  'batch':              `${AWS_ARCH}/Arch_Compute/32/Arch_AWS-Batch_32.svg`,
  'elastic beanstalk':  `${AWS_ARCH}/Arch_Compute/32/Arch_AWS-Elastic-Beanstalk_32.svg`,
  'lightsail':          `${AWS_ARCH}/Arch_Compute/32/Arch_Amazon-Lightsail_32.svg`,
  'app runner':         `${AWS_ARCH}/Arch_Compute/32/Arch_AWS-App-Runner_32.svg`,
  'auto scaling':       `${AWS_ARCH}/Arch_Compute/32/Arch_Amazon-EC2-Auto-Scaling_32.svg`,
  'outposts':           `${AWS_ARCH}/Arch_Compute/32/Arch_AWS-Outposts_32.svg`,

  // ── Storage ───────────────────────────────────────────────────────────────
  's3':                 `${AWS_ARCH}/Arch_Storage/32/Arch_Amazon-S3_32.svg`,
  'efs':                `${AWS_ARCH}/Arch_Storage/32/Arch_Amazon-EFS_32.svg`,
  'fsx':                `${AWS_ARCH}/Arch_Storage/32/Arch_Amazon-FSx_32.svg`,
  's3 glacier':         `${AWS_ARCH}/Arch_Storage/32/Arch_Amazon-S3-Glacier_32.svg`,
  'glacier':            `${AWS_ARCH}/Arch_Storage/32/Arch_Amazon-S3-Glacier_32.svg`,
  'backup':             `${AWS_ARCH}/Arch_Storage/32/Arch_AWS-Backup_32.svg`,
  'storage gateway':    `${AWS_ARCH}/Arch_Storage/32/Arch_AWS-Storage-Gateway_32.svg`,

  // ── Databases ─────────────────────────────────────────────────────────────
  'rds':                `${AWS_ARCH}/Arch_Databases/32/Arch_Amazon-RDS_32.svg`,
  'aurora':             `${AWS_ARCH}/Arch_Databases/32/Arch_Amazon-Aurora_32.svg`,
  'dynamodb':           `${AWS_ARCH}/Arch_Databases/32/Arch_Amazon-DynamoDB_32.svg`,
  'elasticache':        `${AWS_ARCH}/Arch_Databases/32/Arch_Amazon-ElastiCache_32.svg`,
  'redshift':           `${AWS_ARCH}/Arch_Databases/32/Arch_Amazon-Redshift_32.svg`,
  'documentdb':         `${AWS_ARCH}/Arch_Databases/32/Arch_Amazon-DocumentDB_32.svg`,
  'neptune':            `${AWS_ARCH}/Arch_Databases/32/Arch_Amazon-Neptune_32.svg`,
  'timestream':         `${AWS_ARCH}/Arch_Databases/32/Arch_Amazon-Timestream_32.svg`,
  'qldb':               `${AWS_ARCH}/Arch_Databases/32/Arch_Amazon-QLDB_32.svg`,

  // ── Networking & Content Delivery ─────────────────────────────────────────
  'cloudfront':         `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_Amazon-CloudFront_32.svg`,
  'api gateway':        `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_Amazon-API-Gateway_32.svg`,
  'vpc':                `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_Amazon-VPC_32.svg`,
  'route53':            `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_Amazon-Route-53_32.svg`,
  'elb':                `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_Elastic-Load-Balancing_32.svg`,
  'alb':                `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_Elastic-Load-Balancing_32.svg`,
  'load balancer':      `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_Elastic-Load-Balancing_32.svg`,
  'waf':                `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_AWS-WAF_32.svg`,
  'direct connect':     `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_AWS-Direct-Connect_32.svg`,
  'transit gateway':    `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_AWS-Transit-Gateway_32.svg`,
  'global accelerator': `${AWS_ARCH}/Arch_Networking-Content-Delivery/32/Arch_AWS-Global-Accelerator_32.svg`,

  // ── Application Integration ───────────────────────────────────────────────
  'sqs':                `${AWS_ARCH}/Arch_Application-Integration/32/Arch_Amazon-Simple-Queue-Service_32.svg`,
  'sns':                `${AWS_ARCH}/Arch_Application-Integration/32/Arch_Amazon-Simple-Notification-Service_32.svg`,
  'eventbridge':        `${AWS_ARCH}/Arch_Application-Integration/32/Arch_Amazon-EventBridge_32.svg`,
  'step functions':     `${AWS_ARCH}/Arch_Application-Integration/32/Arch_AWS-Step-Functions_32.svg`,
  'appsync':            `${AWS_ARCH}/Arch_Application-Integration/32/Arch_AWS-AppSync_32.svg`,
  'mq':                 `${AWS_ARCH}/Arch_Application-Integration/32/Arch_Amazon-MQ_32.svg`,

  // ── Analytics ─────────────────────────────────────────────────────────────
  'kinesis':            `${AWS_ARCH}/Arch_Analytics/32/Arch_Amazon-Kinesis_32.svg`,
  'glue':               `${AWS_ARCH}/Arch_Analytics/32/Arch_AWS-Glue_32.svg`,
  'emr':                `${AWS_ARCH}/Arch_Analytics/32/Arch_Amazon-EMR_32.svg`,
  'athena':             `${AWS_ARCH}/Arch_Analytics/32/Arch_Amazon-Athena_32.svg`,
  'opensearch':         `${AWS_ARCH}/Arch_Analytics/32/Arch_Amazon-OpenSearch-Service_32.svg`,
  'elasticsearch':      `${AWS_ARCH}/Arch_Analytics/32/Arch_Amazon-OpenSearch-Service_32.svg`,
  'quicksight':         `${AWS_ARCH}/Arch_Analytics/32/Arch_Amazon-QuickSight_32.svg`,
  'lake formation':     `${AWS_ARCH}/Arch_Analytics/32/Arch_AWS-Lake-Formation_32.svg`,
  'data pipeline':      `${AWS_ARCH}/Arch_Analytics/32/Arch_AWS-Data-Pipeline_32.svg`,
  'msk':                `${AWS_ARCH}/Arch_Analytics/32/Arch_Amazon-MSK_32.svg`,
  'kafka':              `${AWS_ARCH}/Arch_Analytics/32/Arch_Amazon-MSK_32.svg`,

  // ── Security, Identity & Compliance ──────────────────────────────────────
  'iam':                `${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_AWS-Identity-and-Access-Management_32.svg`,
  'cognito':            `${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_Amazon-Cognito_32.svg`,
  'kms':                `${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_AWS-Key-Management-Service_32.svg`,
  'secrets manager':    `${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_AWS-Secrets-Manager_32.svg`,
  'shield':             `${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_AWS-Shield_32.svg`,
  'guardduty':          `${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_Amazon-GuardDuty_32.svg`,
  'inspector':          `${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_Amazon-Inspector_32.svg`,
  'macie':              `${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_Amazon-Macie_32.svg`,
  'certificate manager':`${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_AWS-Certificate-Manager_32.svg`,
  'acm':                `${AWS_ARCH}/Arch_Security-Identity-Compliance/32/Arch_AWS-Certificate-Manager_32.svg`,

  // ── Developer Tools / Operations ──────────────────────────────────────────
  'cloudwatch':         `${AWS_ARCH}/Arch_Management-Governance/32/Arch_Amazon-CloudWatch_32.svg`,
  'cloudtrail':         `${AWS_ARCH}/Arch_Management-Governance/32/Arch_AWS-CloudTrail_32.svg`,
  'cloudformation':     `${AWS_ARCH}/Arch_Management-Governance/32/Arch_AWS-CloudFormation_32.svg`,
  'codepipeline':       `${AWS_ARCH}/Arch_Developer-Tools/32/Arch_AWS-CodePipeline_32.svg`,
  'codebuild':          `${AWS_ARCH}/Arch_Developer-Tools/32/Arch_AWS-CodeBuild_32.svg`,
  'codecommit':         `${AWS_ARCH}/Arch_Developer-Tools/32/Arch_AWS-CodeCommit_32.svg`,
  'codedeploy':         `${AWS_ARCH}/Arch_Developer-Tools/32/Arch_AWS-CodeDeploy_32.svg`,
  'xray':               `${AWS_ARCH}/Arch_Developer-Tools/32/Arch_AWS-X-Ray_32.svg`,

  // ── Machine Learning ──────────────────────────────────────────────────────
  'sagemaker':          `${AWS_ARCH}/Arch_Machine-Learning/32/Arch_Amazon-SageMaker_32.svg`,
  'bedrock':            `${AWS_ARCH}/Arch_Machine-Learning/32/Arch_Amazon-Bedrock_32.svg`,
  'rekognition':        `${AWS_ARCH}/Arch_Machine-Learning/32/Arch_Amazon-Rekognition_32.svg`,
  'comprehend':         `${AWS_ARCH}/Arch_Machine-Learning/32/Arch_Amazon-Comprehend_32.svg`,

  // ── General / Resource Icons ──────────────────────────────────────────────
  'user':     `${AWS_RES}/Res_General-Icons/Res_48_Dark/Res_User_48_Dark.svg`,
  'client':   `${AWS_RES}/Res_General-Icons/Res_48_Dark/Res_User_48_Dark.svg`,
  'mobile':   `${AWS_RES}/Res_General-Icons/Res_48_Dark/Res_Mobile-Client_48_Dark.svg`,
  'browser':  `${AWS_RES}/Res_General-Icons/Res_48_Dark/Res_Generic-Application_48_Dark.svg`,
  'database': `${AWS_RES}/Res_Databases/Res_48_Dark/Res_Amazon-RDS_Amazon-Aurora-Instance_48_Dark.svg`,
  'internet': `${AWS_RES}/Res_General-Icons/Res_48_Dark/Res_Internet_48_Dark.svg`,
}

// ─── GCP Icon Map ─────────────────────────────────────────────────────────────

const GCP_ICON_MAP: Record<string, string> = {
  'cloud functions':  'icons/gcp/compute/cloud-functions.svg',
  'gce':              'icons/gcp/compute/compute-engine.svg',
  'gke':              'icons/gcp/compute/kubernetes-engine.svg',
  'cloud run':        'icons/gcp/compute/cloud-run.svg',
  'gcs':              'icons/gcp/storage/cloud-storage.svg',
  'bigquery':         'icons/gcp/data/bigquery.svg',
  'pub/sub':          'icons/gcp/data/pubsub.svg',
  'cloud spanner':    'icons/gcp/data/cloud-spanner.svg',
  'cloud sql':        'icons/gcp/data/cloud-sql.svg',
  'cloud cdn':        'icons/gcp/networking/cloud-cdn.svg',
  'cloud load balancing': 'icons/gcp/networking/cloud-load-balancing.svg',
  'firestore':        'icons/gcp/data/firestore.svg',
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

export function resolveIcon(keyword: string): IconEntry {
  const normalized = keyword.toLowerCase().trim()
  if (AWS_ICON_MAP[normalized]) return { path: AWS_ICON_MAP[normalized], tier: 'aws', confidence: 1.0 }
  if (GCP_ICON_MAP[normalized]) return { path: GCP_ICON_MAP[normalized], tier: 'gcp', confidence: 1.0 }

  for (const [key, path] of Object.entries(AWS_ICON_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { path, tier: 'aws', confidence: 0.75 }
    }
  }

  // Fallback — use resource generic icon (Arch pack has no generic app icon)
  return { path: `${AWS_RES}/Res_General-Icons/Res_48_Dark/Res_Generic-Application_48_Dark.svg`, tier: 'aws', confidence: 0.3 }
}

export function buildIconHotlist(userPrompt: string): string[] {
  const words = userPrompt.toLowerCase().split(/\s+|,|\.|\//)
  const resolved = new Set<string>()
  for (const word of words) {
    if (word.length < 2) continue
    const entry = resolveIcon(word)
    if (entry.confidence >= 0.7) resolved.add(entry.path)
  }
  return Array.from(resolved)
}

/**
 * Returns a formatted multi-line table of all available icon keyword → path
 * mappings, suitable for embedding directly into an AI system prompt.
 */
export function buildIconHotlistString(): string {
  const allEntries = [
    ...Object.entries(AWS_ICON_MAP),
    ...Object.entries(GCP_ICON_MAP),
  ]
  return allEntries
    .map(([keyword, path]) => `  ${keyword.padEnd(22)} → ${path}`)
    .join('\n')
}

export function resolveIconPath(path: string) {
  const entry = resolveIcon(path)
  const parts = entry.path.split('/')
  return {
    found: true,
    path: entry.path,
    tier: entry.tier,
    category: parts[parts.length - 2] || 'general',
    label: parts[parts.length - 1].replace('.svg', '').replace(/Arch_|Res_|_48_Dark|_32/g, ''),
    fallback: 'rectangle' as const
  }
}

export function resolveIconPathString(keywordOrPath?: string): string | undefined {
  if (!keywordOrPath || typeof keywordOrPath !== 'string') return undefined
  const clean = keywordOrPath.trim()
  if (clean.startsWith('icons/')) return clean
  const res = resolveIconPath(clean)
  return res && typeof res === 'object' ? res.path : (typeof res === 'string' ? res : undefined)
}

