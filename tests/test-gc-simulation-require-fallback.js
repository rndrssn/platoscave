'use strict';

/**
 * Verifies that gc-simulation.js resolves gc-simulation-core.js via the
 * cwd-based fallback path when the __dirname and ./ require attempts fail.
 *
 * This exercises the third try/catch block in resolveSimulationCore().
 */

const { spawnSync } = require('child_process');
const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testCwdFallbackResolvesModule() {
  const repoRoot = path.join(__dirname, '..');
  const simPath = JSON.stringify(path.join(repoRoot, 'modules', 'garbage-can', 'runtime', 'gc-simulation.js'));

  // Patch Module._load to intercept the first two gc-simulation-core.js require
  // calls (simulating __dirname and ./ path failures), then let the cwd-based
  // third attempt succeed.
  const script = `
    'use strict';
    const Module = require('module');
    const orig = Module._load;
    let gcCoreCallCount = 0;
    Module._load = function(req, parent, isMain) {
      if (req.includes('gc-simulation-core') && gcCoreCallCount < 2) {
        gcCoreCallCount++;
        const err = new Error('Simulated path failure #' + gcCoreCallCount);
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }
      return orig.call(this, req, parent, isMain);
    };
    const sim = require(${simPath});
    Module._load = orig;
    process.stdout.write(typeof sim.runGarbageCanSimulation + '\\n');
  `;

  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert(
    result.status === 0,
    'Process should exit cleanly.\nstderr: ' + result.stderr
  );
  assert(
    result.stdout.trim() === 'function',
    'runGarbageCanSimulation should be a function after cwd fallback resolved the module'
  );
}

function run() {
  testCwdFallbackResolvesModule();
  console.log('PASS: tests/test-gc-simulation-require-fallback.js');
}

run();
