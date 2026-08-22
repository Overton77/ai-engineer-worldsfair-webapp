-- Mission 001 is additive: no legacy challenge, attempt, evaluator, reward, or promotion objects are changed.
create table public.stock_research_challenge_version (
  slug text not null,
  version text not null,
  title text not null,
  curriculum_audience text not null default 'adult' check (curriculum_audience = 'adult'),
  instructions_md text not null,
  published_at timestamptz not null,
  primary key (slug, version)
);
insert into public.stock_research_challenge_version(slug, version, title, instructions_md, published_at)
values ('source-grounded-stock-research', '1.0.0', 'Mission 001: Source-grounded stock research',
'Create an as-of-date research bundle from public sources. This lab uses synthetic portfolios and paper trading only; it is educational and is not personalized investment advice.', now());

create type public.stock_research_state as enum ('queued','researching','awaiting_approval','approved','rejected','failed');
create table public.stock_research_run (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null,
  ticker text not null check (ticker ~ '^[A-Z][A-Z0-9.-]{0,9}$'),
  as_of timestamptz not null check (as_of <= now()),
  challenge_slug text not null default 'source-grounded-stock-research',
  challenge_version text not null,
  state public.stock_research_state not null default 'queued',
  failure_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), decided_at timestamptz,
  foreign key(challenge_slug, challenge_version) references public.stock_research_challenge_version(slug, version),
  check (tenant_id = user_id),
  check ((state in ('approved','rejected')) = (decided_at is not null))
);
create index stock_research_run_owner_created_idx on public.stock_research_run(tenant_id,user_id,created_at desc);
create index stock_research_run_queue_idx on public.stock_research_run(state,created_at) where state in ('queued','researching');

create table public.stock_research_bundle (
  run_id uuid primary key references public.stock_research_run(id) on delete cascade,
  schema_version text not null check (schema_version = '1.0'),
  bundle jsonb not null check (jsonb_typeof(bundle) = 'object'),
  created_at timestamptz not null default now()
);
create table public.stock_research_evidence (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.stock_research_run(id) on delete cascade,
  ordinal integer not null check (ordinal >= 0), source_url text not null check (source_url ~ '^https://'),
  publisher text not null check (length(trim(publisher)) > 0), retrieved_at timestamptz not null,
  published_at timestamptz, excerpt text, structured_fact jsonb,
  unique(run_id, ordinal), check (nullif(trim(excerpt),'') is not null or structured_fact is not null)
);
create index stock_research_evidence_run_idx on public.stock_research_evidence(run_id,ordinal);
create table public.stock_research_decision_audit (
  id bigint generated always as identity primary key, run_id uuid not null references public.stock_research_run(id),
  actor_id uuid not null references auth.users(id), tenant_id uuid not null, decision public.stock_research_state not null check(decision in ('approved','rejected')),
  decided_at timestamptz not null default clock_timestamp()
);
create index stock_research_audit_run_idx on public.stock_research_decision_audit(run_id,id);

alter table public.stock_research_challenge_version enable row level security;
alter table public.stock_research_run enable row level security;
alter table public.stock_research_bundle enable row level security;
alter table public.stock_research_evidence enable row level security;
alter table public.stock_research_decision_audit enable row level security;
create policy stock_challenge_read on public.stock_research_challenge_version for select to authenticated using (true);
create policy stock_run_read on public.stock_research_run for select to authenticated using (user_id=(select auth.uid()) and tenant_id=(select auth.uid()));
create policy stock_run_insert on public.stock_research_run for insert to authenticated with check (user_id=(select auth.uid()) and tenant_id=(select auth.uid()) and state='queued');
create policy stock_bundle_read on public.stock_research_bundle for select to authenticated using (exists(select 1 from public.stock_research_run r where r.id=run_id and r.user_id=(select auth.uid()) and r.tenant_id=(select auth.uid())));
create policy stock_evidence_read on public.stock_research_evidence for select to authenticated using (exists(select 1 from public.stock_research_run r where r.id=run_id and r.user_id=(select auth.uid()) and r.tenant_id=(select auth.uid())));
create policy stock_audit_read on public.stock_research_decision_audit for select to authenticated using (actor_id=(select auth.uid()) and tenant_id=(select auth.uid()));

create function public.stock_research_reject_mutation() returns trigger language plpgsql as $$ begin raise exception 'immutable stock research record'; end $$;
create trigger stock_bundle_immutable before update or delete on public.stock_research_bundle for each row execute function public.stock_research_reject_mutation();
create trigger stock_evidence_immutable before update or delete on public.stock_research_evidence for each row execute function public.stock_research_reject_mutation();
create trigger stock_audit_append_only before update or delete on public.stock_research_decision_audit for each row execute function public.stock_research_reject_mutation();

create function public.stock_research_claim_run(p_run_id uuid,p_version text) returns boolean language plpgsql security definer set search_path=public as $$
declare changed integer; begin update stock_research_run set state='researching',updated_at=clock_timestamp() where id=p_run_id and state='queued' and challenge_version=p_version; get diagnostics changed=row_count; return changed=1; end $$;
create function public.stock_research_complete_run(p_run_id uuid,p_bundle jsonb) returns void language plpgsql security definer set search_path=public as $$
declare r stock_research_run; item jsonb; i integer:=0; begin
 select * into r from stock_research_run where id=p_run_id for update;
 if r.state <> 'researching' then raise exception 'invalid run state'; end if;
 if p_bundle->>'ticker' <> r.ticker or (p_bundle->>'asOf')::timestamptz <> r.as_of then raise exception 'bundle/run mismatch'; end if;
 if jsonb_array_length(coalesce(p_bundle->'evidence','[]'))=0 then raise exception 'evidence required'; end if;
 if jsonb_array_length(coalesce(p_bundle->'thesis','[]'))=0 or jsonb_array_length(coalesce(p_bundle->'counterThesis','[]'))=0 or jsonb_array_length(coalesce(p_bundle->'uncertainties','[]'))=0 then raise exception 'cited analysis sections required'; end if;
 if coalesce((p_bundle#>>'{paperTrade,simulationOnly}')::boolean,false) is not true or p_bundle->>'disclaimer' <> 'Educational paper-trading simulation only; not personalized investment advice.' then raise exception 'paper-trading safety boundary required'; end if;
 for item in select * from jsonb_array_elements(p_bundle->'evidence') loop
  if item->>'sourceUrl' !~ '^https://' or nullif(trim(item->>'publisher'),'') is null or (nullif(item->>'excerpt','') is null and item->'structuredFact' is null) then raise exception 'invalid evidence'; end if;
  if item->>'publishedAt' is not null and (item->>'publishedAt')::timestamptz > r.as_of then raise exception 'post-as-of evidence'; end if;
  insert into stock_research_evidence(run_id,ordinal,source_url,publisher,retrieved_at,published_at,excerpt,structured_fact) values(p_run_id,i,item->>'sourceUrl',item->>'publisher',(item->>'retrievedAt')::timestamptz,(item->>'publishedAt')::timestamptz,item->>'excerpt',item->'structuredFact'); i:=i+1;
 end loop;
 insert into stock_research_bundle(run_id,schema_version,bundle) values(p_run_id,p_bundle->>'schemaVersion',p_bundle);
 update stock_research_run set state='awaiting_approval',updated_at=clock_timestamp() where id=p_run_id;
end $$;
create function public.stock_research_decide_run(p_run_id uuid,p_decision text) returns public.stock_research_run language plpgsql security definer set search_path=public as $$
declare r stock_research_run; actor uuid:=auth.uid(); decision_state stock_research_state; ts timestamptz:=clock_timestamp(); begin
 if actor is null or p_decision not in ('approved','rejected') then raise exception 'forbidden'; end if; decision_state:=p_decision::stock_research_state;
 select * into r from stock_research_run where id=p_run_id and user_id=actor and tenant_id=actor for update;
 if r.id is null then raise exception 'not found'; end if; if r.state <> 'awaiting_approval' then raise exception 'invalid run state'; end if;
 update stock_research_run set state=decision_state,decided_at=ts,updated_at=ts where id=p_run_id returning * into r;
 insert into stock_research_decision_audit(run_id,actor_id,tenant_id,decision,decided_at) values(r.id,actor,r.tenant_id,decision_state,ts); return r;
end $$;
revoke all on function public.stock_research_claim_run(uuid,text) from public,anon,authenticated;
revoke all on function public.stock_research_complete_run(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.stock_research_claim_run(uuid,text) to service_role;
grant execute on function public.stock_research_complete_run(uuid,jsonb) to service_role;
revoke all on function public.stock_research_decide_run(uuid,text) from public,anon;
grant execute on function public.stock_research_decide_run(uuid,text) to authenticated;
grant select,insert on public.stock_research_run to authenticated;
grant select on public.stock_research_challenge_version,public.stock_research_bundle,public.stock_research_evidence,public.stock_research_decision_audit to authenticated;
