<?php
// ===== CONFIG: CHANGE THESE BEFORE GOING LIVE =====
const ADMIN_USER = 'atulya';
const ADMIN_PASS = 'admin';
const SECRET_KEY = 'change-this-to-a-long-random-string';
// ==================================================
function make_token() { $e = time() + 43200; return base64_encode("admin|$e|" . hash_hmac('sha256', "admin|$e", SECRET_KEY)); }
function check_token($t) {
  $p = explode('|', (string)base64_decode((string)$t));
  if (count($p) !== 3 || $p[0] !== 'admin' || (int)$p[1] < time()) return false;
  return hash_equals(hash_hmac('sha256', "admin|{$p[1]}", SECRET_KEY), $p[2]);
}
function admin_login($u, $p) {
  usleep(400000);
  $ok = hash_equals(ADMIN_USER, (string)$u) & hash_equals(ADMIN_PASS, (string)$p);
  return $ok ? make_token() : false;
}
// Standalone only: when included by api.php this block is skipped.
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json'); header('Cache-Control: no-store');
    $b = json_decode(file_get_contents('php://input'), true) ?: [];
    $t = admin_login($b['user'] ?? '', $b['pass'] ?? '');
    if (!$t) http_response_code(403);
    echo json_encode($t ? ['ok' => true, 'token' => $t] : ['ok' => false, 'error' => 'Wrong credentials']);
  } else {
    echo '<!doctype html><meta charset="utf-8"><title>Admin</title><body style="font-family:system-ui;padding:2rem"><h1>👑 A Vault admin</h1><p>Sign in on the <a href="index.html">main site</a> with your admin account.</p>';
  }
}
