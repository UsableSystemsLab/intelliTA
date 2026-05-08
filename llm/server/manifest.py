"""Test manifest — the per-activity bundle of test source files.

The manifest lives in S3 at the URL stored on Activity.tests_url. It contains
only the test source bytes; the binding from a checkpoint to a specific test
method lives on QuizQuestion.test_name in the database.

This split keeps the manifest immutable across rebinds and avoids a stale
copy whenever an instructor moves a test between checkpoints.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx
from pydantic import BaseModel, Field

from config import STORAGE_PUBLIC_URL, STORAGE_INTERNAL_URL

logger = logging.getLogger("uvicorn")


class ManifestFile(BaseModel):
    path: str
    content: str


class TestManifest(BaseModel):
    language: str
    test_files: list[ManifestFile] = Field(default_factory=list)


async def fetch_manifest(tests_url: str) -> Optional[TestManifest]:
    """Download and parse the manifest JSON from S3. Returns None on failure."""
    if not tests_url:
        return None
    # Public URLs use localhost:9000 (browser-accessible) but inside Docker we
    # must reach RustFS via its service hostname. Rewrite if both vars are set.
    fetch_url = tests_url
    if STORAGE_PUBLIC_URL and STORAGE_INTERNAL_URL and tests_url.startswith(STORAGE_PUBLIC_URL):
        fetch_url = STORAGE_INTERNAL_URL + tests_url[len(STORAGE_PUBLIC_URL):]
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(fetch_url)
            resp.raise_for_status()
            return TestManifest.model_validate(resp.json())
    except Exception as e:
        logger.error(f"Failed to fetch manifest from {tests_url}: {e}")
        return None


def find_test_file(manifest: TestManifest, test_name: str) -> Optional[ManifestFile]:
    """Heuristic: pick the manifest file most likely to contain the named test.

    Used only to feed the LLM the right snippet — Piston still gets all files.
    Looks for the literal test name first; falls back to the first test file.
    """
    for f in manifest.test_files:
        if test_name and test_name in f.content:
            return f
    return manifest.test_files[0] if manifest.test_files else None
