--
-- PostgreSQL database dump
--

\restrict aDvHjMuMdubLdAMMFyYzKwcHIBd6JofMKKfA0oZy7QyQwMSOeBYS1FBPprgw90q

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.12 (Debian 17.12-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: get_lab_work_file_signed_url(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lab_work_file_signed_url(file_id text, expires_in integer DEFAULT 86400) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    storage_path TEXT;
    signed_url TEXT;
BEGIN
    -- Verificar acceso: usuario debe ser creador o laboratorio asignado
    SELECT lwf.storage_path INTO storage_path
    FROM lab_work_files lwf
    INNER JOIN lab_works lw ON lwf.lab_work_id = lw.id
    WHERE lwf.id = file_id
    AND (lw.admin_email = auth.email() OR lw.lab_email = auth.email())
    AND lw.deleted_at IS NULL;

    IF storage_path IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado o archivo no existe';
    END IF;

    -- Generar signed URL (delegado a cliente con Supabase.storage.createSignedUrl)
    RETURN storage_path;
END;
$$;


--
-- Name: get_my_clinic_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_clinic_admin() RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT admin_email FROM team WHERE data->>'email' = auth.email() LIMIT 1),
    auth.email()
  );
$$;


--
-- Name: get_my_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_email() RETURNS text
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'pg_temp'
    AS $$SELECT auth.jwt()->>'email';$$;


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (
      SELECT data->>'role'
      FROM team
      WHERE data->>'email' = auth.email()
        AND deleted_at IS NULL
      LIMIT 1
    ),
    'admin'
  )
$$;


--
-- Name: get_occupied_slots(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_occupied_slots(clinic_email text, check_date text) RETURNS TABLE(occupied_time text)
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT data->>'time' AS occupied_time
  FROM appointments
  WHERE admin_email = clinic_email
    AND data->>'date' = check_date
    AND data->>'status' != 'cancelado'; -- Asume que si está cancelado, el espacio está libre
END;
$$;


--
-- Name: my_clinic_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.my_clinic_admin() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT admin_email FROM team WHERE data->>'email' = auth.email() AND deleted_at IS NULL LIMIT 1),
    auth.email()
  )
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: FUNCTION set_updated_at(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.set_updated_at() IS 'Actualiza automáticamente la columna updated_at antes de cada UPDATE, usado para resolución de conflictos de sincronización (last-write-wins).';


--
-- Name: tg_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id text NOT NULL,
    user_id uuid DEFAULT auth.uid(),
    data jsonb,
    admin_email text,
    reminders_sent text[] DEFAULT ARRAY[]::text[],
    deleted_at timestamp with time zone,
    google_event_id text,
    sync_origin text DEFAULT 'app'::text NOT NULL,
    google_sync_status text DEFAULT 'synced'::text NOT NULL,
    sede text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT appointments_google_sync_status_check CHECK ((google_sync_status = ANY (ARRAY['synced'::text, 'pending'::text, 'error'::text, 'conflict'::text]))),
    CONSTRAINT appointments_sync_origin_check CHECK ((sync_origin = ANY (ARRAY['app'::text, 'google'::text])))
);


--
-- Name: COLUMN appointments.google_event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.google_event_id IS 'ID del evento correspondiente en Google Calendar, si la cita está sincronizada.';


--
-- Name: COLUMN appointments.sync_origin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.sync_origin IS 'Indica si la cita nació en la app o fue importada desde Google Calendar.';


--
-- Name: COLUMN appointments.sede; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.sede IS 'Etiqueta libre de ubicación/sede donde ocurre la cita, útil para dentistas que atienden en varios lugares.';


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    user_email text,
    action text,
    patient_id text,
    details jsonb,
    admin_email text
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalog (
    id text NOT NULL,
    data jsonb NOT NULL,
    admin_email text,
    deleted_at timestamp with time zone
);


--
-- Name: clinic_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinic_config (
    id text NOT NULL,
    "radiologyRatio" numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    rut text,
    logo text,
    name text,
    phone text,
    address text,
    schedule text,
    specialty text,
    laboratories jsonb,
    "hourlyRate" numeric,
    "publicSlug" text,
    "wpGreeting" text,
    "profitMargin" numeric,
    "sterilizationDays" numeric
);


--
-- Name: clinical_evolutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_evolutions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id text NOT NULL,
    clinic_email text NOT NULL,
    author text NOT NULL,
    evolution_text text NOT NULL,
    signature_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: endodontics_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.endodontics_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id text NOT NULL,
    clinic_email text NOT NULL,
    date date NOT NULL,
    tooth text,
    diagnosis text,
    treatment_type text,
    pulp_condition text,
    working_length numeric,
    apical_diameter text,
    master_cone text,
    sealer text,
    obturation_technique text,
    post_placement boolean DEFAULT false,
    post_type text,
    restoration_type text,
    follow_up_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: endodontics_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.endodontics_tracking (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    patient_id text NOT NULL,
    tooth_number text,
    diagnosis text,
    working_length text,
    instruments_used text,
    irrigation_solution text,
    intracanal_medication text,
    obturation_material text,
    radiographic_follow_up boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text
);


--
-- Name: evolution_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evolution_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    clinic_email text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text
);


--
-- Name: financials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financials (
    id text NOT NULL,
    user_id uuid DEFAULT auth.uid(),
    data jsonb,
    admin_email text,
    boleta_emitida boolean DEFAULT false,
    boleta_fecha timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: google_calendar_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_calendar_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dentist_email text NOT NULL,
    admin_email text NOT NULL,
    google_account_email text,
    access_token_encrypted text NOT NULL,
    refresh_token_encrypted text NOT NULL,
    token_expires_at timestamp with time zone NOT NULL,
    calendar_id text DEFAULT 'primary'::text NOT NULL,
    sync_token text,
    watch_channel_id text,
    watch_resource_id text,
    watch_expires_at timestamp with time zone,
    status text DEFAULT 'active'::text NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT google_calendar_connections_status_check CHECK ((status = ANY (ARRAY['active'::text, 'revoked'::text, 'error'::text])))
);


--
-- Name: TABLE google_calendar_connections; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.google_calendar_connections IS 'Conexión OAuth de un dentista con su cuenta de Google Calendar para sincronización bidireccional de la agenda.';


--
-- Name: implantology_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.implantology_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id text NOT NULL,
    clinic_email text NOT NULL,
    date date NOT NULL,
    tooth text,
    implant_brand text,
    implant_model text,
    implant_lot text,
    diameter text,
    length text,
    insertion_torque numeric,
    isq numeric,
    prosthesis_type text,
    immediate_load boolean DEFAULT false,
    load_date date,
    abutment_type text,
    crown_material text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: implantology_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.implantology_tracking (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    patient_id text NOT NULL,
    implant_brand text,
    implant_model text,
    diameter text,
    length text,
    insertion_torque text,
    placement_date date,
    stage text,
    abutment_type text,
    crown_type text,
    bone_graft boolean DEFAULT false,
    bone_graft_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text
);


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    id text NOT NULL,
    data jsonb NOT NULL,
    admin_email text,
    deleted_at timestamp with time zone
);


--
-- Name: lab_network; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_network (
    lab_id uuid DEFAULT gen_random_uuid() NOT NULL,
    lab_name text NOT NULL,
    contact_email text NOT NULL,
    clinics_connected integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    deleted_at timestamp with time zone
);


--
-- Name: lab_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_pricing (
    id text NOT NULL,
    lab_email text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lab_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lab_email text NOT NULL,
    plan_type text DEFAULT 'free'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    mp_preapproval_id text,
    mp_payer_email text,
    monthly_fee numeric(10,2) DEFAULT 0,
    trial_ends_at timestamp with time zone,
    next_billing_date date,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT plan_type_check CHECK ((plan_type = ANY (ARRAY['free'::text, 'pro'::text]))),
    CONSTRAINT status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'past_due'::text])))
);


--
-- Name: lab_work_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_work_files (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    lab_work_id text NOT NULL,
    original_name text NOT NULL,
    storage_path text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by text NOT NULL,
    thumbnail_path text,
    upload_source text DEFAULT 'clinic'::text,
    deleted_at timestamp with time zone
);


--
-- Name: lab_works; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_works (
    id text NOT NULL,
    "patientId" text,
    "patientName" text,
    "workType" text,
    tooth text,
    "labName" text,
    "sendDate" text,
    "expectedDate" text,
    status text,
    admin_email text,
    created_by text,
    lab_email text,
    file_name text,
    file_url text,
    shade text,
    notes text,
    deleted_at timestamp with time zone,
    data jsonb DEFAULT '{}'::jsonb
);


--
-- Name: lab_work_files_audit; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.lab_work_files_audit WITH (security_invoker='true') AS
 SELECT lwf.id,
    lwf.lab_work_id,
    lwf.original_name,
    lwf.file_size,
    lwf.mime_type,
    lwf.created_at,
    lwf.created_by,
    lw.admin_email,
    lw.lab_email,
    lw.status
   FROM (public.lab_work_files lwf
     JOIN public.lab_works lw ON ((lwf.lab_work_id = lw.id)))
  WHERE (lw.deleted_at IS NULL);


--
-- Name: orthodontics_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orthodontics_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id text NOT NULL,
    clinic_email text NOT NULL,
    date date NOT NULL,
    apparatology text,
    arc_type text,
    arc_size text,
    adjustment_notes text,
    cephalometric_angles jsonb,
    cigo_index numeric,
    icon_index numeric,
    next_appointment date,
    treatment_phase text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: orthodontics_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orthodontics_tracking (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    patient_id text NOT NULL,
    treatment_type text,
    torque_angulation text,
    archwire_type text,
    archwire_change_date date,
    elastomers text,
    activation_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text
);


--
-- Name: packs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.packs (
    id text NOT NULL,
    user_id uuid DEFAULT auth.uid(),
    data jsonb,
    admin_email text,
    deleted_at timestamp with time zone
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id text NOT NULL,
    user_id uuid DEFAULT auth.uid(),
    data jsonb,
    admin_email text,
    deleted_at timestamp with time zone,
    rut_norm text GENERATED ALWAYS AS (NULLIF(upper(regexp_replace(COALESCE(((data -> 'personal'::text) ->> 'rut'::text), ''::text), '[^0-9kK]'::text, ''::text, 'g'::text)), ''::text)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    import_batch_id text
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id text NOT NULL,
    user_id uuid DEFAULT auth.uid(),
    data jsonb,
    admin_email text,
    phone_comercial text
);


--
-- Name: public_appointments_availability; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_appointments_availability WITH (security_invoker='true') AS
 SELECT admin_email,
    (data ->> 'date'::text) AS date,
    (data ->> 'time'::text) AS "time",
    (data ->> 'duration'::text) AS duration
   FROM public.appointments a
  WHERE (admin_email IN ( SELECT settings.admin_email
           FROM public.settings
          WHERE ((settings.id = 'general'::text) AND ((settings.data ->> 'publicSlug'::text) IS NOT NULL) AND ((settings.data ->> 'publicSlug'::text) <> ''::text))));


--
-- Name: public_clinic_info; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_clinic_info WITH (security_invoker='true') AS
 SELECT admin_email,
    jsonb_build_object('name', (data ->> 'name'::text), 'logo', (data ->> 'logo'::text), 'phone', (data ->> 'phone'::text), 'address', (data ->> 'address'::text), 'schedule', (data -> 'schedule'::text), 'specialty', (data ->> 'specialty'::text), 'publicSlug', (data ->> 'publicSlug'::text), 'require_payment_at_booking', (data ->> 'require_payment_at_booking'::text), 'appointment_price', (data ->> 'appointment_price'::text), 'mp_user_id', (data ->> 'mp_user_id'::text)) AS data
   FROM public.settings
  WHERE ((id = 'general'::text) AND ((data ->> 'publicSlug'::text) IS NOT NULL) AND ((data ->> 'publicSlug'::text) <> ''::text));


--
-- Name: reminder_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id text NOT NULL,
    patient_email text NOT NULL,
    sent_at timestamp with time zone DEFAULT now(),
    days_before integer
);


--
-- Name: saas_subscription_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saas_subscription_payments (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    clinic_email text NOT NULL,
    mp_preapproval_id text,
    mp_payment_id text,
    amount numeric,
    status text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: saas_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saas_subscriptions (
    clinic_email text NOT NULL,
    clinic_name text NOT NULL,
    plan_type text DEFAULT 'pro'::text,
    monthly_fee numeric NOT NULL,
    status text DEFAULT 'active'::text,
    next_billing_date date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    mp_preapproval_id text
);


--
-- Name: sterilization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sterilization (
    id text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    admin_email text,
    deleted_at timestamp with time zone
);


--
-- Name: sterilization_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sterilization_inventory (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    clinic_email text NOT NULL,
    item_name text NOT NULL,
    category text DEFAULT 'Instrumental'::text NOT NULL,
    total_quantity integer DEFAULT 0 NOT NULL,
    available_quantity integer DEFAULT 0 NOT NULL,
    in_sterilization_quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    dirty_quantity integer DEFAULT 0 NOT NULL
);


--
-- Name: supply_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supply_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_email text NOT NULL,
    order_details jsonb NOT NULL,
    total_amount numeric NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    deleted_at timestamp with time zone
);


--
-- Name: supply_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supply_providers (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    city text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team (
    id text NOT NULL,
    data jsonb NOT NULL,
    admin_email text,
    commission numeric DEFAULT 0,
    deleted_at timestamp with time zone
);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: catalog catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog
    ADD CONSTRAINT catalog_pkey PRIMARY KEY (id);


--
-- Name: clinic_config clinic_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_config
    ADD CONSTRAINT clinic_config_pkey PRIMARY KEY (id);


--
-- Name: clinical_evolutions clinical_evolutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_evolutions
    ADD CONSTRAINT clinical_evolutions_pkey PRIMARY KEY (id);


--
-- Name: endodontics_records endodontics_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endodontics_records
    ADD CONSTRAINT endodontics_records_pkey PRIMARY KEY (id);


--
-- Name: endodontics_tracking endodontics_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endodontics_tracking
    ADD CONSTRAINT endodontics_tracking_pkey PRIMARY KEY (id);


--
-- Name: evolution_templates evolution_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolution_templates
    ADD CONSTRAINT evolution_templates_pkey PRIMARY KEY (id);


--
-- Name: financials financials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financials
    ADD CONSTRAINT financials_pkey PRIMARY KEY (id);


--
-- Name: google_calendar_connections google_calendar_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_connections
    ADD CONSTRAINT google_calendar_connections_pkey PRIMARY KEY (id);


--
-- Name: implantology_records implantology_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implantology_records
    ADD CONSTRAINT implantology_records_pkey PRIMARY KEY (id);


--
-- Name: implantology_tracking implantology_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implantology_tracking
    ADD CONSTRAINT implantology_tracking_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: lab_network lab_network_contact_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_network
    ADD CONSTRAINT lab_network_contact_email_key UNIQUE (contact_email);


--
-- Name: lab_network lab_network_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_network
    ADD CONSTRAINT lab_network_pkey PRIMARY KEY (lab_id);


--
-- Name: lab_pricing lab_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_pricing
    ADD CONSTRAINT lab_pricing_pkey PRIMARY KEY (id);


--
-- Name: lab_subscriptions lab_subscriptions_lab_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_subscriptions
    ADD CONSTRAINT lab_subscriptions_lab_email_key UNIQUE (lab_email);


--
-- Name: lab_subscriptions lab_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_subscriptions
    ADD CONSTRAINT lab_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: lab_work_files lab_work_files_lab_work_id_original_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_files
    ADD CONSTRAINT lab_work_files_lab_work_id_original_name_key UNIQUE (lab_work_id, original_name);


--
-- Name: lab_work_files lab_work_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_files
    ADD CONSTRAINT lab_work_files_pkey PRIMARY KEY (id);


--
-- Name: lab_works lab_works_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_works
    ADD CONSTRAINT lab_works_pkey PRIMARY KEY (id);


--
-- Name: orthodontics_records orthodontics_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orthodontics_records
    ADD CONSTRAINT orthodontics_records_pkey PRIMARY KEY (id);


--
-- Name: orthodontics_tracking orthodontics_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orthodontics_tracking
    ADD CONSTRAINT orthodontics_tracking_pkey PRIMARY KEY (id);


--
-- Name: packs packs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packs
    ADD CONSTRAINT packs_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: reminder_log reminder_log_appointment_id_days_before_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_log
    ADD CONSTRAINT reminder_log_appointment_id_days_before_key UNIQUE (appointment_id, days_before);


--
-- Name: reminder_log reminder_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_log
    ADD CONSTRAINT reminder_log_pkey PRIMARY KEY (id);


--
-- Name: saas_subscription_payments saas_subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saas_subscription_payments
    ADD CONSTRAINT saas_subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: saas_subscriptions saas_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saas_subscriptions
    ADD CONSTRAINT saas_subscriptions_pkey PRIMARY KEY (clinic_email);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: sterilization_inventory sterilization_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sterilization_inventory
    ADD CONSTRAINT sterilization_inventory_pkey PRIMARY KEY (id);


--
-- Name: sterilization sterilization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sterilization
    ADD CONSTRAINT sterilization_pkey PRIMARY KEY (id);


--
-- Name: supply_orders supply_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_orders
    ADD CONSTRAINT supply_orders_pkey PRIMARY KEY (id);


--
-- Name: supply_providers supply_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_providers
    ADD CONSTRAINT supply_providers_pkey PRIMARY KEY (id);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (id);


--
-- Name: appointments_admin_google_event_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX appointments_admin_google_event_key ON public.appointments USING btree (admin_email, google_event_id) WHERE ((google_event_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: appointments_google_sync_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_google_sync_status_idx ON public.appointments USING btree (google_sync_status) WHERE (google_sync_status = ANY (ARRAY['pending'::text, 'error'::text, 'conflict'::text]));


--
-- Name: google_calendar_connections_admin_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX google_calendar_connections_admin_email_idx ON public.google_calendar_connections USING btree (admin_email);


--
-- Name: google_calendar_connections_dentist_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX google_calendar_connections_dentist_email_key ON public.google_calendar_connections USING btree (dentist_email) WHERE (deleted_at IS NULL);


--
-- Name: google_calendar_connections_watch_channel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX google_calendar_connections_watch_channel_idx ON public.google_calendar_connections USING btree (watch_channel_id) WHERE (watch_channel_id IS NOT NULL);


--
-- Name: idx_appointments_admin_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_admin_active ON public.appointments USING btree (admin_email) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointments_admin_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_admin_email ON public.appointments USING btree (admin_email);


--
-- Name: idx_appointments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_user_id ON public.appointments USING btree (user_id);


--
-- Name: idx_clinical_evolutions_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_evolutions_clinic ON public.clinical_evolutions USING btree (clinic_email);


--
-- Name: idx_clinical_evolutions_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_evolutions_patient ON public.clinical_evolutions USING btree (patient_id);


--
-- Name: idx_endo_track_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_endo_track_patient ON public.endodontics_tracking USING btree (patient_id, created_at DESC);


--
-- Name: idx_endodontics_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_endodontics_clinic ON public.endodontics_records USING btree (clinic_email);


--
-- Name: idx_endodontics_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_endodontics_patient ON public.endodontics_records USING btree (patient_id);


--
-- Name: idx_financials_admin_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financials_admin_active ON public.financials USING btree (admin_email) WHERE (deleted_at IS NULL);


--
-- Name: idx_financials_admin_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financials_admin_email ON public.financials USING btree (admin_email);


--
-- Name: idx_financials_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financials_user_id ON public.financials USING btree (user_id);


--
-- Name: idx_implanto_track_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_implanto_track_patient ON public.implantology_tracking USING btree (patient_id, created_at DESC);


--
-- Name: idx_implantology_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_implantology_clinic ON public.implantology_records USING btree (clinic_email);


--
-- Name: idx_implantology_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_implantology_patient ON public.implantology_records USING btree (patient_id);


--
-- Name: idx_inventory_admin_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_admin_active ON public.inventory USING btree (admin_email) WHERE (deleted_at IS NULL);


--
-- Name: idx_lab_pricing_lab_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_pricing_lab_email ON public.lab_pricing USING btree (lab_email) WHERE (deleted_at IS NULL);


--
-- Name: idx_lab_work_files_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_files_created_by ON public.lab_work_files USING btree (created_by) WHERE (created_at IS NOT NULL);


--
-- Name: idx_lab_work_files_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_files_creator ON public.lab_work_files USING btree (created_by, created_at DESC);


--
-- Name: idx_lab_work_files_lab_work_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_files_lab_work_id ON public.lab_work_files USING btree (lab_work_id) WHERE (created_at IS NOT NULL);


--
-- Name: idx_lab_work_files_work_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_files_work_id ON public.lab_work_files USING btree (lab_work_id);


--
-- Name: idx_lab_works_admin_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_works_admin_active ON public.lab_works USING btree (admin_email) WHERE (deleted_at IS NULL);


--
-- Name: idx_lab_works_admin_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_works_admin_email ON public.lab_works USING btree (admin_email) WHERE (deleted_at IS NULL);


--
-- Name: idx_lab_works_lab_email_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_works_lab_email_status ON public.lab_works USING btree (lab_email, status) WHERE (deleted_at IS NULL);


--
-- Name: idx_ortho_track_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ortho_track_patient ON public.orthodontics_tracking USING btree (patient_id, created_at DESC);


--
-- Name: idx_orthodontics_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orthodontics_clinic ON public.orthodontics_records USING btree (clinic_email);


--
-- Name: idx_orthodontics_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orthodontics_patient ON public.orthodontics_records USING btree (patient_id);


--
-- Name: idx_packs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_packs_user_id ON public.packs USING btree (user_id);


--
-- Name: idx_patients_admin_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_admin_active ON public.patients USING btree (admin_email) WHERE (deleted_at IS NULL);


--
-- Name: idx_patients_admin_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_admin_email ON public.patients USING btree (admin_email);


--
-- Name: idx_patients_id_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_id_admin ON public.patients USING btree (id, admin_email);


--
-- Name: idx_patients_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_user_id ON public.patients USING btree (user_id);


--
-- Name: idx_saas_subscription_payments_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saas_subscription_payments_email ON public.saas_subscription_payments USING btree (clinic_email);


--
-- Name: idx_saas_subscriptions_preapproval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saas_subscriptions_preapproval ON public.saas_subscriptions USING btree (mp_preapproval_id);


--
-- Name: idx_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settings_user_id ON public.settings USING btree (user_id);


--
-- Name: patients_import_batch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_import_batch_idx ON public.patients USING btree (import_batch_id) WHERE (import_batch_id IS NOT NULL);


--
-- Name: patients_rut_norm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_rut_norm_idx ON public.patients USING btree (rut_norm) WHERE (deleted_at IS NULL);


--
-- Name: patients_rut_unico_por_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patients_rut_unico_por_clinica ON public.patients USING btree (admin_email, rut_norm) WHERE ((deleted_at IS NULL) AND (rut_norm IS NOT NULL));


--
-- Name: appointments appointments_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER appointments_set_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patients patients_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER patients_set_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


--
-- Name: appointments appointments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: endodontics_records endodontics_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endodontics_records
    ADD CONSTRAINT endodontics_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: endodontics_tracking endodontics_tracking_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.endodontics_tracking
    ADD CONSTRAINT endodontics_tracking_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: financials financials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financials
    ADD CONSTRAINT financials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: implantology_records implantology_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implantology_records
    ADD CONSTRAINT implantology_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: implantology_tracking implantology_tracking_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implantology_tracking
    ADD CONSTRAINT implantology_tracking_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: lab_work_files lab_work_files_lab_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_files
    ADD CONSTRAINT lab_work_files_lab_work_id_fkey FOREIGN KEY (lab_work_id) REFERENCES public.lab_works(id) ON DELETE CASCADE;


--
-- Name: orthodontics_records orthodontics_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orthodontics_records
    ADD CONSTRAINT orthodontics_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: orthodontics_tracking orthodontics_tracking_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orthodontics_tracking
    ADD CONSTRAINT orthodontics_tracking_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: packs packs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packs
    ADD CONSTRAINT packs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: settings settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: google_calendar_connections Aislamiento de conexiones Google Calendar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Aislamiento de conexiones Google Calendar" ON public.google_calendar_connections USING (((dentist_email = public.get_my_email()) OR (admin_email = public.get_my_email()) OR (admin_email IN ( SELECT team.admin_email
   FROM public.team
  WHERE ((team.data ->> 'email'::text) = public.get_my_email()))))) WITH CHECK (((dentist_email = public.get_my_email()) OR (admin_email = public.get_my_email())));


--
-- Name: appointments Aislamiento total de Agenda; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Aislamiento total de Agenda" ON public.appointments TO authenticated USING (((admin_email = (auth.jwt() ->> 'email'::text)) OR (admin_email IN ( SELECT team.admin_email
   FROM public.team
  WHERE ((team.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text))))));


--
-- Name: clinic_config Aislamiento total de Configuracion; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Aislamiento total de Configuracion" ON public.clinic_config TO authenticated USING (((id = (auth.jwt() ->> 'email'::text)) OR (id IN ( SELECT team.admin_email
   FROM public.team
  WHERE ((team.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text))))));


--
-- Name: clinical_evolutions Aislamiento total de Evoluciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Aislamiento total de Evoluciones" ON public.clinical_evolutions TO authenticated USING (((clinic_email = (auth.jwt() ->> 'email'::text)) OR (clinic_email IN ( SELECT team.admin_email
   FROM public.team
  WHERE ((team.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text))))));


--
-- Name: financials Aislamiento total de Finanzas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Aislamiento total de Finanzas" ON public.financials TO authenticated USING (((admin_email = (auth.jwt() ->> 'email'::text)) OR (admin_email IN ( SELECT team.admin_email
   FROM public.team
  WHERE ((team.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text))))));


--
-- Name: patients Aislamiento total de Pacientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Aislamiento total de Pacientes" ON public.patients TO authenticated USING (((admin_email = (auth.jwt() ->> 'email'::text)) OR (admin_email IN ( SELECT team.admin_email
   FROM public.team
  WHERE ((team.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text))))));


--
-- Name: evolution_templates Aislamiento total de Plantillas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Aislamiento total de Plantillas" ON public.evolution_templates USING (((clinic_email = (auth.jwt() ->> 'email'::text)) OR (clinic_email IN ( SELECT team.admin_email
   FROM public.team
  WHERE ((team.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text)))))) WITH CHECK (((clinic_email = (auth.jwt() ->> 'email'::text)) OR (clinic_email IN ( SELECT team.admin_email
   FROM public.team
  WHERE ((team.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text))))));


--
-- Name: team Aislamiento total del Equipo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Aislamiento total del Equipo" ON public.team TO authenticated USING (((admin_email = (auth.jwt() ->> 'email'::text)) OR ((data ->> 'email'::text) = (auth.jwt() ->> 'email'::text))));


--
-- Name: reminder_log Allow all for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for authenticated users" ON public.reminder_log TO authenticated USING (true) WITH CHECK (true);


--
-- Name: supply_orders Clinicas pueden crear pedidos v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinicas pueden crear pedidos v2" ON public.supply_orders FOR INSERT TO authenticated WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: lab_work_files Clínica puede ver sus archivos de laboratorio; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clínica puede ver sus archivos de laboratorio" ON public.lab_work_files FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.lab_works lw
  WHERE ((lw.id = lab_work_files.lab_work_id) AND (lw.admin_email = (auth.jwt() ->> 'email'::text))))) OR (EXISTS ( SELECT 1
   FROM (public.lab_works lw
     JOIN public.team t ON ((lw.admin_email = t.admin_email)))
  WHERE ((lw.id = lab_work_files.lab_work_id) AND ((t.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text)) AND (t.deleted_at IS NULL))))));


--
-- Name: sterilization Clínicas pueden ver su propia esterilización; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clínicas pueden ver su propia esterilización" ON public.sterilization TO authenticated USING ((admin_email = ( SELECT auth.email() AS email))) WITH CHECK ((admin_email = ( SELECT auth.email() AS email)));


--
-- Name: endodontics_records Clínicas pueden ver sus propios registros de endodoncia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clínicas pueden ver sus propios registros de endodoncia" ON public.endodontics_records TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = endodontics_records.patient_id) AND (patients.admin_email = ( SELECT auth.email() AS email)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = endodontics_records.patient_id) AND (patients.admin_email = ( SELECT auth.email() AS email))))));


--
-- Name: implantology_records Clínicas pueden ver sus propios registros de implantología; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clínicas pueden ver sus propios registros de implantología" ON public.implantology_records TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = implantology_records.patient_id) AND (patients.admin_email = ( SELECT auth.email() AS email)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = implantology_records.patient_id) AND (patients.admin_email = ( SELECT auth.email() AS email))))));


--
-- Name: orthodontics_records Clínicas pueden ver sus propios registros de ortodoncia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clínicas pueden ver sus propios registros de ortodoncia" ON public.orthodontics_records TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = orthodontics_records.patient_id) AND (patients.admin_email = ( SELECT auth.email() AS email)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = orthodontics_records.patient_id) AND (patients.admin_email = ( SELECT auth.email() AS email))))));


--
-- Name: supply_orders Clínicas ven sus propios pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clínicas ven sus propios pedidos" ON public.supply_orders FOR SELECT TO authenticated USING ((admin_email = (auth.jwt() ->> 'email'::text)));


--
-- Name: lab_work_files Creador o admin pueden borrar archivos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creador o admin pueden borrar archivos" ON public.lab_work_files FOR DELETE USING (((created_by = (auth.jwt() ->> 'email'::text)) OR (EXISTS ( SELECT 1
   FROM public.lab_works lw
  WHERE ((lw.id = lab_work_files.lab_work_id) AND (lw.admin_email = (auth.jwt() ->> 'email'::text)))))));


--
-- Name: lab_network God Mode Labs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "God Mode Labs" ON public.lab_network TO authenticated USING (((auth.jwt() ->> 'email'::text) = 'b.barreracabrera.dent@gmail.com'::text));


--
-- Name: supply_orders God Mode Orders Select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "God Mode Orders Select" ON public.supply_orders FOR SELECT USING (((auth.jwt() ->> 'email'::text) = 'b.barreracabrera.dent@gmail.com'::text));


--
-- Name: supply_orders God Mode Orders Update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "God Mode Orders Update" ON public.supply_orders FOR UPDATE USING (((auth.jwt() ->> 'email'::text) = 'b.barreracabrera.dent@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'b.barreracabrera.dent@gmail.com'::text));


--
-- Name: supply_providers God Mode Providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "God Mode Providers" ON public.supply_providers USING (((auth.jwt() ->> 'email'::text) = 'b.barreracabrera.dent@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'b.barreracabrera.dent@gmail.com'::text));


--
-- Name: saas_subscription_payments God Mode Subscription Payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "God Mode Subscription Payments" ON public.saas_subscription_payments USING (((auth.jwt() ->> 'email'::text) = 'b.barreracabrera.dent@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'b.barreracabrera.dent@gmail.com'::text));


--
-- Name: saas_subscriptions God Mode Subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "God Mode Subscriptions" ON public.saas_subscriptions TO authenticated USING (((auth.jwt() ->> 'email'::text) = 'b.barreracabrera.dent@gmail.com'::text));


--
-- Name: lab_work_files Laboratorio puede ver sus archivos asignados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Laboratorio puede ver sus archivos asignados" ON public.lab_work_files FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.lab_works lw
  WHERE ((lw.id = lab_work_files.lab_work_id) AND (lw.lab_email = (auth.jwt() ->> 'email'::text))))));


--
-- Name: lab_works Labs actualizan sus trabajos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Labs actualizan sus trabajos" ON public.lab_works FOR UPDATE USING (((auth.jwt() ->> 'email'::text) = lab_email));


--
-- Name: lab_subscriptions Labs see own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Labs see own subscription" ON public.lab_subscriptions FOR SELECT USING (((auth.jwt() ->> 'email'::text) = lab_email));


--
-- Name: lab_works Labs ven sus trabajos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Labs ven sus trabajos" ON public.lab_works FOR SELECT USING (((auth.jwt() ->> 'email'::text) = lab_email));


--
-- Name: team Permitir leer rol propio; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir leer rol propio" ON public.team FOR SELECT USING (((data ->> 'email'::text) = (auth.jwt() ->> 'email'::text)));


--
-- Name: lab_subscriptions Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.lab_subscriptions USING ((auth.role() = 'service_role'::text));


--
-- Name: sterilization_inventory Users can manage their own sterilization inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own sterilization inventory" ON public.sterilization_inventory USING ((clinic_email = (auth.jwt() ->> 'email'::text))) WITH CHECK ((clinic_email = (auth.jwt() ->> 'email'::text)));


--
-- Name: lab_work_files Usuarios autorizados pueden subir archivos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios autorizados pueden subir archivos" ON public.lab_work_files FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.lab_works lw
  WHERE ((lw.id = lab_work_files.lab_work_id) AND ((lw.admin_email = (auth.jwt() ->> 'email'::text)) OR (lw.lab_email = (auth.jwt() ->> 'email'::text)) OR (EXISTS ( SELECT 1
           FROM public.team t
          WHERE ((t.admin_email = lw.admin_email) AND ((t.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text)) AND (t.deleted_at IS NULL)))))))));


--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs audit_logs_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_logs_insert_own ON public.audit_logs FOR INSERT TO authenticated WITH CHECK ((user_email = auth.email()));


--
-- Name: audit_logs audit_logs_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_logs_select_own ON public.audit_logs FOR SELECT TO authenticated USING ((user_email = auth.email()));


--
-- Name: catalog; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;

--
-- Name: catalog catalog_delete_admin_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY catalog_delete_admin_only ON public.catalog FOR DELETE TO authenticated USING ((admin_email = auth.email()));


--
-- Name: catalog catalog_insert_admin_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY catalog_insert_admin_only ON public.catalog FOR INSERT TO authenticated WITH CHECK ((admin_email = auth.email()));


--
-- Name: catalog catalog_update_admin_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY catalog_update_admin_only ON public.catalog FOR UPDATE TO authenticated USING ((admin_email = auth.email())) WITH CHECK ((admin_email = auth.email()));


--
-- Name: clinic_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinic_config ENABLE ROW LEVEL SECURITY;

--
-- Name: clinical_evolutions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinical_evolutions ENABLE ROW LEVEL SECURITY;

--
-- Name: clinical_evolutions crear_mis_evoluciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crear_mis_evoluciones ON public.clinical_evolutions FOR INSERT WITH CHECK ((clinic_email = ( SELECT (auth.jwt() ->> 'email'::text))));


--
-- Name: endodontics_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.endodontics_records ENABLE ROW LEVEL SECURITY;

--
-- Name: endodontics_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.endodontics_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: clinical_evolutions evo_insert_team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evo_insert_team ON public.clinical_evolutions FOR INSERT TO authenticated WITH CHECK ((clinic_email = public.my_clinic_admin()));


--
-- Name: clinical_evolutions evo_select_team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY evo_select_team ON public.clinical_evolutions FOR SELECT TO authenticated USING ((clinic_email = public.my_clinic_admin()));


--
-- Name: evolution_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evolution_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: financials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;

--
-- Name: google_calendar_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: implantology_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.implantology_records ENABLE ROW LEVEL SECURITY;

--
-- Name: implantology_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.implantology_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_work_files lab_files_delete_creator_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lab_files_delete_creator_or_admin ON public.lab_work_files FOR DELETE TO authenticated USING (((created_by = (auth.jwt() ->> 'email'::text)) OR (EXISTS ( SELECT 1
   FROM public.lab_works lw
  WHERE ((lw.id = lab_work_files.lab_work_id) AND (lw.admin_email = (auth.jwt() ->> 'email'::text)))))));


--
-- Name: lab_work_files lab_files_insert_authorized; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lab_files_insert_authorized ON public.lab_work_files FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.lab_works lw
  WHERE ((lw.id = lab_work_files.lab_work_id) AND ((lw.admin_email = (auth.jwt() ->> 'email'::text)) OR (lw.lab_email = (auth.jwt() ->> 'email'::text)) OR (EXISTS ( SELECT 1
           FROM public.team t
          WHERE ((t.admin_email = lw.admin_email) AND ((t.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text)) AND (t.deleted_at IS NULL)))))))));


--
-- Name: lab_work_files lab_files_select_clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lab_files_select_clinic ON public.lab_work_files FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.lab_works lw
  WHERE ((lw.id = lab_work_files.lab_work_id) AND ((lw.admin_email = (auth.jwt() ->> 'email'::text)) OR (EXISTS ( SELECT 1
           FROM public.team t
          WHERE ((t.admin_email = lw.admin_email) AND ((t.data ->> 'email'::text) = (auth.jwt() ->> 'email'::text)) AND (t.deleted_at IS NULL)))))))));


--
-- Name: lab_work_files lab_files_select_lab; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lab_files_select_lab ON public.lab_work_files FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.lab_works lw
  WHERE ((lw.id = lab_work_files.lab_work_id) AND (lw.lab_email = (auth.jwt() ->> 'email'::text))))));


--
-- Name: lab_network; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_network ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_pricing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_pricing ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_work_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_work_files ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_work_files lab_work_files_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lab_work_files_delete ON public.lab_work_files FOR DELETE TO authenticated USING (((lab_work_id IN ( SELECT lab_works.id
   FROM public.lab_works
  WHERE ((lab_works.admin_email = auth.email()) AND (lab_works.deleted_at IS NULL)))) AND (created_by = auth.email())));


--
-- Name: lab_work_files lab_work_files_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lab_work_files_insert ON public.lab_work_files FOR INSERT TO authenticated WITH CHECK (((lab_work_id IN ( SELECT lab_works.id
   FROM public.lab_works
  WHERE ((lab_works.admin_email = auth.email()) AND (lab_works.deleted_at IS NULL)))) AND (created_by = auth.email())));


--
-- Name: lab_work_files lab_work_files_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lab_work_files_select ON public.lab_work_files FOR SELECT TO authenticated USING ((lab_work_id IN ( SELECT lab_works.id
   FROM public.lab_works
  WHERE (((lab_works.admin_email = auth.email()) OR (lab_works.lab_email = auth.email())) AND (lab_works.deleted_at IS NULL)))));


--
-- Name: lab_works; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_works ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments master_appointments_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_appointments_auth ON public.appointments TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: catalog master_catalog_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_catalog_auth ON public.catalog TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: financials master_financials_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_financials_auth ON public.financials TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: inventory master_inventory_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_inventory_auth ON public.inventory TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: lab_works master_lab_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_lab_auth ON public.lab_works TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: audit_logs master_logs_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_logs_auth ON public.audit_logs TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: packs master_packs_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_packs_auth ON public.packs TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: patients master_patients_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_patients_auth ON public.patients TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: settings master_settings_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_settings_auth ON public.settings TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: sterilization master_sterilization_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_sterilization_auth ON public.sterilization TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: team master_team_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY master_team_auth ON public.team TO authenticated USING ((admin_email = ( SELECT public.get_my_email() AS get_my_email))) WITH CHECK ((admin_email = ( SELECT public.get_my_email() AS get_my_email)));


--
-- Name: orthodontics_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orthodontics_records ENABLE ROW LEVEL SECURITY;

--
-- Name: orthodontics_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orthodontics_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: packs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;

--
-- Name: patients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_pricing pricing_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pricing_delete_own ON public.lab_pricing FOR DELETE TO authenticated USING ((lab_email = auth.email()));


--
-- Name: lab_pricing pricing_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pricing_insert_own ON public.lab_pricing FOR INSERT TO authenticated WITH CHECK ((lab_email = auth.email()));


--
-- Name: lab_pricing pricing_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pricing_select_own ON public.lab_pricing FOR SELECT TO authenticated USING ((lab_email = auth.email()));


--
-- Name: lab_pricing pricing_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pricing_update_own ON public.lab_pricing FOR UPDATE TO authenticated USING ((lab_email = auth.email())) WITH CHECK ((lab_email = auth.email()));


--
-- Name: clinical_evolutions prohibir_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prohibir_delete ON public.clinical_evolutions FOR DELETE USING (false);


--
-- Name: clinical_evolutions prohibir_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prohibir_update ON public.clinical_evolutions FOR UPDATE USING (false);


--
-- Name: appointments public_insert_appointments_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_insert_appointments_v2 ON public.appointments FOR INSERT TO anon WITH CHECK ((admin_email IN ( SELECT public_clinic_info.admin_email
   FROM public.public_clinic_info)));


--
-- Name: patients public_insert_patients_v2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_insert_patients_v2 ON public.patients FOR INSERT TO anon WITH CHECK ((admin_email IN ( SELECT public_clinic_info.admin_email
   FROM public.public_clinic_info)));


--
-- Name: reminder_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;

--
-- Name: saas_subscription_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saas_subscription_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: saas_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- Name: settings settings_insert_admin_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY settings_insert_admin_only ON public.settings FOR INSERT TO authenticated WITH CHECK ((admin_email = auth.email()));


--
-- Name: settings settings_update_admin_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY settings_update_admin_only ON public.settings FOR UPDATE TO authenticated USING ((admin_email = auth.email())) WITH CHECK ((admin_email = auth.email()));


--
-- Name: sterilization; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sterilization ENABLE ROW LEVEL SECURITY;

--
-- Name: sterilization_inventory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sterilization_inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: supply_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supply_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: supply_providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supply_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: team; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;

--
-- Name: team team_delete_admin_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_delete_admin_only ON public.team FOR DELETE TO authenticated USING ((admin_email = auth.email()));


--
-- Name: team team_insert_admin_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_insert_admin_only ON public.team FOR INSERT TO authenticated WITH CHECK ((admin_email = auth.email()));


--
-- Name: team team_update_admin_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_update_admin_only ON public.team FOR UPDATE TO authenticated USING ((admin_email = auth.email())) WITH CHECK ((admin_email = auth.email()));


--
-- Name: clinical_evolutions ver_mis_evoluciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ver_mis_evoluciones ON public.clinical_evolutions FOR SELECT USING ((clinic_email = ( SELECT (auth.jwt() ->> 'email'::text))));


--
-- PostgreSQL database dump complete
--

\unrestrict aDvHjMuMdubLdAMMFyYzKwcHIBd6JofMKKfA0oZy7QyQwMSOeBYS1FBPprgw90q

