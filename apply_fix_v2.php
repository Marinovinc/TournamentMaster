<?php
/**
 * Script per applicare la fix a server_manager_api.php (v2 - CRLF aware)
 */

$file = 'D:/Dev/TournamentMaster/server_manager_api.php';

// Leggi contenuto
$content = file_get_contents($file);

// Nuove funzioni da aggiungere PRIMA di killOrphanNodeProcesses
$newFunctions = '/**
 * Ottiene la command line di un processo dato il PID
 */
function getProcessCommandLine(int $pid): ?string {
    $output = [];
    exec("wmic process where ProcessId={$pid} get CommandLine /format:value 2>nul", $output);
    foreach ($output as $line) {
        if (preg_match(\'/CommandLine=(.+)/\', $line, $matches)) {
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

    $claudePatterns = [\'claude-code\', \'@anthropic-ai\', \'anthropic-ai\'];
    foreach ($claudePatterns as $pattern) {
        if (stripos($cmdLine, $pattern) !== false) {
            return true;
        }
    }
    return false;
}

';

// Pattern da cercare (regex per essere flessibile con whitespace)
$pattern = '/\/\*\*\s*\n\s*\*\s*Trova e killa processi Node\.js orfani[^\*]+\*\/\s*\nfunction killOrphanNodeProcesses/s';

if (preg_match($pattern, $content)) {
    // Trova la posizione esatta del commento
    preg_match('/\/\*\*\s*\r?\n\s*\*\s*Trova e killa processi Node\.js orfani/', $content, $matches, PREG_OFFSET_CAPTURE);

    if (!empty($matches)) {
        $pos = $matches[0][1];

        // Inserisci le nuove funzioni prima del commento
        $content = substr($content, 0, $pos) . $newFunctions . "/**\r\n * Trova e killa processi Node.js orfani di TournamentMaster\r\n * IMPORTANTE: Esclude processi di Claude Code per non interrompere sessioni attive\r\n */\r\nfunction killOrphanNodeProcesses";

        // Rimuovi il vecchio commento e dichiarazione
        $content = preg_replace('/function killOrphanNodeProcesses\/\*\*\s*\r?\n\s*\*\s*Trova e killa[^\*]+\*\/\s*\r?\nfunction killOrphanNodeProcesses/', 'function killOrphanNodeProcesses', $content);

        echo "Step 1: Aggiunte funzioni helper\n";
    }
} else {
    echo "Pattern commento non trovato, provo approccio alternativo...\n";
}

// Approccio alternativo: cerca direttamente il testo
$searchText = 'Trova e killa processi Node.js orfani (non nella gerarchia delle porte 3000/3001)';
if (strpos($content, $searchText) !== false) {
    // Sostituisci solo il commento
    $content = str_replace(
        $searchText,
        "Trova e killa processi Node.js orfani di TournamentMaster\r\n * IMPORTANTE: Esclude processi di Claude Code per non interrompere sessioni attive",
        $content
    );
    echo "Commento aggiornato\n";

    // Aggiungi le nuove funzioni prima della funzione
    $funcStart = "/**\r\n * Trova e killa processi Node.js orfani di TournamentMaster";
    $content = str_replace($funcStart, $newFunctions . $funcStart, $content);
    echo "Funzioni helper aggiunte\n";
}

// Ora modifichiamo la logica interna
// 1. Aggiungi identificazione Claude dopo array_unique($keepPids)
$after = '$keepPids = array_unique($keepPids);';
$claudeCheck = "\r\n\r\n    // Identifica processi Claude Code (da proteggere)\r\n    \$claudePids = [];\r\n    foreach (\$allNodePids as \$pid) {\r\n        if (isClaudeCodeProcess(\$pid)) {\r\n            \$claudePids[] = \$pid;\r\n        }\r\n    }\r\n\r\n    // Merge: tieni sia quelli delle porte che quelli di Claude\r\n    \$allKeepPids = array_unique(array_merge(\$keepPids, \$claudePids));";

if (strpos($content, $after) !== false && strpos($content, '$claudePids') === false) {
    $content = str_replace($after, $after . $claudeCheck, $content);
    echo "Aggiunta identificazione Claude Code\n";
}

// 2. Modifica orphanPids per usare allKeepPids
$oldOrphan = '$orphanPids = array_diff($allNodePids, $keepPids);';
$newOrphan = '$orphanPids = array_diff($allNodePids, $allKeepPids);';
if (strpos($content, $oldOrphan) !== false) {
    $content = str_replace($oldOrphan, $newOrphan, $content);
    echo "Aggiornato calcolo orfani\n";
}

// 3. Aggiungi check Claude nel foreach dei kept
$oldCheck = 'if (in_array($pid, $keepPids)) {';
$newCheck = "if (in_array(\$pid, \$claudePids)) {\r\n            \$result['kept'][] = [\r\n                'pid' => \$pid,\r\n                'reason' => 'Claude Code (protetto)'\r\n            ];\r\n        } elseif (in_array(\$pid, \$keepPids)) {";
if (strpos($content, $oldCheck) !== false && strpos($content, 'Claude Code (protetto)') === false) {
    $content = str_replace($oldCheck, $newCheck, $content);
    echo "Aggiunto check Claude nei kept\n";
}

// 4. Aggiungi $claudeCount
$oldCount = '$keptCount = count($result[\'kept\']);';
if (strpos($content, $oldCount) !== false && strpos($content, '$claudeCount') === false) {
    $content = str_replace($oldCount, $oldCount . "\r\n    \$claudeCount = count(\$claudePids);", $content);
    echo "Aggiunto claudeCount\n";
}

// 5. Aggiorna messaggio successo
$oldMsg = '"Terminati {$killedCount} processi orfani, mantenuti {$keptCount} attivi"';
$newMsg = '"Terminati {$killedCount} processi orfani, mantenuti {$keptCount} attivi" . ($claudeCount > 0 ? " (incl. {$claudeCount} Claude Code)" : "")';
if (strpos($content, $oldMsg) !== false) {
    $content = str_replace($oldMsg, $newMsg, $content);
    echo "Aggiornato messaggio successo\n";
}

// 6. Aggiorna messaggio nessun orfano
$oldNoOrphan = '"Nessun processo orfano trovato ({$keptCount} processi attivi mantenuti)"';
$newNoOrphan = '"Nessun processo orfano trovato ({$keptCount} processi attivi mantenuti" . ($claudeCount > 0 ? ", incl. {$claudeCount} Claude Code" : "") . ")"';
if (strpos($content, $oldNoOrphan) !== false) {
    $content = str_replace($oldNoOrphan, $newNoOrphan, $content);
    echo "Aggiornato messaggio nessun orfano\n";
}

// Scrivi file
file_put_contents($file, $content);
echo "\nFix applicata!\n";

// Verifica sintassi
exec('D:/xampp/php/php.exe -l "' . $file . '" 2>&1', $output, $code);
echo implode("\n", $output) . "\n";
