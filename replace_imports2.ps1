Get-ChildItem -Path apps, services, packages -Include *.ts,*.tsx -Recurse -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $original = $content
    
    $content = $content.Replace('from "@shared/schema"', 'from "@edusphere/types"')
    $content = $content.Replace("from '@shared/schema'", "from '@edusphere/types'")
    $content = $content.Replace('from "../../shared/schema"', 'from "@edusphere/types"')
    $content = $content.Replace("from '../../shared/schema'", "from '@edusphere/types'")
    $content = $content.Replace('from "../shared/schema"', 'from "@edusphere/types"')
    $content = $content.Replace("from '../shared/schema'", "from '@edusphere/types'")
    
    $content = $content.Replace('from "@shared/routes"', 'from "@edusphere/api-client"')
    $content = $content.Replace("from '@shared/routes'", "from '@edusphere/api-client'")
    $content = $content.Replace('from "../../shared/routes"', 'from "@edusphere/api-client"')
    $content = $content.Replace("from '../../shared/routes'", "from '@edusphere/api-client'")
    $content = $content.Replace('from "../shared/routes"', 'from "@edusphere/api-client"')
    $content = $content.Replace("from '../shared/routes'", "from '@edusphere/api-client'")
    
    $content = $content.Replace('import "@shared/schema"', 'import "@edusphere/types"')
    
    if ($content -cne $original) {
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Updated $($_.FullName)"
    }
}
