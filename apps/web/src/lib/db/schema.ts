import { pgTable, text, timestamp, boolean, jsonb, bigint } from 'drizzle-orm/pg-core'

// ─────────────────────────────────────────────
// Authentication Tables (Better-auth)
// ─────────────────────────────────────────────

export const user = pgTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image:         text('image'),
  createdAt:     timestamp('createdAt').notNull(),
  updatedAt:     timestamp('updatedAt').notNull(),
})

export const session = pgTable('session', {
  id:        text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token:     text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId:    text('userId').notNull().references(() => user.id),
})

export const account = pgTable('account', {
  id:                    text('id').primaryKey(),
  accountId:             text('accountId').notNull(),
  providerId:            text('providerId').notNull(),
  userId:                text('userId').notNull().references(() => user.id),
  accessToken:           text('accessToken'),
  refreshToken:          text('refreshToken'),
  idToken:               text('idToken'),
  accessTokenExpiresAt:  timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope:                 text('scope'),
  password:              text('password'),
  createdAt:             timestamp('createdAt').notNull(),
  updatedAt:             timestamp('updatedAt').notNull(),
})

export const verification = pgTable('verification', {
  id:        text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:     text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// ─────────────────────────────────────────────
// Project Persistence
// ─────────────────────────────────────────────

export const projects = pgTable('projects', {
  id:              text('id').primaryKey(), // UUID
  ownerId:         text('ownerId').notNull().references(() => user.id),
  name:            text('name').notNull(),
  description:     text('description').notNull().default(''),
  slides:          jsonb('slides').notNull().default([]),
  transitions:     jsonb('transitions').notNull().default([]),
  prototypeLayout: jsonb('prototypeLayout').notNull().default({}),
  shareKey:        text('shareKey').notNull(),
  visibility:      text('visibility').notNull().default('private'), // 'private' | 'link-shared' | 'collaborative' | 'public'
  createdAt:       bigint('createdAt', { mode: 'number' }).notNull(), // Epoch ms
  updatedAt:       bigint('updatedAt', { mode: 'number' }).notNull(), // Epoch ms
})
