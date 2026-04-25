'use strict';

(function initResourceTrapSimulation(root) {
  var BASE_ARRIVALS = [0, 1, 2, 20, 21, 46, 70, 71, 72, 94];
  var BASE_WORK = [
    [8, 7, 7],
    [6, 9, 6],
    [13, 8, 10],
    [7, 6, 8],
    [9, 12, 7],
    [6, 7, 6],
    [11, 10, 13],
    [7, 6, 7],
    [8, 9, 6],
    [6, 8, 6]
  ];
  var JITTER = [-0.4, 0.2, 0.5, -0.1, 0.4, -0.5, 0.1, -0.2, 0.5, -0.3];
  var DEFAULT_CONTROLS = {
    demand: 1,
    burstiness: 1,
    taskVariation: 1,
    flowWipLimit: 3
  };
  var DEFAULT_CONFIG = buildConfig(DEFAULT_CONTROLS);

  function finiteNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function scaleArrivalTick(baseTick, burstiness) {
    var anchor = Math.round(baseTick / 24) * 24;
    var scaled = anchor + ((baseTick - anchor) * (2 - burstiness));
    return Math.max(0, Math.min(108, Math.round(scaled)));
  }

  function scaleWork(baseWork, taskVariation, index, stationIndex) {
    var mean = 8;
    var wave = Math.sin((index + 1) * (stationIndex + 2)) * 1.6;
    var varied = mean + ((baseWork - mean + wave) * taskVariation);
    return Math.max(3, Math.round(varied));
  }

  function buildArrivals(controlsInput) {
    var controls = normalizeControls(controlsInput);
    var demandCount = Math.max(6, Math.min(BASE_ARRIVALS.length, Math.round(6 + (controls.demand * 4))));
    return BASE_ARRIVALS.slice(0, demandCount).map(function buildTask(baseTick, index) {
      return {
        id: 't' + (index + 1),
        arrivalTick: scaleArrivalTick(baseTick, controls.burstiness),
        work: BASE_WORK[index].map(function buildWork(baseWork, stationIndex) {
          return scaleWork(baseWork, controls.taskVariation, index, stationIndex);
        }),
        jitter: JITTER[index] || 0
      };
    });
  }

  function normalizeControls(input) {
    var source = input || DEFAULT_CONTROLS;
    return {
      demand: clamp(finiteNumber(source.demand, DEFAULT_CONTROLS.demand), 0, 1),
      burstiness: clamp(finiteNumber(source.burstiness, DEFAULT_CONTROLS.burstiness), 0, 1),
      taskVariation: clamp(finiteNumber(source.taskVariation, DEFAULT_CONTROLS.taskVariation), 0, 1),
      flowWipLimit: Math.max(2, Math.min(6, Math.round(finiteNumber(source.flowWipLimit, DEFAULT_CONTROLS.flowWipLimit))))
    };
  }

  function buildConfig(controlsInput) {
    var controls = normalizeControls(controlsInput);
    return {
      ticks: 120,
      stationCount: 3,
      controls: controls,
      arrivals: buildArrivals(controls),
      policies: [
        {
          key: 'busy',
          label: 'Optimize for busy people',
          mood: 'push work in, keep stations occupied',
          wipLimit: 9,
          congestionPenalty: 0.22
        },
        {
          key: 'flow',
          label: 'Optimize for flow',
          mood: 'pull work when the system can absorb it',
          wipLimit: controls.flowWipLimit,
          congestionPenalty: 0.04
        }
      ]
    };
  }

  function cloneTask(task) {
    return {
      id: task.id,
      arrivalTick: task.arrivalTick,
      work: task.work.slice(),
      jitter: task.jitter || 0,
      station: 0,
      remaining: task.work[0],
      enteredTick: null,
      completedTick: null,
      state: 'not-arrived'
    };
  }

  function cloneConfig(config) {
    var source = config || DEFAULT_CONFIG;
    return {
      ticks: source.ticks || DEFAULT_CONFIG.ticks,
      stationCount: source.stationCount || DEFAULT_CONFIG.stationCount,
      controls: normalizeControls(source.controls || DEFAULT_CONTROLS),
      arrivals: (source.arrivals || DEFAULT_CONFIG.arrivals).map(cloneTask),
      policies: (source.policies || DEFAULT_CONFIG.policies).map(function clonePolicy(policy) {
        return {
          key: policy.key,
          label: policy.label,
          mood: policy.mood,
          wipLimit: policy.wipLimit,
          congestionPenalty: policy.congestionPenalty
        };
      })
    };
  }

  function countInSystem(tasks) {
    return tasks.filter(function inSystem(task) {
      return task.enteredTick !== null && task.completedTick === null;
    }).length;
  }

  function countWaiting(stations) {
    return stations.reduce(function sum(acc, station) {
      return acc + station.queue.length;
    }, 0);
  }

  function releaseArrivals(state, policy, tick) {
    state.tasks.forEach(function receive(task) {
      if (task.arrivalTick === tick) {
        task.state = 'intake';
        state.intake.push(task);
      }
    });

    while (state.intake.length > 0 && countInSystem(state.tasks) < policy.wipLimit) {
      var next = state.intake.shift();
      next.enteredTick = tick;
      next.state = 'queued';
      next.station = 0;
      next.remaining = next.work[0];
      state.stations[0].queue.push(next);
    }
  }

  function startIdleStations(state) {
    state.stations.forEach(function start(station) {
      if (!station.active && station.queue.length > 0) {
        station.active = station.queue.shift();
        station.active.state = 'active';
      }
    });
  }

  function processStations(state, policy, tick) {
    state.stations.forEach(function process(station, stationIndex) {
      if (!station.active) return;

      var congestion = station.queue.length;
      var serviceRate = 1 / (1 + (policy.congestionPenalty * congestion));
      station.active.remaining -= serviceRate;
      state.busyTicks[stationIndex] += 1;

      if (station.active.remaining > 0) return;

      var completed = station.active;
      station.active = null;
      if (stationIndex === state.stations.length - 1) {
        completed.state = 'done';
        completed.completedTick = tick + 1;
        return;
      }

      completed.station = stationIndex + 1;
      completed.remaining = completed.work[completed.station];
      completed.state = 'queued';
      state.stations[completed.station].queue.push(completed);
    });
  }

  function taskSnapshot(task, stations) {
    var state = task.state;
    var queueIndex = -1;
    if (state === 'queued') {
      queueIndex = stations[task.station].queue.findIndex(function same(queued) {
        return queued.id === task.id;
      });
    }
    var workSize = task.work[task.station] || task.work[task.work.length - 1];
    var progress = state === 'active' ? 1 - Math.max(0, task.remaining / workSize) : 0;
    return {
      id: task.id,
      state: state,
      station: task.station,
      queueIndex: queueIndex,
      progress: progress,
      jitter: task.jitter,
      arrivalTick: task.arrivalTick,
      enteredTick: task.enteredTick,
      completedTick: task.completedTick
    };
  }

  function snapshot(state, policy, tick, totalTicks) {
    var completed = state.tasks.filter(function done(task) {
      return task.completedTick !== null && task.completedTick <= tick;
    });
    var elapsed = Math.max(1, tick + 1);
    var arrivalsSoFar = state.tasks.filter(function arrived(task) {
      return task.arrivalTick <= tick;
    }).length;
    var leadTimes = completed.map(function leadTime(task) {
      return task.completedTick - task.arrivalTick;
    });
    var averageLeadTime = leadTimes.length > 0
      ? leadTimes.reduce(function sum(acc, value) { return acc + value; }, 0) / leadTimes.length
      : 0;

    return {
      tick: tick,
      progress: tick / Math.max(1, totalTicks - 1),
      policy: policy,
      metrics: {
        arrivals: arrivalsSoFar,
        arrivalRate: arrivalsSoFar / elapsed,
        done: completed.length,
        throughput: completed.length / elapsed,
        wip: countInSystem(state.tasks),
        waiting: countWaiting(state.stations),
        utilization: state.busyTicks.reduce(function sum(acc, value) { return acc + value; }, 0) / (elapsed * state.stations.length),
        averageLeadTime: averageLeadTime
      },
      stationBusy: state.stations.map(function busy(station) { return Boolean(station.active); }),
      tasks: state.tasks.map(function mapTask(task) { return taskSnapshot(task, state.stations); })
    };
  }

  function simulatePolicy(config, policy) {
    var state = {
      tasks: config.arrivals.map(cloneTask),
      intake: [],
      stations: Array.from({ length: config.stationCount }, function station() {
        return { active: null, queue: [] };
      }),
      busyTicks: Array.from({ length: config.stationCount }, function zero() { return 0; })
    };
    var snapshots = [];

    for (var tick = 0; tick < config.ticks; tick += 1) {
      releaseArrivals(state, policy, tick);
      startIdleStations(state);
      processStations(state, policy, tick);
      startIdleStations(state);
      snapshots.push(snapshot(state, policy, tick, config.ticks));
    }

    return {
      key: policy.key,
      policy: policy,
      snapshots: snapshots,
      finalMetrics: snapshots[snapshots.length - 1].metrics
    };
  }

  function simulateResourceTrap(configInput) {
    var config = configInput && configInput.arrivals ? cloneConfig(configInput) : buildConfig(configInput && configInput.controls ? configInput.controls : configInput);
    var lanes = config.policies.map(function simulate(policy) {
      return simulatePolicy(config, policy);
    });

    return {
      config: config,
      lanes: lanes,
      snapshotsAt: function snapshotsAt(progress) {
        var index = Math.max(0, Math.min(config.ticks - 1, Math.floor(progress * config.ticks)));
        return lanes.reduce(function collect(acc, lane) {
          acc[lane.key] = lane.snapshots[index];
          return acc;
        }, {});
      }
    };
  }

  var api = {
    DEFAULT_CONTROLS: DEFAULT_CONTROLS,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    buildConfig: buildConfig,
    simulateResourceTrap: simulateResourceTrap
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.ResourceTrapSimulation = api;
})(typeof window !== 'undefined' ? window : globalThis);
