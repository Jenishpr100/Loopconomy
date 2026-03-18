#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$MAIN_DIR/.bot.pid"
LOG_FILE="$MAIN_DIR/bot.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    fi
}

is_running() {
    local pid=$(get_pid)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    fi
    return 1
}

print_banner() {
    clear
    echo -e "${MAGENTA}"
    cat <<'EOF'
 ╔════════════════════════════════════════╗
 ║        Loopconomy Bot Manager          ║
 ╚════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

show_status() {
    echo -e "${CYAN}${BOLD}Bot Status:${NC}"
    echo ""
    
    if is_running; then
        local pid=$(get_pid)
        local uptime=$(ps -o etime= -p "$pid" 2>/dev/null || echo "unknown")
        local cpu=$(ps -o %cpu= -p "$pid" 2>/dev/null || echo "0")
        local mem=$(ps -o %mem= -p "$pid" 2>/dev/null || echo "0")
        
        echo -e "  ${GREEN}● RUNNING${NC}"
        echo -e "  PID: $pid"
        echo -e "  Uptime: $uptime"
        echo -e "  CPU: ${cpu}%"
        echo -e "  Memory: ${mem}%"
        
        if [ -f "$LOG_FILE" ]; then
            local lines=$(wc -l < "$LOG_FILE")
            echo -e "  Log lines: $lines"
        fi
    else
        echo -e "  ${RED}● STOPPED${NC}"
    fi
    echo ""
}

start_bot() {
    if is_running; then
        echo -e "${YELLOW}Bot is already running!${NC}"
        return 1
    fi
    
    cd "$MAIN_DIR"
    
    echo "Starting bot..."
    nohup node main.js >> "$LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$PID_FILE"
    
    sleep 2
    
    if is_running; then
        echo -e "${GREEN}Bot started successfully! (PID: $pid)${NC}"
    else
        echo -e "${RED}Bot failed to start. Check logs.${NC}"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop_bot() {
    if ! is_running; then
        echo -e "${YELLOW}Bot is not running.${NC}"
        return 1
    fi
    
    local pid=$(get_pid)
    echo "Stopping bot (PID: $pid)..."
    
    kill "$pid"
    
    local count=0
    while kill -0 "$pid" 2>/dev/null && [ $count -lt 30 ]; do
        sleep 1
        ((count++))
        echo -n "."
    done
    echo ""
    
    if is_running; then
        echo -e "${YELLOW}Force killing...${NC}"
        kill -9 "$pid" 2>/dev/null
    fi
    
    rm -f "$PID_FILE"
    echo -e "${GREEN}Bot stopped.${NC}"
}

restart_bot() {
    echo "Restarting bot..."
    stop_bot
    sleep 1
    start_bot
}

view_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "No log file found."
        return 1
    fi
    
    echo -e "${CYAN}Showing last 50 lines. Press Ctrl+C to exit.${NC}"
    echo ""
    tail -n 50 -f "$LOG_FILE"
}

view_full_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "No log file found."
        return 1
    fi
    
    less "$LOG_FILE"
}

clear_logs() {
    if [ -f "$LOG_FILE" ]; then
        read -p "Clear log file? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            > "$LOG_FILE"
            echo -e "${GREEN}Logs cleared.${NC}"
        fi
    else
        echo "No logs to clear."
    fi
}

update_bot() {
    echo "Pulling updates from Git..."
    cd "$MAIN_DIR"
    
    if command -v git &> /dev/null; then
        git pull origin beta2
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Updates pulled successfully${NC}"
            
            if [ -d "node_modules" ]; then
                echo "Checking for new dependencies..."
                npm install 2>/dev/null
            fi
            
            if is_running; then
                read -p "Restart bot to apply updates? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    restart_bot
                fi
            fi
        else
            echo -e "${RED}✗ Git pull failed${NC}"
        fi
    else
        echo -e "${RED}Git not found.${NC}"
    fi
}

backup_database() {
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}PostgreSQL client not found.${NC}"
        return 1
    fi
    
    cd "$MAIN_DIR"
    
    if [ -f .env ]; then
        source .env
        
        if [ -n "$DATABASE_URL" ]; then
            local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
            echo "Creating backup: $backup_file"
            
            if pg_dump "$DATABASE_URL" > "$backup_file" 2>/dev/null; then
                echo -e "${GREEN}✓ Backup created: $backup_file${NC}"
                
                read -p "Compress backup? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    gzip "$backup_file"
                    echo -e "Backup compressed: ${backup_file}.gz"
                fi
            else
                echo -e "${RED}✗ Backup failed${NC}"
            fi
        else
            echo -e "${RED}DATABASE_URL not set.${NC}"
        fi
    else
        echo -e "${RED}.env file not found.${NC}"
    fi
}

show_menu() {
    print_banner
    show_status
    
    echo -e "${CYAN}${BOLD}        ╔════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}        ║        Management Menu         ║${NC}"
    echo -e "${CYAN}${BOLD}        ╚════════════════════════════════╝${NC}"
    echo ""
    
    if is_running; then
        echo -e "  ${GREEN}1.${NC} Stop Bot"
    else
        echo -e "  ${GREEN}1.${NC} Start Bot"
    fi
    echo -e "  ${BOLD}2.${NC} Restart Bot"
    echo -e "  ${BOLD}3.${NC} View Logs (live)"
    echo -e "  ${BOLD}4.${NC} View Full Logs"
    echo -e "  ${BOLD}5.${NC} Clear Logs"
    echo -e "  ${BOLD}6.${NC} Update Bot (git pull)"
    echo -e "  ${BOLD}7.${NC} Backup Database"
    echo -e "  ${BOLD}8.${NC} Refresh Status"
    echo -e "  ${RED}9.${NC} Exit"
    echo ""
}

main() {
    while true; do
        show_menu
        read -p "Select option: " choice
        echo ""
        
        case $choice in
            1)
                if is_running; then
                    stop_bot
                else
                    start_bot
                fi
                echo ""
                read -p "Press Enter to continue..."
                ;;
            2)
                restart_bot
                echo ""
                read -p "Press Enter to continue..."
                ;;
            3)
                view_logs
                ;;
            4)
                view_full_logs
                ;;
            5)
                clear_logs
                echo ""
                read -p "Press Enter to continue..."
                ;;
            6)
                update_bot
                echo ""
                read -p "Press Enter to continue..."
                ;;
            7)
                backup_database
                echo ""
                read -p "Press Enter to continue..."
                ;;
            8)
                continue
                ;;
            9)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                echo "Invalid option."
                sleep 1
                ;;
        esac
    done
}

main "$@"