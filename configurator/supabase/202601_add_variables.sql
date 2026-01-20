-- Variables migration (manual Supabase SQL)
-- Review before running in production. This script creates variables and migrates from attributes if present.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'variable_data_type') then
    create type variable_data_type as enum (
      'string',
      'number',
      'boolean',
      'datetime',
      'stringArray',
      'numberArray',
      'booleanArray',
      'datetimeArray',
      'collection'
    );
  end if;
end
$$;

create table if not exists "Variable" (
  id uuid primary key default gen_random_uuid(),
  "optionId" uuid null,
  "ownerKey" text not null,
  name text not null,
  description text null,
  "sortOrder" integer not null default 0,
  "isActive" boolean not null default true,
  "dataType" variable_data_type not null,
  "defaultValue" jsonb null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint variable_option_fk foreign key ("optionId") references "Option"(id) on delete cascade
);

create unique index if not exists variable_owner_key_name_unique on "Variable" ("ownerKey", name);
create index if not exists variable_option_id_idx on "Variable" ("optionId");

-- Optional: migrate existing attributes into variables (comment out if not applicable).
-- Assumes existing table `attribute` and enum values: string, number, boolean, enum, range, json.
insert into "Variable" (id, "optionId", "ownerKey", name, description, "sortOrder", "isActive", "dataType", "defaultValue", "createdAt", "updatedAt")
select
  a.id,
  a."optionId",
  a."optionId"::text as "ownerKey",
  a.key as name,
  a.label as description,
  a."sortOrder",
  a."isActive",
  case a."dataType"
    when 'string' then 'string'::variable_data_type
    when 'number' then 'number'::variable_data_type
    when 'boolean' then 'boolean'::variable_data_type
    when 'enum' then 'stringArray'::variable_data_type
    when 'range' then 'numberArray'::variable_data_type
    when 'json' then 'collection'::variable_data_type
    else 'collection'::variable_data_type
  end,
  null,
  a."createdAt",
  a."updatedAt"
from "Attribute" a
on conflict (id) do nothing;

-- Optional cleanup: drop attribute table once verified.
-- drop table if exists "Attribute";
