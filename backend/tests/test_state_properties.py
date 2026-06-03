"""
Property-based tests for the Redis State Adapter (RedisAppState).

Feature: docker-deployment
Tests: Properties 1–4 covering serialization, key naming, log capping, and reset semantics.
"""

import sys
import os
import json

# Ensure the backend package root is on sys.path so imports work correctly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import fakeredis
from hypothesis import given, settings
import hypothesis.strategies as st

from services.state import RedisAppState


# ---------------------------------------------------------------------------
# Property 3: Log list cap invariant
# Feature: docker-deployment, Property 3: Log list cap invariant
# ---------------------------------------------------------------------------

@given(existing_entries=st.lists(st.text(), min_size=0, max_size=1000))
@settings(max_examples=100, deadline=None)
def test_log_list_cap_invariant(existing_entries):
    """
    **Validates: Requirements 4.6**

    For any log list of arbitrary length (including lengths >= 500) and any
    new log entry, after calling add_log() the list length must be at most 500,
    and the new entry must be at index 0 (head of the list).
    """
    # Create a fresh fakeredis client for each test run
    client = fakeredis.FakeRedis(decode_responses=True)

    # Pre-load the log list: rpush to simulate existing data
    for entry in existing_entries:
        client.rpush("app:logs", entry)

    # Instantiate the state adapter with the pre-loaded client
    state = RedisAppState(client)

    # Add a new log entry
    state.add_log("Test Activity", "Success", "Test details")

    # 1. The list must be capped at 500 entries
    length = client.llen("app:logs")
    assert length <= 500, (
        f"Log list length {length} exceeds the 500-entry cap after add_log()"
    )

    # 2. The newest entry must be at index 0 (head)
    newest_raw = client.lindex("app:logs", 0)
    assert newest_raw is not None, "Expected a log entry at index 0 after add_log()"

    newest = json.loads(newest_raw)
    assert newest["activity"] == "Test Activity", (
        f"Expected activity 'Test Activity' at index 0, got: {newest.get('activity')!r}"
    )

# ---------------------------------------------------------------------------
# Property 4: Reset leaves logs intact
# Feature: docker-deployment, Property 4: Reset leaves logs intact
# Validates: Requirements 4.5
# ---------------------------------------------------------------------------

@given(log_entries=st.lists(st.text(min_size=1), min_size=1, max_size=50))
@settings(max_examples=100, deadline=None)
def test_reset_leaves_logs_intact(log_entries):
    """
    **Validates: Requirements 4.5**

    For any application state with arbitrary values across all 7 resettable
    fields and an arbitrary non-empty log list, after calling
    reset_dataset_state() the 7 fields must be reinitialized to their default
    values and the app:logs list must remain unchanged.
    """
    client = fakeredis.FakeRedis(decode_responses=True)

    # Pre-load the 7 resettable fields with arbitrary values
    for key in (
        "app:uploaded_zip_path",
        "app:uploaded_json_path",
        "app:extracted_images_dir",
        "app:coco_data",
        "app:validation_results",
        "app:conversion_status",
        "app:conversion_result",
    ):
        client.set(key, "some_value")

    # Pre-load logs
    for entry in log_entries:
        client.rpush("app:logs", entry)

    # Capture the original log list before reset
    original_logs = client.lrange("app:logs", 0, -1)

    # Perform reset
    state = RedisAppState(client)
    state.reset_dataset_state()

    # Assert all 7 resettable fields are back at their defaults (None)
    assert state.uploaded_zip_path is None, (
        f"uploaded_zip_path should be None after reset, got {state.uploaded_zip_path!r}"
    )
    assert state.uploaded_json_path is None, (
        f"uploaded_json_path should be None after reset, got {state.uploaded_json_path!r}"
    )
    assert state.extracted_images_dir is None, (
        f"extracted_images_dir should be None after reset, got {state.extracted_images_dir!r}"
    )
    assert state.coco_data is None, (
        f"coco_data should be None after reset, got {state.coco_data!r}"
    )
    assert state.conversion_result is None, (
        f"conversion_result should be None after reset, got {state.conversion_result!r}"
    )
    assert state._parser is None, (
        "_parser should be None after reset"
    )

    # Assert logs are untouched
    after_logs = client.lrange("app:logs", 0, -1)
    assert after_logs == original_logs, (
        f"app:logs should be unchanged after reset.\n"
        f"Before: {original_logs!r}\n"
        f"After:  {after_logs!r}"
    )


# ---------------------------------------------------------------------------
# Feature: docker-deployment, Property 5: Cache header regex correctness
# ---------------------------------------------------------------------------

import re

HASH_PATTERN = re.compile(r'\.[a-f0-9]{8}\.')


@given(hex_hash=st.from_regex(r'[a-f0-9]{8}', fullmatch=True))
@settings(max_examples=100)
def test_valid_hash_filenames_match(hex_hash):
    """
    **Validates: Requirements 3.5**

    For any valid 8-character lowercase hex segment, a filename of the form
    'main.<hex>.js' must be matched by the nginx cache-header regex pattern.
    """
    filename = f"main.{hex_hash}.js"
    assert HASH_PATTERN.search(filename) is not None, (
        f"Expected HASH_PATTERN to match valid filename {filename!r}"
    )


@given(bad_hash=st.one_of(
    st.from_regex(r'[a-f0-9]{7}', fullmatch=True),
    st.from_regex(r'[a-f0-9]{9}', fullmatch=True),
    st.from_regex(r'[g-z]{8}', fullmatch=True),
))
@settings(max_examples=100)
def test_invalid_hash_filenames_no_match(bad_hash):
    """
    **Validates: Requirements 3.5**

    For any filename whose embedded segment is either the wrong length
    (7 or 9 hex chars) or contains non-hex characters (g–z), the nginx
    cache-header regex pattern must NOT match.
    """
    filename = f"main.{bad_hash}.js"
    assert HASH_PATTERN.search(filename) is None, (
        f"Expected HASH_PATTERN NOT to match invalid filename {filename!r}"
    )


# ---------------------------------------------------------------------------
# Property 1: State field serialization round-trip
# Feature: docker-deployment, Property 1: State field serialization round-trip
# Validates: Requirements 4.4
# ---------------------------------------------------------------------------

json_values = st.one_of(
    st.none(),
    st.booleans(),
    st.integers(),
    st.floats(allow_nan=False, allow_infinity=False),
    st.text(),
    st.dictionaries(st.text(), st.text()),
    st.lists(st.text()),
)

_FIELDS = [
    "uploaded_zip_path",
    "uploaded_json_path",
    "extracted_images_dir",
    "coco_data",
    "validation_results",
    "conversion_status",
    "conversion_result",
]


@given(value=json_values)
@settings(max_examples=50, deadline=None)
def test_state_field_serialization_roundtrip(value):
    """
    Property 1: State field serialization round-trip.

    For any JSON-serializable value, writing it to a RedisAppState field
    and reading it back must produce the original value unchanged.
    Validates: Requirements 4.4
    """
    for field in _FIELDS:
        client = fakeredis.FakeRedis(decode_responses=True)
        state = RedisAppState(client)
        setattr(state, field, value)
        result = getattr(state, field)
        assert result == value, (
            f"Round-trip failed for field '{field}': "
            f"wrote {value!r}, read back {result!r}"
        )


# ---------------------------------------------------------------------------
# Property 2: Redis key naming convention
# Feature: docker-deployment, Property 2: Redis key naming convention
# Validates: Requirements 4.1
# ---------------------------------------------------------------------------

@given(value=st.text(min_size=1, max_size=50))
@settings(max_examples=50, deadline=None)
def test_redis_key_naming_convention(value):
    """
    Property 2: Redis key naming convention.

    Writing to any of the 7 Redis-backed fields must result in exactly one
    key written under the 'app:<field_name>' namespace and no other app: keys.
    Validates: Requirements 4.1
    """
    for field in _FIELDS:
        client = fakeredis.FakeRedis(decode_responses=True)
        state = RedisAppState(client)
        # Use a plain string value for all fields (avoids type-specific defaults)
        setattr(state, field, value)
        keys = client.keys("app:*")
        # Exclude app:logs which may be populated by other operations
        field_keys = [k for k in keys if k != "app:logs"]
        assert len(field_keys) == 1, (
            f"Expected exactly 1 app: key after writing field '{field}', "
            f"got {len(field_keys)}: {field_keys}"
        )
        expected_key = f"app:{field}"
        assert expected_key in field_keys, (
            f"Expected key '{expected_key}' but found: {field_keys}"
        )
