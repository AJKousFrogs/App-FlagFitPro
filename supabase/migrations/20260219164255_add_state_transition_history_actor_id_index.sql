create index if not exists idx_state_transition_history_actor_id on public.state_transition_history(actor_id) where actor_id is not null;
