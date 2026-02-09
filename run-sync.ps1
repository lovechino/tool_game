& node scripts/sync-assets.cjs *>&1 | Tee-Object -FilePath debug-output.log
Write-Host "`n=== Full output saved to debug-output.log ===`n"
Get-Content debug-output.log -Tail 100
