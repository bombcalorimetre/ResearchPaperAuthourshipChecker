/**
 * db.js — JSON file read / write helpers
 * All data lives in /backend/data/*.json
 */
const fs   = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../data')

/** Read a JSON database file and return its parsed content */
function readDB(filename) {
  const filePath = path.join(DATA_DIR, filename)
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (err) {
    throw new Error(`Cannot read ${filename}: ${err.message}`)
  }
}

/** Write data back to a JSON database file */
function writeDB(filename, data) {
  const filePath = path.join(DATA_DIR, filename)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    throw new Error(`Cannot write ${filename}: ${err.message}`)
  }
}

/**
 * Generate the next sequential ID.
 * nextId('STU', ['STU001','STU003']) → 'STU004'
 */
function nextId(prefix, existingIds) {
  const nums = existingIds
    .map(id => parseInt(id.replace(prefix, ''), 10))
    .filter(n => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

module.exports = { readDB, writeDB, nextId }