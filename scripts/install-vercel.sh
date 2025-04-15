#!/bin/bash

# Get the start time
start_time=$(date +%s)

# Source the utils script
source ./scripts/utils.sh

SCRIPT_NAME="install-vercel.sh"

function print() {
  local message=$1
  print_message "${SCRIPT_NAME}" "${message}"
}

# Function to pull the drift protocol submodule
function init_protocol_submodule() {
  print "Initializing drift-protocol-v2 submodule"
  print_exec_command "${SCRIPT_NAME}" "git submodule update --init drift-protocol-v2"
}

# Function to install and link a package
function install_and_link() {
  local folder=$1
  local should_link=$2
  local links=("${@:3}")
  
  print "Installing dependencies for ${folder}"
  cd "${folder}"
  
  print_exec_command "${SCRIPT_NAME}" "npm install --legacy-peer-deps"
  
  # Link the package if requested
  if [ "${should_link}" = "true" ]; then
    print "Creating global link for ${folder}"
    print_exec_command "${SCRIPT_NAME}" "npm link"
  fi
  
  # Link dependencies if provided
  for link in "${links[@]}"; do
    if [ -n "${link}" ]; then
      print "Linking dependency ${link} in ${folder}"
      print_exec_command "${SCRIPT_NAME}" "npm link ${link}"
    fi
  done
  
  cd - > /dev/null
}

# Main installation process
print "Starting Vercel installation process"

# Initialize protocol submodule
init_protocol_submodule

# Install and build SDK
print "Installing SDK dependencies"
install_and_link "./drift-protocol-v2/sdk" "true"

# Install main application dependencies
print "Installing main application dependencies"
install_and_link "." "false" "@drift-labs/sdk"

# Install polyfills explicitly
print "Installing browser polyfills"
print_exec_command "${SCRIPT_NAME}" "npm install browserify-zlib buffer crypto-browserify https-browserify os-browserify path-browserify process stream-browserify stream-http --legacy-peer-deps"

# Get the end time
end_time=$(date +%s)

# Calculate and print the execution time
execution_time=$((end_time - start_time))
print "Installation completed in ${execution_time} seconds" 