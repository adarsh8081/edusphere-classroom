$baseUrl = "http://localhost:3000/api"
$classCode = "29405C"

function Join-Class {
    param([string]$email, [string]$password)
    
    # Login
    $loginUrl = "$baseUrl/login"
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session
        Write-Host "Logged in as $email"
    } catch {
        Write-Host "Failed to login $email : $($_.Exception.Message)"
        return
    }

    # Join Class
    $joinUrl = "$baseUrl/classes/join"
    $joinBody = @{
        classCode = $classCode
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $joinUrl -Method POST -Body $joinBody -ContentType "application/json" -WebSession $session
        Write-Host "Joined class successfully as $email"
    } catch {
        Write-Host "Failed to join class for $email : $($_.Exception.Message)"
        if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
    }
}

Join-Class -email "student1_uat@edusphere.test" -password "TeacherPass123"
Join-Class -email "student2_uat@edusphere.test" -password "TeacherPass123"
