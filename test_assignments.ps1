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

    if (-not $classId) {
        Write-Host "Class not found!"
        exit 1
    }

    $assignData = @{
        title = "UAT Automated Assignment"
        description = "Testing assignment creation via script."
        dueDate = (Get-Date).AddDays(2).ToString("o")
        totalPoints = 100
        isPeerReview = $false
    }
    $assignBody = $assignData | ConvertTo-Json

    $assignment = Invoke-RestMethod -Uri "$baseUrl/classes/$classId/assignments" -Method POST -Body $assignBody -ContentType "application/json" -WebSession $teacherSession
    $assignmentId = $assignment.id
    Write-Host "Teacher created Assignment ID: $assignmentId"

    $studentSession = Login -email "student1_uat@edusphere.test" -password "TeacherPass123"
    Write-Host "Student 1 logged in successfully."

    $submitData = @{
        assignmentId = $assignmentId
        content = "My answer to the assignment."
        attachments = @()
    }
    $submitBody = $submitData | ConvertTo-Json -Depth 3

    $submission = Invoke-RestMethod -Uri "$baseUrl/assignments/$assignmentId/submissions" -Method POST -Body $submitBody -ContentType "application/json" -WebSession $studentSession
    $submissionId = $submission.id
    Write-Host "Student submitted work, Submission ID: $submissionId"

    $gradeData = @{
        grade = 100
        feedback = "Perfect score."
    }
    $gradeBody = $gradeData | ConvertTo-Json

    $graded = Invoke-RestMethod -Uri "$baseUrl/submissions/$submissionId/grade" -Method PATCH -Body $gradeBody -ContentType "application/json" -WebSession $teacherSession
    Write-Host "Teacher graded submission. Grade recorded: $($graded.grade) / 100"

    Write-Host "Module 3 Assignment Management workflows completed successfully."

} catch {
    Write-Host "Error occurred: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
