/**
 * Railway Platform Allocator - Frontend JavaScript
 * College DAA (Design and Analysis of Algorithms) Mini Project
 * Demonstrates:
 * 1. Divide and Conquer: Merge Sort (O(n log n)) to sort trains by arrival time
 * 2. Greedy Strategy: First-fit Platform Allocation (O(n * p))
 * 3. Two-Pointer Verification & Peak Overlap Detection
 */

// Sample Indian Railways dataset (10 trains) as specified
const SAMPLE_TRAINS = [
  { name: "12951 Rajdhani Exp", arrival: "06:00", departure: "06:20" },
  { name: "12009 Shatabdi Exp", arrival: "06:10", departure: "06:40" },
  { name: "12123 Deccan Queen", arrival: "06:30", departure: "07:00" },
  { name: "12269 Duronto Exp", arrival: "06:50", departure: "07:30" },
  { name: "51317 Pune Passenger", arrival: "07:10", departure: "07:45" },
  { name: "11020 Konark Exp", arrival: "07:40", departure: "08:10" },
  { name: "12780 Goa Exp", arrival: "08:00", departure: "08:30" },
  { name: "12203 Garib Rath", arrival: "08:20", departure: "09:00" },
  { name: "12127 Intercity Exp", arrival: "08:50", departure: "09:15" },
  { name: "12139 Mail Exp", arrival: "09:05", departure: "09:40" }
];

// Determine API base URL (relative if served by Flask, or localhost:5000 if opened directly)
const API_BASE_URL = window.location.origin.includes('http') && !window.location.origin.startsWith('file:')
  ? window.location.origin
  : 'http://localhost:5000';

// Distinct platform color palette matching style.css (cycles if platforms > 8)
const PLATFORM_COLORS = [
  { id: 1, name: "Blue", class: "plat-1", barClass: "bar-plat-1", hex: "#2563EB" },
  { id: 2, name: "Green", class: "plat-2", barClass: "bar-plat-2", hex: "#16A34A" },
  { id: 3, name: "Orange", class: "plat-3", barClass: "bar-plat-3", hex: "#EA580C" },
  { id: 4, name: "Purple", class: "plat-4", barClass: "bar-plat-4", hex: "#9333EA" },
  { id: 5, name: "Pink", class: "plat-5", barClass: "bar-plat-5", hex: "#DB2777" },
  { id: 6, name: "Cyan", class: "plat-6", barClass: "bar-plat-6", hex: "#0891B2" },
  { id: 7, name: "Red", class: "plat-7", barClass: "bar-plat-7", hex: "#DC2626" },
  { id: 8, name: "Lime", class: "plat-8", barClass: "bar-plat-8", hex: "#65A30D" }
];

function getPlatformMeta(platformNum) {
  const index = (platformNum - 1) % PLATFORM_COLORS.length;
  return PLATFORM_COLORS[index];
}

// App State
let trainsList = [];
let lastAllocationResult = null;
let highlightedTrainName = null;
let currentPlaybackStep = 0;
let playbackInterval = null;

// DOM Elements
const trainForm = document.getElementById('train-form');
const trainNameInput = document.getElementById('train-name');
const trainArrivalInput = document.getElementById('train-arrival');
const trainDepartureInput = document.getElementById('train-departure');
const btnAddTrain = document.getElementById('btn-add-train');
const btnLoadSample = document.getElementById('btn-load-sample');
const btnClearAll = document.getElementById('btn-clear-all');
const btnRunAllocation = document.getElementById('btn-run-allocation');
const formError = document.getElementById('form-error');
const formErrorText = document.getElementById('form-error-text');

// Presets Elements
const btnPresetBest = document.getElementById('btn-preset-best');
const btnPresetWorst = document.getElementById('btn-preset-worst');
const btnPresetRandom = document.getElementById('btn-preset-random');
const randomCountSelect = document.getElementById('random-count-select');

// Table & Empty State Elements
const trainsEmptyState = document.getElementById('trains-empty-state');
const trainsTable = document.getElementById('trains-table');
const trainsTableBody = document.getElementById('trains-table-body');
const trainCounterBadge = document.getElementById('train-counter-badge');

// Results & Stats Elements
const fallbackNotice = document.getElementById('fallback-notice');
const resultsSection = document.getElementById('results-section');
const statMinPlatforms = document.getElementById('stat-min-platforms');
const statTotalTrains = document.getElementById('stat-total-trains');
const statAvgHalt = document.getElementById('stat-avg-halt');
const verificationMatchTag = document.getElementById('verification-match-tag');
const verificationDetail = document.getElementById('verification-detail');

// Playback Elements
const playbackStepCounter = document.getElementById('playback-step-counter');
const btnPlaybackPrev = document.getElementById('btn-playback-prev');
const btnPlaybackPlay = document.getElementById('btn-playback-play');
const playbackPlayIcon = document.getElementById('playback-play-icon');
const playbackPauseIcon = document.getElementById('playback-pause-icon');
const playbackPlayText = document.getElementById('playback-play-text');
const btnPlaybackNext = document.getElementById('btn-playback-next');
const btnPlaybackReset = document.getElementById('btn-playback-reset');
const playbackTrainTag = document.getElementById('playback-train-tag');
const playbackDecisionTag = document.getElementById('playback-decision-tag');
const playbackExplanationText = document.getElementById('playback-explanation-text');
const pseudocodeLines = document.getElementById('pseudocode-lines');

// Merge Sort View Elements
const mergeSortHeader = document.getElementById('merge-sort-header');
const btnToggleMergeSort = document.getElementById('btn-toggle-mergesort');
const mergeSortBody = document.getElementById('merge-sort-body');
const mergeSortToggleLabel = document.getElementById('mergesort-toggle-label');
const mergeSortToggleIcon = document.getElementById('mergesort-toggle-icon');
const mergeSortTreeContainer = document.getElementById('mergesort-tree-container');

// Timeline Elements
const peakTimeVal = document.getElementById('peak-time-val');
const peakTrainsVal = document.getElementById('peak-trains-val');
const timelineLegend = document.getElementById('timeline-legend');
const timelineAxis = document.getElementById('timeline-axis');
const timelineTracks = document.getElementById('timeline-tracks');
const timelineScrollContainer = document.getElementById('timeline-scroll-container');
const timelineWrapper = document.getElementById('timeline-wrapper');
const allocationTableBody = document.getElementById('allocation-table-body');

// Timeline Zoom & Spacing State
let timelineZoomScale = 2.8; // Pixels per minute
let timelineZoomMode = 'comfortable'; // 'comfortable', 'fit', or 'custom'
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomReset = document.getElementById('btn-zoom-reset');
const btnZoomFit = document.getElementById('btn-zoom-fit');

// Header Elements
const backendStatusPill = document.getElementById('backend-status');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIconDark = document.getElementById('theme-icon-dark');
const themeIconLight = document.getElementById('theme-icon-light');

// =============================================================================
// Helper Utilities
// =============================================================================
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function showFormError(message) {
  formErrorText.textContent = message;
  formError.classList.remove('hidden');
}

function clearFormError() {
  formError.classList.add('hidden');
  formErrorText.textContent = '';
}

function hideResults() {
  stopPlayback();
  resultsSection.classList.add('hidden');
  fallbackNotice.classList.add('hidden');
  highlightedTrainName = null;
  lastAllocationResult = null;
  currentPlaybackStep = 0;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =============================================================================
// Table Rendering & State Updates
// =============================================================================
function renderScheduledTrains() {
  trainCounterBadge.textContent = `${trainsList.length} ${trainsList.length === 1 ? 'Train' : 'Trains'}`;

  if (trainsList.length === 0) {
    trainsEmptyState.classList.remove('hidden');
    trainsTable.classList.add('hidden');
    trainsTableBody.innerHTML = '';
    return;
  }

  trainsEmptyState.classList.add('hidden');
  trainsTable.classList.remove('hidden');
  trainsTableBody.innerHTML = '';

  trainsList.forEach((train, index) => {
    const tr = document.createElement('tr');
    tr.dataset.trainName = train.name;
    if (highlightedTrainName === train.name) {
      tr.classList.add('is-highlighted');
    }

    tr.innerHTML = `
      <td style="font-weight: 600; color: var(--text-muted);">${index + 1}</td>
      <td style="font-weight: 600;">${escapeHtml(train.name)}</td>
      <td><span class="badge badge-neutral">${train.arrival}</span></td>
      <td><span class="badge badge-neutral">${train.departure}</span></td>
      <td style="text-align: center;">
        <button class="btn-delete-row" title="Remove train" data-index="${index}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </td>
    `;

    // Row click for cross-highlighting
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-row')) return;
      toggleTrainHighlight(train.name);
    });

    trainsTableBody.appendChild(tr);
  });

  // Attach delete handlers
  trainsTableBody.querySelectorAll('.btn-delete-row').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      deleteTrain(idx);
    });
  });
}

function deleteTrain(index) {
  trainsList.splice(index, 1);
  clearFormError();
  hideResults();
  renderScheduledTrains();
}

// =============================================================================
// Presets Generators (Best Case, Worst Case, Random Case)
// =============================================================================
function loadBestCase() {
  clearFormError();
  // Best Case: Sequential non-overlapping trains requiring only 1 platform
  trainsList = [];
  let curr = 360; // 06:00 AM
  for (let i = 1; i <= 10; i++) {
    const arr = curr;
    const dep = arr + 20; // 20 mins halt
    trainsList.push({
      name: `Exp ${1000 + i}`,
      arrival: minutesToTime(arr),
      departure: minutesToTime(dep)
    });
    curr = dep + 10; // 10 mins gap
  }
  renderScheduledTrains();
  hideResults();
}

function loadWorstCase() {
  clearFormError();
  // Worst Case: All trains arrive and halt simultaneously, requiring N platforms
  trainsList = [];
  for (let i = 1; i <= 8; i++) {
    const arr = 360 + (i * 2); // 06:02, 06:04, 06:06...
    const dep = 480;           // All depart at 08:00
    trainsList.push({
      name: `RushExp ${2000 + i}`,
      arrival: minutesToTime(arr),
      departure: minutesToTime(dep)
    });
  }
  renderScheduledTrains();
  hideResults();
}

function loadRandomCase(count) {
  clearFormError();
  trainsList = [];
  for (let i = 1; i <= count; i++) {
    // Random arrival between 05:00 (300) and 21:00 (1260)
    const arr = 300 + Math.floor(Math.random() * 960);
    const halt = 15 + Math.floor(Math.random() * 45); // 15 to 60 mins
    const dep = Math.min(arr + halt, 1439);
    trainsList.push({
      name: `Train ${3000 + i}`,
      arrival: minutesToTime(arr),
      departure: minutesToTime(dep)
    });
  }
  renderScheduledTrains();
  hideResults();
}

btnPresetBest.addEventListener('click', loadBestCase);
btnPresetWorst.addEventListener('click', loadWorstCase);
btnPresetRandom.addEventListener('click', () => {
  const count = parseInt(randomCountSelect.value, 10) || 10;
  loadRandomCase(count);
});

// =============================================================================
// Client-side Divide & Conquer (Merge Sort) + Greedy Engine (Fallback)
// =============================================================================
function clientMergeSort(arr, depth = 0, stepsRecorder = null) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);

  if (stepsRecorder && arr.length <= 50) {
    stepsRecorder.push({
      action: "split",
      depth: depth,
      original: arr.map(t => `${t.name} (${t.arrival})`),
      left: arr.slice(0, mid).map(t => `${t.name} (${t.arrival})`),
      right: arr.slice(mid).map(t => `${t.name} (${t.arrival})`)
    });
  }

  const left = clientMergeSort(arr.slice(0, mid), depth + 1, stepsRecorder);
  const right = clientMergeSort(arr.slice(mid), depth + 1, stepsRecorder);

  const merged = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (
      left[i].arrMins < right[j].arrMins ||
      (left[i].arrMins === right[j].arrMins && left[i].depMins <= right[j].depMins)
    ) {
      merged.append ? merged.append(left[i]) : merged.push(left[i]);
      i++;
    } else {
      merged.push(right[j]);
      j++;
    }
  }

  while (i < left.length) { merged.push(left[i]); i++; }
  while (j < right.length) { merged.push(right[j]); j++; }

  if (stepsRecorder && arr.length <= 50) {
    stepsRecorder.push({
      action: "merged",
      depth: depth,
      result: merged.map(t => `${t.name} (${t.arrival})`)
    });
  }

  return merged;
}

function runClientSideAllocation(trains) {
  // Step 1: Parse and Divide & Conquer Merge Sort from Scratch
  const parsed = trains.map(t => ({
    name: t.name,
    arrival: t.arrival,
    departure: t.departure,
    arrMins: timeToMinutes(t.arrival),
    depMins: timeToMinutes(t.departure),
    haltMins: timeToMinutes(t.departure) - timeToMinutes(t.arrival)
  }));

  const mergeSteps = [];
  const sorted = clientMergeSort(parsed, 0, mergeSteps);

  // Step 2: Greedy Platform Allocation
  const platformLastDep = [];
  const allocation = [];
  const playbackSteps = [];

  sorted.forEach((train, index) => {
    let assignedPlat = null;
    const currentPlatformStates = [];

    for (let p = 0; p < platformLastDep.length; p++) {
      const isFree = platformLastDep[p] <= train.arrMins;
      currentPlatformStates.push({
        platform: p + 1,
        lastDeparture: minutesToTime(platformLastDep[p]),
        isFree: isFree
      });
      if (isFree && assignedPlat === null) {
        assignedPlat = p + 1;
        platformLastDep[p] = train.depMins;
      }
    }

    let isNewPlatform = false;
    if (assignedPlat === null) {
      platformLastDep.push(train.depMins);
      assignedPlat = platformLastDep.length;
      isNewPlatform = true;
    }

    let explanation = "";
    let pseudoLine = 4;
    if (isNewPlatform) {
      pseudoLine = 5;
      explanation = currentPlatformStates.length === 0
        ? `Train ${train.name} arrives at ${train.arrival}. First train in schedule; opens Platform 1.`
        : `Train ${train.name} arrives at ${train.arrival}. All active platforms occupied. Opened new Platform ${assignedPlat}.`;
    } else {
      const prevDep = currentPlatformStates.find(p => p.platform === assignedPlat).lastDeparture;
      explanation = `Train ${train.name} arrives at ${train.arrival}. Platform ${assignedPlat} is free (last departure ${prevDep} <= ${train.arrival}). Reusing Platform ${assignedPlat}.`;
    }

    playbackSteps.push({
      step: index + 1,
      train: train.name,
      arrival: train.arrival,
      departure: train.departure,
      haltMins: train.haltMins,
      chosenPlatform: assignedPlat,
      isNewPlatform: isNewPlatform,
      platforms: currentPlatformStates,
      explanation: explanation,
      pseudoLine: pseudoLine
    });

    allocation.push({
      seq: index + 1,
      name: train.name,
      arrival: train.arrival,
      departure: train.departure,
      haltMins: train.haltMins,
      platform: assignedPlat
    });
  });

  const minPlatforms = platformLastDep.length;

  // Step 3: Two-Pointer Verification & Peak Interval
  const arrivals = parsed.map(t => t.arrMins).sort((a, b) => a - b);
  const departures = parsed.map(t => t.depMins).sort((a, b) => a - b);

  let i = 0, j = 0;
  let currentPlatforms = 0;
  let maxTwoPointer = 0;
  let peakStartMinute = arrivals[0];
  let peakEndMinute = departures[0];
  const n = parsed.length;

  while (i < n && j < n) {
    if (arrivals[i] < departures[j]) {
      currentPlatforms++;
      if (currentPlatforms > maxTwoPointer) {
        maxTwoPointer = currentPlatforms;
        peakStartMinute = arrivals[i];
        const depsAfter = departures.filter(d => d > peakStartMinute);
        peakEndMinute = depsAfter.length > 0 ? depsAfter[0] : departures[departures.length - 1];
      }
      i++;
    } else {
      currentPlatforms--;
      j++;
    }
  }

  const totalHalt = parsed.reduce((acc, t) => acc + t.haltMins, 0);
  const avgHalt = +(totalHalt / n).toFixed(1);

  const peakStartStr = minutesToTime(peakStartMinute);
  const peakEndStr = minutesToTime(peakEndMinute);

  return {
    minPlatforms: minPlatforms,
    totalTrains: n,
    avgHaltMinutes: avgHalt,
    peakTime: peakStartStr,
    peakStartTime: peakStartStr,
    peakEndTime: peakEndStr,
    peakTrains: maxTwoPointer,
    verification: {
      method: "Two-Pointer (Sorted Arrivals vs Departures)",
      result: maxTwoPointer,
      match: minPlatforms === maxTwoPointer
    },
    allocation: allocation,
    steps: playbackSteps,
    mergeSortSteps: mergeSteps
  };
}

// =============================================================================
// Run Allocation & Results Rendering
// =============================================================================
async function handleRunAllocation() {
  clearFormError();

  if (trainsList.length === 0) {
    showFormError("Please add at least one train or select a preset before running allocation.");
    return;
  }

  btnRunAllocation.disabled = true;
  btnRunAllocation.style.opacity = '0.7';

  let data = null;
  let usedFallback = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/api/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trains: trainsList }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      data = await response.json();
      updateBackendStatus(true);
    } else {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.error || `Server responded with status ${response.status}`);
    }
  } catch (err) {
    console.warn("Backend API unavailable or error; using in-browser JavaScript Divide & Conquer + Greedy engine.", err);
    updateBackendStatus(false);
    data = runClientSideAllocation(trainsList);
    usedFallback = true;
  } finally {
    btnRunAllocation.disabled = false;
    btnRunAllocation.style.opacity = '1';
  }

  if (data) {
    lastAllocationResult = data;
    renderResults(data, usedFallback);
  }
}

function renderResults(data, usedFallback) {
  // Update Fallback notice pill
  if (usedFallback) {
    fallbackNotice.classList.remove('hidden');
  } else {
    fallbackNotice.classList.add('hidden');
  }

  // Stat Cards
  statMinPlatforms.textContent = data.minPlatforms;
  statTotalTrains.textContent = data.totalTrains;
  statAvgHalt.textContent = `${data.avgHaltMinutes} min`;

  // Peak Indicator
  const peakStart = data.peakStartTime || data.peakTime;
  const peakEnd = data.peakEndTime;
  if (peakEnd && peakEnd !== peakStart) {
    peakTimeVal.textContent = `${peakStart} – ${peakEnd}`;
  } else {
    peakTimeVal.textContent = peakStart;
  }
  peakTrainsVal.textContent = data.peakTrains;

  // Verification Banner
  const isMatch = data.verification.match;
  verificationMatchTag.textContent = isMatch ? "Sorting method = Two-pointer method" : "Discrepancy Detected";
  verificationDetail.innerHTML = `
    Greedy Strategy: <strong>${data.minPlatforms}</strong> platform${data.minPlatforms === 1 ? '' : 's'} &bull;
    Two-Pointer Overlap Scan: <strong>${data.verification.result}</strong> platform${data.verification.result === 1 ? '' : 's'} &bull;
    ${isMatch ? '<strong style="color:var(--color-success);">Optimal result verified (100% Match)</strong>' : 'Check constraints'}
  `;

  // Render Allocation Table
  allocationTableBody.innerHTML = '';
  data.allocation.forEach(item => {
    const platMeta = getPlatformMeta(item.platform);
    const tr = document.createElement('tr');
    tr.dataset.trainName = item.name;

    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--text-muted);">${item.seq}</td>
      <td style="font-weight: 600;">${escapeHtml(item.name)}</td>
      <td><span class="badge badge-neutral">${item.arrival}</span></td>
      <td><span class="badge badge-neutral">${item.departure}</span></td>
      <td><span style="font-weight: 600;">${item.haltMins} mins</span></td>
      <td style="text-align: center;">
        <span class="platform-badge ${platMeta.class}">
          <span class="plat-dot"></span>
          Platform ${item.platform}
        </span>
      </td>
    `;

    tr.addEventListener('click', () => toggleTrainHighlight(item.name));
    allocationTableBody.appendChild(tr);
  });

  // Render Gantt Timeline with Peak Marker
  renderTimeline(data.allocation, data.minPlatforms, peakStart, data.peakTrains, peakEnd);

  // Render Merge Sort Visualization
  renderMergeSortView(data.mergeSortSteps);

  // Initialize Step-by-Step Playback
  initPlayback(data.steps);

  // Reveal results smoothly
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =============================================================================
// Platform Timeline (Gantt Chart with Dynamic Scale & Peak Window Overlay)
// =============================================================================
const timelineTooltipEl = document.getElementById('timeline-tooltip');

function showTimelineTooltip(e, train, platform) {
  if (!timelineTooltipEl) return;
  timelineTooltipEl.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
      <span>${escapeHtml(train.name)}</span>
      <span style="background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 4px; font-size: 0.7rem;">Platform ${platform}</span>
    </div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; font-size: 0.74rem;">
      <span style="opacity: 0.7;">Arrival:</span><strong>${train.arrival}</strong>
      <span style="opacity: 0.7;">Departure:</span><strong>${train.departure}</strong>
      <span style="opacity: 0.7;">Halt:</span><strong>${train.haltMins} mins</strong>
    </div>
  `;
  timelineTooltipEl.classList.remove('hidden');
  positionTimelineTooltip(e);
}

function positionTimelineTooltip(e) {
  if (!timelineTooltipEl) return;
  const offset = 14;
  let x = e.clientX + offset;
  let y = e.clientY + offset;
  const ttRect = timelineTooltipEl.getBoundingClientRect();
  if (x + ttRect.width > window.innerWidth - 10) {
    x = e.clientX - ttRect.width - offset;
  }
  if (y + ttRect.height > window.innerHeight - 10) {
    y = e.clientY - ttRect.height - offset;
  }
  timelineTooltipEl.style.left = `${x}px`;
  timelineTooltipEl.style.top = `${y}px`;
}

function hideTimelineTooltip() {
  if (timelineTooltipEl) timelineTooltipEl.classList.add('hidden');
}

function renderTimeline(allocation, numPlatforms, peakTimeStr, peakTrainsCount, peakEndTimeStr) {
  timelineLegend.innerHTML = '';
  timelineTracks.innerHTML = '';
  timelineAxis.innerHTML = '';

  if (!allocation || allocation.length === 0) return;

  // Render Legend
  for (let p = 1; p <= numPlatforms; p++) {
    const meta = getPlatformMeta(p);
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <span class="legend-color-dot" style="background-color: ${meta.hex};"></span>
      <span>Platform ${p}</span>
    `;
    timelineLegend.appendChild(legendItem);
  }

  // Calculate Time Boundaries
  let minMinutes = Math.min(...allocation.map(t => timeToMinutes(t.arrival)));
  let maxMinutes = Math.max(...allocation.map(t => timeToMinutes(t.departure)));

  // Round boundaries to clean half-hour intervals
  minMinutes = Math.floor(minMinutes / 30) * 30;
  maxMinutes = Math.ceil(maxMinutes / 30) * 30;
  if (maxMinutes <= minMinutes) maxMinutes = minMinutes + 60;

  const totalDuration = maxMinutes - minMinutes;

  // Dynamic Width Calculation based on Zoom Mode and Total Duration
  const containerWidth = timelineScrollContainer.clientWidth || 920;
  let targetTrackWidth;

  if (timelineZoomMode === 'fit') {
    targetTrackWidth = Math.max(780, containerWidth - 160);
  } else {
    // In comfortable mode, give ample space per minute (at least 2.8px/min)
    targetTrackWidth = Math.max(900, Math.round(totalDuration * timelineZoomScale));
  }

  timelineWrapper.style.width = `${targetTrackWidth + 140}px`;

  // Dynamic Collision-Free Time Ticks Calculation
  const minTickPixelGap = 85;
  const maxPossibleTicks = Math.max(3, Math.floor(targetTrackWidth / minTickPixelGap));
  const rawInterval = totalDuration / maxPossibleTicks;

  // Choose clean, human-friendly interval: 10m, 15m, 30m, 1h, 2h, 3h, 4h, 6h
  const cleanIntervals = [10, 15, 30, 60, 120, 180, 240, 360];
  let tickStep = cleanIntervals[cleanIntervals.length - 1];
  for (const interval of cleanIntervals) {
    if (interval >= rawInterval) {
      tickStep = interval;
      break;
    }
  }

  // Align start tick to multiple of tickStep
  const startTick = Math.floor(minMinutes / tickStep) * tickStep;

  // Render Time Axis
  const axisHeader = document.createElement('div');
  axisHeader.className = 'timeline-axis-header';
  axisHeader.textContent = 'Platform';
  timelineAxis.appendChild(axisHeader);

  const axisTrack = document.createElement('div');
  axisTrack.className = 'timeline-axis-track';
  timelineAxis.appendChild(axisTrack);

  for (let m = startTick; m <= maxMinutes; m += tickStep) {
    if (m < minMinutes) continue;
    const tickPercent = ((m - minMinutes) / totalDuration) * 100;
    const tick = document.createElement('div');
    tick.className = 'axis-tick';
    if (m === minMinutes) tick.classList.add('tick-first');
    else if (m === maxMinutes) tick.classList.add('tick-last');
    tick.style.left = `${tickPercent}%`;
    tick.textContent = minutesToTime(m);
    axisTrack.appendChild(tick);
  }

  // Group Trains by Platform
  const platformGroups = {};
  for (let p = 1; p <= numPlatforms; p++) {
    platformGroups[p] = [];
  }
  allocation.forEach(train => {
    if (!platformGroups[train.platform]) platformGroups[train.platform] = [];
    platformGroups[train.platform].push(train);
  });

  const peakStartMins = peakTimeStr ? timeToMinutes(peakTimeStr) : null;
  const peakEndMins = peakEndTimeStr ? timeToMinutes(peakEndTimeStr) : (peakStartMins ? peakStartMins + 1 : null);

  // Render Lanes
  for (let p = 1; p <= numPlatforms; p++) {
    const meta = getPlatformMeta(p);
    const lane = document.createElement('div');
    lane.className = 'timeline-lane';

    const header = document.createElement('div');
    header.className = 'lane-header';
    header.innerHTML = `
      <span class="plat-dot" style="background-color: ${meta.hex}; width:8px; height:8px; border-radius:50%;"></span>
      <span>Platform ${p}</span>
    `;

    const track = document.createElement('div');
    track.className = 'lane-track';

    // Draw clean vertical grid lines matching tickStep
    for (let m = startTick; m <= maxMinutes; m += tickStep) {
      if (m < minMinutes) continue;
      const gridPercent = ((m - minMinutes) / totalDuration) * 100;
      const gridline = document.createElement('div');
      gridline.className = 'timeline-gridline';
      gridline.style.left = `${gridPercent}%`;
      track.appendChild(gridline);
    }

    // Place train bars with smart labeling & progressive disclosure
    const trains = platformGroups[p] || [];
    trains.forEach(t => {
      const arr = timeToMinutes(t.arrival);
      const dep = timeToMinutes(t.departure);

      const leftPercent = ((arr - minMinutes) / totalDuration) * 100;
      const widthPercent = Math.max(((dep - arr) / totalDuration) * 100, 1.2);
      const barWidthPx = (widthPercent / 100) * targetTrackWidth;

      const bar = document.createElement('div');
      bar.className = `timeline-bar ${meta.barClass}`;
      bar.style.left = `${leftPercent}%`;
      bar.style.width = `${widthPercent}%`;
      bar.dataset.trainName = t.name;

      // Active in peak window check
      if (peakStartMins !== null && peakEndMins !== null) {
        if (arr <= peakEndMins && dep >= peakStartMins) {
          bar.classList.add('is-peak-active');
        }
      }

      // Responsive label based on actual pixel width
      let labelHtml = '';
      if (barWidthPx >= 140) {
        labelHtml = `<span>${escapeHtml(t.name)} (${t.arrival} - ${t.departure})</span>`;
      } else if (barWidthPx >= 80) {
        labelHtml = `<span>${escapeHtml(t.name)} (${t.arrival})</span>`;
      } else if (barWidthPx >= 44) {
        labelHtml = `<span>${escapeHtml(t.name)}</span>`;
      } else {
        const shortNum = t.name.split(' ')[0] || t.name;
        labelHtml = `<span>${escapeHtml(shortNum)}</span>`;
      }
      bar.innerHTML = labelHtml;

      // Interactive Tooltip listeners
      bar.addEventListener('mouseenter', (e) => showTimelineTooltip(e, t, p));
      bar.addEventListener('mousemove', (e) => positionTimelineTooltip(e));
      bar.addEventListener('mouseleave', hideTimelineTooltip);

      bar.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTrainHighlight(t.name);
      });

      track.appendChild(bar);
    });

    lane.appendChild(header);
    lane.appendChild(track);
    timelineTracks.appendChild(lane);
  }

  // Render High-Precision Overlay Track with Peak Interval Band & Line
  if (peakStartMins !== null && peakStartMins >= minMinutes && peakStartMins <= maxMinutes) {
    const overlay = document.createElement('div');
    overlay.className = 'timeline-overlay-track';

    const startPercent = Math.max(0, Math.min(100, ((peakStartMins - minMinutes) / totalDuration) * 100));
    const effectiveEndMins = (peakEndMins && peakEndMins > peakStartMins) ? peakEndMins : (peakStartMins + 10);
    const endPercent = Math.max(startPercent + 0.8, Math.min(100, ((effectiveEndMins - minMinutes) / totalDuration) * 100));
    const bandWidthPercent = endPercent - startPercent;

    // 1. Shaded Peak Period Band
    const peakBand = document.createElement('div');
    peakBand.className = 'peak-period-band';
    peakBand.style.left = `${startPercent}%`;
    peakBand.style.width = `${bandWidthPercent}%`;

    const intervalLabel = (peakEndTimeStr && peakEndTimeStr !== peakTimeStr)
      ? `${peakTimeStr} – ${peakEndTimeStr}`
      : peakTimeStr;

    peakBand.innerHTML = `
      <div class="peak-band-tag">
        <span>Peak Window: ${intervalLabel} (${peakTrainsCount} trains)</span>
      </div>
    `;
    overlay.appendChild(peakBand);

    // 2. High-precision vertical indicator line at peak moment
    const peakLine = document.createElement('div');
    peakLine.className = 'peak-time-line';
    peakLine.style.left = `${startPercent}%`;
    overlay.appendChild(peakLine);

    timelineTracks.appendChild(overlay);
  }
}

// Timeline Zoom Event Handlers
function updateTimelineZoom(mode, scaleDelta = null) {
  if (mode === 'comfortable') {
    timelineZoomMode = 'comfortable';
    timelineZoomScale = 2.8;
  } else if (mode === 'fit') {
    timelineZoomMode = 'fit';
  } else if (scaleDelta) {
    timelineZoomMode = 'custom';
    timelineZoomScale = Math.max(1.2, Math.min(6.0, +(timelineZoomScale * scaleDelta).toFixed(2)));
  }

  // Update zoom mode buttons state
  btnZoomReset.classList.toggle('active', timelineZoomMode === 'comfortable');
  btnZoomFit.classList.toggle('active', timelineZoomMode === 'fit');

  if (lastAllocationResult) {
    renderTimeline(
      lastAllocationResult.allocation,
      lastAllocationResult.minPlatforms,
      lastAllocationResult.peakStartTime || lastAllocationResult.peakTime,
      lastAllocationResult.peakTrains,
      lastAllocationResult.peakEndTime
    );
  }
}

if (btnZoomIn) {
  btnZoomIn.addEventListener('click', () => updateTimelineZoom('custom', 1.35));
}
if (btnZoomOut) {
  btnZoomOut.addEventListener('click', () => updateTimelineZoom('custom', 0.72));
}
if (btnZoomReset) {
  btnZoomReset.addEventListener('click', () => updateTimelineZoom('comfortable'));
}
if (btnZoomFit) {
  btnZoomFit.addEventListener('click', () => updateTimelineZoom('fit'));
}

// Smooth horizontal mouse wheel scroll on timeline
if (timelineScrollContainer) {
  timelineScrollContainer.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
      // If container can scroll horizontally
      if (timelineScrollContainer.scrollWidth > timelineScrollContainer.clientWidth) {
        timelineScrollContainer.scrollLeft += e.deltaY;
      }
    }
  }, { passive: true });
}

// =============================================================================
// Step-by-Step Playback Walkthrough & Pseudocode Tracer
// =============================================================================
function initPlayback(steps) {
  stopPlayback();
  currentPlaybackStep = 0;
  updatePlaybackUI(steps);
}

function updatePlaybackUI(steps) {
  if (!steps || steps.length === 0) {
    playbackStepCounter.textContent = "Step 0 of 0";
    playbackTrainTag.textContent = "No steps available";
    playbackDecisionTag.textContent = "-";
    playbackExplanationText.textContent = "Run allocation to begin step-by-step playback.";
    highlightPseudocodeLine(1);
    return;
  }

  playbackStepCounter.textContent = `Step ${currentPlaybackStep} of ${steps.length}`;

  // Disable / enable buttons
  btnPlaybackPrev.disabled = (currentPlaybackStep <= 0);
  btnPlaybackNext.disabled = (currentPlaybackStep >= steps.length);

  if (currentPlaybackStep === 0) {
    playbackTrainTag.textContent = "Start Walkthrough";
    playbackDecisionTag.className = "tag tag-neutral";
    playbackDecisionTag.textContent = "Ready";
    playbackExplanationText.innerHTML = "Click <strong>Next</strong> or <strong>Play</strong> to advance through the greedy platform allocation decisions.";
    highlightPseudocodeLine(1);

    // Show all bars normally
    document.querySelectorAll('.timeline-bar').forEach(b => {
      b.style.opacity = '1';
      b.classList.remove('is-revealed-step');
    });
    return;
  }

  const stepData = steps[currentPlaybackStep - 1];

  playbackTrainTag.textContent = stepData.train;
  if (stepData.isNewPlatform) {
    playbackDecisionTag.className = "tag tag-orange";
    playbackDecisionTag.textContent = `Opened Platform ${stepData.chosenPlatform}`;
  } else {
    playbackDecisionTag.className = "tag tag-teal";
    playbackDecisionTag.textContent = `Reused Platform ${stepData.chosenPlatform}`;
  }

  playbackExplanationText.textContent = stepData.explanation;

  // Highlight Pseudocode Line
  highlightPseudocodeLine(stepData.pseudoLine);

  // Cross-highlight active train in table & timeline
  toggleTrainHighlight(stepData.train, true);

  // Visually reveal bars up to this step
  const activeNames = new Set(steps.slice(0, currentPlaybackStep).map(s => s.train));
  document.querySelectorAll('.timeline-bar').forEach(b => {
    if (activeNames.has(b.dataset.trainName)) {
      b.style.opacity = '1';
      if (b.dataset.trainName === stepData.train) {
        b.classList.add('is-revealed-step');
      } else {
        b.classList.remove('is-revealed-step');
      }
    } else {
      b.style.opacity = '0.2';
    }
  });
}

function highlightPseudocodeLine(lineNum) {
  document.querySelectorAll('#pseudocode-lines .code-line').forEach(line => {
    if (parseInt(line.dataset.line, 10) === lineNum) {
      line.classList.add('active-line');
    } else {
      line.classList.remove('active-line');
    }
  });
}

function stopPlayback() {
  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
    playbackPlayIcon.classList.remove('hidden');
    playbackPauseIcon.classList.add('hidden');
    playbackPlayText.textContent = "Play";
  }
}

btnPlaybackNext.addEventListener('click', () => {
  stopPlayback();
  if (lastAllocationResult?.steps && currentPlaybackStep < lastAllocationResult.steps.length) {
    currentPlaybackStep++;
    updatePlaybackUI(lastAllocationResult.steps);
  }
});

btnPlaybackPrev.addEventListener('click', () => {
  stopPlayback();
  if (lastAllocationResult?.steps && currentPlaybackStep > 0) {
    currentPlaybackStep--;
    updatePlaybackUI(lastAllocationResult.steps);
  }
});

btnPlaybackReset.addEventListener('click', () => {
  stopPlayback();
  currentPlaybackStep = 0;
  if (lastAllocationResult?.steps) {
    updatePlaybackUI(lastAllocationResult.steps);
  }
});

btnPlaybackPlay.addEventListener('click', () => {
  if (playbackInterval) {
    stopPlayback();
  } else {
    if (!lastAllocationResult?.steps || lastAllocationResult.steps.length === 0) return;
    if (currentPlaybackStep >= lastAllocationResult.steps.length) {
      currentPlaybackStep = 0;
    }
    playbackPlayIcon.classList.add('hidden');
    playbackPauseIcon.classList.remove('hidden');
    playbackPlayText.textContent = "Pause";

    playbackInterval = setInterval(() => {
      if (currentPlaybackStep < lastAllocationResult.steps.length) {
        currentPlaybackStep++;
        updatePlaybackUI(lastAllocationResult.steps);
      } else {
        stopPlayback();
      }
    }, 1200);
  }
});

// =============================================================================
// Merge Sort View (Divide and Conquer Tree / Stages)
// =============================================================================
function renderMergeSortView(steps) {
  mergeSortTreeContainer.innerHTML = '';

  if (!steps || steps.length === 0) {
    mergeSortTreeContainer.innerHTML = `
      <p style="color:var(--text-muted); font-size:0.85rem; padding:12px;">
        Merge sort completed in O(n log n) time. Detailed tree visualization is available for schedules with up to 50 trains.
      </p>
    `;
    return;
  }

  steps.forEach((step, idx) => {
    const card = document.createElement('div');
    card.className = 'mergesort-stage-card';

    if (step.action === 'split') {
      card.innerHTML = `
        <div class="mergesort-stage-header">
          <span class="stage-badge badge-split">Divide: Halve Subarray</span>
          <span class="stage-depth">Depth Level ${step.depth}</span>
        </div>
        <div class="mergesort-arrays-row">
          <span class="array-chip">${escapeHtml(step.original.join(', '))}</span>
          <span class="arrow-symbol">&rarr;</span>
          <span class="array-chip" style="border-color:#3B82F6;">Left: [${escapeHtml(step.left.join(', '))}]</span>
          <span class="array-chip" style="border-color:#9333EA;">Right: [${escapeHtml(step.right.join(', '))}]</span>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="mergesort-stage-header">
          <span class="stage-badge badge-merge">Conquer &amp; Combine: Merged</span>
          <span class="stage-depth">Depth Level ${step.depth}</span>
        </div>
        <div class="mergesort-arrays-row">
          <span class="arrow-symbol">&darr;</span>
          <span class="array-chip" style="border-color:#10B981; font-weight:700;">Sorted: [${escapeHtml(step.result.join(', '))}]</span>
        </div>
      `;
    }

    mergeSortTreeContainer.appendChild(card);
  });
}

// Toggle Merge Sort Collapsible
mergeSortHeader.addEventListener('click', toggleMergeSortCollapse);
btnToggleMergeSort.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleMergeSortCollapse();
});

function toggleMergeSortCollapse() {
  const isHidden = mergeSortBody.classList.contains('hidden');
  if (isHidden) {
    mergeSortBody.classList.remove('hidden');
    btnToggleMergeSort.classList.add('expanded');
    mergeSortToggleLabel.textContent = "Hide Merge Sort Steps";
  } else {
    mergeSortBody.classList.add('hidden');
    btnToggleMergeSort.classList.remove('expanded');
    mergeSortToggleLabel.textContent = "Show Merge Sort Steps";
  }
}

// =============================================================================
// Cross-Highlighting Interaction
// =============================================================================
function toggleTrainHighlight(trainName, alwaysSelect = false) {
  if (!alwaysSelect && highlightedTrainName === trainName) {
    highlightedTrainName = null;
  } else {
    highlightedTrainName = trainName;
  }

  // Update Scheduled Train Rows
  document.querySelectorAll('#trains-table-body tr').forEach(row => {
    if (row.dataset.trainName === highlightedTrainName) {
      row.classList.add('is-highlighted');
    } else {
      row.classList.remove('is-highlighted');
    }
  });

  // Update Allocation Table Rows
  document.querySelectorAll('#allocation-table-body tr').forEach(row => {
    if (row.dataset.trainName === highlightedTrainName) {
      row.classList.add('is-highlighted');
    } else {
      row.classList.remove('is-highlighted');
    }
  });

  // Update Timeline Bars
  document.querySelectorAll('.timeline-bar').forEach(bar => {
    if (bar.dataset.trainName === highlightedTrainName) {
      bar.classList.add('is-highlighted');
    } else {
      bar.classList.remove('is-highlighted');
    }
  });
}

// =============================================================================
// Form Handlers & Sample Data
// =============================================================================
trainForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearFormError();

  const name = trainNameInput.value.trim();
  const arrival = trainArrivalInput.value;
  const departure = trainDepartureInput.value;

  if (!name) {
    showFormError("Please enter a train number or name (e.g. '12951 Rajdhani Exp').");
    trainNameInput.focus();
    return;
  }

  if (!arrival) {
    showFormError("Please select an arrival time.");
    trainArrivalInput.focus();
    return;
  }

  if (!departure) {
    showFormError("Please select a departure time.");
    trainDepartureInput.focus();
    return;
  }

  const arrMins = timeToMinutes(arrival);
  const depMins = timeToMinutes(departure);

  if (depMins <= arrMins) {
    showFormError(`Departure time (${departure}) must be strictly later than arrival time (${arrival}).`);
    trainDepartureInput.focus();
    return;
  }

  trainsList.push({ name, arrival, departure });
  renderScheduledTrains();
  hideResults();

  // Reset inputs
  trainNameInput.value = '';
  trainArrivalInput.value = '';
  trainDepartureInput.value = '';
  trainNameInput.focus();
});

btnLoadSample.addEventListener('click', () => {
  clearFormError();
  trainsList = JSON.parse(JSON.stringify(SAMPLE_TRAINS));
  renderScheduledTrains();
  hideResults();
});

btnClearAll.addEventListener('click', () => {
  clearFormError();
  trainsList = [];
  renderScheduledTrains();
  hideResults();
});

btnRunAllocation.addEventListener('click', handleRunAllocation);

// =============================================================================
// Theme Toggle & Preferences
// =============================================================================
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('railway-theme', theme);

  if (theme === 'dark') {
    themeIconDark.classList.add('hidden');
    themeIconLight.classList.remove('hidden');
    themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
  } else {
    themeIconDark.classList.remove('hidden');
    themeIconLight.classList.add('hidden');
    themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('railway-theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
});

// =============================================================================
// Backend Status Checker
// =============================================================================
function updateBackendStatus(online) {
  if (online) {
    backendStatusPill.className = 'status-pill online';
    backendStatusPill.querySelector('.status-text').textContent = 'Backend Online';
    backendStatusPill.title = 'Flask Backend connected via POST /api/allocate';
  } else {
    backendStatusPill.className = 'status-pill offline';
    backendStatusPill.querySelector('.status-text').textContent = 'Offline (JS Fallback)';
    backendStatusPill.title = 'Running in-browser JavaScript Divide & Conquer + Greedy Engine';
  }
}

async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      updateBackendStatus(true);
      return;
    }
  } catch (e) {
    // Offline
  }
  updateBackendStatus(false);
}

// =============================================================================
// Initialization
// =============================================================================
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderScheduledTrains();
  checkBackendHealth();
});
