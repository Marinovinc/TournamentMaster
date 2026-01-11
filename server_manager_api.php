<?php
/**
 * TournamentMaster Server Manager API
 *
 * Gestisce start/stop e status di Backend (3001) e Frontend (3000)
 *
 * Endpoints:
 *   GET  ?action=status         - Stato entrambi i servizi
 *   POST ?action=start&service= - Avvia servizio (backend|frontend|all)
 *   POST ?action=stop&service=  - Ferma servizio (backend|frontend|all)
 *   GET  ?action=logs&service=  - Ultimi log del servizio
 */

// ============================================================================
// ROBUST ERROR HANDLING - Always return valid JSON
// ============================================================================
ob_start();

register_shutdown_function(function() {
    $error = error_get_last();
    $output = ob_get_clean();

    // Handle fatal PHP errors
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) {
            header('Content-Type: application/json');
        }
        echo json_encode([
            'success' => false,
            'error' => 'PHP Fatal Error',
            'message' => $error['message']
        ]);
        return;
    }

    // Handle empty response
    if (empty(trim($output))) {
        if (!headers_sent()) {
            header('Content-Type: application/json');
        }
        echo json_encode([
            'success' => false,
            'error' => 'Empty response',
            'message' => 'API returned no data'
        ]);
        return;
    }

    echo $output;
});

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    echo json_encode(['success' => true]);
    exit(0);
}

// Configurazione
define('TM_PATH', 'D:\\Dev\\TournamentMaster');
define('BACKEND_PORT', 3001);
define('FRONTEND_PORT', 3000);
define('SHUTDOWN_SECRET', 'tm-local-shutdown-2024');

/**
 * Verifica se una porta è in ascolto
 */
function isPortListening(int $port): array {
    $output = [];
    $pid = null;

    exec("netstat -ano | findstr \":{$port}.*LISTENING\"", $output);

    if (!empty($output)) {
        // Estrai PID
        if (preg_match('/LISTENING\s+(\d+)/', $output[0], $matches)) {
            $pid = (int)$matches[1];
        }
        return [
            'running' => true,
            'pid' => $pid,
            'port' => $port
        ];
    }

    return [
        'running' => false,
        'pid' => null,
        'port' => $port
    ];
}

/**
 * Forza la chiusura di tutti i processi su una porta specifica
 * Usa /T per terminare anche i processi figli (es. npm -> node)
 */
function forceKillPort(int $port): array {
    $status = isPortListening($port);
    $result = [
        'success' => false,
        'message' => '',
        'port' => $port
    ];

    if (!$status['running']) {
        $result['success'] = true;
        $result['message'] = "Porta {$port} già libera";
        return $result;
    }

    if ($status['pid']) {
        $output = [];
        // /F = Force, /T = Tree (termina anche processi figli)
        exec("taskkill /PID {$status['pid']} /F /T 2>&1", $output, $returnCode);

        // Attendi che la porta si liberi
        sleep(2);

        // Verifica che la porta sia effettivamente libera
        $newStatus = isPortListening($port);
        $result['success'] = !$newStatus['running'];
        $result['message'] = $result['success']
            ? "Porta {$port} liberata (PID: {$status['pid']})"
            : "Impossibile liberare porta {$port}: " . implode(' ', $output);
        $result['output'] = $output;
    }

    return $result;
}

/**
 * Ottiene info dettagliate sul processo
 */
function getProcessInfo(int $pid): ?array {
    if (!$pid) return null;

    $output = [];
    exec("tasklist /FI \"PID eq {$pid}\" /FO CSV /NH 2>nul", $output);

    if (!empty($output) && strpos($output[0], 'INFO:') === false) {
        $parts = str_getcsv($output[0]);
        return [
            'name' => $parts[0] ?? 'Unknown',
            'pid' => $pid,
            'memory' => $parts[4] ?? 'N/A'
        ];
    }

    return null;
}

/**
 * Trova il PID del processo genitore
 */
function getParentPid(int $pid): ?int {
    $output = [];
    exec("wmic process where ProcessId={$pid} get ParentProcessId /format:value 2>nul", $output);
    foreach ($output as $line) {
        if (preg_match('/ParentProcessId=(\d+)/', $line, $matches)) {
            return (int)$matches[1];
        }
    }
    return null;
}

/**
 * Trova tutti i PIDs nella gerarchia di un processo (genitori + figli ricorsivi)
 * Risale l'albero verso i genitori e scende verso i figli
 */
function getProcessHierarchy(int $pid, array &$visited = []): array {
    if (in_array($pid, $visited) || $pid <= 0) {
        return [];
    }
    $visited[] = $pid;
    $hierarchy = [$pid];

    // Trova genitori (risali fino a root o max 10 livelli)
    $currentPid = $pid;
    for ($i = 0; $i < 10; $i++) {
        $parentPid = getParentPid($currentPid);
        if (!$parentPid || $parentPid <= 4 || in_array($parentPid, $visited)) {
            break;
        }
        $hierarchy[] = $parentPid;
        $visited[] = $parentPid;
        $currentPid = $parentPid;
    }

    // Trova figli ricorsivamente
    $childOutput = [];
    exec("wmic process where ParentProcessId={$pid} get ProcessId /format:value 2>nul", $childOutput);
    foreach ($childOutput as $line) {
        if (preg_match('/ProcessId=(\d+)/', $line, $matches)) {
            $childPid = (int)$matches[1];
            if (!in_array($childPid, $visited)) {
                $hierarchy = array_merge($hierarchy, getProcessHierarchy($childPid, $visited));
            }
        }
    }

    return $hierarchy;
}

/**
 * Graceful shutdown via HTTP endpoint
 * Richiede che il backend abbia l'endpoint /api/shutdown
 */
function gracefulShutdown(int $port, string $secret): array {
    $result = [
        'success' => false,
        'message' => '',
        'method' => 'http'
    ];

    $ch = curl_init("http://localhost:{$port}/api/shutdown");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['secret' => $secret]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-Shutdown-Secret: ' . $secret
        ],
        CURLOPT_TIMEOUT => 5,
        CURLOPT_CONNECTTIMEOUT => 3
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($httpCode === 200) {
        $result['success'] = true;
        $result['message'] = 'Shutdown signal sent successfully';
        $result['response'] = json_decode($response, true);
    } elseif ($httpCode === 0) {
        $result['message'] = 'Connection failed: ' . ($error ?: 'server not responding');
    } else {
        $result['message'] = "HTTP {$httpCode}: " . ($response ?: 'unknown error');
    }

    return $result;
}

/**
 * Testa health endpoint del backend
 */
function checkBackendHealth(): array {
    $ch = curl_init('http://localhost:' . BACKEND_PORT . '/api/health');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 3,
        CURLOPT_CONNECTTIMEOUT => 2
    ]);

    $start = microtime(true);
    $response = curl_exec($ch);
    $elapsed = round((microtime(true) - $start) * 1000);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'healthy' => $httpCode === 200,
        'http_code' => $httpCode,
        'response_time_ms' => $elapsed,
        'response' => $response ? json_decode($response, true) : null
    ];
}

/**
 * Testa se frontend risponde
 */
function checkFrontendHealth(): array {
    $ch = curl_init('http://localhost:' . FRONTEND_PORT);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_NOBODY => true
    ]);

    $start = microtime(true);
    curl_exec($ch);
    $elapsed = round((microtime(true) - $start) * 1000);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'healthy' => $httpCode === 200,
        'http_code' => $httpCode,
        'response_time_ms' => $elapsed
    ];
}

/**
 * Avvia un servizio
 */
function startService(string $service, bool $force = false): array {
    $result = ['success' => false, 'message' => ''];

    switch ($service) {
        case 'backend':
            $status = isPortListening(BACKEND_PORT);
            if ($status['running']) {
                if (!$force) {
                    $result['message'] = 'Backend già in esecuzione sulla porta ' . BACKEND_PORT;
                    $result['success'] = true;
                    return $result;
                }
                // Force mode: chiudi processo esistente
                $killResult = forceKillPort(BACKEND_PORT);
                if (!$killResult['success']) {
                    $result['message'] = 'Impossibile fermare backend esistente: ' . $killResult['message'];
                    return $result;
                }
            }

            // Crea script VBS per avvio in background SENZA redirect output
            // IMPORTANTE: nodemon termina se l'output viene redirezionato a file!
            $vbsFile = sys_get_temp_dir() . '\\start_backend_' . time() . '.vbs';
            $backendPath = str_replace('/', '\\', TM_PATH) . '\\backend';
            $vbsContent = 'Set WshShell = CreateObject("WScript.Shell")' . "\r\n";
            $vbsContent .= 'WshShell.CurrentDirectory = "' . $backendPath . '"' . "\r\n";
            // Stile 6 = finestra minimizzata (nodemon richiede terminale)
            $vbsContent .= 'WshShell.Run "cmd /c npm run dev", 6, False' . "\r\n";
            file_put_contents($vbsFile, $vbsContent);

            // Esegui VBS
            pclose(popen("wscript //nologo \"{$vbsFile}\"", 'r'));

            // Cleanup VBS dopo un po'
            usleep(500000);
            @unlink($vbsFile);

            // Attendi un po' e verifica
            sleep(3);
            $status = isPortListening(BACKEND_PORT);
            $result['success'] = $status['running'];
            $result['message'] = $status['running']
                ? 'Backend avviato con successo sulla porta ' . BACKEND_PORT
                : 'Avvio backend in corso... controlla tra qualche secondo';
            break;

        case 'frontend':
            $status = isPortListening(FRONTEND_PORT);
            if ($status['running']) {
                if (!$force) {
                    $result['message'] = 'Frontend già in esecuzione sulla porta ' . FRONTEND_PORT;
                    $result['success'] = true;
                    return $result;
                }
                // Force mode: chiudi processo esistente
                $killResult = forceKillPort(FRONTEND_PORT);
                if (!$killResult['success']) {
                    $result['message'] = 'Impossibile fermare frontend esistente: ' . $killResult['message'];
                    return $result;
                }
            }

            // Crea script VBS per avvio frontend SENZA redirect output
            // Next.js potrebbe avere lo stesso problema di nodemon
            $vbsFile = sys_get_temp_dir() . '\\start_frontend_' . time() . '.vbs';
            $frontendPath = str_replace('/', '\\', TM_PATH) . '\\frontend';
            $vbsContent = 'Set WshShell = CreateObject("WScript.Shell")' . "\r\n";
            $vbsContent .= 'WshShell.CurrentDirectory = "' . $frontendPath . '"' . "\r\n";
            // Stile 6 = finestra minimizzata (Next.js richiede terminale)
            $vbsContent .= 'WshShell.Run "cmd /c npm run dev", 6, False' . "\r\n";
            file_put_contents($vbsFile, $vbsContent);

            // Esegui VBS
            pclose(popen("wscript //nologo \"{$vbsFile}\"", 'r'));

            // Cleanup VBS dopo un po'
            usleep(500000);
            @unlink($vbsFile);

            // Next.js impiega più tempo
            sleep(5);
            $status = isPortListening(FRONTEND_PORT);
            $result['success'] = $status['running'];
            $result['message'] = $status['running']
                ? 'Frontend avviato con successo sulla porta ' . FRONTEND_PORT
                : 'Avvio frontend in corso... Next.js impiega ~10-15 secondi';
            break;

        case 'all':
            $backendResult = startService('backend', $force);
            $frontendResult = startService('frontend', $force);
            $result['success'] = true;
            $result['message'] = "Backend: {$backendResult['message']} | Frontend: {$frontendResult['message']}";
            $result['details'] = [
                'backend' => $backendResult,
                'frontend' => $frontendResult
            ];
            break;

        default:
            $result['message'] = 'Servizio non valido. Usa: backend, frontend, all';
    }

    return $result;
}

/**
 * Esegue taskkill usando PowerShell per evitare blocchi Apache
 */
function safeTaskkill(int $pid): array {
    // Crea file temporaneo per output
    $outputFile = sys_get_temp_dir() . '\\taskkill_' . $pid . '_' . time() . '.txt';

    // Usa PowerShell per eseguire taskkill e catturare output
    $psCmd = "try { \$result = & taskkill /PID {$pid} /F /T 2>&1; \$result | Out-File -FilePath '{$outputFile}' -Encoding utf8 } catch { \$_.Exception.Message | Out-File -FilePath '{$outputFile}' -Encoding utf8 }";
    $cmd = "powershell -NoProfile -ExecutionPolicy Bypass -Command \"{$psCmd}\"";

    // Esegui e attendi
    pclose(popen($cmd, 'r'));

    // Attendi per completamento
    usleep(800000); // 0.8 secondi

    // Leggi output
    $rawOutput = '';
    if (file_exists($outputFile)) {
        $rawOutput = @file_get_contents($outputFile);
        @unlink($outputFile);
    }

    // Pulisci output - estrai solo messaggi rilevanti
    $cleanOutput = '';
    if (!empty($rawOutput)) {
        // Rimuovi BOM e caratteri speciali
        $rawOutput = preg_replace('/^\xEF\xBB\xBF/', '', $rawOutput);
        $rawOutput = str_replace(["\r\n", "\r"], "\n", $rawOutput);

        // Estrai solo i messaggi di errore principali
        if (preg_match('/Accesso negato/i', $rawOutput)) {
            $cleanOutput = 'Accesso negato - il server web non ha i permessi per terminare questo processo. Avvia XAMPP come Amministratore o usa il Task Manager.';
        } elseif (preg_match('/SUCCESS|Operazione completata/i', $rawOutput)) {
            $cleanOutput = 'Processo terminato con successo';
        } else {
            // Estrai solo le righe significative
            $lines = array_filter(explode("\n", trim($rawOutput)), function($line) {
                $line = trim($line);
                return !empty($line) && !preg_match('/^\+|^In riga|^CategoryInfo|^FullyQualifiedErrorId/', $line);
            });
            $cleanOutput = implode(' ', array_slice($lines, 0, 3));
        }
    }

    return [
        'output' => $cleanOutput ? [$cleanOutput] : [],
        'raw' => $rawOutput,
        'clean' => $cleanOutput
    ];
}

/**
 * Ferma un servizio
 */
function stopService(string $service): array {
    $result = ['success' => false, 'message' => ''];

    switch ($service) {
        case 'backend':
            $status = isPortListening(BACKEND_PORT);
            if (!$status['running']) {
                $result['message'] = 'Backend non in esecuzione';
                $result['success'] = true;
                return $result;
            }

            // Prima prova graceful shutdown via HTTP (non richiede privilegi admin)
            $shutdownResult = gracefulShutdown(BACKEND_PORT, SHUTDOWN_SECRET);

            if ($shutdownResult['success']) {
                // Attendi che il processo termini
                sleep(2);
                $newStatus = isPortListening(BACKEND_PORT);
                $result['success'] = !$newStatus['running'];
                $result['message'] = $result['success']
                    ? "Backend fermato gracefully"
                    : "Shutdown inviato ma processo ancora attivo";
                $result['method'] = 'http';
            } else {
                // Fallback a taskkill se HTTP fallisce
                if ($status['pid']) {
                    $killResult = safeTaskkill($status['pid']);
                    usleep(500000);
                    $newStatus = isPortListening(BACKEND_PORT);
                    $result['success'] = !$newStatus['running'];
                    $result['message'] = $result['success']
                        ? "Backend fermato (PID: {$status['pid']})"
                        : ($killResult['clean'] ?: "Errore arresto backend (PID: {$status['pid']})");
                    $result['method'] = 'taskkill';
                    $result['http_error'] = $shutdownResult['message'];
                }
            }
            break;

        case 'frontend':
            $status = isPortListening(FRONTEND_PORT);
            if (!$status['running']) {
                $result['message'] = 'Frontend non in esecuzione';
                $result['success'] = true;
                return $result;
            }

            // Prima prova graceful shutdown via HTTP (non richiede privilegi admin)
            $shutdownResult = gracefulShutdown(FRONTEND_PORT, SHUTDOWN_SECRET);

            if ($shutdownResult['success']) {
                // Attendi che il processo termini
                sleep(2);
                $newStatus = isPortListening(FRONTEND_PORT);
                $result['success'] = !$newStatus['running'];
                $result['message'] = $result['success']
                    ? "Frontend fermato gracefully"
                    : "Shutdown inviato ma processo ancora attivo";
                $result['method'] = 'http';
            } else {
                // Fallback a taskkill se HTTP fallisce
                if ($status['pid']) {
                    $killResult = safeTaskkill($status['pid']);
                    usleep(500000);
                    $newStatus = isPortListening(FRONTEND_PORT);
                    $result['success'] = !$newStatus['running'];
                    $result['message'] = $result['success']
                        ? "Frontend fermato (PID: {$status['pid']})"
                        : ($killResult['clean'] ?: "Errore arresto frontend (PID: {$status['pid']})");
                    $result['method'] = 'taskkill';
                    $result['http_error'] = $shutdownResult['message'];
                }
            }
            break;

        case 'all':
            $backendResult = stopService('backend');
            $frontendResult = stopService('frontend');
            // Success is true if at least one was stopped or both were already stopped
            $result['success'] = $backendResult['success'] || $frontendResult['success'];
            $result['message'] = "Backend: {$backendResult['message']} | Frontend: {$frontendResult['message']}";
            $result['details'] = [
                'backend' => $backendResult,
                'frontend' => $frontendResult
            ];
            break;

        default:
            $result['message'] = 'Servizio non valido. Usa: backend, frontend, all';
    }

    return $result;
}

/**
 * Legge ultimi log
 */
function getLogs(string $service, int $lines = 50): array {
    $logFile = '';

    switch ($service) {
        case 'backend':
            $logFile = TM_PATH . '\\backend\\logs\\backend.log';
            break;
        case 'frontend':
            $logFile = TM_PATH . '\\frontend\\logs\\frontend.log';
            break;
        default:
            return ['error' => 'Servizio non valido', 'success' => false];
    }

    if (!file_exists($logFile)) {
        return ['logs' => '', 'message' => 'File log non trovato', 'success' => true];
    }

    // Leggi ultime N righe
    $content = file_get_contents($logFile);
    $allLines = explode("\n", $content);
    $lastLines = array_slice($allLines, -$lines);

    return [
        'success' => true,
        'logs' => implode("\n", $lastLines),
        'file' => $logFile,
        'total_lines' => count($allLines)
    ];
}

/**
 * Ottiene la command line di un processo dato il PID
 */
function getProcessCommandLine(int $pid): ?string {
    $output = [];
    exec("wmic process where ProcessId={$pid} get CommandLine /format:value 2>nul", $output);
    foreach ($output as $line) {
        if (preg_match('/CommandLine=(.+)/', $line, $matches)) {
            return trim($matches[1]);
        }
    }
    return null;
}

/**
 * Verifica se un processo appartiene a Claude Code
 */
function isClaudeCodeProcess(int $pid): bool {
    $cmdLine = getProcessCommandLine($pid);
    if (!$cmdLine) return false;

    $claudePatterns = ['claude-code', '@anthropic-ai', 'anthropic-ai'];
    foreach ($claudePatterns as $pattern) {
        if (stripos($cmdLine, $pattern) !== false) {
            return true;
        }
    }
    return false;
}

/**
 * Trova e killa processi Node.js orfani di TournamentMaster
 * IMPORTANTE: Esclude processi di Claude Code per non interrompere sessioni attive
 * IMPORTANTE: Usa getProcessHierarchy per trovare TUTTA la gerarchia (genitori + figli)
 */
function killOrphanNodeProcesses(): array {
    $result = [
        'success' => true,
        'killed' => [],
        'kept' => [],
        'errors' => [],
        'message' => ''
    ];

    // Trova tutti i processi node.exe
    $output = [];
    exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH 2>nul', $output);

    if (empty($output) || (count($output) === 1 && strpos($output[0], 'INFO:') !== false)) {
        $result['message'] = 'Nessun processo Node.js trovato';
        return $result;
    }

    // Ottieni PIDs che usano le porte 3000 e 3001 (da tenere)
    $keepPids = [];
    $visited = [];

    $backendStatus = isPortListening(BACKEND_PORT);
    if ($backendStatus['pid']) {
        // Trova TUTTA la gerarchia (genitori + figli) del processo backend
        $backendHierarchy = getProcessHierarchy($backendStatus['pid'], $visited);
        $keepPids = array_merge($keepPids, $backendHierarchy);
    }

    $frontendStatus = isPortListening(FRONTEND_PORT);
    if ($frontendStatus['pid']) {
        // Trova TUTTA la gerarchia (genitori + figli) del processo frontend
        $frontendHierarchy = getProcessHierarchy($frontendStatus['pid'], $visited);
        $keepPids = array_merge($keepPids, $frontendHierarchy);
    }

    $keepPids = array_unique($keepPids);

    // Processa ogni node.exe trovato - PRIMA di usare $allNodePids
    $allNodePids = [];
    foreach ($output as $line) {
        if (empty(trim($line)) || strpos($line, 'INFO:') !== false) continue;

        $parts = str_getcsv($line);
        if (count($parts) >= 2 && is_numeric($parts[1])) {
            $allNodePids[] = (int)$parts[1];
        }
    }

    // Identifica processi Claude Code (da proteggere)
    $claudePids = [];
    foreach ($allNodePids as $pid) {
        if (isClaudeCodeProcess($pid)) {
            $claudePids[] = $pid;
        }
    }

    // Merge: tieni sia quelli delle porte che quelli di Claude
    $allKeepPids = array_unique(array_merge($keepPids, $claudePids));

    // Identifica orfani (non nella gerarchia delle porte attive E non Claude)
    $orphanPids = array_diff($allNodePids, $allKeepPids);

    foreach ($allNodePids as $pid) {
        if (in_array($pid, $claudePids)) {
            $result['kept'][] = [
                'pid' => $pid,
                'reason' => 'Claude Code (protetto)'
            ];
        } elseif (in_array($pid, $keepPids)) {
            $reason = 'Nella gerarchia attiva';
            if ($pid === $backendStatus['pid']) {
                $reason = 'Backend :3001 (listening)';
            } elseif ($pid === $frontendStatus['pid']) {
                $reason = 'Frontend :3000 (listening)';
            }
            $result['kept'][] = [
                'pid' => $pid,
                'reason' => $reason
            ];
        }
    }

    // Killa gli orfani
    foreach ($orphanPids as $pid) {
        $killOutput = [];
        exec("taskkill /PID {$pid} /F 2>&1", $killOutput, $returnCode);

        if ($returnCode === 0) {
            $result['killed'][] = ['pid' => $pid, 'status' => 'terminated'];
        } else {
            $errorMsg = implode(' ', $killOutput);
            if (stripos($errorMsg, 'Accesso negato') !== false) {
                $result['errors'][] = ['pid' => $pid, 'error' => 'Accesso negato - avvia XAMPP come Admin'];
            } else {
                $result['errors'][] = ['pid' => $pid, 'error' => $errorMsg];
            }
        }
    }

    $killedCount = count($result['killed']);
    $keptCount = count($result['kept']);
    $claudeCount = count($claudePids);
    $errorCount = count($result['errors']);

    if ($killedCount > 0) {
        $result['message'] = "Terminati {$killedCount} processi orfani, mantenuti {$keptCount} attivi" . ($claudeCount > 0 ? " (incl. {$claudeCount} Claude Code)" : "");
    } elseif ($errorCount > 0) {
        $result['message'] = "Errori nel terminare {$errorCount} processi (permessi insufficienti?)";
        $result['success'] = false;
    } else {
        $result['message'] = "Nessun processo orfano trovato ({$keptCount} processi attivi mantenuti" . ($claudeCount > 0 ? ", incl. {$claudeCount} Claude Code" : "") . ")";
    }

    return $result;
}

/**
 * Ottiene stato completo
 */
function getFullStatus(): array {
    $backend = isPortListening(BACKEND_PORT);
    $frontend = isPortListening(FRONTEND_PORT);

    $status = [
        'success' => true,
        'timestamp' => date('c'),
        'backend' => [
            'port' => BACKEND_PORT,
            'running' => $backend['running'],
            'pid' => $backend['pid'],
            'process' => $backend['pid'] ? getProcessInfo($backend['pid']) : null,
            'health' => $backend['running'] ? checkBackendHealth() : null,
            'url' => 'http://localhost:' . BACKEND_PORT,
            'health_endpoint' => 'http://localhost:' . BACKEND_PORT . '/api/health'
        ],
        'frontend' => [
            'port' => FRONTEND_PORT,
            'running' => $frontend['running'],
            'pid' => $frontend['pid'],
            'process' => $frontend['pid'] ? getProcessInfo($frontend['pid']) : null,
            'health' => $frontend['running'] ? checkFrontendHealth() : null,
            'url' => 'http://localhost:' . FRONTEND_PORT
        ],
        'paths' => [
            'base' => TM_PATH,
            'backend_logs' => TM_PATH . '\\backend\\logs\\backend.log',
            'frontend_logs' => TM_PATH . '\\frontend\\logs\\frontend.log'
        ]
    ];

    return $status;
}

// ============================================================================
// ROUTER
// ============================================================================

$action = $_GET['action'] ?? $_POST['action'] ?? 'status';
$service = $_GET['service'] ?? $_POST['service'] ?? '';

try {
    switch ($action) {
        case 'status':
            echo json_encode(getFullStatus(), JSON_PRETTY_PRINT);
            break;

        case 'start':
            if (empty($service)) {
                echo json_encode(['success' => false, 'error' => 'Parametro service richiesto (backend|frontend|all)']);
                break;
            }
            $force = isset($_GET['force']) || isset($_POST['force']);
            echo json_encode(startService($service, $force), JSON_PRETTY_PRINT);
            break;

        case 'stop':
            if (empty($service)) {
                echo json_encode(['success' => false, 'error' => 'Parametro service richiesto (backend|frontend|all)']);
                break;
            }
            echo json_encode(stopService($service), JSON_PRETTY_PRINT);
            break;

        case 'logs':
            if (empty($service)) {
                echo json_encode(['success' => false, 'error' => 'Parametro service richiesto (backend|frontend)']);
                break;
            }
            $lines = (int)($_GET['lines'] ?? 50);
            echo json_encode(getLogs($service, $lines), JSON_PRETTY_PRINT);
            break;

        case 'restart':
            if (empty($service)) {
                echo json_encode(['success' => false, 'error' => 'Parametro service richiesto (backend|frontend|all)']);
                break;
            }
            $stopResult = stopService($service);
            sleep(2);
            $startResult = startService($service, true); // force=true per chiudere eventuali processi rimasti
            echo json_encode([
                'success' => $startResult['success'],
                'message' => "Restart completato",
                'stop' => $stopResult,
                'start' => $startResult
            ], JSON_PRETTY_PRINT);
            break;

        case 'kill_orphans':
            echo json_encode(killOrphanNodeProcesses(), JSON_PRETTY_PRINT);
            break;

        default:
            echo json_encode([
                'success' => false,
                'error' => 'Azione non valida',
                'available_actions' => ['status', 'start', 'stop', 'restart', 'logs', 'kill_orphans'],
                'usage' => [
                    'GET ?action=status' => 'Stato servizi',
                    'POST ?action=start&service=backend|frontend|all' => 'Avvia servizio',
                    'POST ?action=stop&service=backend|frontend|all' => 'Ferma servizio',
                    'POST ?action=restart&service=backend|frontend|all' => 'Riavvia servizio',
                    'GET ?action=logs&service=backend|frontend&lines=50' => 'Leggi log',
                    'POST ?action=kill_orphans' => 'Termina processi Node.js orfani'
                ]
            ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Errore interno',
        'message' => $e->getMessage()
    ]);
}
