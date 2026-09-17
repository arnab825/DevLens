import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.analyzers.error_analyzer import analyze_error
from app.analyzers.network_analyzer import analyze_network_request
from app.analyzers.stacktrace_analyzer import parse_stacktrace

def test_type_error_null_access():
    msg = "TypeError: Cannot read properties of undefined (reading 'avatar')"
    result = analyze_error(msg, source_file="UserProfile.jsx", line=42)
    assert result["type"] == "TypeError"
    assert result["matched"] is True
    assert "avatar" in result["summary"]
    assert len(result["suggested_checks"]) > 0

def test_reference_error():
    msg = "ReferenceError: userProfileData is not defined"
    result = analyze_error(msg)
    assert result["type"] == "ReferenceError"
    assert result["matched"] is True
    assert "userProfileData" in result["summary"]

def test_network_failure_401():
    result = analyze_network_request("POST", "https://api.test.com/login", 401, 150.0)
    assert result["status"] == 401
    assert result["category"] == "Unauthorized"
    assert len(result["possible_causes"]) > 0

def test_javascript_stacktrace_parser():
    trace = """TypeError: Cannot read properties of null
    at calculateTotal (http://localhost:3000/cart.js:45:12)
    at checkout (http://localhost:3000/cart.js:90:5)"""
    result = parse_stacktrace(trace)
    assert result["language"] == "javascript"
    assert result["exception_type"] == "TypeError"
    assert result["total_frames"] == 2
    assert result["frames"][0]["function"] == "calculateTotal"
    assert result["frames"][0]["line"] == 45

def test_python_stacktrace_parser():
    trace = """Traceback (most recent call last):
  File "app/service.py", line 15, in process_item
    return cache[key]
KeyError: 'item_123'"""
    result = parse_stacktrace(trace)
    assert result["language"] == "python"
    assert result["exception_type"] == "KeyError"
    assert result["message"] == "'item_123'"
    assert result["total_frames"] == 1
    assert result["frames"][0]["function"] == "process_item"

if __name__ == "__main__":
    test_type_error_null_access()
    test_reference_error()
    test_network_failure_401()
    test_javascript_stacktrace_parser()
    test_python_stacktrace_parser()
    print("All DevLens analyzer checks PASSED successfully.")
