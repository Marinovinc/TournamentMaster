<?php
/**
 * Script per applicare la fix a server_manager_api.php
 * Aggiunge le funzioni getProcessCommandLine e isClaudeCodeProcess
 * e aggiorna killOrphanNodeProcesses per proteggere Claude Code
 */

$file = 'D:/Dev/TournamentMaster/server_manager_api.php';
$backup = $file . '.bak_' . date('Ymd_His');

// Backup
copy($file, $backup);
echo "Backup creato: $backup\n";

// Leggi contenuto
$content = file_get_contents($file);

// Nuovo codice da inserire
$newFunctions = <<<'PHP'
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

PHP;

// Trova e sostituisci il commento della funzione originale
$oldComment = "/**\n * Trova e killa processi Node.js orfani (non nella gerarchia delle porte 3000/3001)\n * IMPORTANTE: Usa getProcessHierarchy per trovare TUTTA la gerarchia (genitori + figli)\n */";
$newComment = $newFunctions . "/**\n * Trova e killa processi Node.js orfani di TournamentMaster\n * IMPORTANTE: Esclude processi di Claude Code per non interrompere sessioni attive\n */";

if (strpos($content, $oldComment) !== false) {
    $content = str_replace($oldComment, $newComment, $content);
    echo "Step 1: Aggiunte nuove funzioni helper\n";
} else {
    echo "ERRORE: Non trovo il commento originale!\n";
    exit(1);
}

// Ora modifichiamo la logica dentro killOrphanNodeProcesses per usare le nuove funzioni
// Cerchiamo il blocco "Identifica orfani"
$oldOrphanBlock = "    // Identifica orfani (non nella gerarchia delle porte attive)\n    \$orphanPids = array_diff(\$allNodePids, \$keepPids);";
$newOrphanBlock = "    // Identifica processi Claude Code (da proteggere)\n    \$claudePids = [];\n    foreach (\$allNodePids as \$pid) {\n        if (isClaudeCodeProcess(\$pid)) {\n            \$claudePids[] = \$pid;\n        }\n    }\n\n    // Merge: tieni sia quelli delle porte che quelli di Claude\n    \$allKeepPids = array_unique(array_merge(\$keepPids, \$claudePids));\n\n    // Identifica orfani (non nella lista da tenere)\n    \$orphanPids = array_diff(\$allNodePids, \$allKeepPids);";

if (strpos($content, $oldOrphanBlock) !== false) {
    $content = str_replace($oldOrphanBlock, $newOrphanBlock, $content);
    echo "Step 2: Aggiornata logica identificazione orfani\n";
} else {
    echo "ERRORE: Non trovo il blocco orfani!\n";
    exit(1);
}

// Modifica il blocco foreach per registrare i processi mantenuti
$oldKeptBlock = "    foreach (\$allNodePids as \$pid) {\n        if (in_array(\$pid, \$keepPids)) {\n            \$reason = 'Nella gerarchia attiva';\n            if (\$pid === \$backendStatus['pid']) {\n                \$reason = 'Backend :3001 (listening)';\n            } elseif (\$pid === \$frontendStatus['pid']) {\n                \$reason = 'Frontend :3000 (listening)';\n            }\n            \$result['kept'][] = [\n                'pid' => \$pid,\n                'reason' => \$reason\n            ];\n        }\n    }";

$newKeptBlock = "    // Registra i processi mantenuti con la ragione\n    foreach (\$allNodePids as \$pid) {\n        if (in_array(\$pid, \$claudePids)) {\n            \$result['kept'][] = [\n                'pid' => \$pid,\n                'reason' => 'Claude Code (protetto)'\n            ];\n        } elseif (in_array(\$pid, \$keepPids)) {\n            \$reason = 'Nella gerarchia attiva';\n            if (\$pid === \$backendStatus['pid']) {\n                \$reason = 'Backend :3001 (listening)';\n            } elseif (\$pid === \$frontendStatus['pid']) {\n                \$reason = 'Frontend :3000 (listening)';\n            }\n            \$result['kept'][] = [\n                'pid' => \$pid,\n                'reason' => \$reason\n            ];\n        }\n    }";

if (strpos($content, $oldKeptBlock) !== false) {
    $content = str_replace($oldKeptBlock, $newKeptBlock, $content);
    echo "Step 3: Aggiornata registrazione processi mantenuti\n";
} else {
    echo "WARNING: Blocco kept non trovato esattamente, potrebbe essere gia' modificato\n";
}

// Modifica i messaggi finali per includere count Claude
$oldMsgBlock = '    $killedCount = count($result[\'killed\']);
    $keptCount = count($result[\'kept\']);
    $errorCount = count($result[\'errors\']);

    if ($killedCount > 0) {
        $result[\'message\'] = "Terminati {$killedCount} processi orfani, mantenuti {$keptCount} attivi";';

$newMsgBlock = '    $killedCount = count($result[\'killed\']);
    $keptCount = count($result[\'kept\']);
    $claudeCount = count($claudePids);
    $errorCount = count($result[\'errors\']);

    if ($killedCount > 0) {
        $result[\'message\'] = "Terminati {$killedCount} processi orfani, mantenuti {$keptCount} attivi" . ($claudeCount > 0 ? " (incl. {$claudeCount} Claude Code)" : "");';

if (strpos($content, $oldMsgBlock) !== false) {
    $content = str_replace($oldMsgBlock, $newMsgBlock, $content);
    echo "Step 4: Aggiornati messaggi con count Claude\n";
} else {
    echo "WARNING: Blocco messaggi non trovato esattamente\n";
}

// Aggiorna anche il messaggio "nessun orfano"
$oldNoOrphan = '$result[\'message\'] = "Nessun processo orfano trovato ({$keptCount} processi attivi mantenuti)";';
$newNoOrphan = '$result[\'message\'] = "Nessun processo orfano trovato ({$keptCount} processi attivi mantenuti" . ($claudeCount > 0 ? ", incl. {$claudeCount} Claude Code" : "") . ")";';

if (strpos($content, $oldNoOrphan) !== false) {
    $content = str_replace($oldNoOrphan, $newNoOrphan, $content);
    echo "Step 5: Aggiornato messaggio nessun orfano\n";
}

// Scrivi il file modificato
file_put_contents($file, $content);
echo "\nFix applicata con successo!\n";
echo "Backup disponibile in: $backup\n";
