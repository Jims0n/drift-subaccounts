#!/bin/bash

# Define color codes
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
NC="\e[0m"

# Function to print colored messages
print_message() {
    local script_name=$1
    local message=$2
    echo -e "${BLUE}#task - (${script_name}): ${message}${NC}"
}

# Function to print and execute a command
print_exec_command() {
    local script_name=$1
    local command=$2
    
    print_message "${script_name}" "Executing: ${command}"
    eval ${command}
} 