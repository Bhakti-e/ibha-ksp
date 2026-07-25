"""
Fix the truncated bcrypt hashes in the users table.
Generates a valid hash for 'password123' and updates all demo users.
Never prints the password in plain text.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'catalyst', 'functions'))
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.backend'), override=False)
except Exception:
    pass

import bcrypt
from lib.db import execute_query, execute_insert

# Generate one valid hash (all demo users share the same demo password)
pw = b'password123'
valid_hash = bcrypt.hashpw(pw, bcrypt.gensalt(rounds=12)).decode()

print(f"Generated hash length: {len(valid_hash)} chars (should be 60)")
print(f"Hash prefix: {valid_hash[:7]}")
print()

# Verify our hash works before writing it
if not bcrypt.checkpw(pw, valid_hash.encode()):
    print("ERROR: hash verification failed — aborting")
    sys.exit(1)

print("Hash verification: OK")

# Update all demo users
rows = execute_query("SELECT user_id, email FROM users")
updated = 0
for row in rows:
    execute_insert(
        "UPDATE users SET password_hash = %s WHERE user_id = %s",
        (valid_hash, row['user_id'])
    )
    print(f"  Updated: {row['email']}")
    updated += 1

print(f"\nUpdated {updated} users with valid bcrypt hash.")

# Also print the correct hash so seed_data.sql can be updated
print(f"\nCorrect hash for seed_data.sql:")
print(f"  {valid_hash}")
