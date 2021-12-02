--
-- This script contains DDL statements to upgrade a database schema to
-- reflect changes to the model.  This file should only be used to
-- upgrade from the last formal release version to the current code base.
--

CONNECT TO iiq;

alter table identityiq.spt_integration_config add column maintenance_expiration bigint default 0;

--
-- Add flag for auto decisions
--
alter table identityiq.spt_certification_action add auto_decision smallint default 0;

--
-- Add Classifications table and associations with Bundle and Managed Attribute
--

    create table identityiq.spt_classification (
       id varchar(32) not null,
        created bigint,
        modified bigint,
        name varchar(128) not null,
        display_name varchar(128),
        displayable_name varchar(128),
        attributes clob(100000000),
        origin varchar(128),
        type varchar(128),
        name_ci generated always as (upper(name)),
        displayable_name_ci generated always as (upper(displayable_name)),
        primary key (id)
) IN identityiq_ts;

create table identityiq.spt_object_classification (
   id varchar(32) not null,
    created bigint,
    modified bigint,
    owner_id varchar(32),
    owner_type varchar(128),
    source varchar(128),
    effective smallint,
    classification_id varchar(32) not null,
    primary key (id)
) IN identityiq_ts;

create index identityiq.spt_classification_owner_id on identityiq.spt_object_classification (owner_id);

create index identityiq.spt_class_owner_type on identityiq.spt_object_classification (owner_type);

alter table identityiq.spt_object_classification
       add constraint FK4hfvqf5hc3a6rl944f4h171tn
       foreign key (classification_id)
       references identityiq.spt_classification;

create index identityiq.FK4hfvqf5hc3a6rl944f4h171tn on identityiq.spt_object_classification (classification_id);

alter table identityiq.spt_classification
   add constraint UK_eqb3e1wxju8yopo50ljal8lpg unique (name);


create index identityiq.spt_classification_name on identityiq.spt_classification (name_ci);
create index identityiq.spt_classif_dispname_ci on identityiq.spt_classification (displayable_name_ci);

--
-- Add Classification names to certification items
--

create table identityiq.spt_cert_item_classifications (
   certification_item varchar(32),
   classification_name varchar(255)
) IN identityiq_ts;

alter table identityiq.spt_cert_item_classifications
   add constraint FK9dehgtst8bbi31palx2ygp8hi
   foreign key (certification_item)
   references identityiq.spt_certification_item;

create index identityiq.FK9dehgtst8bbi31palx2ygp8hi on identityiq.spt_cert_item_classifications (certification_item);
--
-- Create new index on provisioning transaction table
--
create index identityiq.spt_prvtrans_created on identityiq.spt_provisioning_transaction (created);

--
-- Add remove rule options for quicklink population
--
alter table identityiq.spt_dynamic_scope add column role_remove_control varchar(32);

alter table identityiq.spt_dynamic_scope add column application_remove_control varchar(32);

alter table identityiq.spt_dynamic_scope add column managed_attr_remove_control varchar(32);

alter table identityiq.spt_dynamic_scope
   add constraint FKtktdhh12wn2ah31yrges9oiu1 
   foreign key (role_remove_control) 
   references identityiq.spt_rule;

create index identityiq.FKtktdhh12wn2ah31yrges9oiu1 on identityiq.spt_dynamic_scope (role_remove_control);

alter table identityiq.spt_dynamic_scope
   add constraint FKexhlawv29rux6bct75f19h91v 
   foreign key (application_remove_control) 
   references identityiq.spt_rule;

create index identityiq.FKexhlawv29rux6bct75f19h91v on identityiq.spt_dynamic_scope (application_remove_control);

alter table identityiq.spt_dynamic_scope
   add constraint FK5qib64c7xdiovhut2k81054iu 
   foreign key (managed_attr_remove_control) 
   references identityiq.spt_rule;

create index identityiq.FK5qib64c7xdiovhut2k81054iu on identityiq.spt_dynamic_scope (managed_attr_remove_control);

--
-- This is necessary to maintain the schema version. DO NOT REMOVE.
--
update identityiq.spt_database_version set schema_version = '8.1-08' where name = 'main';
