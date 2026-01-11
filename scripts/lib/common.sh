#!/bin/bash
# ============================================
# Common Shell Script Utilities
# Source this file in your scripts:
#   source "$(dirname "$0")/lib/common.sh"
# ============================================

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export PURPLE='\033[0;35m'
export CYAN='\033[0;36m'
export NC='\033[0m' # No Color

# ============================================
# LOGGING FUNCTIONS
# ============================================

print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
  if [ "${DEBUG:-false}" = "true" ]; then
    echo -e "${PURPLE}[DEBUG]${NC} $1"
  fi
}

# Print a header/banner
print_header() {
  echo ""
  echo -e "${CYAN}========================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}========================================${NC}"
  echo ""
}

# ============================================
# SERVER CHECK FUNCTIONS
# ============================================

# Check if a server is running on a port
check_server() {
  local port="${1:-4200}"
  local url="http://localhost:$port"
  
  if curl -s "$url" > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Wait for server to be ready
wait_for_server() {
  local port="${1:-4200}"
  local max_attempts="${2:-60}"
  local interval="${3:-3}"
  local url="http://localhost:$port"
  
  print_status "Waiting for server on port $port..."
  
  for i in $(seq 1 $max_attempts); do
    if curl -s "$url" > /dev/null 2>&1; then
      print_success "Server is ready on port $port!"
      return 0
    fi
    sleep $interval
  done
  
  print_error "Server failed to start within $((max_attempts * interval)) seconds"
  return 1
}

# ============================================
# DEPENDENCY CHECK FUNCTIONS
# ============================================

# Check if a command exists
require_command() {
  local cmd="$1"
  local install_hint="${2:-}"
  
  if ! command -v "$cmd" &> /dev/null; then
    print_error "Required command '$cmd' not found"
    if [ -n "$install_hint" ]; then
      echo "  Install with: $install_hint"
    fi
    return 1
  fi
  return 0
}

# Check multiple commands
require_commands() {
  local missing=0
  for cmd in "$@"; do
    if ! command -v "$cmd" &> /dev/null; then
      print_error "Required command '$cmd' not found"
      missing=1
    fi
  done
  return $missing
}

# ============================================
# FILE/DIRECTORY FUNCTIONS
# ============================================

# Get the script directory (works even with symlinks)
get_script_dir() {
  local source="${BASH_SOURCE[0]}"
  while [ -h "$source" ]; do
    local dir="$(cd -P "$(dirname "$source")" && pwd)"
    source="$(readlink "$source")"
    [[ $source != /* ]] && source="$dir/$source"
  done
  echo "$(cd -P "$(dirname "$source")" && pwd)"
}

# Get the project root (assumes scripts are in PROJECT_ROOT/scripts/)
get_project_root() {
  local script_dir="$(get_script_dir)"
  echo "$(cd "$script_dir/.." && pwd)"
}

# ============================================
# ENVIRONMENT FUNCTIONS
# ============================================

# Load .env file if it exists
load_env() {
  local env_file="${1:-.env}"
  
  if [ -f "$env_file" ]; then
    print_debug "Loading environment from $env_file"
    set -a
    source "$env_file"
    set +a
    return 0
  else
    print_debug "No $env_file file found"
    return 1
  fi
}

# Check if running in CI environment
is_ci() {
  [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${NETLIFY:-}" ]
}

# Check if running on macOS
is_macos() {
  [[ "$OSTYPE" == "darwin"* ]]
}

# Check if running on Linux
is_linux() {
  [[ "$OSTYPE" == "linux-gnu"* ]]
}

# ============================================
# PROCESS FUNCTIONS
# ============================================

# Kill process on port
kill_port() {
  local port="$1"
  
  if is_macos; then
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
  else
    fuser -k $port/tcp 2>/dev/null || true
  fi
}

# Run command with timeout (macOS compatible)
run_with_timeout() {
  local timeout="$1"
  shift
  
  if command -v gtimeout &> /dev/null; then
    gtimeout "$timeout" "$@"
  elif command -v timeout &> /dev/null; then
    timeout "$timeout" "$@"
  else
    # Fallback: just run the command
    "$@"
  fi
}

# ============================================
# VALIDATION FUNCTIONS
# ============================================

# Validate UUID format
is_valid_uuid() {
  local uuid="$1"
  [[ "$uuid" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$ ]]
}

# ============================================
# OUTPUT FUNCTIONS
# ============================================

# Print a separator line
print_separator() {
  echo "----------------------------------------"
}

# Print key-value pair
print_kv() {
  local key="$1"
  local value="$2"
  printf "  %-20s %s\n" "$key:" "$value"
}

# ============================================
# CLEANUP FUNCTIONS
# ============================================

# Register cleanup function (call at start of script)
# Usage: register_cleanup "cleanup_function_name"
register_cleanup() {
  local cleanup_fn="$1"
  trap "$cleanup_fn" EXIT INT TERM
}
