$baseUrl = "http://localhost:3000/api"
$logFile = "api_audit_log.txt"

function Log-Result {
    param([string]$endpoint, [string]$method, [string]$status, [string]$body)
    $logMsg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $method $endpoint | Status: $status | Body: $body"
    Write-Output $logMsg
    Add-Content -Path $logFile -Value $logMsg
}

# 1. Register User (Student)
$regUrl = "$baseUrl/auth/register"
$regBody = @{
    name = "Test Student " + (Get-Random)
    email = "student$(Get-Random)@example.com"
    password = "Password123"
    role = "student"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $regUrl -Method POST -Body $regBody -ContentType "application/json" -SessionVariable session
    Log-Result "/auth/register" "POST" "201 Created" ($response | ConvertTo-Json -Compress)
} catch {
    Log-Result "/auth/register" "POST" "Failed: $($_.Exception.Message)" ""
}

# 2. Login User
$loginUrl = "$baseUrl/auth/login"
$loginBody = @{
    email = ($regBody | ConvertFrom-Json).email
    password = "Password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json" -WebSession $session
    Log-Result "/auth/login" "POST" "200 OK" ($response | ConvertTo-Json -Compress)
} catch {
    Log-Result "/auth/login" "POST" "Failed: $($_.Exception.Message)" ""
}

# 3. GET /auth/me
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method GET -WebSession $session
    Log-Result "/auth/me" "GET" "200 OK" ($response | ConvertTo-Json -Compress)
} catch {
    Log-Result "/auth/me" "GET" "Failed: $($_.Exception.Message)" ""
}

# 4. GET /users/profile
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -WebSession $session
    Log-Result "/users/profile" "GET" "200 OK" ($response | ConvertTo-Json -Compress)
} catch {
    Log-Result "/users/profile" "GET" "Failed: $($_.Exception.Message)" ""
}

# 5. GET /classes
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET -WebSession $session
    Log-Result "/classes" "GET" "200 OK" ($response | ConvertTo-Json -Compress)
} catch {
    Log-Result "/classes" "GET" "Failed: $($_.Exception.Message)" ""
}

# 6. GET /wellbeing/stats (Without Teacher Role - should fail or return empty)
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/wellbeing/stats?classId=123" -Method GET -WebSession $session
    Log-Result "/wellbeing/stats" "GET" "200 OK" ($response | ConvertTo-Json -Compress)
} catch {
    Log-Result "/wellbeing/stats" "GET" "Failed: $($_.Exception.Response.StatusCode) $($_.Exception.Message)" ""
}

Write-Output "Live API Test Complete. See $logFile for details."
