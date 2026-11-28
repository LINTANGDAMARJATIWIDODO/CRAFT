# Interactive Mainnet Deploy & BscScan Verify Helper for CRAFT
# Run after copying .env.example to .env and filling PRIVATE_KEY + BSCSCAN_API_KEY

$ErrorActionPreference = "Stop"
Set-Location "C:\Users\LENOVO\Downloads\craft"

if (-not (Test-Path ".env")) {
  Write-Host "ERROR: .env file not found. Copy .env.example -> .env and fill PRIVATE_KEY + BSCSCAN_API_KEY." -ForegroundColor Red
  exit 1
}

Write-Host "Deploying TaskRegistry to BNB Smart Chain Mainnet (56)..." -ForegroundColor Cyan
npx --workspace=contracts hardhat run scripts/deploy.ts --network bsc
