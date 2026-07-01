-- approved_by (-> users) and daily_protocol_id (-> daily_protocols) were the
-- only two unindexed FK columns project-wide (per get_advisors), on a table
-- reconstructed from live schema that missed the FK-covering-index pass
-- applied everywhere else (20260604133257 / 20260328160944).
CREATE INDEX IF NOT EXISTS rtp_prescription_approvals_approved_by_idx
  ON public.rtp_prescription_approvals (approved_by);

CREATE INDEX IF NOT EXISTS rtp_prescription_approvals_daily_protocol_id_idx
  ON public.rtp_prescription_approvals (daily_protocol_id);
