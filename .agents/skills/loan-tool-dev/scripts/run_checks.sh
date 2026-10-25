#!/usr/bin/env bash

# ==============================================================================
# LoanPro Full Quality & Integrity Verification Suite
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

echo -e "${BLUE}${BOLD}[1/5] Checking Docker & Colima status...${NC}"
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}[FAIL] Docker daemon is not accessible.${NC}"
  exit 1
fi
echo -e "${GREEN}[PASS] Docker is active.${NC}"

echo -e "\n${BLUE}${BOLD}[2/5] Checking running containers...${NC}"
if ! docker compose ps | grep -q "loan-tool-backend"; then
  echo -e "${RED}[FAIL] loan-tool-backend container is not running. Run: ./scripts/manage.sh start${NC}"
  exit 1
fi
if ! docker compose ps | grep -q "loan-tool-frontend"; then
  echo -e "${RED}[FAIL] loan-tool-frontend container is not running. Run: ./scripts/manage.sh start${NC}"
  exit 1
fi
echo -e "${GREEN}[PASS] Both containers are running.${NC}"

echo -e "\n${BLUE}${BOLD}[3/5] Checking HTTP endpoints...${NC}"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health || echo "000")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")

if [ "$BACKEND_STATUS" != "200" ]; then
  echo -e "${RED}[FAIL] Backend API returned status $BACKEND_STATUS${NC}"
  exit 1
fi
if [ "$FRONTEND_STATUS" != "200" ]; then
  echo -e "${RED}[FAIL] Frontend returned status $FRONTEND_STATUS${NC}"
  exit 1
fi
echo -e "${GREEN}[PASS] Endpoints responding (Backend :5001 -> 200, Frontend :3000 -> 200).${NC}"

echo -e "\n${BLUE}${BOLD}[4/5] Running Backend Automated Tests in Docker...${NC}"
docker compose run --rm backend npm test
echo -e "${GREEN}[PASS] Backend unit and integration tests passed.${NC}"

echo -e "\n${BLUE}${BOLD}[5/5] Running Frontend TypeScript Check in Docker...${NC}"
docker compose exec frontend npx tsc --noEmit
echo -e "${GREEN}[PASS] Frontend TypeScript type check passed (0 errors).${NC}"

echo -e "\n${GREEN}${BOLD}======================================================${NC}"
echo -e "${GREEN}${BOLD} ALL QUALITY & ARCHITECTURAL CHECKS PASSED (100%)    ${NC}"
echo -e "${GREEN}${BOLD}======================================================${NC}"
