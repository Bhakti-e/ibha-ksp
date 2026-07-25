"""Diagnose .env.backend without printing secrets."""
import os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
env_file = os.path.join(ROOT, ".env.backend")

print(f"File: {env_file}")
print(f"Exists: {os.path.exists(env_file)}\n")

if not os.path.exists(env_file):
    print("ERROR: .env.backend not found")
    sys.exit(1)

with open(env_file, encoding="utf-8") as f:
    lines = f.read().splitlines()

secrets = {"DB_PASSWORD", "IBHA_JWT_SECRET"}
seen_keys = {}
issues = []

for i, line in enumerate(lines, 1):
    s = line.strip()
    if not s or s.startswith("#"):
        continue
    if "=" not in s:
        continue
    k, _, v = s.partition("=")
    k = k.strip()
    v_raw = v  # keep raw for whitespace check

    if k in seen_keys:
        issues.append(f"Line {i}: DUPLICATE key {k} (first at line {seen_keys[k]})")
    seen_keys[k] = i

    if k in secrets:
        vlen = len(v.strip())
        has_quotes = v.strip()[:1] in ('"', "'")
        has_ws = v != v.strip()
        empty = vlen == 0
        print(f"  {k}: len={vlen}  quoted={has_quotes}  whitespace={has_ws}  empty={empty}")
        if has_quotes:
            issues.append(f"Line {i}: {k} is wrapped in quotes — remove them")
        if has_ws:
            issues.append(f"Line {i}: {k} has leading/trailing whitespace")
        if empty:
            issues.append(f"Line {i}: {k} is empty")
    else:
        print(f"  {k}={v.strip()}")

print()
if issues:
    print("ISSUES FOUND:")
    for iss in issues:
        print(f"  - {iss}")
    sys.exit(1)
else:
    print("No format issues detected in .env.backend")
