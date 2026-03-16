$baseUrl = "http://localhost:3000/api"

function Login {
    param([string]$email, [string]$password)
    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session
    return $session
}

try {
    $teacherSession = Login -email "teacher_uat@edusphere.test" -password "TeacherPass123"
    $student1Session = Login -email "student1_uat@edusphere.test" -password "TeacherPass123"
    $student2Session = Login -email "student2_uat@edusphere.test" -password "TeacherPass123"
    Write-Host "All sessions established."

    # Get class
    $classes = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET -WebSession $teacherSession
    $classId = ($classes | Where-Object { $_.classCode -eq "29405C" }).id

    # Create a peer-review assignment
    $assignBody = @{
        title = "UAT Peer Review Assignment"
        description = "Test peer review flow."
        dueDate = (Get-Date).AddDays(3).ToString("o")
        totalPoints = 50
        isPeerReview = $true
        peerReviewCount = 1
    } | ConvertTo-Json

    $assignment = Invoke-RestMethod -Uri "$baseUrl/classes/$classId/assignments" -Method POST -Body $assignBody -ContentType "application/json" -WebSession $teacherSession
    $assignmentId = $assignment.id
    Write-Host "Peer review assignment created: $assignmentId"

    # Student 1 submits
    $sub1Body = @{
        assignmentId = $assignmentId
        content = "Student 1 answer for peer review."
        attachments = @()
    } | ConvertTo-Json -Depth 3
    $submission1 = Invoke-RestMethod -Uri "$baseUrl/assignments/$assignmentId/submissions" -Method POST -Body $sub1Body -ContentType "application/json" -WebSession $student1Session
    Write-Host "Student 1 submitted: $($submission1.id)"

    # Student 2 submits
    $sub2Body = @{
        assignmentId = $assignmentId
        content = "Student 2 answer for peer review."
        attachments = @()
    } | ConvertTo-Json -Depth 3
    $submission2 = Invoke-RestMethod -Uri "$baseUrl/assignments/$assignmentId/submissions" -Method POST -Body $sub2Body -ContentType "application/json" -WebSession $student2Session
    Write-Host "Student 2 submitted: $($submission2.id)"

    # Student 2 peer-reviews Student 1's submission
    $reviewBody = @{
        submissionId = $submission1.id
        rating = 4
        feedback = "Great work, very detailed."
    } | ConvertTo-Json

    try {
        $review = Invoke-RestMethod -Uri "$baseUrl/submissions/$($submission1.id)/peer-review" -Method POST -Body $reviewBody -ContentType "application/json" -WebSession $student2Session
        Write-Host "Peer review submitted by student 2. Review ID: $($review.id)"
    } catch {
        Write-Host "Peer review endpoint: $($_.Exception.Message)"
        if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
    }

    # === Module 5: Badge & XP Edge Cases ===
    Write-Host ""
    Write-Host "=== Module 5: XP Edge Cases ==="

    # Get student 1 XP before grading
    $xpBefore = (Invoke-RestMethod -Uri "$baseUrl/gamification/me" -Method GET -WebSession $student1Session).totalXp
    Write-Host "Student 1 XP before grading: $xpBefore"

    # Teacher grades submission
    $gradeBody1 = @{ grade = 45; feedback = "Excellent work!" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/submissions/$($submission1.id)/grade" -Method PATCH -Body $gradeBody1 -ContentType "application/json" -WebSession $teacherSession | Out-Null
    Write-Host "Teacher graded submission 1 with 45/50."

    $xpAfter = (Invoke-RestMethod -Uri "$baseUrl/gamification/me" -Method GET -WebSession $student1Session).totalXp
    Write-Host "Student 1 XP after grading: $xpAfter (delta: $($xpAfter - $xpBefore))"

    # Re-grade (edge case)
    $reGradeBody = @{ grade = 30; feedback = "Revised grade." } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/submissions/$($submission1.id)/grade" -Method PATCH -Body $reGradeBody -ContentType "application/json" -WebSession $teacherSession | Out-Null
    Write-Host "Teacher re-graded submission 1 with 30/50."

    $xpFinal = (Invoke-RestMethod -Uri "$baseUrl/gamification/me" -Method GET -WebSession $student1Session).totalXp
    Write-Host "Student 1 XP after re-grading: $xpFinal"

    # Check badges
    try {
        $badges = Invoke-RestMethod -Uri "$baseUrl/gamification/badges" -Method GET -WebSession $student1Session
        Write-Host "Student 1 has $($badges.Count) badge(s) unlocked."
    } catch {
        Write-Host "Badges endpoint: not implemented or $($_.Exception.Message)"
    }

    Write-Host ""
    Write-Host "=== Peer Review + Gamification Edge Cases Complete ==="

} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
}
