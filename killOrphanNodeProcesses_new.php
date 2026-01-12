<?php
/**
 * NUOVE FUNZIONI DA AGGIUNGERE A server_manager_api.php
 * Posizione: PRIMA di killOrphanNodeProcesses()
 *
 * Queste funzioni proteggono i processi Claude Code dal kill
 */

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
 * FUNZIONE AGGIORNATA - killOrphanNodeProcesses()
 * Trova e killa processi Node.js orfani di TournamentMaster
 * IMPORTANTE: Esclude processi di Claude Code per non interrompere sessioni attive
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
        $backendHierarchy = getProcessHierarchy($backendStatus['pid'], $visited);
        $keepPids = array_merge($keepPids, $backendHierarchy);
    }

    $frontendStatus = isPortListening(FRONTEND_PORT);
    if ($frontendStatus['pid']) {
        $frontendHierarchy = getProcessHierarchy($frontendStatus['pid'], $visited);
        $keepPids = array_merge($keepPids, $frontendHierarchy);
    }

    $keepPids = array_unique($keepPids);

    // Processa ogni node.exe trovato
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

    // Identifica orfani (non nella lista da tenere)
    $orphanPids = array_diff($allNodePids, $allKeepPids);

    // Registra i processi mantenuti con la ragione
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

    // Killa solo gli orfani veri (non Claude, non porte attive)
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
