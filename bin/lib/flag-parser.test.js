"use strict";

const { parsePtesFlags } = require("./flag-parser");

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error("FAIL:", name);
    failed++;
  } else {
    console.log("ok:", name);
  }
}

const d = () => parsePtesFlags("");

assert(
  "no flags",
  d().tier === "none" &&
    !d().recon &&
    !d().poc &&
    !d().redteam &&
    d().tokenBudget === 0,
);

const r = parsePtesFlags("--recon");
assert(
  "--recon",
  r.tier === "standard" && r.recon && r.tokenBudget === 2000 && !r.redteam,
);

const l = parsePtesFlags("--recon-light");
assert(
  "--recon-light",
  l.tier === "free" && l.recon && l.tokenBudget === 0,
);

const f = parsePtesFlags("--recon-full");
assert(
  "--recon-full",
  f.tier === "deep" && f.recon && f.tokenBudget === 6000,
);

const rt = parsePtesFlags("--redteam");
assert(
  "--redteam",
  rt.tier === "redteam" &&
    rt.recon &&
    rt.poc &&
    rt.redteam &&
    rt.tokenBudget === 8000,
);

const poc = parsePtesFlags("--poc");
assert(
  "--poc only",
  poc.tier === "none" && poc.poc && !poc.recon && poc.tokenBudget === 0,
);

const pr = parsePtesFlags("--recon-light --recon-full --redteam");
assert("priority redteam", pr.tier === "redteam" && pr.redteam);

const combo = parsePtesFlags("--recon --poc");
assert(
  "--recon --poc",
  combo.recon && combo.poc && combo.tier === "standard",
);

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nflag-parser.test.js: all passed");
