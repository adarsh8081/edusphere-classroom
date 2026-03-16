$baseUrl = "http://localhost:3000/api"

function Login {
    param([string]$email, [string]$password)
    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session
    return $session
}

try {
    $teacherSession = Login -email "teacher_uat@edusphere.test" -password "TeacherPass123"
    Write-Host "Teacher logged in successfully."

    $classes = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET -WebSession $teacherSession
    $classId = ($classes | Where-Object { $_.classCode -eq "29405C" }).id
    Write-Host "Target Class ID: $classId"

    # Start Session
    $startBody = @{ classId = $classId } | ConvertTo-Json
    $sessionData = Invoke-RestMethod -Uri "$baseUrl/attendance/session" -Method POST -Body $startBody -ContentType "application/json" -WebSession $teacherSession
    $qrCode = $sessionData.qrCode
    Write-Host "Teacher started attendance session."
    Write-Host "Generated QR Code String: $qrCode"

    # Student Scan
    $studentSession = Login -email "student1_uat@edusphere.test" -password "TeacherPass123"
    Write-Host "Student 1 logged in successfully."

    $scanBody = @{
        qrCode = $qrCode
        latitude = 40.7128
        longitude = -74.0060
    } | ConvertTo-Json

    $scanResult = Invoke-RestMethod -Uri "$baseUrl/attendance/scan" -Method POST -Body $scanBody -ContentType "application/json" -WebSession $studentSession
    Write-Host "Student scan result: $($scanResult.message). XP Awarded: $($scanResult.xpAwarded)"

    # Get Stats
    $stats = Invoke-RestMethod -Uri "$baseUrl/attendance/session/$($sessionData.id)/stats" -Method GET -WebSession $teacherSession
    Write-Host "Attendance Stats retrieved for session:"
    Write-Host "Present: $($stats.presentCount)"

    Write-Host "Module 4 Attendance Management workflows completed successfully."
} catch {
    Write-Host "Error occurred: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
