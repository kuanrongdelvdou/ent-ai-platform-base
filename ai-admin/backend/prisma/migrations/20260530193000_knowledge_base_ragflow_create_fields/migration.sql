ALTER TABLE "knowledge_bases"
  ADD COLUMN "parse_type" INTEGER,
  ADD COLUMN "pipeline_id" TEXT;

CREATE INDEX "knowledge_bases_parse_type_idx" ON "knowledge_bases"("parse_type");
CREATE INDEX "knowledge_bases_pipeline_id_idx" ON "knowledge_bases"("pipeline_id");
