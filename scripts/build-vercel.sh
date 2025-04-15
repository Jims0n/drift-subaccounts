#!/bin/bash

# Get the start time
start_time=$(date +%s)

# Source the utility script
source ./scripts/utils.sh

SCRIPT_NAME="build-vercel.sh"

function print() {
  local message=$1
  print_message "${SCRIPT_NAME}" "${message}"
}

# Function to build a package
function build_package() {
  local folder=$1
  local build_command=${2:-"build"}
  local additional_command=$3
  
  print "Building package in ${folder}"
  cd "${folder}"
  
  # Run additional command if provided
  if [ -n "${additional_command}" ]; then
    print "Running additional command: ${additional_command}"
    print_exec_command "${SCRIPT_NAME}" "${additional_command}"
  fi
  
  # Run build command
  print "Running build command: npm run ${build_command}"
  print_exec_command "${SCRIPT_NAME}" "npm run ${build_command}"
  
  cd - > /dev/null
}

# Print environment info
print "Node version: $(node -v)"
print "NPM version: $(npm -v)"

# Store current directory for reference
base_directory=$(pwd)

# Build SDK first
print "Building SDK"
build_package "./drift-protocol-v2/sdk" "build:browser" "npm install @project-serum/borsh @solana/spl-token --legacy-peer-deps"

# Return to base directory
cd "${base_directory}"

# Install necessary webpack polyfills
print "Installing webpack polyfills"
print_exec_command "${SCRIPT_NAME}" "npm install rpc-websockets@7.5.1 crypto-browserify stream-browserify path-browserify browserify-zlib stream-http https-browserify os-browserify buffer process --legacy-peer-deps"

# Build main application
print "Building main application"
build_package "." "build"

# Copy necessary files for standalone output
print "Preparing standalone output"
print_exec_command "${SCRIPT_NAME}" "mkdir -p .next/standalone/public"
print_exec_command "${SCRIPT_NAME}" "cp -r public/* .next/standalone/public/"
print_exec_command "${SCRIPT_NAME}" "cp -r .next/static .next/standalone/.next/"

# Get the end time
end_time=$(date +%s)

# Calculate and print the execution time
execution_time=$((end_time - start_time))
print "Build completed in ${execution_time} seconds" 