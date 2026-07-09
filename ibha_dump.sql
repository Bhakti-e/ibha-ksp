--
-- PostgreSQL database dump
--

\restrict SFv10RfeBJVsxm2xd7mnrDiLhUucBto6PZRgiKXRMQAOVOQNupHhHZBQp9QZv85

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accused; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accused (
    accusedmasterid integer NOT NULL,
    casemasterid integer NOT NULL,
    accusedname character varying(255) NOT NULL,
    ageyear integer,
    genderid integer,
    personid character varying(10),
    address text,
    previouscases integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.accused OWNER TO postgres;

--
-- Name: accused_accusedmasterid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accused_accusedmasterid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accused_accusedmasterid_seq OWNER TO postgres;

--
-- Name: accused_accusedmasterid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accused_accusedmasterid_seq OWNED BY public.accused.accusedmasterid;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id character varying(50) NOT NULL,
    role character varying(30),
    station_id integer,
    district_id integer,
    query_text text NOT NULL,
    intent character varying(50),
    filters_applied jsonb,
    result_count integer,
    execution_time_ms integer,
    ts timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: casecategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.casecategory (
    casecategoryid integer NOT NULL,
    lookupvalue character varying(50) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.casecategory OWNER TO postgres;

--
-- Name: casecategory_casecategoryid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.casecategory_casecategoryid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.casecategory_casecategoryid_seq OWNER TO postgres;

--
-- Name: casecategory_casecategoryid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.casecategory_casecategoryid_seq OWNED BY public.casecategory.casecategoryid;


--
-- Name: casemaster; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.casemaster (
    casemasterid integer NOT NULL,
    crimeno character varying(18) NOT NULL,
    caseno character varying(9) NOT NULL,
    crimeregistereddate date NOT NULL,
    policepersonid integer,
    policestationid integer,
    casecategoryid integer DEFAULT 1,
    gravityoffenceid integer DEFAULT 2,
    crimemajorheadid integer,
    crimeminorheadid integer,
    casestatusid integer DEFAULT 1,
    courtid integer,
    incidentfromdate timestamp without time zone,
    incidenttodate timestamp without time zone,
    inforeceivedpsdate timestamp without time zone,
    latitude numeric(9,6),
    longitude numeric(9,6),
    brieffacts text,
    modusoperandi text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.casemaster OWNER TO postgres;

--
-- Name: casemaster_casemasterid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.casemaster_casemasterid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.casemaster_casemasterid_seq OWNER TO postgres;

--
-- Name: casemaster_casemasterid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.casemaster_casemasterid_seq OWNED BY public.casemaster.casemasterid;


--
-- Name: casestatusmaster; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.casestatusmaster (
    casestatusid integer NOT NULL,
    casestatusname character varying(100) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.casestatusmaster OWNER TO postgres;

--
-- Name: casestatusmaster_casestatusid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.casestatusmaster_casestatusid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.casestatusmaster_casestatusid_seq OWNER TO postgres;

--
-- Name: casestatusmaster_casestatusid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.casestatusmaster_casestatusid_seq OWNED BY public.casestatusmaster.casestatusid;


--
-- Name: chargesheetdetails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chargesheetdetails (
    csid integer NOT NULL,
    casemasterid integer NOT NULL,
    csdate timestamp without time zone,
    cstype character(1),
    policepersonid integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chargesheetdetails_cstype_check CHECK ((cstype = ANY (ARRAY['A'::bpchar, 'B'::bpchar, 'C'::bpchar])))
);


ALTER TABLE public.chargesheetdetails OWNER TO postgres;

--
-- Name: complainantdetails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complainantdetails (
    complainantid integer NOT NULL,
    casemasterid integer NOT NULL,
    complainantname character varying(255) NOT NULL,
    ageyear integer,
    genderid integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.complainantdetails OWNER TO postgres;

--
-- Name: complainantdetails_complainantid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.complainantdetails_complainantid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.complainantdetails_complainantid_seq OWNER TO postgres;

--
-- Name: complainantdetails_complainantid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.complainantdetails_complainantid_seq OWNED BY public.complainantdetails.complainantid;


--
-- Name: crime_trends; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crime_trends (
    id integer NOT NULL,
    district_id integer,
    station_id integer,
    crime_head_id integer,
    date_bucket date,
    bucket_type character varying(10),
    incident_count integer DEFAULT 0,
    computed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT crime_trends_bucket_type_check CHECK (((bucket_type)::text = ANY ((ARRAY['DAILY'::character varying, 'WEEKLY'::character varying, 'MONTHLY'::character varying])::text[])))
);


ALTER TABLE public.crime_trends OWNER TO postgres;

--
-- Name: crime_trends_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.crime_trends_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crime_trends_id_seq OWNER TO postgres;

--
-- Name: crime_trends_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.crime_trends_id_seq OWNED BY public.crime_trends.id;


--
-- Name: crimehead; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crimehead (
    crimeheadid integer NOT NULL,
    crimegroupname character varying(255) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.crimehead OWNER TO postgres;

--
-- Name: crimehead_crimeheadid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.crimehead_crimeheadid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crimehead_crimeheadid_seq OWNER TO postgres;

--
-- Name: crimehead_crimeheadid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.crimehead_crimeheadid_seq OWNED BY public.crimehead.crimeheadid;


--
-- Name: crimesubhead; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crimesubhead (
    crimesubheadid integer NOT NULL,
    crimeheadid integer NOT NULL,
    crimeheadname character varying(255) NOT NULL,
    seqid integer,
    active boolean DEFAULT true
);


ALTER TABLE public.crimesubhead OWNER TO postgres;

--
-- Name: crimesubhead_crimesubheadid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.crimesubhead_crimesubheadid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crimesubhead_crimesubheadid_seq OWNER TO postgres;

--
-- Name: crimesubhead_crimesubheadid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.crimesubhead_crimesubheadid_seq OWNED BY public.crimesubhead.crimesubheadid;


--
-- Name: designation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.designation (
    designationid integer NOT NULL,
    designationname character varying(100) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.designation OWNER TO postgres;

--
-- Name: designation_designationid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.designation_designationid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.designation_designationid_seq OWNER TO postgres;

--
-- Name: designation_designationid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.designation_designationid_seq OWNED BY public.designation.designationid;


--
-- Name: district; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.district (
    districtid integer NOT NULL,
    districtname character varying(255) NOT NULL,
    stateid integer NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.district OWNER TO postgres;

--
-- Name: district_districtid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.district_districtid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.district_districtid_seq OWNER TO postgres;

--
-- Name: district_districtid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.district_districtid_seq OWNED BY public.district.districtid;


--
-- Name: employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee (
    employeeid integer NOT NULL,
    districtid integer,
    unitid integer,
    rankid integer,
    designationid integer,
    kgid character varying(50),
    firstname character varying(255),
    employeedob date,
    genderid integer,
    physicallychallenged boolean DEFAULT false,
    appointmentdate date,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee OWNER TO postgres;

--
-- Name: employee_employeeid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_employeeid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_employeeid_seq OWNER TO postgres;

--
-- Name: employee_employeeid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_employeeid_seq OWNED BY public.employee.employeeid;


--
-- Name: firs_compat; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.firs_compat AS
 SELECT concat('FIR_', casemasterid) AS fir_id,
    crimeno AS fir_number,
    policestationid AS station_id,
    NULL::text AS district_id,
    crimeregistereddate AS date_time,
    NULL::text AS location_name,
    latitude AS location_geo_lat,
    longitude AS location_geo_lon,
    NULL::text AS crime_type,
    NULL::text AS crime_category,
    NULL::text AS modus_operandi,
    brieffacts AS description,
        CASE
            WHEN (gravityoffenceid = 1) THEN 'CONFIDENTIAL'::text
            ELSE 'NORMAL'::text
        END AS sensitivity,
        CASE casestatusid
            WHEN 1 THEN 'REGISTERED'::text
            WHEN 2 THEN 'UNDER_INVESTIGATION'::text
            WHEN 3 THEN 'CHARGE_SHEETED'::text
            WHEN 4 THEN 'CLOSED'::text
            ELSE NULL::text
        END AS status,
    created_at
   FROM public.casemaster;


ALTER VIEW public.firs_compat OWNER TO postgres;

--
-- Name: gravityoffence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gravityoffence (
    gravityoffenceid integer NOT NULL,
    lookupvalue character varying(50) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.gravityoffence OWNER TO postgres;

--
-- Name: gravityoffence_gravityoffenceid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gravityoffence_gravityoffenceid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gravityoffence_gravityoffenceid_seq OWNER TO postgres;

--
-- Name: gravityoffence_gravityoffenceid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gravityoffence_gravityoffenceid_seq OWNED BY public.gravityoffence.gravityoffenceid;


--
-- Name: rank; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rank (
    rankid integer NOT NULL,
    rankname character varying(100) NOT NULL,
    rankorder integer,
    active boolean DEFAULT true
);


ALTER TABLE public.rank OWNER TO postgres;

--
-- Name: rank_rankid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rank_rankid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rank_rankid_seq OWNER TO postgres;

--
-- Name: rank_rankid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rank_rankid_seq OWNED BY public.rank.rankid;


--
-- Name: state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.state (
    stateid integer NOT NULL,
    statename character varying(255) NOT NULL,
    statecode character varying(10),
    active boolean DEFAULT true
);


ALTER TABLE public.state OWNER TO postgres;

--
-- Name: state_stateid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.state_stateid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.state_stateid_seq OWNER TO postgres;

--
-- Name: state_stateid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.state_stateid_seq OWNED BY public.state.stateid;


--
-- Name: unit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit (
    unitid integer NOT NULL,
    unitname character varying(255) NOT NULL,
    typeid integer,
    parentunit integer,
    stateid integer,
    districtid integer,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.unit OWNER TO postgres;

--
-- Name: unit_unitid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_unitid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_unitid_seq OWNER TO postgres;

--
-- Name: unit_unitid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_unitid_seq OWNED BY public.unit.unitid;


--
-- Name: unittype; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unittype (
    unittypeid integer NOT NULL,
    unittypename character varying(100) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.unittype OWNER TO postgres;

--
-- Name: unittype_unittypeid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unittype_unittypeid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unittype_unittypeid_seq OWNER TO postgres;

--
-- Name: unittype_unittypeid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unittype_unittypeid_seq OWNED BY public.unittype.unittypeid;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(30) NOT NULL,
    station_id integer,
    district_id integer,
    full_name character varying(255),
    phone character varying(20),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['Constable'::character varying, 'SI'::character varying, 'Inspector'::character varying, 'DSP'::character varying, 'SCRB_Analyst'::character varying, 'Admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: victim; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.victim (
    victimmasterid integer NOT NULL,
    casemasterid integer NOT NULL,
    victimname character varying(255) NOT NULL,
    ageyear integer,
    genderid integer,
    victimpolice character varying(1) DEFAULT '0'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT victim_victimpolice_check CHECK (((victimpolice)::text = ANY ((ARRAY['0'::character varying, '1'::character varying])::text[])))
);


ALTER TABLE public.victim OWNER TO postgres;

--
-- Name: victim_victimmasterid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.victim_victimmasterid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.victim_victimmasterid_seq OWNER TO postgres;

--
-- Name: victim_victimmasterid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.victim_victimmasterid_seq OWNED BY public.victim.victimmasterid;


--
-- Name: accused accusedmasterid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accused ALTER COLUMN accusedmasterid SET DEFAULT nextval('public.accused_accusedmasterid_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: casecategory casecategoryid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.casecategory ALTER COLUMN casecategoryid SET DEFAULT nextval('public.casecategory_casecategoryid_seq'::regclass);


--
-- Name: casemaster casemasterid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.casemaster ALTER COLUMN casemasterid SET DEFAULT nextval('public.casemaster_casemasterid_seq'::regclass);


--
-- Name: casestatusmaster casestatusid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.casestatusmaster ALTER COLUMN casestatusid SET DEFAULT nextval('public.casestatusmaster_casestatusid_seq'::regclass);


--
-- Name: complainantdetails complainantid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complainantdetails ALTER COLUMN complainantid SET DEFAULT nextval('public.complainantdetails_complainantid_seq'::regclass);


--
-- Name: crime_trends id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crime_trends ALTER COLUMN id SET DEFAULT nextval('public.crime_trends_id_seq'::regclass);


--
-- Name: crimehead crimeheadid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crimehead ALTER COLUMN crimeheadid SET DEFAULT nextval('public.crimehead_crimeheadid_seq'::regclass);


--
-- Name: crimesubhead crimesubheadid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crimesubhead ALTER COLUMN crimesubheadid SET DEFAULT nextval('public.crimesubhead_crimesubheadid_seq'::regclass);


--
-- Name: designation designationid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.designation ALTER COLUMN designationid SET DEFAULT nextval('public.designation_designationid_seq'::regclass);


--
-- Name: district districtid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district ALTER COLUMN districtid SET DEFAULT nextval('public.district_districtid_seq'::regclass);


--
-- Name: employee employeeid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee ALTER COLUMN employeeid SET DEFAULT nextval('public.employee_employeeid_seq'::regclass);


--
-- Name: gravityoffence gravityoffenceid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gravityoffence ALTER COLUMN gravityoffenceid SET DEFAULT nextval('public.gravityoffence_gravityoffenceid_seq'::regclass);


--
-- Name: rank rankid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rank ALTER COLUMN rankid SET DEFAULT nextval('public.rank_rankid_seq'::regclass);


--
-- Name: state stateid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state ALTER COLUMN stateid SET DEFAULT nextval('public.state_stateid_seq'::regclass);


--
-- Name: unit unitid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit ALTER COLUMN unitid SET DEFAULT nextval('public.unit_unitid_seq'::regclass);


--
-- Name: unittype unittypeid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unittype ALTER COLUMN unittypeid SET DEFAULT nextval('public.unittype_unittypeid_seq'::regclass);


--
-- Name: victim victimmasterid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.victim ALTER COLUMN victimmasterid SET DEFAULT nextval('public.victim_victimmasterid_seq'::regclass);


--
-- Data for Name: accused; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accused (accusedmasterid, casemasterid, accusedname, ageyear, genderid, personid, address, previouscases, created_at) FROM stdin;
1	1	Ravi Kumar	32	1	A1	Unknown	3	2026-07-07 19:40:27.160233
2	2	Ravi Kumar	32	1	A1	Unknown	4	2026-07-07 19:40:27.160233
3	7	Deepak Shetty	24	1	A1	Koramangala 3rd Block	1	2026-07-07 19:40:27.160233
4	11	Ravi Kumar	32	1	A1	Unknown	5	2026-07-07 19:40:27.160233
5	14	Mukesh Singh	28	1	A1	Unknown	2	2026-07-07 19:40:27.160233
6	14	Suresh Yadav	26	1	A2	Unknown	1	2026-07-07 19:40:27.160233
7	19	Sanjay Verma	29	1	A1	Unknown	3	2026-07-07 19:40:27.160233
8	21	Ramesh Babu	35	1	A1	Whitefield	0	2026-07-07 19:40:27.160233
9	21	Kumar Swamy	27	1	A2	Whitefield	1	2026-07-07 19:40:27.160233
10	26	Prakash Gowda	33	1	A1	Whitefield	2	2026-07-07 19:40:27.160233
11	29	Vijay Kumar	25	1	A1	Unknown	1	2026-07-07 19:40:27.160233
12	29	Ajay Singh	23	1	A2	Unknown	0	2026-07-07 19:40:27.160233
13	31	Anil Patil	40	1	A1	Unknown	4	2026-07-07 19:40:27.160233
14	31	Dinesh Kumar	38	1	A2	Unknown	3	2026-07-07 19:40:27.160233
15	31	Sunil Rao	35	1	A3	Unknown	2	2026-07-07 19:40:27.160233
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, role, station_id, district_id, query_text, intent, filters_applied, result_count, execution_time_ms, ts) FROM stdin;
1	USR_001	Constable	1	1	Show theft cases in my station in last 30 days	search_cases	{"date_to": null, "date_from": "2026-06-07", "crime_type_ids": [1], "location_scope": "my_station"}	0	\N	2026-07-07 22:39:32.2703
2	USR_001	Constable	1	1	Show theft cases in my station in last 30 days	search_cases	{"date_to": null, "date_from": "2026-06-07", "crime_type_ids": [1], "location_scope": "my_station"}	0	\N	2026-07-07 23:35:13.424009
3	USR_003	Inspector	2	1	Show theft cases in my station in last 30 days	search_cases	{"date_to": null, "date_from": "2026-06-07", "crime_type_ids": [1], "location_scope": "my_station"}	0	\N	2026-07-07 23:35:50.780767
4	USR_006	Admin	100	1	Show theft cases in my station in last 30 days	search_cases	{"date_to": null, "date_from": "2026-06-07", "crime_type_ids": [1], "location_scope": "my_station"}	0	\N	2026-07-07 23:36:25.267315
\.


--
-- Data for Name: casecategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.casecategory (casecategoryid, lookupvalue, active) FROM stdin;
1	FIR	t
2	UDR	t
3	PAR	t
4	Zero FIR	t
\.


--
-- Data for Name: casemaster; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.casemaster (casemasterid, crimeno, caseno, crimeregistereddate, policepersonid, policestationid, casecategoryid, gravityoffenceid, crimemajorheadid, crimeminorheadid, casestatusid, courtid, incidentfromdate, incidenttodate, inforeceivedpsdate, latitude, longitude, brieffacts, modusoperandi, created_at) FROM stdin;
1	104430001202600001	202600001	2025-11-01	\N	1	1	2	1	1	2	\N	2025-11-01 18:00:00	\N	\N	12.935200	77.624500	Residential theft reported at apartment complex. Gold jewelry worth Rs. 2 lakhs stolen from bedroom. No signs of forced entry, suspect had duplicate key. CCTV shows person entering at 2 PM when residents were away.	Duplicate key used, professional thief	2026-07-07 19:40:27.152309
2	104430001202600002	202600002	2025-11-05	\N	1	1	2	1	1	2	\N	2025-11-05 14:00:00	\N	\N	12.934300	77.624700	Shop burglary at electronics store during night hours. Stock worth Rs. 5 lakhs missing including laptops and mobile phones. Back door lock broken. Similar MO to previous case in area.	Breaking and entering at night	2026-07-07 19:40:27.152309
3	104430001202600003	202600003	2025-11-08	\N	1	1	2	1	4	2	\N	2025-11-08 08:30:00	\N	\N	12.935500	77.625000	Two-wheeler theft from parking lot. Honda Activa registration KA-01-AB-1234 stolen. CCTV footage shows suspect cutting lock at 2:30 AM. Vehicle recovered from nearby area.	Lock cutting, late night theft	2026-07-07 19:40:27.152309
4	104430001202600004	202600004	2025-11-12	\N	1	1	2	1	1	2	\N	2025-11-12 20:00:00	\N	\N	12.936000	77.624800	Theft at gym facility. Multiple lockers broken, cash and valuables worth Rs. 80,000 stolen. No CCTV in locker room. Suspect believed to be insider or regular member.	Locker breaking	2026-07-07 19:40:27.152309
5	104430001202600005	202600005	2025-11-15	\N	1	1	1	2	6	2	\N	2025-11-15 22:30:00	\N	\N	12.934200	77.623500	Assault case following road rage incident. Two individuals involved in altercation at traffic signal. One person sustained minor injuries. Both parties filed complaints.	Road rage violence	2026-07-07 19:40:27.152309
6	104430001202600006	202600006	2025-11-18	\N	1	1	2	4	10	1	\N	2025-11-18 10:00:00	\N	\N	12.934800	77.624200	Online banking fraud reported. Victim received phishing email claiming to be from bank. Login credentials compromised, Rs. 1.2 lakhs transferred to unknown account. Cyber crime unit investigating.	Phishing email, online fraud	2026-07-07 19:40:27.152309
7	104430001202600007	202600007	2025-11-22	\N	1	1	2	1	1	2	\N	2025-11-22 16:00:00	\N	\N	12.933500	77.625500	Pickpocketing at Forum Mall. Mobile phone and wallet stolen from victim pocket in crowded area. Suspect identified from mall CCTV footage. Known repeat offender.	Crowded place pickpocketing	2026-07-07 19:40:27.152309
8	104430001202600008	202600008	2025-11-25	\N	1	1	2	1	2	2	\N	2025-11-25 03:00:00	\N	\N	12.935800	77.624000	Residential burglary attempt. Suspect tried to break into apartment through window. Alert neighbor called police. Suspect fled before entry. Tool marks found on window grill.	Window breaking attempt	2026-07-07 19:40:27.152309
9	104430001202600009	202600009	2025-11-28	\N	1	1	2	1	4	2	\N	2025-11-28 07:00:00	\N	\N	12.936200	77.625200	Scooter theft from apartment basement parking. TVS Jupiter stolen. No CCTV in basement. Multiple similar thefts reported in area over past month.	Basement parking theft	2026-07-07 19:40:27.152309
10	104430001202600010	202600010	2025-12-01	\N	1	1	2	4	10	1	\N	2025-12-01 14:30:00	\N	\N	12.934000	77.624400	Credit card fraud. Unauthorized transactions totaling Rs. 67,000 detected. Card was cloned at ATM. Bank has blocked card and initiated investigation.	ATM skimming, card cloning	2026-07-07 19:40:27.152309
11	104430001202600011	202600011	2025-12-05	\N	1	1	2	1	1	2	\N	2025-12-05 19:00:00	\N	\N	12.934500	77.623800	Jewelry theft from parked car. Car window smashed, bag containing gold chain stolen. Incident occurred in busy market area during evening hours.	Car break-in, smash and grab	2026-07-07 19:40:27.152309
12	104430001202600012	202600012	2025-12-08	\N	1	1	2	1	1	3	\N	2025-12-08 11:00:00	\N	\N	12.935000	77.624600	Theft at office premises. Laptop and important documents stolen from locked cabin. Suspect believed to be contract worker. CCTV footage being reviewed.	Inside job, office theft	2026-07-07 19:40:27.152309
13	104430001202600013	202600013	2025-12-12	\N	1	1	1	2	6	2	\N	2025-12-12 21:00:00	\N	\N	12.933800	77.624100	Assault case at pub. Verbal argument escalated to physical fight. Three individuals involved. One person hospitalized with head injury. All parties under investigation.	Bar fight, alcohol related	2026-07-07 19:40:27.152309
14	104430001202600014	202600014	2025-12-15	\N	1	1	2	1	3	2	\N	2025-12-15 01:30:00	\N	\N	12.936500	77.624900	Chain snatching on morning walk. Two suspects on motorcycle snatched gold chain from elderly woman. Victim fell and sustained injuries. Suspects absconding.	Two-wheeler borne snatching	2026-07-07 19:40:27.152309
15	104430001202600015	202600015	2025-12-18	\N	1	1	2	1	1	2	\N	2025-12-18 15:00:00	\N	\N	12.933200	77.623600	Shoplifting at supermarket. Multiple items worth Rs. 25,000 stolen. Suspect caught by security guard. CCTV footage clear. Professional shoplifter with previous cases.	Organized shoplifting	2026-07-07 19:40:27.152309
16	104430001202600016	202600016	2025-12-22	\N	1	1	2	4	11	1	\N	2025-12-22 09:00:00	\N	\N	12.935500	77.624300	Identity theft case. Victim Aadhaar and PAN card details used to open bank account and take loan. Rs. 3 lakhs loan amount diverted. Cyber forensics ongoing.	Document forgery, identity theft	2026-07-07 19:40:27.152309
17	104430001202600017	202600017	2025-12-25	\N	1	1	2	1	1	2	\N	2025-12-25 20:00:00	\N	\N	12.934700	77.623900	Residential theft during festival time. Family away for holidays. Multiple items including electronics and jewelry stolen. Neighbor reported suspicious activity.	Festival time targeting	2026-07-07 19:40:27.152309
18	104430001202600018	202600018	2025-12-28	\N	1	1	2	1	4	2	\N	2025-12-28 06:00:00	\N	\N	12.934100	77.625100	Auto-rickshaw theft. Vehicle stolen from stand. Owner received ransom call demanding Rs. 15,000. Call traced, suspect arrested with vehicle.	Vehicle theft with ransom	2026-07-07 19:40:27.152309
19	104430001202600019	202600019	2026-01-02	\N	1	1	2	1	1	2	\N	2026-01-02 13:00:00	\N	\N	12.935300	77.624700	Theft at construction site. Copper wires and electrical equipment worth Rs. 1.5 lakhs stolen. Night watchman claims he was threatened by armed men.	Construction material theft	2026-07-07 19:40:27.152309
20	104430001202600020	202600020	2026-01-05	\N	1	1	2	5	12	2	\N	2026-01-05 22:00:00	\N	\N	12.933900	77.624500	Drug possession case. Police patrol found suspect with 200 grams cannabis. Interrogation reveals links to larger distribution network in area.	Drug possession, small quantity	2026-07-07 19:40:27.152309
21	104430002202600001	202600001	2025-11-03	\N	2	1	2	1	4	2	\N	2025-11-03 23:00:00	\N	\N	12.969800	77.749900	Bike theft from office parking. Bajaj Pulsar stolen. Security guard did not notice. CCTV shows two suspects working together.	Professional bike theft duo	2026-07-07 19:40:27.152309
22	104430002202600002	202600002	2025-11-10	\N	2	1	1	2	6	2	\N	2025-11-10 19:30:00	\N	\N	12.985000	77.726000	Assault at ITPL gate. Security personnel assaulted by intoxicated individual. Victim sustained minor injuries. Suspect arrested at scene.	Alcohol related violence	2026-07-07 19:40:27.152309
23	104430002202600003	202600003	2025-11-15	\N	2	1	2	1	3	2	\N	2025-11-15 08:00:00	\N	\N	12.972000	77.752000	Morning chain snatching. Two suspects on bike targeted woman walking to work. Gold chain worth Rs. 45,000 snatched. Suspects absconding, vehicle number noted.	Two-wheeler snatch	2026-07-07 19:40:27.152309
24	104430002202600004	202600004	2025-11-20	\N	2	1	2	1	1	2	\N	2025-11-20 02:00:00	\N	\N	12.968000	77.748000	ATM theft attempt. Suspects tried to break ATM machine using gas cutter. Alert security guard called police. Suspects fled leaving tools behind.	ATM breaking attempt	2026-07-07 19:40:27.152309
25	104430002202600005	202600005	2025-11-25	\N	2	1	2	4	10	1	\N	2025-11-25 11:00:00	\N	\N	12.971000	77.751000	Online shopping fraud. Fake website selling electronics. Multiple victims lost money. Total amount Rs. 4.5 lakhs. Cyber investigation underway.	E-commerce fraud	2026-07-07 19:40:27.152309
26	104430002202600006	202600006	2025-12-01	\N	2	1	2	1	2	2	\N	2025-12-01 04:00:00	\N	\N	12.969000	77.749000	Warehouse burglary. Electronics warehouse broken into. Goods worth Rs. 8 lakhs stolen. Multiple suspects involved, used truck for transport.	Organized warehouse theft	2026-07-07 19:40:27.152309
27	104430002202600007	202600007	2025-12-05	\N	2	1	2	1	4	2	\N	2025-12-05 21:00:00	\N	\N	12.973000	77.753000	Car theft from apartment complex. Honda City stolen from visitors parking. No CCTV coverage in that section. Vehicle alert issued.	Car theft, no CCTV area	2026-07-07 19:40:27.152309
28	104430002202600008	202600008	2025-12-10	\N	2	1	1	2	7	3	\N	2025-12-10 14:00:00	\N	\N	12.970000	77.750000	Hit and run case. Pedestrian hit by speeding car on main road. Victim suffered fractures. Partial vehicle number captured. Search ongoing.	Traffic accident, fleeing	2026-07-07 19:40:27.152309
29	104430002202600009	202600009	2025-12-15	\N	2	1	2	1	1	2	\N	2025-12-15 16:00:00	\N	\N	12.971500	77.751500	Mobile phone theft at mall. Phone snatched from victim hand while shopping. Suspect quickly disappeared in crowd. Mall security reviewing footage.	Snatch theft in mall	2026-07-07 19:40:27.152309
30	104430002202600010	202600010	2025-12-20	\N	2	1	2	1	3	2	\N	2025-12-20 07:30:00	\N	\N	12.970500	77.750500	Chain snatching near bus stop. Elderly victim targeted during morning hours. Gold chain worth Rs. 60,000 stolen. Similar pattern to previous cases.	Repeat MO snatching	2026-07-07 19:40:27.152309
31	104430002202600011	202600011	2025-12-25	\N	2	1	2	5	13	2	\N	2025-12-25 23:00:00	\N	\N	12.969500	77.749500	Drug trafficking case. Police raid recovered 2 kg ganja. Three suspects arrested. Investigation reveals supply chain from neighboring state.	Drug trafficking network	2026-07-07 19:40:27.152309
32	104430002202600012	202600012	2025-12-30	\N	2	1	2	1	1	2	\N	2025-12-30 12:00:00	\N	\N	12.972500	77.752500	Office burglary during holiday. IT company office broken into during year-end holidays. Computers and networking equipment worth Rs. 3 lakhs stolen.	Holiday targeting burglary	2026-07-07 19:40:27.152309
33	104430002202600013	202600013	2026-01-03	\N	2	1	2	1	4	2	\N	2026-01-03 05:00:00	\N	\N	12.968500	77.748500	Two-wheeler theft gang busted. Police patrol caught three suspects red-handed stealing bike. Recovery of 8 previously stolen bikes. Major breakthrough.	Vehicle theft gang	2026-07-07 19:40:27.152309
34	104430002202600014	202600014	2026-01-06	\N	2	1	2	4	10	1	\N	2026-01-06 10:00:00	\N	\N	12.970800	77.750800	UPI fraud case. Victim received call pretending to be bank official. Rs. 85,000 transferred via multiple UPI transactions. Phone number traced.	Banking fraud, social engineering	2026-07-07 19:40:27.152309
35	104430002202600015	202600015	2026-01-08	\N	2	1	1	2	6	2	\N	2026-01-08 20:00:00	\N	\N	12.971200	77.751200	Assault at restaurant. Customer dispute with staff escalated to violence. Two people injured. CCTV footage clear. Chargesheet filed.	Customer dispute violence	2026-07-07 19:40:27.152309
\.


--
-- Data for Name: casestatusmaster; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.casestatusmaster (casestatusid, casestatusname, active) FROM stdin;
1	Registered	t
2	Under Investigation	t
3	Charge Sheeted	t
4	Closed	t
5	Reopened	t
\.


--
-- Data for Name: chargesheetdetails; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chargesheetdetails (csid, casemasterid, csdate, cstype, policepersonid, created_at) FROM stdin;
\.


--
-- Data for Name: complainantdetails; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complainantdetails (complainantid, casemasterid, complainantname, ageyear, genderid, created_at) FROM stdin;
\.


--
-- Data for Name: crime_trends; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crime_trends (id, district_id, station_id, crime_head_id, date_bucket, bucket_type, incident_count, computed_at) FROM stdin;
\.


--
-- Data for Name: crimehead; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crimehead (crimeheadid, crimegroupname, active) FROM stdin;
1	Crimes Against Property	t
2	Crimes Against Body	t
3	Crimes Against Women	t
4	Cyber Crimes	t
5	Drug Related Crimes	t
\.


--
-- Data for Name: crimesubhead; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crimesubhead (crimesubheadid, crimeheadid, crimeheadname, seqid, active) FROM stdin;
1	1	Theft	1	t
2	1	Burglary	2	t
3	1	Robbery	3	t
4	1	Vehicle Theft	4	t
5	2	Murder	1	t
6	2	Assault	2	t
7	2	Grievous Hurt	3	t
8	3	Domestic Violence	1	t
9	3	Sexual Assault	2	t
10	4	Online Fraud	1	t
11	4	Identity Theft	2	t
12	5	Drug Possession	1	t
13	5	Drug Trafficking	2	t
\.


--
-- Data for Name: designation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.designation (designationid, designationname, active) FROM stdin;
1	Beat Constable	t
2	Investigating Officer	t
3	Station House Officer	t
4	Crime Analyst	t
5	System Administrator	t
\.


--
-- Data for Name: district; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.district (districtid, districtname, stateid, active) FROM stdin;
1	Bangalore Urban	1	t
2	Bangalore Rural	1	t
3	Mysuru	1	t
4	Mangaluru	1	t
\.


--
-- Data for Name: employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee (employeeid, districtid, unitid, rankid, designationid, kgid, firstname, employeedob, genderid, physicallychallenged, appointmentdate, active, created_at) FROM stdin;
\.


--
-- Data for Name: gravityoffence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gravityoffence (gravityoffenceid, lookupvalue, active) FROM stdin;
1	Heinous	t
2	Non-Heinous	t
\.


--
-- Data for Name: rank; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rank (rankid, rankname, rankorder, active) FROM stdin;
1	Constable	1	t
2	Head Constable	2	t
3	Sub-Inspector	3	t
4	Inspector	4	t
5	Deputy Superintendent of Police	5	t
6	Superintendent of Police	6	t
\.


--
-- Data for Name: state; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.state (stateid, statename, statecode, active) FROM stdin;
1	Karnataka	KA	t
\.


--
-- Data for Name: unit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unit (unitid, unitname, typeid, parentunit, stateid, districtid, active, created_at) FROM stdin;
1	Koramangala Police Station	1	\N	1	1	t	2026-07-07 19:39:57.174203
2	Whitefield Police Station	1	\N	1	1	t	2026-07-07 19:39:57.174203
3	Jayanagar Police Station	1	\N	1	1	t	2026-07-07 19:39:57.174203
4	HSR Layout Police Station	1	\N	1	1	t	2026-07-07 19:39:57.174203
5	Mysuru City Police Station	1	\N	1	3	t	2026-07-07 19:39:57.174203
6	Mangaluru Central Police Station	1	\N	1	4	t	2026-07-07 19:39:57.174203
100	SCRB Headquarters	4	\N	1	1	t	2026-07-07 19:39:57.174203
\.


--
-- Data for Name: unittype; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unittype (unittypeid, unittypename, active) FROM stdin;
1	Police Station	t
2	Circle Office	t
3	Division Office	t
4	Headquarters	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, email, password_hash, role, station_id, district_id, full_name, phone, active, created_at, last_login) FROM stdin;
USR_001	rajesh.kumar@ksp.gov.in	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg	Constable	1	1	Rajesh Kumar	+919876543210	t	2026-07-07 19:40:27.141421	\N
USR_002	priya.sharma@ksp.gov.in	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg	SI	1	1	Priya Sharma	+919876543211	t	2026-07-07 19:40:27.141421	\N
USR_003	arun.desai@ksp.gov.in	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg	Inspector	2	1	Arun Desai	+919876543212	t	2026-07-07 19:40:27.141421	\N
USR_004	lakshmi.rao@ksp.gov.in	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg	DSP	3	1	Lakshmi Rao	+919876543213	t	2026-07-07 19:40:27.141421	\N
USR_005	vikram.mehta@ksp.gov.in	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg	SCRB_Analyst	100	1	Vikram Mehta	+919876543214	t	2026-07-07 19:40:27.141421	\N
USR_006	admin.system@ksp.gov.in	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg	Admin	100	1	System Admin	+919876543215	t	2026-07-07 19:40:27.141421	\N
\.


--
-- Data for Name: victim; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.victim (victimmasterid, casemasterid, victimname, ageyear, genderid, victimpolice, created_at) FROM stdin;
1	1	Sunita Rao	45	2	0	2026-07-07 19:40:27.164918
2	2	Ramesh Electronics	\N	\N	0	2026-07-07 19:40:27.164918
3	3	Mohan Kumar	38	1	0	2026-07-07 19:40:27.164918
4	5	Rajesh Patel	42	1	0	2026-07-07 19:40:27.164918
5	5	Suresh Gowda	40	1	0	2026-07-07 19:40:27.164918
6	6	Anita Sharma	35	2	0	2026-07-07 19:40:27.164918
7	7	Priya Nair	28	2	0	2026-07-07 19:40:27.164918
8	10	Venkatesh Murthy	52	1	0	2026-07-07 19:40:27.164918
9	11	Lakshmi Devi	60	2	0	2026-07-07 19:40:27.164918
10	13	Kiran Kumar	29	1	0	2026-07-07 19:40:27.164918
11	14	Meera Bai	55	2	0	2026-07-07 19:40:27.164918
12	16	Ashok Reddy	45	1	0	2026-07-07 19:40:27.164918
13	21	Security Guard	50	1	1	2026-07-07 19:40:27.164918
14	23	Pavan Kumar	32	1	0	2026-07-07 19:40:27.164918
15	30	Manjula Devi	48	2	0	2026-07-07 19:40:27.164918
16	34	Vijaya Lakshmi	38	2	0	2026-07-07 19:40:27.164918
\.


--
-- Name: accused_accusedmasterid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accused_accusedmasterid_seq', 15, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 4, true);


--
-- Name: casecategory_casecategoryid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.casecategory_casecategoryid_seq', 1, false);


--
-- Name: casemaster_casemasterid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.casemaster_casemasterid_seq', 35, true);


--
-- Name: casestatusmaster_casestatusid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.casestatusmaster_casestatusid_seq', 1, false);


--
-- Name: complainantdetails_complainantid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.complainantdetails_complainantid_seq', 1, false);


--
-- Name: crime_trends_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.crime_trends_id_seq', 1, false);


--
-- Name: crimehead_crimeheadid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.crimehead_crimeheadid_seq', 1, false);


--
-- Name: crimesubhead_crimesubheadid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.crimesubhead_crimesubheadid_seq', 1, false);


--
-- Name: designation_designationid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.designation_designationid_seq', 1, false);


--
-- Name: district_districtid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.district_districtid_seq', 1, false);


--
-- Name: employee_employeeid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_employeeid_seq', 1, false);


--
-- Name: gravityoffence_gravityoffenceid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gravityoffence_gravityoffenceid_seq', 1, false);


--
-- Name: rank_rankid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rank_rankid_seq', 1, false);


--
-- Name: state_stateid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.state_stateid_seq', 1, false);


--
-- Name: unit_unitid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unit_unitid_seq', 1, false);


--
-- Name: unittype_unittypeid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unittype_unittypeid_seq', 1, false);


--
-- Name: victim_victimmasterid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.victim_victimmasterid_seq', 16, true);


--
-- Name: accused accused_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accused
    ADD CONSTRAINT accused_pkey PRIMARY KEY (accusedmasterid);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: casecategory casecategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.casecategory
    ADD CONSTRAINT casecategory_pkey PRIMARY KEY (casecategoryid);


--
-- Name: casemaster casemaster_crimeno_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.casemaster
    ADD CONSTRAINT casemaster_crimeno_key UNIQUE (crimeno);


--
-- Name: casemaster casemaster_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.casemaster
    ADD CONSTRAINT casemaster_pkey PRIMARY KEY (casemasterid);


--
-- Name: casestatusmaster casestatusmaster_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.casestatusmaster
    ADD CONSTRAINT casestatusmaster_pkey PRIMARY KEY (casestatusid);


--
-- Name: chargesheetdetails chargesheetdetails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chargesheetdetails
    ADD CONSTRAINT chargesheetdetails_pkey PRIMARY KEY (csid);


--
-- Name: complainantdetails complainantdetails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complainantdetails
    ADD CONSTRAINT complainantdetails_pkey PRIMARY KEY (complainantid);


--
-- Name: crime_trends crime_trends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crime_trends
    ADD CONSTRAINT crime_trends_pkey PRIMARY KEY (id);


--
-- Name: crimehead crimehead_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crimehead
    ADD CONSTRAINT crimehead_pkey PRIMARY KEY (crimeheadid);


--
-- Name: crimesubhead crimesubhead_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crimesubhead
    ADD CONSTRAINT crimesubhead_pkey PRIMARY KEY (crimesubheadid);


--
-- Name: designation designation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.designation
    ADD CONSTRAINT designation_pkey PRIMARY KEY (designationid);


--
-- Name: district district_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district
    ADD CONSTRAINT district_pkey PRIMARY KEY (districtid);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (employeeid);


--
-- Name: gravityoffence gravityoffence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gravityoffence
    ADD CONSTRAINT gravityoffence_pkey PRIMARY KEY (gravityoffenceid);


--
-- Name: rank rank_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rank
    ADD CONSTRAINT rank_pkey PRIMARY KEY (rankid);


--
-- Name: state state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state
    ADD CONSTRAINT state_pkey PRIMARY KEY (stateid);


--
-- Name: unit unit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_pkey PRIMARY KEY (unitid);


--
-- Name: unittype unittype_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unittype
    ADD CONSTRAINT unittype_pkey PRIMARY KEY (unittypeid);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: victim victim_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.victim
    ADD CONSTRAINT victim_pkey PRIMARY KEY (victimmasterid);


--
-- Name: idx_accused_case; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accused_case ON public.accused USING btree (casemasterid);


--
-- Name: idx_accused_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accused_name ON public.accused USING btree (accusedname);


--
-- Name: idx_accused_personid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accused_personid ON public.accused USING btree (personid);


--
-- Name: idx_audit_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_role ON public.audit_logs USING btree (role);


--
-- Name: idx_audit_ts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_ts ON public.audit_logs USING btree (ts DESC);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_casemaster_crimehead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_casemaster_crimehead ON public.casemaster USING btree (crimemajorheadid, crimeminorheadid);


--
-- Name: idx_casemaster_crimeno; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_casemaster_crimeno ON public.casemaster USING btree (crimeno);


--
-- Name: idx_casemaster_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_casemaster_date ON public.casemaster USING btree (crimeregistereddate DESC);


--
-- Name: idx_casemaster_geo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_casemaster_geo ON public.casemaster USING btree (latitude, longitude);


--
-- Name: idx_casemaster_station; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_casemaster_station ON public.casemaster USING btree (policestationid);


--
-- Name: idx_casemaster_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_casemaster_status ON public.casemaster USING btree (casestatusid);


--
-- Name: idx_chargesheet_case; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chargesheet_case ON public.chargesheetdetails USING btree (casemasterid);


--
-- Name: idx_chargesheet_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chargesheet_date ON public.chargesheetdetails USING btree (csdate DESC);


--
-- Name: idx_complainant_case; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complainant_case ON public.complainantdetails USING btree (casemasterid);


--
-- Name: idx_crimesubhead_head; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crimesubhead_head ON public.crimesubhead USING btree (crimeheadid);


--
-- Name: idx_district_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_district_state ON public.district USING btree (stateid);


--
-- Name: idx_employee_kgid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_kgid ON public.employee USING btree (kgid);


--
-- Name: idx_employee_rank; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_rank ON public.employee USING btree (rankid);


--
-- Name: idx_employee_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_unit ON public.employee USING btree (unitid);


--
-- Name: idx_trends_district_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trends_district_date ON public.crime_trends USING btree (district_id, date_bucket DESC);


--
-- Name: idx_trends_station_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trends_station_date ON public.crime_trends USING btree (station_id, date_bucket DESC);


--
-- Name: idx_unit_district; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_district ON public.unit USING btree (districtid);


--
-- Name: idx_unit_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_parent ON public.unit USING btree (parentunit);


--
-- Name: idx_unit_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_type ON public.unit USING btree (typeid);


--
-- Name: idx_users_district; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_district ON public.users USING btree (district_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_station; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_station ON public.users USING btree (station_id);


--
-- Name: idx_victim_case; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_victim_case ON public.victim USING btree (casemasterid);


--
-- Name: idx_victim_police; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_victim_police ON public.victim USING btree (victimpolice);


--
-- Name: accused accused_casemasterid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accused
    ADD CONSTRAINT accused_casemasterid_fkey FOREIGN KEY (casemasterid) REFERENCES public.casemaster(casemasterid) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: chargesheetdetails chargesheetdetails_casemasterid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chargesheetdetails
    ADD CONSTRAINT chargesheetdetails_casemasterid_fkey FOREIGN KEY (casemasterid) REFERENCES public.casemaster(casemasterid) ON DELETE CASCADE;


--
-- Name: complainantdetails complainantdetails_casemasterid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complainantdetails
    ADD CONSTRAINT complainantdetails_casemasterid_fkey FOREIGN KEY (casemasterid) REFERENCES public.casemaster(casemasterid) ON DELETE CASCADE;


--
-- Name: crime_trends crime_trends_crime_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crime_trends
    ADD CONSTRAINT crime_trends_crime_head_id_fkey FOREIGN KEY (crime_head_id) REFERENCES public.crimehead(crimeheadid);


--
-- Name: crime_trends crime_trends_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crime_trends
    ADD CONSTRAINT crime_trends_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.district(districtid);


--
-- Name: crime_trends crime_trends_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crime_trends
    ADD CONSTRAINT crime_trends_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.unit(unitid);


--
-- Name: crimesubhead crimesubhead_crimeheadid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crimesubhead
    ADD CONSTRAINT crimesubhead_crimeheadid_fkey FOREIGN KEY (crimeheadid) REFERENCES public.crimehead(crimeheadid);


--
-- Name: district district_stateid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district
    ADD CONSTRAINT district_stateid_fkey FOREIGN KEY (stateid) REFERENCES public.state(stateid);


--
-- Name: employee employee_designationid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_designationid_fkey FOREIGN KEY (designationid) REFERENCES public.designation(designationid);


--
-- Name: employee employee_districtid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_districtid_fkey FOREIGN KEY (districtid) REFERENCES public.district(districtid);


--
-- Name: employee employee_rankid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_rankid_fkey FOREIGN KEY (rankid) REFERENCES public.rank(rankid);


--
-- Name: employee employee_unitid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_unitid_fkey FOREIGN KEY (unitid) REFERENCES public.unit(unitid);


--
-- Name: unit unit_districtid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_districtid_fkey FOREIGN KEY (districtid) REFERENCES public.district(districtid);


--
-- Name: unit unit_stateid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_stateid_fkey FOREIGN KEY (stateid) REFERENCES public.state(stateid);


--
-- Name: unit unit_typeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_typeid_fkey FOREIGN KEY (typeid) REFERENCES public.unittype(unittypeid);


--
-- Name: users users_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.district(districtid);


--
-- Name: users users_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.unit(unitid);


--
-- Name: victim victim_casemasterid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.victim
    ADD CONSTRAINT victim_casemasterid_fkey FOREIGN KEY (casemasterid) REFERENCES public.casemaster(casemasterid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict SFv10RfeBJVsxm2xd7mnrDiLhUucBto6PZRgiKXRMQAOVOQNupHhHZBQp9QZv85

