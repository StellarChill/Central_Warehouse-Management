$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = "Continue"
$BASE = "http://localhost:3000/api"
$script:pass = 0
$script:fail = 0

function T {
    param([string]$Name, [string]$M, [string]$U, [string]$B = "", [string]$Tk = "", [string]$Co = "", [int]$Ex = 200)
    $h = @{}
    if ($Tk) { $h["Authorization"] = "Bearer $Tk" }
    if ($Co) { $h["x-company-id"] = $Co }
    try {
        $p = @{ Uri = $U; Method = $M; ContentType = "application/json"; TimeoutSec = 10; ErrorAction = "Stop" }
        if ($h.Count -gt 0) { $p.Headers = $h }
        if ($B) { $p.Body = [System.Text.Encoding]::UTF8.GetBytes($B) }
        $r = Invoke-RestMethod @p
        $script:pass++
        Write-Host "  PASS: $Name" -ForegroundColor Green
        return $r
    }
    catch {
        $code = 0; $ed = $null
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            try {
                $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $ed = $sr.ReadToEnd() | ConvertFrom-Json
            }
            catch {}
        }
        if ($code -eq $Ex) {
            $script:pass++; Write-Host "  PASS: $Name (HTTP $code expected)" -ForegroundColor Green
            return $ed
        }
        $script:fail++
        $em = if ($code -gt 0) { "HTTP $code" }else { $_.Exception.Message }
        Write-Host "  FAIL: $Name -> $em" -ForegroundColor Red
        if ($ed -and $ed.error) { Write-Host "        $($ed.error)" -ForegroundColor DarkRed }
        return $null
    }
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host " Sai Jai Management - Full API Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# [0] Health
T -Name "Health" -M GET -U "http://localhost:3000/health"

# [1] Platform Login
$lr = T -Name "Login platform-admin" -M POST -U "$BASE/login" -B '{"UserName":"platform-admin","UserPassword":"admin123"}'
$pt = if ($lr) { $lr.token }else { "" }

# [2] Register Company
$ts = Get-Date -Format "HHmmss"
$cn = "TestCo-$ts"; $an = "testadmin-$ts"
$rb = @{company = @{CompanyName = $cn; CompanyAddress = "123 St"; TaxId = "1234567890123"; CompanyEmail = "c@t.com"; CompanyTelNumber = "080" }; adminUser = @{UserName = $an; UserPassword = "test1234"; Email = "a@t.com"; TelNumber = "081" } } | ConvertTo-Json -Depth 5
$rr = T -Name "Register $cn" -M POST -U "$BASE/public/company-register" -B $rb -Ex 201
$cid = if ($rr) { $rr.company.CompanyId }else { $null }; $auid = if ($rr) { $rr.adminUser.UserId }else { $null }

# [3] Register User
$un = "testuser-$ts"
$ub = @{UserName = $un; UserPassword = "user1234"; Email = "u@t.com"; TelNumber = "082"; tempCompany = @{TempCompanyName = "Temp" }; RequestedRoleText = "WH Manager" } | ConvertTo-Json -Depth 5
$ur = T -Name "Register $un" -M POST -U "$BASE/public/register" -B $ub -Ex 201
$uuid = if ($ur) { $ur.user.UserId }else { $null }

# [5] Approve Company
if ($cid) { T -Name "Approve Co #$cid" -M PUT -U "$BASE/company/$cid" -B '{"CompanyStatus":"ACTIVE"}' -Tk $pt }

# [6] Assign & Approve Users
$rl = T -Name "List roles" -M GET -U "$BASE/role" -Tk $pt
$caR = if ($rl) { @($rl | Where-Object { $_.RoleCode -eq "COMPANY_ADMIN" })[0] }else { $null }
$whR = if ($rl) { @($rl | Where-Object { $_.RoleCode -eq "WAREHOUSE_ADMIN" })[0] }else { $null }

if ($auid -and $cid -and $caR) {
    T -Name "Assign admin" -M POST -U "$BASE/platform/users/$auid/assign" -B (@{CompanyId = $cid; RoleId = $caR.RoleId } | ConvertTo-Json) -Tk $pt
    T -Name "Approve admin" -M POST -U "$BASE/platform/users/$auid/approve" -B '{"action":"APPROVE"}' -Tk $pt
}
if ($uuid -and $cid -and $whR) {
    T -Name "Assign user" -M POST -U "$BASE/platform/users/$uuid/assign" -B (@{CompanyId = $cid; RoleId = $whR.RoleId } | ConvertTo-Json) -Tk $pt
    T -Name "Approve user" -M POST -U "$BASE/platform/users/$uuid/approve" -B '{"action":"APPROVE"}' -Tk $pt
}

# [7] Login CA
$cal = T -Name "Login $an" -M POST -U "$BASE/login" -B "{`"UserName`":`"$an`",`"UserPassword`":`"test1234`"}"
$ct = if ($cal) { $cal.token }else { "" }; $ch = "$cid"

# [8] WH
$wh = T -Name "List WH" -M GET -U "$BASE/warehouse" -Tk $ct -Co $ch
$wid = if ($wh) { @($wh)[0].WarehouseId }else { $null }

# [9] Cat + Mat
$cat = T -Name "Create Cat" -M POST -U "$BASE/catagory" -B '{"CatagoryName":"TestCat","CatagoryCode":"CAT-$ts"}' -Tk $ct -Co $ch -Ex 201
if ($cat) {
    $mid = T -Name "Create Mat" -M POST -U "$BASE/material" -B (@{MaterialName = "Widget"; MaterialCode = "M-$ts"; Unit = "pcs"; Price = 100; CatagoryId = $cat.CatagoryId } | ConvertTo-Json) -Tk $ct -Co $ch -Ex 201
    if ($mid) { $mid = $mid.MaterialId }
}

# [10] Sup
$sp = T -Name "Create Sup" -M POST -U "$BASE/supplier" -B (@{SupplierName = "Sup-$ts"; SupplierCode = "S-$ts"; ContactPerson = "J"; TelNumber = "08"; Email = "s@t.com" } | ConvertTo-Json) -Tk $ct -Co $ch -Ex 201
$sid = if ($sp) { $sp.SupplierId }else { $null }

# [11-14] PO, Receipt, Stock, Issue
if ($sid -and $mid -and $wid) {
    $po = T -Name "Create PO" -M POST -U "$BASE/po" -B (@{SupplierId = $sid; WarehouseId = $wid; items = @(@{MaterialId = $mid; Quantity = 10; UnitPrice = 100 }) } | ConvertTo-Json -Depth 5) -Tk $ct -Co $ch -Ex 201
    if ($po) {
        T -Name "Create Receipt" -M POST -U "$BASE/receipt" -B (@{PurchaseOrderId = $po.PurchaseOrderId; WarehouseId = $wid; items = @(@{MaterialId = $mid; ReceivedQty = 10; UnitPrice = 100 }) } | ConvertTo-Json -Depth 5) -Tk $ct -Co $ch -Ex 201
    }
    T -Name "List Stock" -M GET -U "$BASE/stock" -Tk $ct -Co $ch
    T -Name "Create Issue" -M POST -U "$BASE/issue" -B (@{WarehouseId = $wid; items = @(@{MaterialId = $mid; Quantity = 2 }) } | ConvertTo-Json -Depth 5) -Tk $ct -Co $ch -Ex 201
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host " TOTAL=$($script:pass+$script:fail)  PASS=$($script:pass)  FAIL=$($script:fail)" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
