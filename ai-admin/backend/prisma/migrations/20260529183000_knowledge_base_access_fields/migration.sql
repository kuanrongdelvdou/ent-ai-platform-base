ALTER TABLE "knowledge_bases"
  ADD COLUMN "dept_id" TEXT,
  ADD COLUMN "owner_id" TEXT,
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'dept',
  ADD COLUMN "embedding_model_id" TEXT;

ALTER TABLE "knowledge_bases"
  ADD CONSTRAINT "knowledge_bases_dept_id_fkey"
  FOREIGN KEY ("dept_id") REFERENCES "departments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "knowledge_bases"
  ADD CONSTRAINT "knowledge_bases_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "knowledge_bases_dept_id_idx" ON "knowledge_bases"("dept_id");
CREATE INDEX "knowledge_bases_owner_id_idx" ON "knowledge_bases"("owner_id");
CREATE INDEX "knowledge_bases_visibility_idx" ON "knowledge_bases"("visibility");
