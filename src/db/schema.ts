import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Postgres full-text vector. Reserved for v2 server-side search (docs/PLAN.md section 5). */
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const COURSE_LEVELS = ["licenta", "master"] as const;
export const SESSIONS = ["prima", "restante", "partial", "altele"] as const;
export const ATTACHMENT_KINDS = ["image", "pdf", "doc", "archive", "text", "other"] as const;

export const course = pgTable("course", {
  id: serial("id").primaryKey(),
  /** materie.id from the 2011 export; null for courses created in v2. */
  legacyId: integer("legacy_id").unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /** 1..4 for licență, 1..2 for master. */
  year: smallint("year").notNull(),
  level: text("level", { enum: COURSE_LEVELS }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subject = pgTable(
  "subject",
  {
    id: serial("id").primaryKey(),
    /** subiect.id from the 2011 export; also the public URL id. Null for v2 subjects. */
    legacyId: integer("legacy_id").unique(),
    courseId: integer("course_id")
      .notNull()
      .references(() => course.id),
    professor: text("professor"),
    examYear: smallint("exam_year"),
    examDate: date("exam_date"),
    session: text("session", { enum: SESSIONS }).notNull(),
    series: text("series"),
    groupName: text("group_name"),
    /** Sanitised HTML. The only content field that may be rendered. */
    contentHtml: text("content_html").notNull(),
    /** Plain text derived from contentHtml, for search and snippets. */
    contentText: text("content_text").notNull(),
    /** Null when the subject was posted anonymously. */
    posterName: text("poster_name"),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    /**
     * Reserved for v2. 'simple' config, no unaccent: unaccent() is not IMMUTABLE and cannot be
     * used in a generated column without a wrapper function. Add that wrapper in v2 if needed.
     */
    search: tsvector("search").generatedAlwaysAs(
      sql`to_tsvector('simple', coalesce(professor, '') || ' ' || coalesce(content_text, ''))`,
    ),
  },
  (t) => [
    index("subject_course_year_idx").on(t.courseId, t.examYear.desc()),
    index("subject_hidden_created_idx").on(t.hidden, t.createdAt.desc()),
    index("subject_search_idx").using("gin", t.search),
  ],
);

export const attachment = pgTable(
  "attachment",
  {
    id: serial("id").primaryKey(),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subject.id, { onDelete: "cascade" }),
    /** Original filename, used for Content-Disposition on download. May contain any character. */
    originalName: text("original_name").notNull(),
    /** ASCII object key of the original file in R2. */
    storageKey: text("storage_key").notNull().unique(),
    /** Images only: max 2000 px WebP. */
    webKey: text("web_key"),
    /** Images only: max 400 px WebP. */
    thumbKey: text("thumb_key"),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    /** Images only, after EXIF rotation. */
    width: integer("width"),
    height: integer("height"),
    kind: text("kind", { enum: ATTACHMENT_KINDS }).notNull(),
    sortOrder: smallint("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attachment_subject_idx").on(t.subjectId, t.sortOrder)],
);

export const courseRelations = relations(course, ({ many }) => ({
  subjects: many(subject),
}));

export const subjectRelations = relations(subject, ({ one, many }) => ({
  course: one(course, { fields: [subject.courseId], references: [course.id] }),
  attachments: many(attachment),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  subject: one(subject, { fields: [attachment.subjectId], references: [subject.id] }),
}));

export type Course = typeof course.$inferSelect;
export type NewCourse = typeof course.$inferInsert;
export type Subject = typeof subject.$inferSelect;
export type NewSubject = typeof subject.$inferInsert;
export type Attachment = typeof attachment.$inferSelect;
export type NewAttachment = typeof attachment.$inferInsert;
export type CourseLevel = (typeof COURSE_LEVELS)[number];
export type Session = (typeof SESSIONS)[number];
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];
