#!/bin/bash

check_file() {
    file_name=$1

    if [ -f $file_name ];
    then
        return 0
    else
        return 1
    fi
}

remove_xlsx_files() {
    path=$1
    
    rm -rf "$path"/*.xlsx

}

main() {

    script_path="$(cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P)"
    export PYTHONPATH=$script_path

    dir_list=("temp" "forms" "output")

    # Removing old files
    for i in "${dir_list[@]}";
        do
            remove_xlsx_files "$script_path/data_extraction/$i"
        done

    # Running extraction routines
    npm run manager
    npm run agent

    # Running data handling routines
    if [ $(find "$script_path/forms" | grep xlsx | wc -l) == 16 ];
    then
        python data_handling/scripts/create_output_file.py
    else
        return 1
    fi
 
    if check_file "$script_path/temp/unified_siga.xlsx";
    then
        python data_handling/scripts/handle_output_file.py
    else
        echo "Missing file: unified_siga.xlsx"
        return 1
    fi

    if check_file "$script_path/output/total_leads.xlsx";
    then
        python data_handling/scripts/get_todays_leads.py
    else
        echo "Missing file: total_leads.xlsx"
        return 1
    fi

    if check_file "$script_path/output/last_days_leads.xlsx";
    then
        python data_handling/scripts/create_rd_pattern.py
    else
        echo "Missing file: last_days_leads.xlsx"
        return 1
    fi
}

main