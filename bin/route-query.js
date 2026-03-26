#!/usr/bin/env node
'use strict';

/**
 * CLI script phan loai research query thanh internal hoac external.
 *
 * Nhan 1 argument (topic string), goi routeQuery() tu research-store.js,
 * in ket qua ra stdout ('internal' hoac 'external').
 *
 * Usage: node bin/route-query.js "ten file hoac thu vien"
 */

const { routeQuery } = require('./lib/research-store');

const topic = process.argv[2] || '';
const result = routeQuery(topic);
console.log(result);
