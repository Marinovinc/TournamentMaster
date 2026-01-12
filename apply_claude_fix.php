<?php
/**
 * Fix per riordinare il codice in killOrphanNodeProcesses()
 * Il problema: $allNodePids viene usata prima di essere definita
 */

$file = __DIR__ . '/server_manager_api.php';
$content = file_get_contents($file);

// Backup
file_put_contents($file . '.BACKUP_' . date('Ymd_His'), $content);

$old = '    $keepPids = array_unique($keepPids);

    // Identifica processi Claude Code (da proteggere)
    $claudePids = [];
    foreach ($allNodePids as $pid) {
        if (isClaudeCodeProcess($pid)) {
            $claudePids[] = $pid;
        }
    }

    // Merge: tieni sia quelli delle porte che quelli di Claude
    $allKeepPids = array_unique(array_merge($keepPids, $claudePids));

    // Processa ogni node.exe trovato
    $allNodePids = [];
    foreach ($output as $line) {
        if (empty(trim($line)) || strpos($line, \'INFO:\') !== false) continue;

        $parts = str_getcsv($line);
        if (count($parts) >= 2 && is_numeric($parts[1])) {
            $allNodePids[] = (int)$parts[1];
        }
    }

    // Identifica orfani (non nella gerarchia delle porte attive)
    $orphanPids = array_diff($allNodePids, $allKeepPids);';

$new = '    $keepPids = array_unique($keepPids);

    // Processa ogni node.exe trovato - PRIMA di usare $allNodePids
    $allNodePids = [];
    foreach ($output as $line) {
        if (empty(trim($line)) || strpos($line, \'INFO:\') !== false) continue;

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
    $orphanPids = array_diff($allNodePids, $allKeepPids);';

if (strpos($content, $old) !== false) {
    $content = str_replace($old, $new, $content);
    file_put_contents($file, $content);
    echo "Fix applicato con successo!\n";
    echo "Backup creato: server_manager_api.php.BACKUP_" . date('Ymd_His') . "\n";
} else {
    echo "Pattern non trovato nel file.\n";
    // Debug: mostra parte del contenuto
    $pos = strpos($content, 'array_unique($keepPids)');
    if ($pos !== false) {
        echo "Trovato 'array_unique(\$keepPids)' a posizione $pos\n";
        echo "Contenuto attorno:\n";
        echo substr($content, $pos, 200) . "\n";
    }
}
