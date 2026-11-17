# Railway Platform Allocator 🚆
## DAA Mini Project: Divide & Conquer (Merge Sort) + Greedy Platform Allocation

---

## 1. Project Introduction
The **Railway Platform Allocator** is an algorithmic decision-support and dispatching simulation built for a college **Design and Analysis of Algorithms (DAA)** mini project. In busy junction stations, allocating platforms to inbound trains without schedule collisions while minimizing the total number of physical platforms is a classic algorithmic challenge. This project models the station platform management system through a full-stack, mission-critical operations control center interface.

---

## 2. Problem Statement
Given a set of $n$ trains with their respective arrival and departure times at a railway station:
$$\text{Trains} = \{ (A_1, D_1), (A_2, D_2), \dots, (A_n, D_n) \}$$
where $A_i < D_i$ for all $i$ within the same 24-hour cycle.

**Objective:**  
Assign each train to a platform such that no two trains simultaneously occupy the same platform at any point in time, while **minimizing the total number of platforms required** ($p_{\min}$).

---

## 3. Objectives
1. Implement a manual **Divide and Conquer** algorithm (**Merge Sort from scratch**) to sort trains chronologically by arrival time (with departure time as tie-breaker) without using built-in sorting routines.
2. Implement an optimal **Greedy Strategy** (**First-Fit Platform Allocation**) that reuses existing platforms whenever possible or opens a new platform only when strictly necessary.
3. Implement an independent **Two-Pointer Overlap Verification** algorithm to mathematically verify that the greedy allocation achieves the theoretical minimum platform count.
4. Provide a command-line benchmark tool (`compare.py`) evaluating the optimized pipeline against the $\mathcal{O}(n^2)$ brute-force approach.
5. Deliver a mission-critical **RailOps Control Center UI** (inspired by Indian Railways command consoles) featuring a real-time Gantt timeline, interactive step-by-step playback, and dynamic pseudocode tracing.

---

## 4. DAA Concepts Used

| Primary Strategy | Algorithmic Paradigm | Purpose | Time Complexity | Auxiliary Space |
| :--- | :--- | :--- | :--- | :--- |
| **Merge Sort** | Divide and Conquer | Chronological sorting by arrival (tie-broken by departure) | $\mathcal{O}(n \log n)$ | $\mathcal{O}(n)$ |
| **First-Fit Allocation** | Greedy Strategy | Platform reuse or new track provisioning | $\mathcal{O}(n \times p)$ | $\mathcal{O}(p)$ |
| **Two-Pointer Scan** | Verification Scan | Computes maximum concurrent overlapping intervals | $\mathcal{O}(n \log n)$ | $\mathcal{O}(n)$ |

---

## 5. Merge Sort Explanation (Divide and Conquer)
To make optimal greedy allocation choices chronologically, trains must first be sorted by arrival time:
- **Divide**: Partition the array of $n$ trains into two equal halves at $\text{mid} = \lfloor n / 2 \rfloor$.
- **Conquer**: Recursively apply Merge Sort to the left half and right half until reaching the base case ($\text{length} \le 1$).
- **Combine**: Merge the two sorted subarrays in linear time $\mathcal{O}(n)$. If two trains have identical arrival times, departure times are used as a tie-breaker to ensure deterministic, collision-safe ordering.

**Recurrence Relation:**
$$T(n) = 2T(n/2) + \Theta(n)$$
By Case 2 of the Master Theorem:
$$T(n) = \Theta(n \log n)$$
Merge sort runs in $\mathcal{O}(n \log n)$ time in **all cases** (best, average, and worst).

---

## 6. Greedy Algorithm Explanation (Platform Allocation)
The greedy choice property guarantees that processing trains in order of their arrival and greedily assigning the first available platform yields the global minimum number of platforms:

1. Maintain an array `platforms_last_departure` where index $p$ stores the departure minute of the train currently occupying platform $p+1$.
2. For each incoming train $(A_k, D_k)$ in chronologically sorted order:
   - Scan active platforms $1, 2, \dots, p$:
   - If a platform is found where $\text{last\_departure} \le A_k$, **reuse this platform** and update its departure time to $D_k$.
   - If no open platform satisfies the condition, **open a new platform** ($p + 1$) and record its departure time as $D_k$.
3. Total platforms opened = Minimum platforms required.

**Simultaneous Events Guarantee:**  
If a train departs at 08:30 and another arrives at 08:30, the condition $\text{last\_departure} \le A_k$ ($510 \le 510$) holds true, meaning the platform is freed and reused without requiring an extra platform.

---

## 7. Two-Pointer Verification Explanation
To independently verify that the greedy allocation is mathematically optimal, a Two-Pointer overlap algorithm is executed:
1. Extract all arrival times into an array $A$ and all departure times into an array $D$.
2. Sort $A$ and $D$ independently using Merge Sort.
3. Initialize pointers $i = 0, j = 0$, `current_platforms = 0`, and `max_platforms = 0`.
4. Traverse the timeline:
   - If $A[i] < D[j]$: a train arrives before a departure; increment `current_platforms` and advance $i$.
   - Else: a train departs (or simultaneous departure occurs); decrement `current_platforms` and advance $j$.
   - Update `max_platforms = max(max_platforms, current_platforms)`.
5. The result proves:
$$\text{Greedy Platform Count} == \text{Two-Pointer Peak Count}$$

---

## 8. System Architecture
```
+-------------------------------------------------------------+
|                 Frontend (HTML5 / CSS3 / ES6+)              |
|  - RailOps Control Dashboard    - Test Presets (10, 50, 100)|
|  - Platform Gantt Timeline      - Algorithm Step Visualizer |
|  - In-Browser JS Engine         - Dark / Light Mode System  |
+------------------------------+------------------------------+
                               | REST JSON API
                               v
+-------------------------------------------------------------+
|                     Flask Backend (app.py)                  |
|  - POST /api/allocate (Merge Sort + Greedy + Verification)  |
|  - GET  /api/health   (Service Health & Strategy Registry)  |
|  - GET  /api/compare  (Testing Benchmark Endpoint)          |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|             Backend Benchmarking Engine (compare.py)        |
|  - Divide & Conquer + Greedy vs. Brute-Force O(n^2)         |
|  - Operations Counter & High-Resolution Timing Benchmarks   |
|  - Outputs comparison_results.csv & comparison_graph.png    |
+-------------------------------------------------------------+
```

---

## 9. Folder Structure
```text
railway-platform-allocator/
├── backend/
│   ├── app.py                  # Flask API with manual Merge Sort, Greedy allocation & Two-Pointer verification
│   ├── compare.py              # CLI benchmark script: D&C + Greedy vs. Brute-Force O(n^2)
│   ├── comparison_results.csv  # Benchmark operations & timing output (generated by compare.py)
│   ├── comparison_graph.png    # Matplotlib runtime comparison curve (generated by compare.py)
│   └── requirements.txt        # Backend dependencies (Flask, flask-cors, matplotlib)
├── frontend/
│   ├── index.html              # RailOps Control Center single-page layout (Queue, Results, Visualizer, Dashboard)
│   ├── style.css               # Design tokens, Gantt timeline, platform badges, dark/light themes
│   └── script.js               # Event handlers, Gantt engine, playback controller, client JS fallback
├── screenshots/                # Captured desktop and mobile interface previews
└── README.md                   # Complete 17-section project documentation
```

---

## 10. Installation Instructions
Ensure Python 3.9+ is installed on your machine.
```bash
# Clone or navigate to the repository root
cd railway-platform-allocator

# Install backend dependencies
pip install -r backend/requirements.txt
```

---

## 11. How to Run the Backend
```bash
# Start the Flask API server
python3 backend/app.py
```
Expected output:
```text
Railway Platform Allocator running at http://127.0.0.1:5000
 * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
```

---

## 12. How to Open the Frontend
- **Browser access**: Navigate to [http://localhost:5000/](http://localhost:5000/) while the backend is running.
- **Standalone execution**: You can also double-click and open `frontend/index.html` directly in any modern web browser. If the Flask backend is unreachable, the application automatically engages its in-browser JavaScript Divide & Conquer and Greedy engine.

---

## 13. Sample Input and Output

### Request Payload (`POST /api/allocate`)
```json
{
  "trains": [
    { "name": "12951 Mumbai Rajdhani Exp", "arrival": "06:00", "departure": "06:20" },
    { "name": "12009 Shatabdi Express", "arrival": "06:10", "departure": "06:40" },
    { "name": "12123 Deccan Queen", "arrival": "06:30", "departure": "07:00" },
    { "name": "12269 Duronto Express", "arrival": "06:50", "departure": "07:30" }
  ]
}
```

### Response Payload (`200 OK`)
```json
{
  "minPlatforms": 2,
  "totalTrains": 4,
  "avgHaltMinutes": 32.5,
  "peakTime": "06:30",
  "peakTrains": 2,
  "verification": {
    "method": "Two-Pointer (Sorted Arrivals vs Departures)",
    "result": 2,
    "match": true
  },
  "allocation": [
    { "seq": 1, "name": "12951 Mumbai Rajdhani Exp", "arrival": "06:00", "departure": "06:20", "haltMins": 20, "platform": 1 },
    { "seq": 2, "name": "12009 Shatabdi Express", "arrival": "06:10", "departure": "06:40", "haltMins": 30, "platform": 2 },
    { "seq": 3, "name": "12123 Deccan Queen", "arrival": "06:30", "departure": "07:00", "haltMins": 30, "platform": 1 },
    { "seq": 4, "name": "12269 Duronto Express", "arrival": "06:50", "departure": "07:30", "haltMins": 40, "platform": 2 }
  ]
}
```

---

## 14. Time and Space Complexity

| Phase | Strategy | Best Case Time | Average Case Time | Worst Case Time | Space Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Sorting** | Divide & Conquer (Merge Sort) | $\mathcal{O}(n \log n)$ | $\mathcal{O}(n \log n)$ | $\mathcal{O}(n \log n)$ | $\mathcal{O}(n)$ (Auxiliary merge buffers) |
| **2. Allocation** | Greedy Strategy (First-Fit) | $\mathcal{O}(n)$ <br><small>(No overlap, $p = 1$)</small> | $\mathcal{O}(n \times p)$ <br><small>($p \ll n$)</small> | $\mathcal{O}(n^2)$ <br><small>(All overlap, $p = n$)</small> | $\mathcal{O}(p)$ (Platform registers) |
| **Overall Pipeline** | **Combined D&C + Greedy** | $\mathcal{O}(n \log n)$ | $\mathcal{O}(n \log n + n \times p)$ | $\mathcal{O}(n^2)$ | $\mathcal{O}(n)$ |

---

## 15. Testing Results (`compare.py`)
Running `python3 backend/compare.py` benchmarks the optimized pipeline against the brute-force baseline:

| Input Size ($n$) | Case Type | Optimized Ops ($\mathcal{O}(n \log n)$) | Brute-Force Ops ($\mathcal{O}(n^2)$) | Optimized Time | Brute-Force Time | Results Match |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **10** | Random | 33 | 100 | 0.013 ms | 0.008 ms | **YES** |
| **100** | Random | 792 | 10,000 | 0.153 ms | 0.733 ms | **YES** |
| **500** | Random | 7,812 | 250,000 | 1.127 ms | 15.691 ms | **YES** |
| **1000** | Random | 23,071 | 1,000,000 | 2.326 ms | 61.931 ms | **YES** |
| **2000** | Random | 71,072 | 4,000,000 | 6.140 ms | 249.725 ms | **YES** |
| **100** | Best Case (No Overlap) | 415 | 10,000 | 0.105 ms | 0.676 ms | **YES** |
| **100** | Worst Case (All Overlap)| 5,466 | 10,000 | 0.379 ms | 0.672 ms | **YES** |

> At $n = 2000$, the optimized pipeline achieves a **$40\times$ speedup** over the $\mathcal{O}(n^2)$ baseline while producing an identical optimal platform count.

---

## 16. Conclusion
The Railway Platform Allocator demonstrates the power of combining classical algorithmic paradigms to solve real-world scheduling problems:
- **Divide and Conquer** ensures deterministic, stable chronological ordering in $\mathcal{O}(n \log n)$.
- The **Greedy Strategy** leverages this ordered structure to achieve optimal resource allocation without backtracking.
- Independent **Two-Pointer verification** mathematically guarantees collision-free optimality.
- The resulting full-stack platform provides a clear, defensible, and interactive demonstration suitable for college academic evaluation and viva defense.

---

## 17. Future Scope
1. **Multi-Day & Overnight Journeys**: Extending the algorithm to handle journeys crossing midnight ($D_i < A_i$) via 48-hour modular circular intervals.
2. **Platform Length & Rake Compatibility**: Incorporating 24-coach vs 16-coach rake constraints and electric catenary restrictions.
3. **Dynamic Delays & Buffer Margin**: Introducing stochastic delay modeling with real-time dynamic re-allocation.
4. **Maintenance Blocks**: Incorporating scheduled track maintenance windows where specific platforms are locked from allocation.
