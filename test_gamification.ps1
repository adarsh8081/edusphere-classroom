$baseUrl = "http://localhost:3000/api"

function Login {
    param([string]$email, [string]$password)
    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session
    return $session
}

try {
    # Login as Student
    $studentSession = Login -email "student1_uat@edusphere.test" -password "TeacherPass123"
    
    # 1. Check Personal Gamification Stats
    $meStats = Invoke-RestMethod -Uri "$baseUrl/gamification/me" -Method GET -WebSession $studentSession
    Write-Host "Student Personal XP: $($meStats.totalXp)"
    Write-Host "Student Level: $($meStats.level)"

    # 2. Check Class Leaderboard
    # Need classId for leaderboard
    $teacherSession = Login -email "teacher_uat@edusphere.test" -password "TeacherPass123"
    $classes = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET -WebSession $teacherSession
    $classId = ($classes | Where-Object { $_.classCode -eq "29405C" }).id
    
    $leaderboard = Invoke-RestMethod -Uri "$baseUrl/gamification/leaderboard/$classId" -Method GET -WebSession $studentSession
    Write-Host "Leaderboard top student name: $($leaderboard[0].name)"
    Write-Host "Leaderboard top student XP: $($leaderboard[0].totalXp)"

    # 3. Check Notifications
    $notifications = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -WebSession $studentSession
    Write-Host "Student has $($notifications.Count) notifications."
    if ($notifications.Count -gt 0) {
        Write-Host "Latest notification title: $($notifications[0].title)"
    }

} catch {
    Write-Host "Error occurred: $($_.Exception.Message)"
}
