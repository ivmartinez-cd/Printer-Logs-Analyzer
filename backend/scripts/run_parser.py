"""CLI helper to parse log files during development."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow running as `python scripts/run_parser.py` from backend/ or repo root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from application.parsers.log_parser import LogParser


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Parse HP printer log files.")
    parser.add_argument("input", type=Path, help="Path to the log file to parse")
    return parser.parse_args()


def main() -> None:
    args = parse_arguments()
    log_parser = LogParser()
    report = log_parser.parse_file(args.input)
    print(f"Parsed events: {len(report.events)}")
    for event in report.events:
        print(event.model_dump())
    if report.errors:
        print("\nErrors:")
        for error in report.errors:
            print(f"[line {error.line_number}] {error.reason} -> {error.raw_line}")


if __name__ == "__main__":
    main()
