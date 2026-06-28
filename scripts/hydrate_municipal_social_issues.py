#!/usr/bin/env python3
"""Hydrate CivicOS issues from Municipal Social Issues Dataset CSV exports.

The script reads large CSV files in chunks, uses Gemini to normalize municipal
text into CivicOS issue records, then inserts those records into Supabase
PostGIS through the `create_hydrated_issue` RPC added in migration 005.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.parse import quote


ISSUE_TYPES = {
    "Pothole",
    "Water Leakage",
    "Broken Streetlight",
    "Waste Accumulation",
    "Drainage",
    "Illegal Dumping",
}
SEVERITIES = {"low", "medium", "high"}
INFRASTRUCTURE_KEYWORDS = (
    "broken",
    "civic",
    "cleanliness",
    "dumping",
    "electric",
    "electricity",
    "garbage",
    "illegal",
    "infrastructure",
    "lamp",
    "leak",
    "overflow",
    "sanitation",
    "street",
    "streetlight",
    "trash",
    "waste",
    "road",
    "pothole",
    "water",
    "logging",
    "dump",
    "drain",
    "drainage",
    "nullah",
    "nala",
    "sewer",
    "light",
    "bijli",
    "kutcha",
)
SOURCE_CATEGORY_MAP = {
    "pothole": "Pothole",
    "damaged_road_issue": "Pothole",
    "damaged-road-issue": "Pothole",
    "water_leakage": "Water Leakage",
    "water-leakage": "Water Leakage",
    "water_leak": "Water Leakage",
    "water-leak": "Water Leakage",
    "streetlight": "Broken Streetlight",
    "street_light_issue": "Broken Streetlight",
    "street-light-issue": "Broken Streetlight",
    "garbage": "Waste Accumulation",
    "garbage_and_trash_issue": "Waste Accumulation",
    "garbage-and-trash-issue": "Waste Accumulation",
    "drainage": "Drainage",
    "illegal_dumping": "Illegal Dumping",
    "illegal-dumping": "Illegal Dumping",
    "graffiti": "Illegal Dumping",
    "illegal_drawing_on_walls": "Illegal Dumping",
    "illegal-drawing-on-walls": "Illegal Dumping",
}
UNSUPPORTED_SOURCE_CATEGORIES = {
    "noise",
    "illegal_parking",
    "illegal-parking",
    "other",
}
JAMSHEDPUR_GEOFENCE_BOUNDS = {
    "lat_min": 22.78,
    "lat_max": 22.81,
    "lng_min": 86.19,
    "lng_max": 86.22,
}


@dataclass(frozen=True)
class Config:
    supabase_url: str
    supabase_key: str
    gemini_api_key: str | None


@dataclass
class SimpleResponse:
    data: Any


@dataclass(frozen=True)
class MunicipalColumns:
    id_column: str | None
    description_column: str
    category_column: str | None
    location_columns: tuple[str, ...]
    status_column: str | None
    priority_column: str | None
    date_column: str | None
    latitude_column: str | None
    longitude_column: str | None
    photo_url_column: str | None
    department_column: str | None
    priority_score_column: str | None
    severity_score_column: str | None
    area_importance_column: str | None
    citizen_reports_count_column: str | None


def load_dotenv(path: Path) -> None:
    """Load KEY=VALUE pairs without requiring python-dotenv."""
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value


def load_config(env_file: Path | None) -> Config:
    if env_file:
        load_dotenv(env_file)
    else:
        load_dotenv(Path("app/.env"))
        load_dotenv(Path(".env"))

    return Config(
        supabase_url=normalize_supabase_url(os.environ.get("VITE_SUPABASE_URL", "").strip()),
        supabase_key=(
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            or os.environ.get("VITE_SUPABASE_ANON_KEY", "")
        ).strip(),
        gemini_api_key=os.environ.get("GEMINI_API_KEY", "").strip() or None,
    )


def normalize_supabase_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return url


def import_pandas():
    try:
        import pandas as pd

        return pd
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: pandas. Install with "
            "`python3 -m pip install -r scripts/requirements-ingestion.txt`."
        ) from exc


def create_supabase_client(config: Config):
    try:
        from supabase import create_client

        return create_client(config.supabase_url, config.supabase_key)
    except ImportError:
        print("WARN supabase-py is not installed; using built-in REST fallback client.")
        return SupabaseRestClient(config)


class SupabaseRestClient:
    def __init__(self, config: Config) -> None:
        self.rest_url = f"{config.supabase_url.rstrip('/')}/rest/v1"
        self.headers = {
            "apikey": config.supabase_key,
            "authorization": f"Bearer {config.supabase_key}",
            "content-type": "application/json",
        }

    def table(self, name: str) -> "SupabaseRestTableQuery":
        return SupabaseRestTableQuery(self, name)

    def rpc(self, function_name: str, payload: dict[str, Any]) -> "SupabaseRestRpcQuery":
        return SupabaseRestRpcQuery(self, function_name, payload)

    def request(self, method: str, path: str, payload: Any | None = None) -> SimpleResponse:
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = urllib.request.Request(
            f"{self.rest_url}{path}",
            data=body,
            headers=self.headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read().decode("utf-8")
                return SimpleResponse(json.loads(raw) if raw else None)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Supabase HTTP {exc.code}: {detail}") from exc


class SupabaseRestTableQuery:
    def __init__(self, client: SupabaseRestClient, table_name: str) -> None:
        self.client = client
        self.table_name = table_name
        self.columns = "*"
        self.limit_count: int | None = None
        self.filters: list[tuple[str, str, str]] = []

    def select(self, columns: str) -> "SupabaseRestTableQuery":
        self.columns = columns
        return self

    def limit(self, count: int) -> "SupabaseRestTableQuery":
        self.limit_count = count
        return self

    def eq(self, column: str, value: str) -> "SupabaseRestTableQuery":
        self.filters.append((column, "eq", value))
        return self

    def execute(self) -> SimpleResponse:
        path = f"/{self.table_name}?select={quote(self.columns, safe='*,')}"
        if self.limit_count is not None:
            path += f"&limit={self.limit_count}"
        for column, operator, value in self.filters:
            path += f"&{quote(column, safe='->>')}={operator}.{quote(value, safe='')}"
        return self.client.request("GET", path)


class SupabaseRestRpcQuery:
    def __init__(
        self,
        client: SupabaseRestClient,
        function_name: str,
        payload: dict[str, Any],
    ) -> None:
        self.client = client
        self.function_name = function_name
        self.payload = payload

    def execute(self) -> SimpleResponse:
        return self.client.request("POST", f"/rpc/{self.function_name}", self.payload)


def configure_gemini(config: Config):
    if not config.gemini_api_key:
        raise SystemExit("Missing GEMINI_API_KEY. Use --dry-run or set the key.")
    try:
        import google.generativeai as genai

        genai.configure(api_key=config.gemini_api_key)
        return genai.GenerativeModel("gemini-2.5-flash")
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: google-generativeai. Install with "
            "`python3 -m pip install -r scripts/requirements-ingestion.txt`."
        ) from exc


def verify_connection_parameters(config: Config, require_gemini: bool) -> bool:
    ok = True

    if not config.supabase_url:
        print("FAIL VITE_SUPABASE_URL is not set.")
        ok = False
    elif not re.match(r"^https://[a-z0-9-]+\.supabase\.co/?$", config.supabase_url):
        print("FAIL VITE_SUPABASE_URL does not look like a Supabase project URL.")
        ok = False
    else:
        print("OK   VITE_SUPABASE_URL is shaped correctly.")

    if not config.supabase_key:
        print("FAIL VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is not set.")
        ok = False
    elif not (
        config.supabase_key.startswith(("sb_publishable_", "sb_secret_"))
        or (len(config.supabase_key) >= 80 and config.supabase_key.count(".") >= 2)
    ):
        print("FAIL Supabase key does not look like a supported Supabase API key.")
        ok = False
    else:
        print("OK   Supabase key is present and supported.")

    if require_gemini:
        if not config.gemini_api_key:
            print("FAIL GEMINI_API_KEY is not set.")
            ok = False
        elif len(config.gemini_api_key) < 20:
            print("FAIL GEMINI_API_KEY is unexpectedly short.")
            ok = False
        else:
            print("OK   GEMINI_API_KEY is present.")
    elif config.gemini_api_key:
        print("OK   GEMINI_API_KEY is present.")
    else:
        print("WARN GEMINI_API_KEY is not set; --dry-run can still inspect CSV rows.")

    return ok


def verify_supabase_connectivity(config: Config) -> bool:
    client = create_supabase_client(config)
    try:
        client.table("issues").select("id").limit(1).execute()
        print("OK   Supabase REST query to public.issues succeeded.")
        return True
    except Exception as exc:
        print(f"FAIL Supabase REST query failed: {exc}")
        return False


def normalize_column_name(column: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", column.lower()).strip("_")


def pick_column(normalized: dict[str, str], candidates: tuple[str, ...]) -> str | None:
    for candidate in candidates:
        normalized_candidate = normalize_column_name(candidate)
        if normalized_candidate in normalized:
            return normalized[normalized_candidate]
    return None


def pick_columns(normalized: dict[str, str], candidates: tuple[str, ...]) -> tuple[str, ...]:
    picked: list[str] = []
    for candidate in candidates:
        normalized_candidate = normalize_column_name(candidate)
        if normalized_candidate in normalized:
            picked.append(normalized[normalized_candidate])
    return tuple(dict.fromkeys(picked))


def detect_columns(columns: list[str]) -> MunicipalColumns:
    normalized = {normalize_column_name(column): column for column in columns}

    description_candidates = (
        "issue_description",
        "description",
        "complaint_description",
        "problem_description",
        "details",
        "issue_details",
        "complaint",
        "text",
        "summary",
    )
    category_candidates = (
        "issue_type",
        "issue_category",
        "category",
        "subcategory",
        "type",
        "problem_type",
        "complaint_type",
        "department",
        "service",
    )
    location_candidates = (
        "location_street_address",
        "location_city",
        "location_state",
        "location_postal_code",
        "location_country",
        "location",
        "address",
        "street_address",
        "area",
        "ward",
        "zone",
        "neighborhood",
        "locality",
        "landmark",
        "street",
        "city",
        "state",
        "postal_code",
        "country",
    )
    status_candidates = ("issue_status", "status", "resolution_status", "complaint_status")
    priority_candidates = (
        "priority_level",
        "priority",
        "severity",
        "urgency",
        "risk_level",
    )
    date_candidates = (
        "report_datetime",
        "reported_date",
        "created_at",
        "date",
        "complaint_date",
        "submission_date",
    )
    id_candidates = ("report_id", "issue_id", "complaint_id", "id", "ticket_id", "case_id")
    latitude_candidates = ("latitude", "lat", "y")
    longitude_candidates = ("longitude", "lng", "lon", "long", "x")
    photo_url_candidates = ("photo_url", "image_url", "image", "photo", "media_url")
    department_candidates = ("municipal_department", "department", "agency", "service")

    description_column = pick_column(normalized, description_candidates)
    if description_column is None:
        raise SystemExit(
            "Could not find a municipal issue description column. Expected one of: "
            + ", ".join(description_candidates)
        )

    return MunicipalColumns(
        id_column=pick_column(normalized, id_candidates),
        description_column=description_column,
        category_column=pick_column(normalized, category_candidates),
        location_columns=pick_columns(normalized, location_candidates),
        status_column=pick_column(normalized, status_candidates),
        priority_column=pick_column(normalized, priority_candidates),
        date_column=pick_column(normalized, date_candidates),
        latitude_column=pick_column(normalized, latitude_candidates),
        longitude_column=pick_column(normalized, longitude_candidates),
        photo_url_column=pick_column(normalized, photo_url_candidates),
        department_column=pick_column(normalized, department_candidates),
        priority_score_column=pick_column(normalized, ("priority_score",)),
        severity_score_column=pick_column(normalized, ("severity_score",)),
        area_importance_column=pick_column(normalized, ("area_importance",)),
        citizen_reports_count_column=pick_column(normalized, ("citizen_reports_count",)),
    )


def source_category_key(category: str) -> str:
    return normalize_column_name(category).replace("__", "_")


def row_matches_infrastructure(category: str, description: str) -> bool:
    category_key = source_category_key(category)
    if category_key in SOURCE_CATEGORY_MAP:
        return True
    if category_key in UNSUPPORTED_SOURCE_CATEGORIES:
        return False

    description_lower = description.lower()
    return any(keyword in description_lower for keyword in INFRASTRUCTURE_KEYWORDS)


def clean_cell(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "null"}:
        return ""
    return text


def compose_municipal_text(row: Any, columns: MunicipalColumns) -> str:
    pieces: list[str] = []

    category = clean_cell(row.get(columns.category_column)) if columns.category_column else ""
    description = clean_cell(row.get(columns.description_column))
    location = ", ".join(
        clean_cell(row.get(column))
        for column in columns.location_columns
        if clean_cell(row.get(column))
    )
    priority = clean_cell(row.get(columns.priority_column)) if columns.priority_column else ""
    status = clean_cell(row.get(columns.status_column)) if columns.status_column else ""
    department = clean_cell(row.get(columns.department_column)) if columns.department_column else ""
    priority_score = (
        clean_cell(row.get(columns.priority_score_column))
        if columns.priority_score_column
        else ""
    )
    severity_score = (
        clean_cell(row.get(columns.severity_score_column))
        if columns.severity_score_column
        else ""
    )

    if category:
        pieces.append(f"Dataset category: {category}")
    if description:
        pieces.append(f"Issue description: {description}")
    if location:
        pieces.append(f"Municipal location text: {location}")
    if department:
        pieces.append(f"Municipal department: {department}")
    if priority:
        pieces.append(f"Dataset priority/severity: {priority}")
    if priority_score:
        pieces.append(f"Priority score: {priority_score}")
    if severity_score:
        pieces.append(f"Severity score: {severity_score}")
    if status:
        pieces.append(f"Dataset status: {status}")

    return "\n".join(pieces)


def get_source_issue_fields(row: Any, columns: MunicipalColumns) -> tuple[str, str]:
    category = clean_cell(row.get(columns.category_column)) if columns.category_column else ""
    description = clean_cell(row.get(columns.description_column))
    return category, description


def iter_filtered_rows(csv_path: Path, chunk_size: int, max_scan_rows: int | None):
    pd = import_pandas()
    scanned = 0
    municipal_columns: MunicipalColumns | None = None

    for chunk in pd.read_csv(csv_path, chunksize=chunk_size):
        if municipal_columns is None:
            municipal_columns = detect_columns(list(chunk.columns))

        for _, row in chunk.iterrows():
            if max_scan_rows is not None and scanned >= max_scan_rows:
                return
            scanned += 1

            source_category, source_description = get_source_issue_fields(row, municipal_columns)
            text = compose_municipal_text(row, municipal_columns)
            if not text or not row_matches_infrastructure(source_category, source_description):
                continue

            source_lat = (
                clean_cell(row.get(municipal_columns.latitude_column))
                if municipal_columns.latitude_column
                else ""
            )
            source_lng = (
                clean_cell(row.get(municipal_columns.longitude_column))
                if municipal_columns.longitude_column
                else ""
            )

            yield {
                "text": text,
                "source_id": clean_cell(row.get(municipal_columns.id_column))
                if municipal_columns.id_column
                else "unknown",
                "source_category": clean_cell(row.get(municipal_columns.category_column))
                if municipal_columns.category_column
                else "unknown",
                "source_location": {
                    "text": ", ".join(
                        clean_cell(row.get(column))
                        for column in municipal_columns.location_columns
                        if clean_cell(row.get(column))
                    ),
                    "latitude": source_lat,
                    "longitude": source_lng,
                },
                "source_status": clean_cell(row.get(municipal_columns.status_column))
                if municipal_columns.status_column
                else "",
                "source_priority": clean_cell(row.get(municipal_columns.priority_column))
                if municipal_columns.priority_column
                else "",
                "source_date": clean_cell(row.get(municipal_columns.date_column))
                if municipal_columns.date_column
                else "",
                "photo_url": clean_cell(row.get(municipal_columns.photo_url_column))
                if municipal_columns.photo_url_column
                else "",
                "department": clean_cell(row.get(municipal_columns.department_column))
                if municipal_columns.department_column
                else "",
                "source_scores": {
                    "priority_score": clean_cell(row.get(municipal_columns.priority_score_column))
                    if municipal_columns.priority_score_column
                    else "",
                    "severity_score": clean_cell(row.get(municipal_columns.severity_score_column))
                    if municipal_columns.severity_score_column
                    else "",
                    "area_importance": clean_cell(row.get(municipal_columns.area_importance_column))
                    if municipal_columns.area_importance_column
                    else "",
                    "citizen_reports_count": clean_cell(
                        row.get(municipal_columns.citizen_reports_count_column)
                    )
                    if municipal_columns.citizen_reports_count_column
                    else "",
                },
            }


def parse_json_object(raw_text: str) -> dict[str, Any]:
    clean = raw_text.strip()
    clean = re.sub(r"^```(?:json)?", "", clean, flags=re.IGNORECASE).strip()
    clean = re.sub(r"```$", "", clean).strip()
    match = re.search(r"\{.*\}", clean, flags=re.DOTALL)
    if not match:
        raise ValueError("Gemini response did not contain a JSON object.")
    return json.loads(match.group(0))


def fallback_point() -> tuple[float, float]:
    """Return a point inside the current Jamshedpur service geofence."""
    return (
        round(random.uniform(22.781, 22.808), 6),
        round(random.uniform(86.191, 86.218), 6),
    )


def validate_payload(payload: dict[str, Any]) -> dict[str, Any]:
    issue_type = str(payload.get("issue_type", "")).strip()
    if issue_type not in ISSUE_TYPES:
        issue_type = "Drainage" if "drain" in issue_type.lower() else "Waste Accumulation"

    severity = str(payload.get("severity", "")).strip().lower()
    if severity not in SEVERITIES:
        severity = "medium"

    try:
        latitude = float(payload.get("latitude"))
        longitude = float(payload.get("longitude"))
    except (TypeError, ValueError):
        latitude, longitude = fallback_point()

    if not (
        JAMSHEDPUR_GEOFENCE_BOUNDS["lat_min"]
        <= latitude
        <= JAMSHEDPUR_GEOFENCE_BOUNDS["lat_max"]
        and JAMSHEDPUR_GEOFENCE_BOUNDS["lng_min"]
        <= longitude
        <= JAMSHEDPUR_GEOFENCE_BOUNDS["lng_max"]
    ):
        latitude, longitude = fallback_point()

    try:
        confidence = int(float(payload.get("confidence", 75)))
    except (TypeError, ValueError):
        confidence = 75
    confidence = max(0, min(100, confidence))

    description = str(payload.get("description", "")).strip()
    if not description:
        description = "Municipal infrastructure issue imported from source dataset"

    return {
        "issue_type": issue_type,
        "severity": severity,
        "description": description[:500],
        "latitude": latitude,
        "longitude": longitude,
        "confidence": confidence,
    }


def enrich_municipal_issue(
    model: Any,
    text: str,
    source_category: str,
    source_location: dict[str, str],
) -> dict[str, Any]:
    prompt = f"""
You are an automated spatial engineering data transformer for CivicOS.
Analyze this Municipal Social Issues Dataset record. These records may contain
short civic issue descriptions, dataset categories, ward/area names, address
fragments, status fields, and municipal shorthand such as bad roads, clogged
drains, uncollected garbage, broken lights, water leakage, dumping, sanitation,
overflow, potholes, street lamp failure, or civic cleanliness problems.

Dataset category: {source_category}
Dataset location footprint: {json.dumps(source_location, ensure_ascii=False)}
Record text:
{json.dumps(text, ensure_ascii=False)}

Instructions:
1. Map the municipal category and description to exactly one internal
   issue_type: Pothole, Water Leakage, Broken Streetlight, Waste Accumulation,
   Drainage, Illegal Dumping.
2. Determine severity as low, medium, or high using the source priority/status
   and operational risk implied by the description.
3. Ignore any source coordinates outside Jamshedpur. Create a synthetic but
   plausible point inside the active CivicOS Jamshedpur geofence:
   latitude 22.7800 to 22.8100 and longitude 86.1900 to 86.2200.
4. Use source ward/area/address text only to choose a believable cluster within
   that geofence. Never return a latitude/longitude outside those bounds.
5. Preserve the meaning of the municipal issue in concise English.

Return ONLY a raw valid JSON object with this shape:
{{
  "issue_type": "Water Leakage",
  "severity": "high",
  "description": "Short clean English summary",
  "latitude": 22.7964,
  "longitude": 86.2047,
  "confidence": 85
}}
"""
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
    )
    return validate_payload(parse_json_object(response.text))


def deterministic_enrichment(text: str, source_category: str = "") -> dict[str, Any]:
    text_lower = text.lower()
    category_key = source_category_key(source_category)

    if category_key in SOURCE_CATEGORY_MAP:
        issue_type = SOURCE_CATEGORY_MAP[category_key]
    elif any(term in text_lower for term in ("water_leakage", "water-leak", "water", "leak", "logging")):
        issue_type = "Water Leakage"
    elif any(term in text_lower for term in ("pothole", "damaged road", "road", "kutcha")):
        issue_type = "Pothole"
    elif any(term in text_lower for term in ("streetlight", "light", "bijli", "electric")):
        issue_type = "Broken Streetlight"
    elif any(term in text_lower for term in ("drain", "nullah", "nala", "sewer")):
        issue_type = "Drainage"
    elif any(
        term in text_lower
        for term in ("illegal dumping", "dump site", "dumped debris", "construction debris")
    ):
        issue_type = "Illegal Dumping"
    elif any(term in text_lower for term in ("dump", "garbage", "waste", "kachra", "trash")):
        issue_type = "Waste Accumulation"
    else:
        issue_type = "Waste Accumulation"

    if any(term in text_lower for term in ("critical", "urgent", "severity score: 8", "severity score: 9")):
        severity = "high"
    elif any(term in text_lower for term in ("high", "priority score: 7", "priority score: 8", "priority score: 9")):
        severity = "high"
    elif any(term in text_lower for term in ("low", "resolved", "closed", "rejected")):
        severity = "low"
    else:
        severity = "medium"

    latitude, longitude = fallback_point()
    return {
        "issue_type": issue_type,
        "severity": severity,
        "description": re.sub(r"\s+", " ", text).strip()[:220],
        "latitude": latitude,
        "longitude": longitude,
        "confidence": 60,
    }


def insert_issue(client: Any, payload: dict[str, Any], meta: dict[str, Any]) -> str | None:
    trust_score = int(payload["confidence"] * 0.75)
    description = f"{payload['description']} (Municipal Social Issues Dataset)"

    rpc_payload = {
        "p_issue_type": payload["issue_type"],
        "p_severity": payload["severity"],
        "p_description": description,
        "p_trust_score": trust_score,
        "p_confidence": payload["confidence"],
        "p_image_url": meta.get("photo_url") or None,
        "p_lat": payload["latitude"],
        "p_lng": payload["longitude"],
        "p_meta_telemetry": meta,
    }

    response = client.rpc("create_hydrated_issue", rpc_payload).execute()
    return getattr(response, "data", None)


def fetch_existing_original_ids(client: Any) -> set[str]:
    try:
        response = (
            client.table("issues")
            .select("meta_telemetry")
            .eq("meta_telemetry->>source", "Municipal Social Issues Dataset")
            .execute()
        )
    except Exception as exc:
        print(f"WARN Could not prefetch existing dataset ids; continuing without resume skip: {exc}")
        return set()

    existing_ids: set[str] = set()
    for row in getattr(response, "data", None) or []:
        telemetry = row.get("meta_telemetry") if isinstance(row, dict) else None
        if isinstance(telemetry, dict) and telemetry.get("original_id"):
            existing_ids.add(str(telemetry["original_id"]))
    return existing_ids


def run_pipeline(args: argparse.Namespace) -> int:
    config = load_config(args.env_file)
    if args.dry_run:
        if args.no_gemini:
            print("OK   Dry run without Gemini; Supabase connection parameters are not required.")
        elif not config.gemini_api_key:
            print("FAIL GEMINI_API_KEY is not set.")
            return 2
    elif not verify_connection_parameters(config, require_gemini=not args.no_gemini):
        return 2

    client = None if args.dry_run else create_supabase_client(config)
    model = None if args.no_gemini else configure_gemini(config)
    existing_original_ids = set() if args.dry_run else fetch_existing_original_ids(client)
    if existing_original_ids:
        print(f"Found {len(existing_original_ids)} existing municipal records; resuming past them.")

    processed = 0
    matched = 0
    skipped_existing = 0
    started = time.time()

    for row in iter_filtered_rows(args.csv_path, args.chunk_size, args.max_scan_rows):
        if processed >= args.max_records:
            break
        matched += 1
        if row["source_id"] in existing_original_ids:
            skipped_existing += 1
            continue

        try:
            enriched = (
                deterministic_enrichment(row["text"], row["source_category"])
                if args.no_gemini
                else enrich_municipal_issue(
                    model,
                    row["text"],
                    row["source_category"],
                    row["source_location"],
                )
            )
            meta = {
                "source": "Municipal Social Issues Dataset",
                "original_id": row["source_id"],
                "category": row["source_category"],
                "location_footprint": row["source_location"],
                "status": row["source_status"],
                "priority": row["source_priority"],
                "reported_date": row["source_date"],
                "photo_url": row["photo_url"],
                "department": row["department"],
                "scores": row["source_scores"],
                "ingestion_mode": "dry_run" if args.dry_run else "supabase",
            }

            if args.dry_run:
                print(json.dumps({"payload": enriched, "meta": meta}, indent=2))
            else:
                issue_id = insert_issue(client, enriched, meta)
                print(
                    "Inserted "
                    f"{issue_id}: {enriched['issue_type']} "
                    f"POINT({enriched['longitude']} {enriched['latitude']})"
                )
            processed += 1
        except Exception as exc:
            print(f"Skipping row after transformation/insertion failure: {exc}", file=sys.stderr)

    print(
        f"Done. matched={matched} processed={processed} "
        f"skipped_existing={skipped_existing} "
        f"elapsed_seconds={time.time() - started:.1f}"
    )
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Hydrate CivicOS from Municipal Social Issues Dataset CSV data."
    )
    parser.add_argument(
        "csv_path",
        nargs="?",
        type=Path,
        help="Path to the Municipal Social Issues Dataset CSV file.",
    )
    parser.add_argument("--env-file", type=Path, help="Optional .env file to load.")
    parser.add_argument("--max-records", type=int, default=25, help="Maximum inserts to perform.")
    parser.add_argument("--max-scan-rows", type=int, help="Stop scanning after this many CSV rows.")
    parser.add_argument("--chunk-size", type=int, default=500, help="CSV rows per pandas chunk.")
    parser.add_argument("--dry-run", action="store_true", help="Transform and print records only.")
    parser.add_argument(
        "--no-gemini",
        action="store_true",
        help="Use deterministic local classification for smoke tests.",
    )
    parser.add_argument(
        "--verify-connection",
        action="store_true",
        help="Validate env vars and perform a Supabase REST smoke query.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    config = load_config(args.env_file)

    if args.verify_connection:
        params_ok = verify_connection_parameters(config, require_gemini=False)
        if not params_ok:
            return 2
        return 0 if verify_supabase_connectivity(config) else 3

    if args.csv_path is None:
        default_csv_path = Path("municipal_training_set_1100.csv")
        if default_csv_path.exists():
            args.csv_path = default_csv_path
        else:
            print("CSV path is required unless --verify-connection is used.", file=sys.stderr)
            return 2
    if not args.csv_path.exists():
        print(f"CSV file not found: {args.csv_path}", file=sys.stderr)
        return 2

    return run_pipeline(args)


if __name__ == "__main__":
    raise SystemExit(main())
