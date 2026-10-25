#!/usr/bin/env bash

# ==============================================================================
# LoanPro Application Lifecycle Manager
# Single script to start, stop, rebuild, test, inspect, and manage the full stack.
# ==============================================================================

set -e

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

print_banner() {
  echo -e "${CYAN}${BOLD}"
  echo "======================================================================="
  echo "       LoanPro - Advanced Loan Comparison & Financial Platform         "
  echo "======================================================================="
  echo -e "${NC}"
}

check_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker daemon is not responding.${NC}"
    if command -v colima >/dev/null 2>&1; then
      echo -e "${YELLOW}[TIP] If you are using Colima, start it with:${NC} colima start"
    fi
    exit 1
  fi
}

cmd_start() {
  check_docker
  echo -e "${BLUE}[*] Starting LoanPro containers via Docker Compose...${NC}"
  docker compose up -d

  echo -e "${BLUE}[*] Waiting for services to become ready...${NC}"
  sleep 3

  echo -e "\n${GREEN}${BOLD}[SUCCESS] Services are up and running!${NC}"
  echo -e "  ${BOLD}Frontend Dashboard:${NC} ${CYAN}http://localhost:3000${NC}"
  echo -e "  ${BOLD}Backend API Health:${NC} ${CYAN}http://localhost:5001/api/health${NC}"
  echo -e "  ${BOLD}API Documentation:${NC}  ${CYAN}http://localhost:5001/${NC}"
  echo -e "  ${BOLD}SQLite Database:${NC}    ${CYAN}./data/loan_tool.db (Persistent)${NC}"
}

cmd_stop() {
  check_docker
  echo -e "${YELLOW}[*] Stopping LoanPro containers...${NC}"
  docker compose down
  echo -e "${GREEN}[SUCCESS] All containers stopped successfully.${NC}"
}

cmd_restart() {
  check_docker
  echo -e "${YELLOW}[*] Restarting LoanPro containers...${NC}"
  docker compose restart
  echo -e "${GREEN}[SUCCESS] Containers restarted.${NC}"
  cmd_status
}

cmd_rebuild() {
  check_docker
  echo -e "${BLUE}[*] Rebuilding and starting LoanPro containers...${NC}"
  docker compose up -d --build
  echo -e "\n${GREEN}${BOLD}[SUCCESS] Rebuild complete!${NC}"
  cmd_status
}

cmd_status() {
  check_docker
  echo -e "${BLUE}${BOLD}[*] Container Status:${NC}"
  docker compose ps
  echo ""
  echo -e "${BLUE}${BOLD}[*] Quick Health Check:${NC}"
  if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
    echo -e "  Backend API:  ${GREEN}ONLINE (Port 5001)${NC}"
  else
    echo -e "  Backend API:  ${RED}OFFLINE${NC}"
  fi

  if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "  Frontend App: ${GREEN}ONLINE (Port 3000)${NC}"
  else
    echo -e "  Frontend App: ${RED}OFFLINE${NC}"
  fi
}

cmd_logs() {
  check_docker
  SERVICE="$1"
  if [ -n "$SERVICE" ]; then
    echo -e "${BLUE}[*] Streaming logs for service: ${BOLD}${SERVICE}${NC}"
    docker compose logs -f "$SERVICE"
  else
    echo -e "${BLUE}[*] Streaming logs for all services (Press Ctrl+C to exit)...${NC}"
    docker compose logs -f
  fi
}

cmd_test() {
  check_docker
  echo -e "${BLUE}[*] Running backend financial engine test suite inside Docker...${NC}"
  docker compose run --rm backend npm test
  echo -e "${GREEN}[SUCCESS] All tests executed successfully!${NC}"
}

cmd_shell() {
  check_docker
  SERVICE="${1:-backend}"
  echo -e "${BLUE}[*] Opening interactive shell in container: ${BOLD}${SERVICE}${NC}"
  docker compose exec "$SERVICE" /bin/sh
}

cmd_db_inspect() {
  check_docker
  echo -e "${BLUE}[*] Inspecting SQLite database inside container...${NC}"
  docker compose exec backend node -e "
    const db = require('./dist/db/database').default || require('better-sqlite3')(process.env.DB_PATH || '/app/data/loan_tool.db');
    console.log('\n--- Loan Presets ---');
    console.table(db.prepare('SELECT id, type, name, default_amount, default_rate, default_tenure_years FROM loan_presets').all());
    console.log('\n--- Saved Calculations ---');
    console.table(db.prepare('SELECT id, share_code, title, calculator_type, created_at FROM saved_calculations LIMIT 10').all());
  "
}

cmd_clean() {
  check_docker
  echo -e "${YELLOW}[!] This will stop and remove containers and networks.${NC}"
  read -p "Do you also want to wipe the SQLite database file in ./data? (y/N): " confirm
  docker compose down
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    rm -rf data/*.db*
    echo -e "${RED}[*] SQLite data files wiped.${NC}"
  fi
  echo -e "${GREEN}[SUCCESS] Clean complete.${NC}"
}

cmd_help() {
  print_banner
  echo -e "${BOLD}USAGE:${NC} ./scripts/manage.sh [command]\n"
  echo -e "${BOLD}COMMANDS:${NC}"
  echo -e "  ${GREEN}start${NC}       Builds (if needed) and starts frontend and backend in background"
  echo -e "  ${GREEN}stop${NC}        Stops all running containers"
  echo -e "  ${GREEN}restart${NC}     Restarts all containers"
  echo -e "  ${GREEN}rebuild${NC}     Rebuilds Docker images and restarts services with hot-reload"
  echo -e "  ${GREEN}status${NC}      Displays container health, ports, and connection status"
  echo -e "  ${GREEN}logs${NC} [svc]  Streams live logs (e.g. ./scripts/manage.sh logs backend)"
  echo -e "  ${GREEN}test${NC}        Executes unit and integration test suite inside Docker"
  echo -e "  ${GREEN}shell${NC} [svc] Opens interactive terminal inside container (default: backend)"
  echo -e "  ${GREEN}db:inspect${NC}  Queries and prints SQLite loan presets and saved calculations"
  echo -e "  ${GREEN}clean${NC}       Stops containers and removes Docker network"
  echo -e "  ${GREEN}help${NC}        Shows this help menu\n"
  echo -e "${BOLD}EXAMPLES:${NC}"
  echo -e "  ./scripts/manage.sh start"
  echo -e "  ./scripts/manage.sh status"
  echo -e "  ./scripts/manage.sh logs frontend"
  echo -e "  ./scripts/manage.sh test"
}

# Main Command Dispatcher
COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
  start|up)
    cmd_start
    ;;
  stop|down)
    cmd_stop
    ;;
  restart)
    cmd_restart
    ;;
  rebuild|build)
    cmd_rebuild
    ;;
  status|ps)
    cmd_status
    ;;
  logs)
    cmd_logs "$@"
    ;;
  test)
    cmd_test
    ;;
  shell|sh|bash)
    cmd_shell "$@"
    ;;
  db:inspect|db)
    cmd_db_inspect
    ;;
  clean)
    cmd_clean
    ;;
  help|--help|-h)
    cmd_help
    ;;
  *)
    echo -e "${RED}[ERROR] Unknown command: '$COMMAND'${NC}"
    cmd_help
    exit 1
    ;;
esac
