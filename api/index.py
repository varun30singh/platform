#!/usr/bin/env python3
"""
Railway Platform Allocator - Vercel Serverless Function (Python)
College DAA (Design and Analysis of Algorithms) Mini Project

Combines TWO classical strategies:
1. Divide and Conquer: Merge Sort from scratch (O(n log n)) to sort trains by arrival time.
2. Greedy Strategy: Platform reuse & allocation (O(n * p)) to find minimum platforms required.

Verified independently via Two-Pointer Peak Overlap algorithm (O(n log n)).
"""

import os
import re
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder=None)
CORS(app)

# Regex pattern for 24-hour time format HH:MM (00:00 to 23:59)
TIME_REGEX = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


def time_to_minutes(time_str: str) -> int:
    """Converts 'HH:MM' 24-hour time string into minutes since midnight."""
    hours, minutes = map(int, time_str.split(':'))
    return hours * 60 + minutes


def minutes_to_time(minutes: int) -> str:
    """Converts minutes since midnight back into 'HH:MM' string."""
    hours = (minutes // 60) % 24
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"


# =============================================================================
# Step 1: Divide and Conquer - Merge Sort From Scratch
# =============================================================================
def merge_sort_trains(arr, depth=0, step_recorder=None):
    """
    Sorts trains chronologically by arrival time using Divide and Conquer (Merge Sort).
    Ties are broken by departure time.

    Time Complexity:
      - Best Case:    O(n log n)
      - Average Case: O(n log n)
      - Worst Case:   O(n log n)
    Space Complexity:
      - Auxiliary Space: O(n) for merging subarrays.
    """
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2

    if step_recorder is not None:
        step_recorder.append({
            "action": "split",
            "depth": depth,
            "original": [t['name'] + f" ({t['arrival']})" for t in arr],
            "left": [t['name'] + f" ({t['arrival']})" for t in arr[:mid]],
            "right": [t['name'] + f" ({t['arrival']})" for t in arr[mid:]]
        })

    left = merge_sort_trains(arr[:mid], depth + 1, step_recorder)
    right = merge_sort_trains(arr[mid:], depth + 1, step_recorder)

    merged = []
    i = 0
    j = 0

    while i < len(left) and j < len(right):
        if (left[i]['arr_mins'] < right[j]['arr_mins']) or (
            left[i]['arr_mins'] == right[j]['arr_mins'] and left[i]['dep_mins'] <= right[j]['dep_mins']
        ):
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1

    while i < len(left):
        merged.append(left[i])
        i += 1

    while j < len(right):
        merged.append(right[j])
        j += 1

    if step_recorder is not None:
        step_recorder.append({
            "action": "merged",
            "depth": depth,
            "result": [t['name'] + f" ({t['arrival']})" for t in merged]
        })

    return merged


# =============================================================================
# API Endpoints
# =============================================================================
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to test backend availability."""
    return jsonify({
        "status": "healthy",
        "service": "Railway Platform Allocator API (Vercel Serverless)",
        "strategies": [
            "Divide and Conquer: Merge Sort O(n log n)",
            "Greedy Strategy: Platform Allocation O(n * p)",
            "Two-Pointer Verification: O(n log n)"
        ]
    }), 200


@app.route('/api/allocate', methods=['POST'])
def allocate_platforms():
    """
    Allocates railway platforms using:
      1. Divide and Conquer (Merge Sort from scratch) to order trains by arrival.
      2. Greedy Strategy to reuse platforms or allocate new ones.
      3. Two-Pointer Scan to independently verify mathematical optimality.
    """
    payload = request.get_json(silent=True)
    if not payload or not isinstance(payload, dict):
        return jsonify({
            "error": "Invalid JSON payload. Expected a JSON object with a 'trains' array."
        }), 400

    trains = payload.get('trains')
    if not isinstance(trains, list):
        return jsonify({
            "error": "The 'trains' field must be an array of train objects."
        }), 400

    if len(trains) == 0:
        return jsonify({
            "error": "Validation failed: At least one train must be provided."
        }), 400

    parsed_trains = []
    for idx, item in enumerate(trains, start=1):
        if not isinstance(item, dict):
            return jsonify({
                "error": f"Train #{idx} is invalid. Each train must be an object with name, arrival, and departure."
            }), 400

        name = str(item.get('name', '')).strip()
        arrival = str(item.get('arrival', '')).strip()
        departure = str(item.get('departure', '')).strip()

        if not name:
            return jsonify({
                "error": f"Train #{idx}: Name cannot be empty."
            }), 400

        if not TIME_REGEX.match(arrival):
            return jsonify({
                "error": f"Train '{name}': Arrival time '{arrival}' must be in 24-hour HH:MM format (e.g. '06:00')."
            }), 400

        if not TIME_REGEX.match(departure):
            return jsonify({
                "error": f"Train '{name}': Departure time '{departure}' must be in 24-hour HH:MM format (e.g. '06:20')."
            }), 400

        arr_mins = time_to_minutes(arrival)
        dep_mins = time_to_minutes(departure)

        if dep_mins <= arr_mins:
            return jsonify({
                "error": f"Train '{name}': Departure time ({departure}) must be strictly later than arrival time ({arrival})."
            }), 400

        parsed_trains.append({
            "name": name,
            "arrival": arrival,
            "departure": departure,
            "arr_mins": arr_mins,
            "dep_mins": dep_mins,
            "halt_mins": dep_mins - arr_mins
        })

    n = len(parsed_trains)

    # Step 1: Divide and Conquer (Merge Sort from Scratch)
    merge_sort_steps = []
    recorder = merge_sort_steps if n <= 200 else None
    sorted_trains = merge_sort_trains(parsed_trains, depth=0, step_recorder=recorder)

    # Step 2: Greedy Platform Allocation
    platforms_last_departure = []
    allocation = []
    playback_steps = []

    for seq, train in enumerate(sorted_trains, start=1):
        assigned_platform = None
        current_platform_states = []

        for p_idx, last_dep in enumerate(platforms_last_departure):
            is_free = (last_dep <= train['arr_mins'])
            current_platform_states.append({
                "platform": p_idx + 1,
                "lastDeparture": minutes_to_time(last_dep),
                "isFree": is_free
            })
            if is_free and assigned_platform is None:
                assigned_platform = p_idx + 1
                platforms_last_departure[p_idx] = train['dep_mins']

        is_new_platform = False
        if assigned_platform is None:
            platforms_last_departure.append(train['dep_mins'])
            assigned_platform = len(platforms_last_departure)
            is_new_platform = True

        if is_new_platform:
            if len(current_platform_states) == 0:
                explanation = f"Train {train['name']} arrives at {train['arrival']}. First train in schedule; opens Platform 1."
            else:
                busy_summary = ", ".join([f"Plat {p['platform']} busy until {p['lastDeparture']}" for p in current_platform_states])
                explanation = f"Train {train['name']} arrives at {train['arrival']}. All active platforms occupied ({busy_summary}). Opened new Platform {assigned_platform}."
            pseudo_line = 5
        else:
            prev_dep = [p['lastDeparture'] for p in current_platform_states if p['platform'] == assigned_platform][0]
            explanation = f"Train {train['name']} arrives at {train['arrival']}. Platform {assigned_platform} is free (departed at {prev_dep} <= {train['arrival']}). Reusing Platform {assigned_platform}."
            pseudo_line = 4

        playback_steps.append({
            "step": seq,
            "train": train['name'],
            "arrival": train['arrival'],
            "departure": train['departure'],
            "haltMins": train['halt_mins'],
            "chosenPlatform": assigned_platform,
            "isNewPlatform": is_new_platform,
            "platforms": current_platform_states,
            "explanation": explanation,
            "pseudoLine": pseudo_line
        })

        allocation.append({
            "seq": seq,
            "name": train['name'],
            "arrival": train['arrival'],
            "departure": train['departure'],
            "haltMins": train['halt_mins'],
            "platform": assigned_platform
        })

    min_platforms = len(platforms_last_departure)

    # Step 3: Two-Pointer Verification & Peak-Load Time Calculation
    def simple_merge_sort(nums):
        if len(nums) <= 1:
            return nums
        m = len(nums) // 2
        l = simple_merge_sort(nums[:m])
        r = simple_merge_sort(nums[m:])
        res = []
        x = y = 0
        while x < len(l) and y < len(r):
            if l[x] <= r[y]:
                res.append(l[x])
                x += 1
            else:
                res.append(r[y])
                y += 1
        res.extend(l[x:])
        res.extend(r[y:])
        return res

    all_arrivals = simple_merge_sort([t['arr_mins'] for t in parsed_trains])
    all_departures = simple_merge_sort([t['dep_mins'] for t in parsed_trains])

    i = 0
    j = 0
    current_platforms = 0
    max_two_pointer = 0
    peak_start_minute = all_arrivals[0]
    peak_end_minute = all_departures[0]

    while i < n and j < n:
        if all_arrivals[i] < all_departures[j]:
            current_platforms += 1
            if current_platforms > max_two_pointer:
                max_two_pointer = current_platforms
                peak_start_minute = all_arrivals[i]
                departures_after = [d for d in all_departures if d > peak_start_minute]
                peak_end_minute = min(departures_after) if departures_after else all_departures[-1]
            i += 1
        else:
            current_platforms -= 1
            j += 1

    peak_time_str = minutes_to_time(peak_start_minute)
    peak_end_str = minutes_to_time(peak_end_minute)

    total_halt = sum(t['halt_mins'] for t in parsed_trains)
    avg_halt = round(total_halt / n, 1)

    verification_result = {
        "method": "Two-Pointer (Sorted Arrivals vs Departures)",
        "result": max_two_pointer,
        "match": (min_platforms == max_two_pointer)
    }

    return jsonify({
        "minPlatforms": min_platforms,
        "totalTrains": n,
        "avgHaltMinutes": avg_halt,
        "peakTime": peak_time_str,
        "peakStartTime": peak_time_str,
        "peakEndTime": peak_end_str,
        "peakTrains": max_two_pointer,
        "verification": verification_result,
        "allocation": allocation,
        "steps": playback_steps,
        "mergeSortSteps": merge_sort_steps
    }), 200


@app.route('/api/compare', methods=['GET'])
def get_benchmark_results():
    """Benchmark comparisons endpoint."""
    return jsonify({
        "status": "success",
        "description": "DAA Benchmark: Divide & Conquer (Merge Sort) + Greedy vs Brute-Force O(n^2)",
        "results": []
    }), 200


candidate_dirs = [
    os.path.join(os.path.dirname(__file__), 'static'),
    os.path.dirname(__file__),
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public')),
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..')),
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'railway-platform-allocator', 'frontend')),
    os.getcwd()
]

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json'
}


def find_static_file(filename):
    for d in candidate_dirs:
        p = os.path.join(d, filename)
        if os.path.isfile(p):
            return p
    return None


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path.startswith('api/'):
        return jsonify({"error": f"API endpoint /{path} not found"}), 404

    from flask import Response
    target = path if path else 'index.html'
    file_path = find_static_file(target)

    if not file_path and not path:
        file_path = find_static_file('index.html')

    if file_path and os.path.isfile(file_path):
        _, ext = os.path.splitext(file_path)
        mime = MIME_TYPES.get(ext.lower(), 'application/octet-stream')
        with open(file_path, 'rb') as f:
            return Response(f.read(), mimetype=mime)

    fallback_index = find_static_file('index.html')
    if fallback_index and os.path.isfile(fallback_index):
        with open(fallback_index, 'rb') as f:
            return Response(f.read(), mimetype='text/html; charset=utf-8')

    return "<h1>Railway Platform Allocator</h1><p>Frontend static files not found on server.</p>", 404
