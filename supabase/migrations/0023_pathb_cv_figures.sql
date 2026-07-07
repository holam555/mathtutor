-- Path B (parent past-paper uploads): CV figure detection results + crop
-- confirmation state. See docs/figure_extraction_diagnosis.md.
--
-- cv_figures: per-page detection output, original-image pixel coords —
--   [{ page: 1, width, height, anchors: [{aid, box}], figures: [{fid, box,
--      band, composite?, members?}] }, …]
-- crops_confirmed: parent has been through the crop-review step (figures
--   chosen/adjusted/declined). Teacher review can proceed either way, but
--   the review list can surface unconfirmed uploads.

BEGIN;

ALTER TABLE past_paper_uploads
  ADD COLUMN IF NOT EXISTS cv_figures jsonb,
  ADD COLUMN IF NOT EXISTS crops_confirmed boolean NOT NULL DEFAULT false;

COMMIT;
