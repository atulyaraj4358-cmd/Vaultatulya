<?php
require __DIR__ . '/admin.php';
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
const DB = __DIR__ . '/data.json';
function out($d, $c = 200) { http_response_code($c); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function blank() { return ['version' => 1, 'updated' => time(), 'files' => [], 'apps' => [], 'scores' => new stdClass, 'deleted' => []]; }
function db_write($d) {
  $t = DB . '.tmp'; file_put_contents($t, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)); rename($t, DB);
}
function db_read() {
  if (!file_exists(DB)) db_write(blank());
  $f = fopen(DB, 'r'); flock($f, LOCK_SH); $j = stream_get_contents($f); flock($f, LOCK_UN); fclose($f);
  $d = json_decode($j, true); return is_array($d) ? $d + blank() : blank();
}
function mutate($fn) {
  $l = fopen(DB . '.lock', 'c'); flock($l, LOCK_EX);
  $d = db_read(); $r = $fn($d);
  if ($r !== false) { $d['version']++; $d['updated'] = time(); db_write($d); }
  flock($l, LOCK_UN); fclose($l); return $d;
}
function rate() {
  $f = sys_get_temp_dir() . '/av_' . md5($_SERVER['REMOTE_ADDR'] ?? 'x'); $n = time();
  $a = json_decode((string)@file_get_contents($f), true) ?: [];
  $a = array_values(array_filter($a, function ($t) use ($n) { return $t > $n - 60; }));
  if (count($a) >= 60) out(['error' => 'Too many requests'], 429);
  $a[] = $n; @file_put_contents($f, json_encode($a));
}
function clean($i, $old = []) {
  $s = function ($v, $n) { return mb_substr(trim(strip_tags((string)$v)), 0, $n); };
  $type = strtoupper($s($i['type'] ?? 'APK', 5));
  if (!in_array($type, ['APK', 'PDF', 'ZIP', 'APP', 'GAME'])) $type = 'APK';
  $link = trim((string)($i['link'] ?? ''));
  if (!preg_match('~^https?://~i', $link) || !filter_var($link, FILTER_VALIDATE_URL)) out(['error' => 'Link must be a valid http/https URL'], 400);
  $title = $s($i['title'] ?? '', 80); if ($title === '') out(['error' => 'Title required'], 400);
  $tags = array_slice(array_filter(array_map(function ($t) use ($s) { return $s($t, 20); }, (array)($i['tags'] ?? []))), 0, 6);
  return array_merge($old, ['title' => $title, 'desc' => $s($i['desc'] ?? '', 300), 'type' => $type, 'size' => $s($i['size'] ?? '', 20),
    'link' => $link, 'icon' => $s($i['icon'] ?? '', 8) ?: ['APK' => '🤖', 'PDF' => '📄', 'ZIP' => '🗜️', 'APP' => '📱', 'GAME' => '🎮'][$type], 'tags' => array_values($tags)]);
}
$act = $_GET['action'] ?? 'list'; $post = $_SERVER['REQUEST_METHOD'] === 'POST';
$b = $post ? (json_decode(file_get_contents('php://input'), true) ?: []) : [];
if ($post) rate();
if (!$post) {
  $d = db_read();
  if ($act === 'version') out(['version' => $d['version']]);
  if ($act === 'list') out($d);
  if ($act === 'since') {
    $v = (int)($_GET['v'] ?? 0); $f = function ($a) use ($v) { return array_values(array_filter($a, function ($x) use ($v) { return ($x['v'] ?? 0) > $v; })); };
    out(['version' => $d['version'], 'files' => $f($d['files']), 'apps' => $f($d['apps']), 'deleted' => array_values(array_filter($d['deleted'], function ($x) use ($v) { return $x['v'] > $v; }))]);
  }
  out(['error' => 'Unknown action'], 404);
}
if ($act === 'login') { $t = admin_login($b['user'] ?? '', $b['pass'] ?? ''); $t ? out(['ok' => true, 'token' => $t]) : out(['ok' => false, 'error' => 'Wrong credentials'], 403); }
$kind = (($b['kind'] ?? 'files') === 'apps') ? 'apps' : 'files';
if ($act === 'increment_download') {
  mutate(function (&$d) use ($b, $kind) { foreach ($d[$kind] as &$x) if ($x['id'] === ($b['id'] ?? '')) { $x['downloads']++; $x['v'] = $d['version'] + 1; return true; } return false; });
  out(['ok' => true]);
}
if ($act === 'submit_score') {
  $g = preg_replace('/[^a-z0-9_]/', '', strtolower((string)($b['game'] ?? ''))); $n = mb_substr(strip_tags((string)($b['name'] ?? 'Player')), 0, 20); $sc = (int)($b['score'] ?? 0);
  if ($g === '') out(['error' => 'Bad game'], 400);
  mutate(function (&$d) use ($g, $n, $sc) { $s = (array)$d['scores']; $s[$g][] = ['name' => $n, 'score' => $sc]; usort($s[$g], function ($a, $c) { return $c['score'] - $a['score']; }); $s[$g] = array_slice($s[$g], 0, 10); $d['scores'] = $s; return true; });
  out(['ok' => true]);
}
$tok = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? ($b['token'] ?? '');
if (!check_token($tok)) out(['error' => 'Admin only'], 403);
if ($act === 'add') {
  $item = clean($b); $item += ['id' => bin2hex(random_bytes(6)), 'date' => date('c'), 'downloads' => 0, 'addedBy' => 'atulya'];
  $d = mutate(function (&$d) use (&$item, $kind) { $item['v'] = $d['version'] + 1; array_unshift($d[$kind], $item); });
  out(['ok' => true, 'item' => $item, 'version' => $d['version']]);
}
if ($act === 'edit') {
  $found = false;
  $d = mutate(function (&$d) use ($b, $kind, &$found) { foreach ($d[$kind] as &$x) if ($x['id'] === ($b['id'] ?? '')) { $x = clean($b, $x); $x['v'] = $d['version'] + 1; $found = true; return true; } return false; });
  $found ? out(['ok' => true, 'version' => $d['version']]) : out(['error' => 'Not found'], 404);
}
if ($act === 'delete') {
  $found = false;
  $d = mutate(function (&$d) use ($b, &$found) {
    foreach (['files', 'apps'] as $k) foreach ($d[$k] as $i => $x) if ($x['id'] === ($b['id'] ?? '')) {
      array_splice($d[$k], $i, 1); $d['deleted'][] = ['id' => $x['id'], 'v' => $d['version'] + 1]; $d['deleted'] = array_slice($d['deleted'], -200); $found = true; return true; }
    return false; });
  $found ? out(['ok' => true, 'version' => $d['version']]) : out(['error' => 'Not found'], 404);
}
out(['error' => 'Unknown action'], 404);
