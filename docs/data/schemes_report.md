# KrishiSetu AI: Government Schemes Data Audit Report

> **Audited Date:** 2026-11-09  
> **Source Attribution:** Government of India (myScheme, Ministry of Agriculture & Farmers Welfare, Ministry of New & Renewable Energy), Government of Gujarat (iKhedut)  
> **Pipeline Stages:** `collect.py` -> `clean.py` -> `validate.py` -> `check_links.py` -> `load_schemes.py`  

---

## 1. Executive Summary

| Metric | Measured Value |
|--------|----------------|
| Raw Schemes Collected | 12 |
| Cleaned Unique Records | 12 |
| Rejected Records | 0 |
| Verified Live HTTP 200 Links | 12 / 12 (100%) |
| Central Schemes | 11 |
| State Schemes | 1 (Gujarat - Mukhyamantri Kisan Sahay Yojana) |
| Scheme Categories | 6 categories |
| Target Farmer Categories | 8 types |
| Database Seed Idempotency | 100% verified (0 created, 12 updated on re-run) |

---

## 2. Scheme Categories Breakdown

| Category | Slug | Scheme Count | Sample Schemes |
|----------|------|--------------|----------------|
| Financial Support | `financial-support` | 1 | PM-KISAN |
| Crop Insurance & Risk Mitigation | `crop-insurance-risk-mitigation` | 2 | PMFBY, Mukhyamantri Kisan Sahay Yojana |
| Credit & Loans | `credit-loans` | 1 | Kisan Credit Card (KCC) |
| Soil & Input Health | `soil-input-health` | 1 | Soil Health Card (SHC) |
| Solar & Renewable Energy | `solar-renewable-energy` | 1 | PM-KUSUM |
| Market Access & Infrastructure | `market-access-infrastructure` | 3 | e-NAM, Agriculture Infrastructure Fund, RKVY-RAFTAAR |
| Organic & Sustainable Farming | `organic-sustainable-farming` | 2 | PKVY, MOVCDNER |
| Irrigation & Water | `irrigation-water` | 1 | PMKSY - Per Drop More Crop |

---

## 3. Link Verification Assessment

All 12 schemes link strictly to official Government of India (`.gov.in` / `.nic.in`) domains with zero third-party or speculative URLs. Every link was tested with live HTTP requests and recorded in `docs/data/scheme_link_report.md`.

| Scheme | Official Portal URL | HTTP Status |
|--------|---------------------|-------------|
| Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) | `https://pmkisan.gov.in/` | 200 OK |
| Pradhan Mantri Fasal Bima Yojana (PMFBY) | `https://pmfby.gov.in/` | 200 OK |
| Kisan Credit Card (KCC) Scheme | `https://agriwelfare.gov.in/` | 200 OK |
| Soil Health Card (SHC) Scheme | `https://soilhealth.dac.gov.in/` | 200 OK |
| PM-KUSUM Solar Scheme | `https://mnre.gov.in/pm-kusum/` | 200 OK |
| e-NAM National Agriculture Market | `https://enam.gov.in/web/` | 200 OK |
| Paramparagat Krishi Vikas Yojana (PKVY) | `https://pgsindia-ncof.gov.in/` | 200 OK |
| Agriculture Infrastructure Fund (AIF) | `https://agriinfra.dac.gov.in/` | 200 OK |
| PMKSY - Per Drop More Crop | `https://pmksy.gov.in/` | 200 OK |
| Rashtriya Krishi Vikas Yojana (RKVY) | `https://agriwelfare.gov.in/en/RKVY` | 200 OK |
| MOVCDNER (North Eastern Region) | `https://www.myscheme.gov.in/schemes/movcdner` | 200 OK |
| Mukhyamantri Kisan Sahay Yojana (Gujarat) | `https://ikhedut.gujarat.gov.in/` | 200 OK |

---

## 4. Integrity and Compliance

- **No Memory-Invented Details**: Every field (eligibility, financial benefits, required documents, how to apply, and official URLs) is derived directly from official government scheme guidelines.
- **Privacy & Safety**: Direct links to official portals ensure that farmers never enter sensitive banking or identity credentials on KrishiSetu AI; applications are always performed on the official `.gov.in` portals.
- **Idempotent Pipeline**: The entire pipeline (`collect.py` -> `clean.py` -> `validate.py` -> `check_links.py` -> `load_schemes.py`) can be re-run at any time to refresh verification dates and add newly notified schemes.
