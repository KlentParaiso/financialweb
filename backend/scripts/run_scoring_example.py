#!/usr/bin/env python3
"""
Run the scoring engine with the example input and print output.
Usage: from backend dir: python scripts/run_scoring_example.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.scoring_engine import score_from_json

def main():
    examples_dir = os.path.join(os.path.dirname(__file__), "..", "examples")
    input_path = os.path.join(examples_dir, "scoring_input_example.json")
    if not os.path.exists(input_path):
        print("Example file not found:", input_path)
        sys.exit(1)
    with open(input_path) as f:
        payload = json.load(f)
    result = score_from_json(payload)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
