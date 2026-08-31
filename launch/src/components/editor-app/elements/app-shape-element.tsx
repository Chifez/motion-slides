import React from 'react';
import { staticFile } from 'remotion';

export type ShapeType =
  | 'circle'
  | 'server'
  | 'database'
  | 'cloud'
  | 'client'
  | 'lambda'
  | 'api-gateway'
  | 's3'
  | 'rds'
  | 'dynamodb'
  | 'aws-icon';

export interface AppShapeElementProps {
  shape: ShapeType;
  color?: string;
  label?: string;
  iconPath?: string;
  selected?: boolean;
  style?: React.CSSProperties;
}

// ── Official AWS Icon Paths ──────────────────────────────────────────────────
export const AWS_ICONS: Record<string, string> = {
  ec2: 'icons/aws/ec2.svg',
  lambda: 'icons/aws/lambda.svg',
  rds: 'icons/aws/rds.svg',
  dynamodb: 'icons/aws/dynamodb.svg',
  s3: 'icons/aws/s3.svg',
  apiGateway: 'icons/aws/api-gateway.svg',
};

export function CircleShape({ color = '#3b82f6' }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
      <circle cx="50" cy="50" r="45" fill="#09090b" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function ServerShape({ color = '#3b82f6' }: { color?: string }) {
  return <AwsIconBadge iconPath={AWS_ICONS.ec2} glowColor="rgba(59, 130, 246, 0.2)" />;
}

export function DatabaseShape({ color = '#3b82f6' }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', padding: 4, display: 'block' }}>
      <ellipse cx="50" cy="18" rx="38" ry="9" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <path d="M12 18 L12 82 A38 9 0 0 0 88 82 L88 18" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M12 18 L12 82 L88 82 L88 18 Z" fill="#09090b" stroke="none" />
      <ellipse cx="50" cy="82" rx="38" ry="9" fill="#09090b" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function AwsIconBadge({
  iconPath,
  glowColor = 'rgba(255, 255, 255, 0.08)',
}: {
  iconPath: string;
  glowColor?: string;
}) {
  const cleanPath = iconPath.startsWith('/') ? iconPath.slice(1) : iconPath;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(17, 17, 22, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px ${glowColor}`,
        padding: 10,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <img
        src={staticFile(cleanPath)}
        alt="AWS Service Icon"
        style={{
          width: '80%',
          height: '80%',
          objectFit: 'contain',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export function LambdaShape() {
  return <AwsIconBadge iconPath={AWS_ICONS.lambda} glowColor="rgba(245, 158, 11, 0.25)" />;
}

export function ApiGatewayShape() {
  return <AwsIconBadge iconPath={AWS_ICONS.apiGateway} glowColor="rgba(168, 85, 247, 0.25)" />;
}

export function S3Shape() {
  return <AwsIconBadge iconPath={AWS_ICONS.s3} glowColor="rgba(16, 185, 129, 0.25)" />;
}

export function RdsShape() {
  return <AwsIconBadge iconPath={AWS_ICONS.rds} glowColor="rgba(59, 130, 246, 0.25)" />;
}

export function DynamoDbShape() {
  return <AwsIconBadge iconPath={AWS_ICONS.dynamodb} glowColor="rgba(59, 130, 246, 0.25)" />;
}

export function AppShapeElement({
  shape,
  color = '#3b82f6',
  label,
  iconPath,
  selected = false,
  style,
}: AppShapeElementProps) {
  const renderShape = () => {
    switch (shape) {
      case 'circle':
      case 'client':
        return <CircleShape color={color} />;
      case 'server':
        return <ServerShape color={color} />;
      case 'database':
        return <DatabaseShape color={color} />;
      case 'lambda':
        return <LambdaShape />;
      case 'api-gateway':
        return <ApiGatewayShape />;
      case 's3':
        return <S3Shape />;
      case 'dynamodb':
        return <DynamoDbShape />;
      case 'aws-icon':
        return iconPath ? <AwsIconBadge iconPath={iconPath} /> : <ServerShape color={color} />;
      default:
        return <ServerShape color={color} />;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...style,
      }}
    >
      <div style={{ width: '100%', height: '100%', flex: 1 }}>{renderShape()}</div>
      {label && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'rgba(255, 255, 255, 0.85)',
            marginTop: 8,
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {label}
        </span>
      )}

      {/* Selected Element Bounding Outline (Figma/Keynote blue selection outline) */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: -4,
            border: '1.5px solid #18a0fb',
            borderRadius: 0,
            pointerEvents: 'none',
          }}
        >
          <div style={{ position: 'absolute', top: -3, left: -3, width: 6, height: 6, background: '#fff', border: '1px solid #18a0fb', borderRadius: 0 }} />
          <div style={{ position: 'absolute', top: -3, right: -3, width: 6, height: 6, background: '#fff', border: '1px solid #18a0fb', borderRadius: 0 }} />
          <div style={{ position: 'absolute', bottom: -3, left: -3, width: 6, height: 6, background: '#fff', border: '1px solid #18a0fb', borderRadius: 0 }} />
          <div style={{ position: 'absolute', bottom: -3, right: -3, width: 6, height: 6, background: '#fff', border: '1px solid #18a0fb', borderRadius: 0 }} />
        </div>
      )}
    </div>
  );
}
