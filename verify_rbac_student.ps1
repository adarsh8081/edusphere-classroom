$baseUrl = "http://localhost:3000/api"

function Login {
    param([string]$email, [string]$password)
    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session
    return $session
}

try {
    $studentSession = Login -email "student1_uat@edusphere.test" -password "TeacherPass123"
    Write-Host "Student session established."

    # Get a class ID
    $classes = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET -WebSession $studentSession
    $classId = $classes[0].id
    Write-Host "Attempting to modify class: $classId"

    # Try PATCH
    try {
        $patchBody = @{ name = "Hacked Class Name" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/classes/$classId" -Method PATCH -Body $patchBody -ContentType "application/json" -WebSession $studentSession
        Write-Host "FAILURE: Student was able to PATCH class!" -ForegroundColor Red
    } catch {
        Write-Host "PATCH response: $($_.Exception.Message)"
        if ($_.Exception.Message -match "403") {
            Write-Host "SUCCESS: Student correctly received 403 Forbidden for PATCH." -ForegroundColor Green
        } else {
            Write-Host "FAILURE: Student received $($_.Exception.Message) instead of 403." -ForegroundColor Yellow
        }
    }

    # Try DELETE
    try {
        Invoke-RestMethod -Uri "$baseUrl/classes/$classId" -Method DELETE -WebSession $studentSession
        Write-Host "FAILURE: Student was able to DELETE class!" -ForegroundColor Red
    } catch {
        Write-Host "DELETE response: $($_.Exception.Message)"
        if ($_.Exception.Message -match "403") {
            Write-Host "SUCCESS: Student correctly received 403 Forbidden for DELETE." -ForegroundColor Green
        } else {
            Write-Host "FAILURE: Student received $($_.Exception.Message) instead of 403." -ForegroundColor Yellow
        }
    }

} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
