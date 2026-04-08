$prepareScript = Join-Path $PSScriptRoot "prepare-infinityfree.ps1"

if (-not (Test-Path $prepareScript)) {
    throw "Missing prepare script at $prepareScript"
}

& $prepareScript
