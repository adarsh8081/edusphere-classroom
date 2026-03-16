###############################################################################
# EduSphere Classroom - Comprehensive API Automation Test
###############################################################################

$baseUrl = "http://localhost:3000/api"
$pass = 0; $fail = 0; $skip = 0; $results = @()

function Login {
    param([string]$email, [string]$password)
    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session
    return $session
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        $Session = $null,
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    try {
        $params = @{ Uri = $Url; Method = $Method; ErrorAction = "Stop" }
        if ($Session) { $params["WebSession"] = $Session }
        if ($Body) { $params["Body"] = $Body; $params["ContentType"] = "application/json" }
        $response = Invoke-RestMethod @params
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:pass++
        $script:results += [PSCustomObject]@{ Test = $Name; Result = "PASS"; Details = "" }
        return $response
    } catch {
        $statusCode = 0
        if ($_.Exception.Response) { $statusCode = [int]$_.Exception.Response.StatusCode }
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  [PASS] $Name (expected $ExpectedStatus)" -ForegroundColor Green
            $script:pass++
            $script:results += [PSCustomObject]@{ Test = $Name; Result = "PASS"; Details = "Expected $ExpectedStatus" }
        } else {
            $details = $_.Exception.Message
            if ($_.ErrorDetails) { $details = $_.ErrorDetails.Message }
            Write-Host "  [FAIL] $Name -- $details" -ForegroundColor Red
            $script:fail++
            $script:results += [PSCustomObject]@{ Test = $Name; Result = "FAIL"; Details = $details }
        }
        return $null
    }
}

function Test-ExpectedError {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        $Session = $null,
        [string]$Body = $null,
        [int]$ExpectedStatus = 403
    )
    try {
        $params = @{ Uri = $Url; Method = $Method; ErrorAction = "Stop" }
        if ($Session) { $params["WebSession"] = $Session }
        if ($Body) { $params["Body"] = $Body; $params["ContentType"] = "application/json" }
        $null = Invoke-RestMethod @params
        Write-Host "  [FAIL] $Name -- Should have returned $ExpectedStatus but succeeded" -ForegroundColor Red
        $script:fail++
        $script:results += [PSCustomObject]@{ Test = $Name; Result = "FAIL"; Details = "Expected $ExpectedStatus, got success" }
    } catch {
        $statusCode = 0
        if ($_.Exception.Response) { $statusCode = [int]$_.Exception.Response.StatusCode }
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  [PASS] $Name (correctly returned $ExpectedStatus)" -ForegroundColor Green
            $script:pass++
            $script:results += [PSCustomObject]@{ Test = $Name; Result = "PASS"; Details = "Correctly returned $ExpectedStatus" }
        } else {
            Write-Host "  [FAIL] $Name -- Expected $ExpectedStatus, got $statusCode" -ForegroundColor Red
            $script:fail++
            $script:results += [PSCustomObject]@{ Test = $Name; Result = "FAIL"; Details = "Expected $ExpectedStatus, got $statusCode" }
        }
    }
}

Write-Host "================================================================"
Write-Host "  EduSphere Classroom - Full Automation Test Suite"
Write-Host "  Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "================================================================"
Write-Host ""

###############################################################################
# 0. Health Check
###############################################################################
Write-Host "--- Module 0: Health Check ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET /api/health-check" -Url "$baseUrl/health-check"
Write-Host ""

###############################################################################
# 1. Authentication
###############################################################################
Write-Host "--- Module 1: Authentication ---" -ForegroundColor Yellow

$regBody = @{
    name = "AutoTest User $(Get-Random -Maximum 9999)"
    email = "autotest_$(Get-Random -Maximum 999999)@edusphere.test"
    password = "TestPass123"
    role = "student"
} | ConvertTo-Json
$regResult = Test-Endpoint -Name "POST /api/register (new student)" -Url "$baseUrl/register" -Method POST -Body $regBody

$teacherSession = Login -email "teacher_uat@edusphere.test" -password "TeacherPass123"
if ($teacherSession) {
    Write-Host "  [PASS] Login as Teacher" -ForegroundColor Green; $pass++
    $results += [PSCustomObject]@{ Test = "Login as Teacher"; Result = "PASS"; Details = "" }
} else {
    Write-Host "  [FAIL] Login as Teacher" -ForegroundColor Red; $fail++
    $results += [PSCustomObject]@{ Test = "Login as Teacher"; Result = "FAIL"; Details = "Session null" }
}

$studentSession = Login -email "student1_uat@edusphere.test" -password "TeacherPass123"
if ($studentSession) {
    Write-Host "  [PASS] Login as Student" -ForegroundColor Green; $pass++
    $results += [PSCustomObject]@{ Test = "Login as Student"; Result = "PASS"; Details = "" }
} else {
    Write-Host "  [FAIL] Login as Student" -ForegroundColor Red; $fail++
    $results += [PSCustomObject]@{ Test = "Login as Student"; Result = "FAIL"; Details = "Session null" }
}

$student2Session = Login -email "student2_uat@edusphere.test" -password "TeacherPass123"

Test-Endpoint -Name "GET /api/me (teacher)" -Url "$baseUrl/me" -Session $teacherSession
Test-Endpoint -Name "GET /api/me (student)" -Url "$baseUrl/me" -Session $studentSession
Test-ExpectedError -Name "GET /api/me (no session expect 401)" -Url "$baseUrl/me" -ExpectedStatus 401
Write-Host ""

###############################################################################
# 2. Class Management
###############################################################################
Write-Host "--- Module 2: Class Management ---" -ForegroundColor Yellow

$classBody = @{
    name = "AutoTest Class $(Get-Random -Maximum 9999)"
    subject = "Automation"
    grade = "10th"
    description = "Created by automation test."
} | ConvertTo-Json
$newClass = Test-Endpoint -Name "POST /api/classes (teacher creates)" -Url "$baseUrl/classes" -Method POST -Body $classBody -Session $teacherSession

Test-Endpoint -Name "GET /api/classes (teacher)" -Url "$baseUrl/classes" -Session $teacherSession
Test-Endpoint -Name "GET /api/classes (student)" -Url "$baseUrl/classes" -Session $studentSession

$classes = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET -WebSession $teacherSession
$classId = ($classes | Where-Object { $_.classCode -eq "29405C" }).id
if (-not $classId -and $classes.Count -gt 0) { $classId = $classes[0].id }

if ($classId) {
    Test-Endpoint -Name "GET /api/classes/:id" -Url "$baseUrl/classes/$classId" -Session $teacherSession
    Test-Endpoint -Name "GET /api/classes/:id/roster" -Url "$baseUrl/classes/$classId/roster" -Session $teacherSession
}

if ($newClass -and $newClass.classCode) {
    $joinBody = @{ classCode = $newClass.classCode } | ConvertTo-Json
    Test-Endpoint -Name "POST /api/classes/join (student)" -Url "$baseUrl/classes/join" -Method POST -Body $joinBody -Session $studentSession
}
Write-Host ""

###############################################################################
# 3. Assignment Management
###############################################################################
Write-Host "--- Module 3: Assignment Management ---" -ForegroundColor Yellow

if ($classId) {
    $assignBody = @{
        title = "AutoTest Assignment"
        description = "Automation test assignment."
        dueDate = (Get-Date).AddDays(5).ToString("o")
        totalPoints = 100
        isPeerReview = $false
    } | ConvertTo-Json
    $assignment = Test-Endpoint -Name "POST /api/classes/:id/assignments (teacher)" -Url "$baseUrl/classes/$classId/assignments" -Method POST -Body $assignBody -Session $teacherSession

    Test-Endpoint -Name "GET /api/classes/:id/assignments" -Url "$baseUrl/classes/$classId/assignments" -Session $teacherSession

    if ($assignment -and $assignment.id) {
        $assignmentId = $assignment.id
        Test-Endpoint -Name "GET /api/classes/:id/assignments/:id" -Url "$baseUrl/classes/$classId/assignments/$assignmentId" -Session $teacherSession

        $subBody = @{
            assignmentId = $assignmentId
            content = "My automated test submission."
            attachments = @()
        } | ConvertTo-Json -Depth 3
        $submission = Test-Endpoint -Name "POST /api/assignments/:id/submissions (student)" -Url "$baseUrl/assignments/$assignmentId/submissions" -Method POST -Body $subBody -Session $studentSession

        Test-Endpoint -Name "GET /api/assignments/:id/submissions" -Url "$baseUrl/assignments/$assignmentId/submissions" -Session $teacherSession

        if ($submission -and $submission.id) {
            $gradeBody = @{ grade = 95; feedback = "Excellent automated work!" } | ConvertTo-Json
            Test-Endpoint -Name "PATCH /api/submissions/:id/grade (teacher)" -Url "$baseUrl/submissions/$($submission.id)/grade" -Method PATCH -Body $gradeBody -Session $teacherSession

            Test-Endpoint -Name "POST /api/submissions/:id/check-plagiarism" -Url "$baseUrl/submissions/$($submission.id)/check-plagiarism" -Method POST -Session $teacherSession
        }
    }
}
Write-Host ""

###############################################################################
# 4. Peer Review
###############################################################################
Write-Host "--- Module 4: Peer Review ---" -ForegroundColor Yellow

if ($classId) {
    $prBody = @{
        title = "AutoTest Peer Review Assignment"
        description = "PR test."
        dueDate = (Get-Date).AddDays(3).ToString("o")
        totalPoints = 50
        isPeerReview = $true
    } | ConvertTo-Json
    $prAssign = Test-Endpoint -Name "POST peer review assignment" -Url "$baseUrl/classes/$classId/assignments" -Method POST -Body $prBody -Session $teacherSession

    if ($prAssign -and $prAssign.id) {
        $prId = $prAssign.id

        $s1Body = @{ assignmentId = $prId; content = "Student 1 PR answer."; attachments = @() } | ConvertTo-Json -Depth 3
        $s1Sub = Test-Endpoint -Name "Student 1 submission for PR" -Url "$baseUrl/assignments/$prId/submissions" -Method POST -Body $s1Body -Session $studentSession

        $s2Body = @{ assignmentId = $prId; content = "Student 2 PR answer."; attachments = @() } | ConvertTo-Json -Depth 3
        $s2Sub = Test-Endpoint -Name "Student 2 submission for PR" -Url "$baseUrl/assignments/$prId/submissions" -Method POST -Body $s2Body -Session $student2Session

        if ($s1Sub -and $s1Sub.id) {
            $revBody = @{ submissionId = $s1Sub.id; rating = 4; feedback = "Automated peer review feedback." } | ConvertTo-Json
            Test-Endpoint -Name "POST peer review (student 2 reviews student 1)" -Url "$baseUrl/submissions/$($s1Sub.id)/peer-review" -Method POST -Body $revBody -Session $student2Session
        }
    }
}
Write-Host ""

###############################################################################
# 5. Attendance
###############################################################################
Write-Host "--- Module 5: Attendance ---" -ForegroundColor Yellow

if ($classId) {
    Test-Endpoint -Name "GET /api/classes/:id/attendance" -Url "$baseUrl/classes/$classId/attendance" -Session $teacherSession

    $qrBody = @{ classId = $classId } | ConvertTo-Json
    $qrSession = Test-Endpoint -Name "POST /api/attendance/session (teacher)" -Url "$baseUrl/attendance/session" -Method POST -Body $qrBody -Session $teacherSession

    if ($qrSession -and $qrSession.qrCode) {
        $scanBody = @{ qrCode = $qrSession.qrCode; latitude = 40.7128; longitude = -74.0060 } | ConvertTo-Json
        Test-Endpoint -Name "POST /api/attendance/scan (student)" -Url "$baseUrl/attendance/scan" -Method POST -Body $scanBody -Session $studentSession

        if ($qrSession.id) {
            Test-Endpoint -Name "GET /api/attendance/session/:id/stats" -Url "$baseUrl/attendance/session/$($qrSession.id)/stats" -Session $teacherSession
        }
    }

    Test-Endpoint -Name "GET /api/classes/:id/attendance/active" -Url "$baseUrl/classes/$classId/attendance/active" -Session $studentSession
}
Write-Host ""

###############################################################################
# 6. Gamification
###############################################################################
Write-Host "--- Module 6: Gamification ---" -ForegroundColor Yellow

Test-Endpoint -Name "GET /api/gamification/me (student)" -Url "$baseUrl/gamification/me" -Session $studentSession

if ($classId) {
    Test-Endpoint -Name "GET /api/gamification/leaderboard/:classId" -Url "$baseUrl/gamification/leaderboard/$classId" -Session $studentSession
}

Test-Endpoint -Name "GET /api/gamification/badges (student)" -Url "$baseUrl/gamification/badges" -Session $studentSession
Write-Host ""

###############################################################################
# 7. Notifications
###############################################################################
Write-Host "--- Module 7: Notifications ---" -ForegroundColor Yellow

Test-Endpoint -Name "GET /api/notifications (student)" -Url "$baseUrl/notifications" -Session $studentSession
Test-Endpoint -Name "GET /api/notifications (teacher)" -Url "$baseUrl/notifications" -Session $teacherSession
Test-Endpoint -Name "GET /api/notifications/preferences" -Url "$baseUrl/notifications/preferences" -Session $studentSession
Write-Host ""

###############################################################################
# 8. Messaging
###############################################################################
Write-Host "--- Module 8: Messaging ---" -ForegroundColor Yellow

Test-Endpoint -Name "GET /api/conversations (teacher)" -Url "$baseUrl/conversations" -Session $teacherSession
Test-Endpoint -Name "GET /api/conversations (student)" -Url "$baseUrl/conversations" -Session $studentSession
Write-Host ""

###############################################################################
# 9. Wellbeing
###############################################################################
Write-Host "--- Module 9: Wellbeing ---" -ForegroundColor Yellow

if ($classId) {
    $checkinBody = @{
        moodScore = 4
        mood = "happy"
        notes = "Feeling great during automation test!"
        classId = $classId
    } | ConvertTo-Json
    Test-Endpoint -Name "POST /api/wellbeing/checkin (student)" -Url "$baseUrl/wellbeing/checkin" -Method POST -Body $checkinBody -Session $studentSession

    Test-Endpoint -Name "GET /api/wellbeing/stats/:classId (teacher)" -Url "$baseUrl/wellbeing/stats/$classId" -Session $teacherSession
}
Write-Host ""

###############################################################################
# 10. Marketplace
###############################################################################
Write-Host "--- Module 10: Marketplace ---" -ForegroundColor Yellow

Test-Endpoint -Name "GET /api/marketplace" -Url "$baseUrl/marketplace" -Session $studentSession
Test-Endpoint -Name "GET /api/marketplace/purchases" -Url "$baseUrl/marketplace/purchases" -Session $studentSession
Write-Host ""

###############################################################################
# 11. Guilds
###############################################################################
Write-Host "--- Module 11: Guilds ---" -ForegroundColor Yellow

Test-Endpoint -Name "GET /api/guilds" -Url "$baseUrl/guilds" -Session $studentSession

$guildBody = @{ name = "AutoTest Guild $(Get-Random -Maximum 9999)"; description = "Test guild" } | ConvertTo-Json
$newGuild = Test-Endpoint -Name "POST /api/guilds (create)" -Url "$baseUrl/guilds" -Method POST -Body $guildBody -Session $teacherSession

if ($newGuild -and $newGuild.id) {
    Test-Endpoint -Name "GET /api/guilds/:id/channels" -Url "$baseUrl/guilds/$($newGuild.id)/channels" -Session $teacherSession
    Test-Endpoint -Name "POST /api/guilds/:id/join (student)" -Url "$baseUrl/guilds/$($newGuild.id)/join" -Method POST -Session $studentSession
}
Write-Host ""

###############################################################################
# 12. Forums
###############################################################################
Write-Host "--- Module 12: Forums ---" -ForegroundColor Yellow

Test-Endpoint -Name "GET /api/forums" -Url "$baseUrl/forums" -Session $studentSession

$forumBody = @{ title = "AutoTest Forum Post"; content = "Automation test forum content." } | ConvertTo-Json
$forumPost = Test-Endpoint -Name "POST /api/forums (create)" -Url "$baseUrl/forums" -Method POST -Body $forumBody -Session $studentSession

if ($forumPost -and $forumPost.id) {
    Test-Endpoint -Name "GET /api/forums/posts/:id/comments" -Url "$baseUrl/forums/posts/$($forumPost.id)/comments" -Session $studentSession
    $voteBody = @{ direction = "up" } | ConvertTo-Json
    Test-Endpoint -Name "POST /api/forums/posts/:id/vote" -Url "$baseUrl/forums/posts/$($forumPost.id)/vote" -Method POST -Body $voteBody -Session $studentSession
}
Write-Host ""

###############################################################################
# 13. AI Features
###############################################################################
Write-Host "--- Module 13: AI Features ---" -ForegroundColor Yellow

$summarizeBody = @{ text = "The quick brown fox jumps over the lazy dog. This is a test of the AI summarization feature." } | ConvertTo-Json
Test-Endpoint -Name "POST /api/ai/summarize" -Url "$baseUrl/ai/summarize" -Method POST -Body $summarizeBody -Session $teacherSession

$tagsBody = @{ text = "Machine learning neural networks deep learning AI." } | ConvertTo-Json
Test-Endpoint -Name "POST /api/ai/suggest-tags" -Url "$baseUrl/ai/suggest-tags" -Method POST -Body $tagsBody -Session $teacherSession

$lessonBody = @{ topic = "Photosynthesis"; grade = "9th"; duration = "45 mins" } | ConvertTo-Json
Test-Endpoint -Name "POST /api/ai/lesson-plan" -Url "$baseUrl/ai/lesson-plan" -Method POST -Body $lessonBody -Session $teacherSession
Write-Host ""

###############################################################################
# 14. Analytics
###############################################################################
Write-Host "--- Module 14: Analytics ---" -ForegroundColor Yellow

if ($classId) {
    Test-Endpoint -Name "GET /api/classes/:id/analytics/engagement" -Url "$baseUrl/classes/$classId/analytics/engagement" -Session $teacherSession
    Test-Endpoint -Name "GET /api/classes/:id/analytics/at-risk" -Url "$baseUrl/classes/$classId/analytics/at-risk" -Session $teacherSession
}
Write-Host ""

###############################################################################
# 15. Career Paths
###############################################################################
Write-Host "--- Module 15: Career Paths ---" -ForegroundColor Yellow

Test-Endpoint -Name "GET /api/career/paths" -Url "$baseUrl/career/paths" -Session $studentSession
Test-Endpoint -Name "GET /api/career/progress" -Url "$baseUrl/career/progress" -Session $studentSession
Write-Host ""

###############################################################################
# 16. RBAC Boundary Tests
###############################################################################
Write-Host "--- Module 16: RBAC Boundary Tests ---" -ForegroundColor Yellow

$hackBody = '{"name":"HackedClass"}'
Test-ExpectedError -Name "POST /api/classes (student expect 403)" -Url "$baseUrl/classes" -Method POST -Session $studentSession -Body $hackBody -ExpectedStatus 403

if ($classId) {
    $hackBody2 = '{"title":"hack"}'
    Test-ExpectedError -Name "POST assignments (student expect 403)" -Url "$baseUrl/classes/$classId/assignments" -Method POST -Session $studentSession -Body $hackBody2 -ExpectedStatus 403
    $hackBody3 = '{"name":"hacked"}'
    Test-ExpectedError -Name "PATCH class (student expect 403)" -Url "$baseUrl/classes/$classId" -Method PATCH -Session $studentSession -Body $hackBody3 -ExpectedStatus 403
    Test-ExpectedError -Name "DELETE class (student expect 403)" -Url "$baseUrl/classes/$classId" -Method DELETE -Session $studentSession -ExpectedStatus 403
}

Test-ExpectedError -Name "GET /api/classes (no session expect 401)" -Url "$baseUrl/classes" -ExpectedStatus 401
Test-ExpectedError -Name "GET /api/notifications (no session expect 401)" -Url "$baseUrl/notifications" -ExpectedStatus 401
Write-Host ""

###############################################################################
# 17. Admin Dashboard
###############################################################################
Write-Host "--- Module 17: Admin Dashboard ---" -ForegroundColor Yellow

try {
    $adminSession = Login -email "admin@edusphere.test" -password "Admin123!"
    if ($adminSession) {
        Test-Endpoint -Name "GET /api/admin/stats" -Url "$baseUrl/admin/stats" -Session $adminSession
        Test-Endpoint -Name "GET /api/admin/users" -Url "$baseUrl/admin/users" -Session $adminSession
        Test-Endpoint -Name "GET /api/admin/classes" -Url "$baseUrl/admin/classes" -Session $adminSession
        Test-Endpoint -Name "GET /api/admin/activity" -Url "$baseUrl/admin/activity" -Session $adminSession
        Test-Endpoint -Name "GET /api/admin/wellbeing/flagged" -Url "$baseUrl/admin/wellbeing/flagged" -Session $adminSession
        Test-Endpoint -Name "GET /api/admin/institutional-stats" -Url "$baseUrl/admin/institutional-stats" -Session $adminSession
    }
} catch {
    Write-Host "  [SKIP] Admin login failed - no admin account available." -ForegroundColor DarkYellow
    $skip++
    $results += [PSCustomObject]@{ Test = "Admin Dashboard Tests"; Result = "SKIP"; Details = "Admin login failed" }
}

Test-ExpectedError -Name "GET /api/admin/stats (student expect 403)" -Url "$baseUrl/admin/stats" -Session $studentSession -ExpectedStatus 403
Write-Host ""

###############################################################################
# Summary
###############################################################################
Write-Host "================================================================"
Write-Host "  TEST RESULTS SUMMARY"
Write-Host "================================================================"
Write-Host ""
Write-Host "  Total:   $($pass + $fail + $skip)"
Write-Host "  Passed:  $pass" -ForegroundColor Green
Write-Host "  Failed:  $fail" -ForegroundColor Red
Write-Host "  Skipped: $skip" -ForegroundColor DarkYellow
Write-Host ""

if ($fail -eq 0) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "  FAILED TESTS:" -ForegroundColor Red
    $results | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object {
        Write-Host "    - $($_.Test): $($_.Details)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "  Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "================================================================"
