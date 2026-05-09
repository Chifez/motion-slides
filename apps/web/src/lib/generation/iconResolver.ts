/**
 * iconResolver.ts
 *
 * Comprehensive mapping for AWS Architecture & Resource icons.
 */

export type IconEntry = {
  path: string;
  tier: 'aws' | 'gcp' | 'generic';
  confidence: number;
};

const AWS_ICON_MAP: Record<string, string> = {
  // --- Architecture Service Icons (32px SVG) ---
  'lambda': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_AWS-Lambda_32.svg',
  'ec2': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-EC2_32.svg',
  'ecs': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-Elastic-Container-Service_32.svg',
  'eks': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-Elastic-Kubernetes-Service_32.svg',
  'fargate': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_AWS-Fargate_32.svg',
  's3': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Storage/32/Arch_Amazon-S3_32.svg',
  'rds': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Databases/32/Arch_Amazon-RDS_32.svg',
  'dynamodb': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Databases/32/Arch_Amazon-DynamoDB_32.svg',
  'cloudfront': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/32/Arch_Amazon-CloudFront_32.svg',
  'api gateway': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/32/Arch_Amazon-API-Gateway_32.svg',
  'vpc': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/32/Arch_Amazon-VPC_32.svg',
  'sqs': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Application-Integration/32/Arch_Amazon-Simple-Queue-Service_32.svg',
  'sns': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Application-Integration/32/Arch_Amazon-Simple-Notification-Service_32.svg',
  'eventbridge': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Application-Integration/32/Arch_Amazon-EventBridge_32.svg',
  'kinesis': 'icons/aws/Architecture-Service-Icons_01302026/Arch_Analytics/32/Arch_Amazon-Kinesis_32.svg',

  // --- General & Resource Icons (fallback to Resource icons for clarity) ---
  'user': 'icons/aws/Resource-Icons_01302026/Res_General-Icons/Res_48_Dark/Res_User_48_Dark.svg',
  'client': 'icons/aws/Resource-Icons_01302026/Res_General-Icons/Res_48_Dark/Res_User_48_Dark.svg',
  'mobile': 'icons/aws/Resource-Icons_01302026/Res_General-Icons/Res_48_Dark/Res_Mobile-Client_48_Dark.svg',
  'browser': 'icons/aws/Resource-Icons_01302026/Res_General-Icons/Res_48_Dark/Res_Generic-Application_48_Dark.svg',
  'database': 'icons/aws/Resource-Icons_01302026/Res_Databases/Res_48_Dark/Res_Amazon-RDS_Amazon-Aurora-Instance_48_Dark.svg',
  'internet': 'icons/aws/Resource-Icons_01302026/Res_General-Icons/Res_48_Dark/Res_Internet_48_Dark.svg',
};

const GCP_ICON_MAP: Record<string, string> = {
  'cloud functions': 'icons/gcp/compute/cloud-functions.svg',
  'gce': 'icons/gcp/compute/compute-engine.svg',
  'gke': 'icons/gcp/compute/kubernetes-engine.svg',
  'gcs': 'icons/gcp/storage/cloud-storage.svg',
  'bigquery': 'icons/gcp/data/bigquery.svg',
};

export function resolveIcon(keyword: string): IconEntry {
  const normalized = keyword.toLowerCase().trim();
  if (AWS_ICON_MAP[normalized]) return { path: AWS_ICON_MAP[normalized], tier: 'aws', confidence: 1.0 };
  if (GCP_ICON_MAP[normalized]) return { path: GCP_ICON_MAP[normalized], tier: 'gcp', confidence: 1.0 };

  for (const [key, path] of Object.entries(AWS_ICON_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { path, tier: 'aws', confidence: 0.75 };
    }
  }

  // Fallbacks
  return { path: 'icons/aws/Architecture-Service-Icons_01302026/Arch_General-Icons/32/Arch_Generic-Application_32.svg', tier: 'aws', confidence: 0.3 };
}

export function buildIconHotlist(userPrompt: string): string[] {
  const words = userPrompt.toLowerCase().split(/\s+|,|\.|\//);
  const resolved = new Set<string>();
  for (const word of words) {
    if (word.length < 2) continue;
    const entry = resolveIcon(word);
    if (entry.confidence >= 0.7) resolved.add(entry.path);
  }
  return Array.from(resolved);
}

export function resolveIconPath(path: string) {
  const entry = resolveIcon(path);
  const parts = entry.path.split('/');
  return {
    found: true,
    path: entry.path,
    tier: entry.tier,
    category: parts[parts.length - 2] || 'general',
    label: parts[parts.length - 1].replace('.svg', '').replace(/Arch_|Res_|_48_Dark|_32/g, ''),
    fallback: 'rectangle' as const
  };
}
