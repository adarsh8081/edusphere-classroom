Get-ChildItem -Path apps, services, packages -Include *.ts,*.tsx -Recurse -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $original = $content
    
    $content = $content -replace "(?m)(from\s+)['\"](@shared/schema|(\.\./)+shared/schema)['\"]", "${1}'@edusphere/types'"
    $content = $content -replace "(?m)(from\s+)['\"](@shared/routes|(\.\./)+shared/routes)['\"]", "${1}'@edusphere/api-client'"
    
    if ($content -cne $original) {
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Updated $($_.FullName)"
    }
}
