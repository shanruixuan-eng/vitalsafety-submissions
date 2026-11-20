import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const submissions = sqliteTable("submissions", {
  id: text().primaryKey(),
  category: text().notNull(),
  title: text().notNull(),
  fields: text().notNull(),
  images: text().notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("submissions_created_at").on(table.createdAt)]);
