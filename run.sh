#!/bin/bash

check_file() {
    partial_name=$1

    if find . -type f -wholename "*$partial_name*"; then
        return 0
    else
        return 1
    fi
}

check_dir() {
    dir_name=$1

    if [ ! -d "$dir_name" ]; then
        mkdir -p "$dir_name"
    fi
}

remove_xlsx_files() {
    path=$1
    
    rm -rf "$path"/*.xlsx

}

main() {

    echo "Initializing process"
    script_path="$(cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P)"
    export PYTHONPATH=$script_path

    dir_list=("temp" "forms" "output")

    echo "Removing old files"
    for i in "${dir_list[@]}";
        do
            check_dir "$script_path/$i"
            remove_xlsx_files "$script_path/$i"
        done

    echo "Running extraction routines"
    
    npm start

    # Running data handling routines
    if [ $(find "$script_path/forms" | grep xlsx | wc -l) == 16 ];
    
    then
        python scripts/create_output_file.py
    else
        return 1
    fi
 
    if check_file "$script_path/temp/unified_siga.xlsx";
    then
        python scripts/handle_output_file.py
    else
        echo "Missing file: unified_siga.xlsx"
        return 1
    fi

    if check_file "$script_path/output/total_leads.xlsx";
    then
        python scripts/get_todays_leads.py
    else
        echo "Missing file: total_leads.xlsx"
        return 1
    fi

    if check_file "$script_path/output/last_days_leads.xlsx";
    then
        python scripts/create_rd_pattern.py
    else
        echo "Missing file: last_days_leads.xlsx"
        return 1
    fi

    if check_file "$script_path/output/rd_input";
    then
        python scripts/create_new_deals.py
    else
        echo "Missing file: rd_input"
        return 1
    fi
}

main