#!/usr/bin/env python3
"""
Algorithm Complexity Comparison - Backend Benchmark
Design and Analysis of Algorithms (DAA) Mini Project

Compares the project's Divide and Conquer (Merge Sort) + Greedy Algorithm
with the classic Brute-Force O(n^2) interval intersection approach.

NOTE: This script is purely a backend benchmarking and analysis tool.
It is NOT exposed to, called by, or mentioned in the frontend website.
"""

import time
import random
import csv
import os
import sys

# Try importing matplotlib for performance visualization
try:
    import matplotlib
    matplotlib.use('Agg')  # Headless backend
    import matplotlib.pyplot as plt
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False


# =============================================================================
# Helper Utilities
# =============================================================================
def time_to_minutes(time_str: str) -> int:
    h, m = map(int, time_str.split(':'))
    return h * 60 + m


def minutes_to_time(minutes: int) -> str:
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


# =============================================================================
# 1. Divide and Conquer (Merge Sort) - From Scratch
# =============================================================================
def merge_sort_timed(arr, counter):
    """
    Merge Sort implemented from scratch using Divide and Conquer.
    Ties broken by departure time.
    Time Complexity: O(n log n) in Best, Average, and Worst cases.
    Space Complexity: O(n) auxiliary memory.
    """
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort_timed(arr[:mid], counter)
    right = merge_sort_timed(arr[mid:], counter)

    merged = []
    i = 0
    j = 0

    while i < len(left) and j < len(right):
        counter['comparisons'] += 1
        # Primary key: arrival time; Tie-breaker: departure time
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

    return merged


# =============================================================================
# 2. Optimized Pipeline: Merge Sort + Greedy Allocation
# =============================================================================
def run_optimized_allocation(trains, counter):
    """
    Executes Divide and Conquer (Merge Sort) + Greedy Platform Allocation.
    Counts comparisons and returns (min_platforms, elapsed_time_seconds).
    Time Complexity: O(n log n) sorting + O(n * p) allocation.
    """
    t_start = time.perf_counter()

    # Step 1: Merge Sort (Divide and Conquer)
    sorted_trains = merge_sort_timed(trains, counter)

    # Step 2: Greedy Platform Allocation
    platforms_last_dep = []
    for train in sorted_trains:
        assigned = False
        for p_idx in range(len(platforms_last_dep)):
            counter['comparisons'] += 1
            if platforms_last_dep[p_idx] <= train['arr_mins']:
                platforms_last_dep[p_idx] = train['dep_mins']
                assigned = True
                break

        if not assigned:
            platforms_last_dep.append(train['dep_mins'])

    elapsed = time.perf_counter() - t_start
    return len(platforms_last_dep), elapsed


# =============================================================================
# 3. Baseline Approach: Double-Loop Peak Count (O(n^2))
# =============================================================================
def run_brute_force_allocation(trains, counter):
    """
    For each train's arrival moment, counts all trains currently present at the station.
    Double nested loop over all trains.
    Time Complexity: O(n^2) comparisons.
    """
    t_start = time.perf_counter()
    n = len(trains)
    max_concurrent = 0

    for i in range(n):
        arr_i = trains[i]['arr_mins']
        concurrent = 0
        for j in range(n):
            counter['comparisons'] += 1
            # Train j is halted at the station at train i's arrival time if:
            # train j arrives at or before arr_i and departs strictly after arr_i
            if trains[j]['arr_mins'] <= arr_i < trains[j]['dep_mins']:
                concurrent += 1
        if concurrent > max_concurrent:
            max_concurrent = concurrent

    elapsed = time.perf_counter() - t_start
    return max_concurrent, elapsed


# =============================================================================
# 4. Dataset Generators
# =============================================================================
def generate_random_trains(n: int):
    """Generates n random trains with valid non-zero halt times within 24 hours."""
    random.seed(42 + n)
    trains = []
    for i in range(n):
        arr = random.randint(0, 1380)  # Between 00:00 and 23:00
        halt = random.randint(10, 60)  # Halt between 10 and 60 minutes
        dep = min(arr + halt, 1439)
        if dep <= arr:
            dep = arr + 1
        trains.append({
            "name": f"Train-{i+1:04d}",
            "arrival": minutes_to_time(arr),
            "departure": minutes_to_time(dep),
            "arr_mins": arr,
            "dep_mins": dep
        })
    return trains


def generate_best_case(n: int):
    """
    Best Case: strictly sequential trains with zero overlap.
    Every train arrives after the previous train has already departed.
    Minimum platforms required = 1.
    """
    trains = []
    curr = 0
    for i in range(n):
        arr = curr
        dep = arr + 10  # 10 mins halt
        trains.append({
            "name": f"SeqTrain-{i+1}",
            "arrival": minutes_to_time(arr % 1440),
            "departure": minutes_to_time(dep % 1440),
            "arr_mins": arr,
            "dep_mins": dep
        })
        curr = dep + 5  # 5 mins buffer
    return trains


def generate_worst_case(n: int):
    """
    Worst Case: all trains overlap simultaneously at the station.
    All trains arrive at the same time or within minutes and depart much later.
    Minimum platforms required = n.
    """
    trains = []
    for i in range(n):
        arr = 360 + (i % 5)  # Arrive around 06:00 - 06:04
        dep = 720            # All depart at 12:00
        trains.append({
            "name": f"RushTrain-{i+1}",
            "arrival": minutes_to_time(arr),
            "departure": minutes_to_time(dep),
            "arr_mins": arr,
            "dep_mins": dep
        })
    return trains


# =============================================================================
# 5. Benchmark Runner
# =============================================================================
def run_benchmark():
    """
    Runs the full performance benchmark across random sizes, best case, and worst case.
    Returns list of result dicts.
    """
    test_suite = [
        ("Random", 10, generate_random_trains(10)),
        ("Random", 100, generate_random_trains(100)),
        ("Random", 500, generate_random_trains(500)),
        ("Random", 1000, generate_random_trains(1000)),
        ("Random", 2000, generate_random_trains(2000)),
        ("Best Case (No Overlap)", 100, generate_best_case(100)),
        ("Worst Case (All Overlap)", 100, generate_worst_case(100))
    ]

    results = []

    for case_type, size, trains in test_suite:
        # Optimized Method
        opt_counter = {'comparisons': 0}
        opt_plat, opt_time = run_optimized_allocation(trains, opt_counter)

        # Baseline / Brute-Force Method
        bf_counter = {'comparisons': 0}
        bf_plat, bf_time = run_brute_force_allocation(trains, bf_counter)

        match = (opt_plat == bf_plat)

        results.append({
            "size": size,
            "case_type": case_type,
            "opt_platforms": opt_plat,
            "bf_platforms": bf_plat,
            "opt_comparisons": opt_counter['comparisons'],
            "bf_comparisons": bf_counter['comparisons'],
            "opt_time_sec": opt_time,
            "bf_time_sec": bf_time,
            "opt_time_ms": round(opt_time * 1000, 3),
            "bf_time_ms": round(bf_time * 1000, 3),
            "match": match
        })

    return results


def print_results_table(results):
    """Prints a clean ASCII table of benchmark results."""
    header = f"{'Size':<6} | {'Case Type':<26} | {'Opt Ops':<12} | {'BF Ops':<12} | {'Opt Time (ms)':<14} | {'BF Time (ms)':<14} | {'Match':<6}"
    sep = "-" * len(header)
    print("\n" + "=" * len(header))
    print(" DAA BENCHMARK: Divide & Conquer + Greedy vs. Brute-Force Baseline")
    print("=" * len(header))
    print(header)
    print(sep)

    for r in results:
        match_str = "YES" if r['match'] else "NO"
        print(f"{r['size']:<6} | {r['case_type']:<26} | {r['opt_comparisons']:<12,d} | {r['bf_comparisons']:<12,d} | {r['opt_time_ms']:<14.3f} | {r['bf_time_ms']:<14.3f} | {match_str:<6}")

    print(sep)


def save_csv(results, filepath):
    """Saves benchmark results to a CSV file."""
    keys = ["size", "case_type", "opt_platforms", "bf_platforms", "opt_comparisons", "bf_comparisons", "opt_time_sec", "bf_time_sec", "opt_time_ms", "bf_time_ms", "match"]
    with open(filepath, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(results)
    print(f"\n[+] Results saved to CSV: {filepath}")


def generate_graph(results, filepath):
    """Generates comparison plot of Time vs Input Size for Random cases."""
    if not HAS_MATPLOTLIB:
        print("[-] Matplotlib not available; skipping graph generation.")
        return

    random_results = [r for r in results if r['case_type'] == 'Random']
    sizes = [r['size'] for r in random_results]
    opt_times = [r['opt_time_ms'] for r in random_results]
    bf_times = [r['bf_time_ms'] for r in random_results]

    plt.figure(figsize=(9, 5.5))
    plt.plot(sizes, opt_times, 'o-', color='#14B8A6', linewidth=2.5, markersize=7, label='Optimized (Merge Sort + Greedy) - O(n log n)')
    plt.plot(sizes, bf_times, 's--', color='#EF4444', linewidth=2.5, markersize=7, label='Brute-Force Baseline - O(n²)')

    plt.title('Execution Time vs. Input Size (DAA Benchmark)', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Number of Trains (n)', fontsize=11, fontweight='semibold')
    plt.ylabel('Execution Time (milliseconds)', fontsize=11, fontweight='semibold')
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.legend(fontsize=10, loc='upper left')
    plt.tight_layout()

    plt.savefig(filepath, dpi=300)
    plt.close()
    print(f"[+] Comparison graph saved: {filepath}")


def main():
    print("Running DAA Algorithm Benchmark across 7 test configurations...")
    results = run_benchmark()
    print_results_table(results)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "comparison_results.csv")
    graph_path = os.path.join(base_dir, "comparison_graph.png")

    save_csv(results, csv_path)
    generate_graph(results, graph_path)
    print("\nBenchmark completed successfully!\n")


if __name__ == '__main__':
    main()
