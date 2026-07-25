"""
Scan all git-tracked files for real secrets before committing.
Exits 1 if any secret is found, 0 if clean.
"""
import subprocess, sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Files that are allowed to contain these patterns (examples/docs only)
EXCLUDED = {".env.backend", ".env.backend.example", "CLOUD_POSTGRES_SETUP.md",
            "STATUS.md", "scripts/scan_secrets.py"}  # exclude self

# Patterns that must NOT appear in tracked source files.
# Split across two strings so this file does not self-trigger.
PATTERNS = [
    "npg_" + "wIiRTMVH",         # Neon password fragment
    "npg_" + "l0OCVyb",          # old Neon password fragment
    "DB_PASSWORD=" + "npg",
    "neondb_owner" + ":",         # would appear in a connection URL
    "postgresql://" + "neondb_owner",
]

result = subprocess.run(
    ["git", "ls-files"],
    capture_output=True, text=True, cwd=ROOT
)
tracked = [f.strip() for f in result.stdout.splitlines() if f.strip()]

found = []
for rel_path in tracked:
    if any(rel_path.endswith(ex) or rel_path == ex for ex in EXCLUDED):
        continue
    full = os.path.join(ROOT, rel_path)
    if not os.path.isfile(full):
        continue
    try:
        content = open(full, encoding="utf-8", errors="ignore").read()
    except Exception:
        continue
    for pat in PATTERNS:
        if pat in content:
            found.append(f"  SECRET in {rel_path}: pattern '{pat}'")

if found:
    print("SECRET SCAN FAILED — real credentials found in tracked files:")
    for f in found:
        print(f)
    sys.exit(1)
else:
    print(f"SECRET SCAN: clean — {len(tracked)} tracked files, no secrets found")
    sys.exit(0)
