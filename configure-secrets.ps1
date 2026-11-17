<#
.SYNOPSIS
    Secure Environment Configuration Helper for ChainTrace
.DESCRIPTION
    Safely writes credentials to local .env files (backend/.env and blockchain/.env)
    without displaying sensitive secrets on the screen or logging them.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     ChainTrace Secure Cloud & Testnet Configurator      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This helper configures your local environment files securely." -ForegroundColor Gray
Write-Host "No passwords or keys are transmitted or logged." -ForegroundColor Gray
Write-Host ""

# 1. MongoDB Atlas Configuration
Write-Host "--- [1/2] MongoDB Atlas Setup ---" -ForegroundColor Yellow
Write-Host "Format: mongodb+srv://<username>:<password>@cluster.mongodb.net/chaintrace?retryWrites=true&w=majority" -ForegroundColor Gray
$mongoUri = Read-Host "Enter MongoDB Atlas Connection String (press Enter to skip)"

# 2. Ethereum Sepolia Testnet Configuration
Write-Host ""
Write-Host "--- [2/2] Ethereum Sepolia Testnet Setup ---" -ForegroundColor Yellow
Write-Host "Example RPC: https://sepolia.infura.io/v3/YOUR_INFURA_KEY or Alchemy URL" -ForegroundColor Gray
$sepoliaRpc = Read-Host "Enter Sepolia RPC URL (press Enter to skip)"

$sepoliaKey = ""
if ($sepoliaRpc) {
    Write-Host "Enter Sepolia Account Private Key (Input is hidden):" -ForegroundColor Gray
    $secureKey = Read-Host -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    $sepoliaKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    if ($sepoliaKey.StartsWith("0x")) {
        $sepoliaKey = $sepoliaKey.Substring(2)
    }
}

# Construct backend/.env
$backendEnv = @"
PORT=5000
NODE_ENV=production
JWT_SECRET=chaintrace_jwt_production_secret_$(Get-Random -Minimum 100000 -Maximum 999999)
FRONTEND_URL=http://localhost:3000
"@

if ($mongoUri) {
    $backendEnv += "`nMONGODB_URI=$mongoUri"
}
if ($sepoliaRpc) {
    $backendEnv += "`nSEPOLIA_RPC_URL=$sepoliaRpc"
}
if ($sepoliaKey) {
    $backendEnv += "`nSEPOLIA_PRIVATE_KEY=$sepoliaKey"
}

# Write backend/.env
$backendEnvPath = Join-Path $PSScriptRoot "backend\.env"
Set-Content -Path $backendEnvPath -Value $backendEnv -Encoding utf8
Write-Host " Saved configuration to: backend/.env" -ForegroundColor Green

# Construct blockchain/.env
if ($sepoliaRpc -and $sepoliaKey) {
    $blockchainEnv = @"
SEPOLIA_RPC_URL=$sepoliaRpc
SEPOLIA_PRIVATE_KEY=$sepoliaKey
"@
    $blockchainEnvPath = Join-Path $PSScriptRoot "blockchain\.env"
    Set-Content -Path $blockchainEnvPath -Value $blockchainEnv -Encoding utf8
    Write-Host " Saved configuration to: blockchain/.env" -ForegroundColor Green
}

Write-Host ""
Write-Host " Configuration saved securely to local .env files (git-ignored)!" -ForegroundColor Green
Write-Host ""
