#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["youtube-transcript-api>=1.0.0", "yt-dlp>=2026.7.1"]
# ///
"""Fetch one YouTube transcript as JSON for the research starter ingest.

Canonical copy: scripts/research-starter-transcripts/fetch-youtube-transcript.py

Both providers contact YouTube. ``auto`` only falls back for extractor/parser
errors; it deliberately does not make a second request after an IP/rate-limit
signal.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
from typing import Any, Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    IpBlocked,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
)
from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

Provider = Literal["youtube-transcript-api", "yt-dlp"]
RATE_LIMIT_MARKERS = (
    "429",
    "too many requests",
    "rate limit",
    "ratelimit",
    "ip blocked",
    "request blocked",
    "sign in to confirm you're not a bot",
    "sign in to confirm you’re not a bot",
)


def _timestamp(seconds: float) -> str:
    hours, remainder = divmod(int(seconds), 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}" if hours else f"{minutes:02d}:{secs:02d}"


def _is_rate_limited(exc: BaseException) -> bool:
    message = str(exc).lower()
    return isinstance(exc, (IpBlocked, RequestBlocked)) or any(
        marker in message for marker in RATE_LIMIT_MARKERS
    )


def _result(
    video_id: str,
    *,
    provider: Provider,
    text: str | None = None,
    language: str | None = None,
    error: BaseException | str | None = None,
    missing: bool = False,
) -> dict[str, object]:
    if text:
        return {
            "ok": True,
            "video_id": video_id,
            "provider": provider,
            "language": language,
            "text": text,
            "missing": False,
        }
    message = f"{type(error).__name__}: {error}" if isinstance(error, BaseException) else str(error)
    return {
        "ok": False,
        "video_id": video_id,
        "provider": provider,
        "error": message,
        "missing": missing,
        "rate_limited": bool(error and _is_rate_limited(error if isinstance(error, BaseException) else Exception(error))),
    }


def fetch_with_transcript_api(video_id: str, with_timestamps: bool) -> dict[str, object]:
    provider: Provider = "youtube-transcript-api"
    try:
        fetched = YouTubeTranscriptApi().fetch(video_id)
        lines = [
            f"[{_timestamp(snippet.start)}] {snippet.text}" if with_timestamps else snippet.text
            for snippet in fetched.snippets
        ]
        return _result(
            video_id,
            provider=provider,
            text="\n".join(lines),
            language=getattr(fetched, "language_code", None) or getattr(fetched, "language", None),
        )
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable) as exc:
        return _result(video_id, provider=provider, error=exc, missing=True)
    except Exception as exc:  # noqa: BLE001
        return _result(video_id, provider=provider, error=exc)


def _caption_track(info: dict[str, Any]) -> tuple[dict[str, Any], str] | None:
    # Prefer human-authored English, then automatic English, then any authored
    # language, and finally any automatic language.
    pools = [info.get("subtitles") or {}, info.get("automatic_captions") or {}]
    for tracks in pools:
        for language in ("en", "en-US", "en-GB", "en-orig"):
            if tracks.get(language):
                formats = tracks[language]
                return next((item for item in formats if item.get("ext") == "json3"), formats[0]), language
    for tracks in pools:
        for language, formats in tracks.items():
            if formats:
                return next((item for item in formats if item.get("ext") == "json3"), formats[0]), language
    return None


def _as_json3_url(url: str) -> str:
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["fmt"] = "json3"
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def _json3_text(payload: dict[str, Any], with_timestamps: bool) -> str:
    lines: list[str] = []
    for event in payload.get("events", []):
        text = "".join(segment.get("utf8", "") for segment in event.get("segs", []))
        text = html.unescape(text).replace("\n", " ").strip()
        if not text:
            continue
        if with_timestamps:
            text = f"[{_timestamp(float(event.get('tStartMs', 0)) / 1000)}] {text}"
        if not lines or lines[-1] != text:
            lines.append(text)
    return "\n".join(lines)


def _vtt_text(raw: str, with_timestamps: bool) -> str:
    lines: list[str] = []
    pending_timestamp: str | None = None
    for raw_line in raw.splitlines():
        line = raw_line.strip()
        if "-->" in line:
            pending_timestamp = line.split("-->", 1)[0].strip().split(".", 1)[0]
            continue
        if not line or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE", "STYLE")) or line.isdigit():
            continue
        line = html.unescape(re.sub(r"<[^>]+>", "", line)).strip()
        if not line:
            continue
        rendered = f"[{pending_timestamp}] {line}" if with_timestamps and pending_timestamp else line
        if not lines or lines[-1] != rendered:
            lines.append(rendered)
        pending_timestamp = None
    return "\n".join(lines)


def _ytdlp_options(browser: str | None = None) -> dict[str, Any]:
    options: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"],
                "skip": ["translated_subs"],
            }
        },
    }
    if browser:
        options["cookiesfrombrowser"] = (browser,)
    return options


def _extract_ytdlp_text(
    video_id: str,
    with_timestamps: bool,
    browser: str | None = None,
) -> dict[str, object]:
    provider: Provider = "yt-dlp"
    with YoutubeDL(_ytdlp_options(browser)) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
        selected = _caption_track(info)
        if not selected:
            return _result(video_id, provider=provider, error="No transcript tracks found", missing=True)
        track, language = selected
        response = ydl.urlopen(_as_json3_url(track["url"]))
        raw = response.read().decode("utf-8", errors="replace")
        try:
            text = _json3_text(json.loads(raw), with_timestamps)
        except json.JSONDecodeError:
            text = _vtt_text(raw, with_timestamps)
        if not text.strip():
            return _result(video_id, provider=provider, error="Transcript track was empty", missing=True)
        return _result(video_id, provider=provider, text=text, language=language)


def fetch_with_ytdlp(video_id: str, with_timestamps: bool) -> dict[str, object]:
    provider: Provider = "yt-dlp"
    preferred = os.environ.get("TRANSCRIPT_COOKIES_BROWSER")
    browsers = ["", preferred] if preferred else [""]
    seen: set[str] = set()
    last_error: BaseException | str | None = None
    for browser in browsers:
        key = browser or "anonymous"
        if key in seen:
            continue
        seen.add(key)
        try:
            return _extract_ytdlp_text(video_id, with_timestamps, browser or None)
        except (DownloadError, Exception) as exc:  # noqa: BLE001
            last_error = exc
            message = str(exc).lower()
            retryable = _is_rate_limited(exc) or "cookie" in message or "dpapi" in message
            if retryable:
                continue
            missing = "video unavailable" in message or "subtitles" in message
            return _result(video_id, provider=provider, error=exc, missing=missing)
    return _result(video_id, provider=provider, error=last_error or "yt-dlp failed")


def fetch(video_id: str, with_timestamps: bool, provider: str) -> dict[str, object]:
    if provider == "youtube-transcript-api":
        return fetch_with_transcript_api(video_id, with_timestamps)
    if provider == "yt-dlp":
        return fetch_with_ytdlp(video_id, with_timestamps)

    primary = fetch_with_transcript_api(video_id, with_timestamps)
    # Rate limits are definitive. Missing English can still have captions in
    # another language, so let yt-dlp try those tracks before giving up.
    if primary.get("ok") or primary.get("rate_limited"):
        return primary
    fallback = fetch_with_ytdlp(video_id, with_timestamps)
    if not fallback.get("ok"):
        fallback["error"] = f"primary={primary.get('error')}; fallback={fallback.get('error')}"
    return fallback


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "video_id",
        nargs="?",
        help="YouTube video id. Prefer --video-id when the id starts with '-'.",
    )
    parser.add_argument(
        "--video-id",
        dest="video_id_opt",
        help="YouTube video id. Use this form for ids that start with '-'.",
    )
    parser.add_argument("--timestamps", action="store_true")
    parser.add_argument(
        "--provider",
        choices=("auto", "youtube-transcript-api", "yt-dlp"),
        default="auto",
    )
    args = parser.parse_args()
    video_id = args.video_id_opt or args.video_id
    if not video_id:
        parser.error("video_id is required")
    provider = os.environ.get("TRANSCRIPT_PROVIDER") or args.provider
    payload = fetch(video_id, args.timestamps, provider)
    print(json.dumps(payload, ensure_ascii=False))
    return 0 if payload.get("ok") or payload.get("missing") else 2


if __name__ == "__main__":
    sys.exit(main())
