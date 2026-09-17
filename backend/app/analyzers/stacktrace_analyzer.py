import re
from typing import Dict, Any, List

def parse_stacktrace(raw_trace: str) -> Dict[str, Any]:
    raw_trace = raw_trace.strip()
    if not raw_trace:
        return {"language": "unknown", "error": "Empty stack trace provided"}

    # Detection: Python Traceback
    if "Traceback (most recent call last):" in raw_trace or re.search(r'File ".*?", line \d+', raw_trace):
        return _parse_python_trace(raw_trace)

    # Detection: JavaScript / V8 Traceback
    return _parse_javascript_trace(raw_trace)

def _parse_javascript_trace(raw_trace: str) -> Dict[str, Any]:
    lines = raw_trace.splitlines()
    header = lines[0].strip() if lines else "Error"
    
    exception_type = "Error"
    message = header
    if ":" in header:
        parts = header.split(":", 1)
        exception_type = parts[0].strip()
        message = parts[1].strip()

    # V8 regex: at FunctionName (http://url:line:col) or at http://url:line:col
    v8_pattern = re.compile(r'^\s*at\s+(?:(?P<fn>[^\s(]+)\s+\()?(?P<location>[^)]+)\)?$')
    frames: List[Dict[str, Any]] = []

    for line in lines[1:]:
        match = v8_pattern.match(line)
        if match:
            fn = match.group("fn") or "<anonymous>"
            location = match.group("location")
            file_path = location
            line_num = None
            col_num = None
            
            # extract line and column
            loc_match = re.search(r'^(.*?):(\d+):(\d+)$', location)
            if loc_match:
                file_path = loc_match.group(1)
                line_num = int(loc_match.group(2))
                col_num = int(loc_match.group(3))
            
            frames.append({
                "function": fn,
                "file": file_path,
                "line": line_num,
                "col": col_num
            })

    top_frame = frames[0] if frames else None
    return {
        "language": "javascript",
        "exception_type": exception_type,
        "message": message,
        "total_frames": len(frames),
        "frames": frames,
        "top_frame": top_frame,
        "root_cause_hint": f"Failure originated in {top_frame['function']} at {top_frame['file']}:{top_frame['line']}" if top_frame else "Could not extract top frame"
    }

def _parse_python_trace(raw_trace: str) -> Dict[str, Any]:
    lines = raw_trace.splitlines()
    frames = []
    
    # Python frames: File "path", line X, in func\n    code
    py_pattern = re.compile(r'^\s*File "(?P<file>.*?)", line (?P<line>\d+)(?:, in (?P<fn>.*))?$')
    i = 0
    while i < len(lines):
        line = lines[i]
        match = py_pattern.match(line)
        if match:
            code_snippet = ""
            if i + 1 < len(lines) and not py_pattern.match(lines[i + 1]) and not lines[i + 1].strip().endswith("Error:"):
                code_snippet = lines[i + 1].strip()
            frames.append({
                "file": match.group("file"),
                "line": int(match.group("line")),
                "function": match.group("fn") or "<module>",
                "code": code_snippet
            })
        i += 1

    last_line = lines[-1].strip() if lines else "Exception"
    exception_type = "Exception"
    message = last_line
    if ":" in last_line:
        parts = last_line.split(":", 1)
        exception_type = parts[0].strip()
        message = parts[1].strip()

    top_frame = frames[-1] if frames else None  # In Python, the last frame is where it broke
    return {
        "language": "python",
        "exception_type": exception_type,
        "message": message,
        "total_frames": len(frames),
        "frames": frames,
        "top_frame": top_frame,
        "root_cause_hint": f"Raised {exception_type} in {top_frame['function']}() on line {top_frame['line']} of {top_frame['file']}" if top_frame else "Could not extract top frame"
    }
