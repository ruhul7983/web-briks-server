// utils/file.js
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

function urlToRelPath(value) {
  if (!value) return null;
  let pathname = value;
  if (/^https?:\/\//i.test(value)) {
    try { pathname = new URL(value).pathname; } catch (e) { /* ignore */ }
  }
  if (!pathname.startsWith('/')) pathname = '/' + pathname;
  return pathname;
}

function relToFsPath(relPath) {
  if (!relPath) return null;
  const trimmed = relPath.startsWith('/') ? relPath.slice(1) : relPath;
  return path.join(process.cwd(), trimmed);
}

function fileExists(value) {
  const rel = urlToRelPath(value);
  if (!rel) return false;
  return fs.existsSync(relToFsPath(rel));
}

function deleteFile(value) {
  try {
    const rel = urlToRelPath(value);
    if (!rel) return false;
    const abs = relToFsPath(rel);
    if (!fs.existsSync(abs)) {
      console.warn('deleteFile: not found', abs);
      return false;
    }
    fs.unlinkSync(abs);
    console.log('deleteFile: removed', abs);
    return true;
  } catch (err) {
    console.error('deleteFile error:', err);
    return false;
  }
}

module.exports = { urlToRelPath, relToFsPath, fileExists, deleteFile };
