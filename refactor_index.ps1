$path = "c:\pages\yulipage\index.html"
$lines = Get-Content $path -Encoding UTF8
$output = @()
$lineNum = 1
foreach ($line in $lines) {
    if ($lineNum -eq 35) {
        $output += '<link rel="stylesheet" href="css/style.css">'
    }
    if ($lineNum -eq 442) {
        $output += '<script type="text/babel" data-presets="react,typescript" src="js/app.js"></script>'
    }
    
    if (($lineNum -ge 35 -and $lineNum -le 423) -or ($lineNum -ge 442 -and $lineNum -le 2153)) {
        # Skip
    } else {
        $output += $line
    }
    $lineNum++
}
$output | Set-Content $path -Encoding UTF8
