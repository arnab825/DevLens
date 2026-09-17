import sqlite3
import json
import os
from typing import List, Dict, Any

DB_PATH = os.environ.get("DEVLENS_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "devlens.db"))

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def init_db():
    with get_connection() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS error_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            url TEXT,
            message TEXT,
            source_file TEXT,
            line INTEGER,
            analysis_json TEXT
        );
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            title TEXT,
            content TEXT,
            report_format TEXT
        );
        """)
        conn.commit()

def save_error_event(url: str, message: str, source_file: str, line: int, analysis: Dict[str, Any]):
    try:
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO error_events (url, message, source_file, line, analysis_json) VALUES (?, ?, ?, ?, ?)",
                (url, message, source_file, line, json.dumps(analysis))
            )
            conn.commit()
    except Exception as e:
        print(f"[DevLens DB Error] Failed to save error event: {e}")

def get_recent_errors(limit: int = 50) -> List[Dict[str, Any]]:
    try:
        with get_connection() as conn:
            cursor = conn.execute(
                "SELECT id, timestamp, url, message, source_file, line, analysis_json FROM error_events ORDER BY id DESC LIMIT ?",
                (limit,)
            )
            rows = cursor.fetchall()
            return [
                {
                    "id": r["id"],
                    "timestamp": r["timestamp"],
                    "url": r["url"],
                    "message": r["message"],
                    "source_file": r["source_file"],
                    "line": r["line"],
                    "analysis": json.loads(r["analysis_json"]) if r["analysis_json"] else {}
                }
                for r in rows
            ]
    except Exception as e:
        print(f"[DevLens DB Error] Failed to query errors: {e}")
        return []

def save_report(title: str, content: str, report_format: str = "markdown") -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO reports (title, content, report_format) VALUES (?, ?, ?)",
            (title, content, report_format)
        )
        conn.commit()
        return cursor.lastrowid

def get_reports() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.execute("SELECT id, timestamp, title, report_format FROM reports ORDER BY id DESC LIMIT 20")
        return [dict(r) for r in cursor.fetchall()]
