import { pgTable, text, timestamp, boolean, jsonb, bigint, doublePrecision } from 'drizzle-orm/pg-core'

// ─────────────────────────────────────────────
// Authentication Tables (Better-auth)
// ─────────────────────────────────────────────

export const user = pgTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image:         text('image'),
  tokenQuota:    bigint('tokenQuota', { mode: 'number' }).notNull().default(100000),
  tokenBalance:  bigint('tokenBalance', { mode: 'number' }).notNull().default(100000),
  encryptedOpenAIKey: text('encryptedOpenAIKey'),
  encryptedElevenLabsKey: text('encryptedElevenLabsKey'),
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
  playbackSettings: jsonb('playbackSettings').notNull().default({}),
  shareKey:        text('shareKey').notNull(),
  visibility:      text('visibility').notNull().default('private'), // 'private' | 'link-shared' | 'collaborative' | 'public'
  createdAt:       bigint('createdAt', { mode: 'number' }).notNull(), // Epoch ms
  updatedAt:       bigint('updatedAt', { mode: 'number' }).notNull(), // Epoch ms
  forkedFromId:    text('forkedFromId'), // Parent project if this is a fork/branch
  headCommitId:    text('headCommitId'), // Active head commit hash
})

export const projectCommits = pgTable('project_commits', {
  id:              text('id').primaryKey(), // Commit Hash (UUID)
  projectId:       text('projectId').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  parentCommitId:  text('parentCommitId'), // Nullable parent commit
  authorId:        text('authorId').references(() => user.id, { onDelete: 'set null' }),
  authorName:      text('authorName').notNull(),
  message:         text('message').notNull(),
  slides:          jsonb('slides').notNull().default([]),
  transitions:     jsonb('transitions').notNull().default([]),
  prototypeLayout: jsonb('prototypeLayout').notNull().default({}),
  createdAt:       bigint('createdAt', { mode: 'number' }).notNull(),
})

export const pullRequests = pgTable('pull_requests', {
  id:              text('id').primaryKey(), // UUID
  sourceProjectId: text('sourceProjectId').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  targetProjectId: text('targetProjectId').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sourceCommitId:  text('sourceCommitId').notNull().references(() => projectCommits.id, { onDelete: 'cascade' }),
  targetCommitId:  text('targetCommitId').notNull().references(() => projectCommits.id, { onDelete: 'cascade' }),
  title:           text('title').notNull(),
  description:     text('description').notNull().default(''),
  status:          text('status').notNull().default('open'), // 'open' | 'merged' | 'closed'
  createdAt:       bigint('createdAt', { mode: 'number' }).notNull(),
  updatedAt:       bigint('updatedAt', { mode: 'number' }).notNull(),
})

export const projectSuggestions = pgTable('project_suggestions', {
  id:              text('id').primaryKey(), // UUID
  projectId:       text('projectId').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  authorId:        text('authorId'), // Nullable for guest/incognito collaborators
  authorName:      text('authorName').notNull().default('Collaborator'),
  slides:          jsonb('slides').notNull().default([]),
  transitions:     jsonb('transitions').notNull().default([]),
  prototypeLayout: jsonb('prototypeLayout').notNull().default({}),
  parentUpdatedAt: bigint('parentUpdatedAt', { mode: 'number' }).notNull(), // Master project updatedAt at start of edit
  status:          text('status').notNull().default('pending'), // 'pending' | 'merged' | 'rejected'
  createdAt:       bigint('createdAt', { mode: 'number' }).notNull(),
  updatedAt:       bigint('updatedAt', { mode: 'number' }).notNull(),
})

export const pullRequestComments = pgTable('pull_request_comments', {
  id:          text('id').primaryKey(),
  prId:        text('prId').notNull().references(() => pullRequests.id, { onDelete: 'cascade' }),
  slideId:     text('slideId').notNull(),
  elementId:   text('elementId'), // Nullable
  x:           doublePrecision('x'),
  y:           doublePrecision('y'),
  authorId:    text('authorId').references(() => user.id, { onDelete: 'set null' }),
  authorName:  text('authorName').notNull(),
  content:     text('content').notNull(),
  resolved:    boolean('resolved').notNull().default(false),
  createdAt:   bigint('createdAt', { mode: 'number' }).notNull(),
})

