// Get the Interactive Grid
var ig$ = apex.region("emp_ig").widget(); // Replace "emp_ig" with your IG static ID
var grid = ig$.interactiveGrid("getViews", "grid");
var model = grid.model;
var selectedRecords = grid.getSelectedRecords();

apex.message.confirm(
    "Are you sure you want to confirm " + selectedRecords.length + " employee(s)?",
    function(okPressed) {
        if (okPressed) {
// Your apex.server.process code here


	if (selectedRecords.length === 0) {
		apex.message.alert("Please select at least one employee!");
		return false;
	}

	// Prepare data array
	var dataArray = [];
			selectedRecords.forEach(function(record) {
				var hireDateValue = model.getValue(record, "HIREDATE");
				var confirmDateValue = model.getValue(record, "CONFIRMATION_DATE");
				var effectiveDateValue = model.getValue(record, "EFFECTIVE_DATE");
				
					// Format dates to YYYY-MM-DD
					var formatDate = function(dateVal) {
						if (!dateVal) return null;
						if (dateVal instanceof Date) {
							return dateVal.toISOString().split('T')[0];
						}
						return dateVal;
						};
				
					dataArray.push({
							fingerId: model.getValue(record, "FINGER_ID"),
							idNumber: model.getValue(record, "ID_NUMBER"),
							empName: model.getValue(record, "NAME"),
							designation: model.getValue(record, "DESIGNATION"),
							department: model.getValue(record, "DEPARTMENT"),
							hireDate: formatDate(hireDateValue),
							provisionPeriod: model.getValue(record, "PROVISION_PERIOD"),
							confirmationDate: formatDate(confirmDateValue),
							effectiveDate: formatDate(effectiveDateValue)
							});
				});

				// Call AJAX process
				apex.server.process(
									'INSERT_CONFIRMATION_DATA',
									{
										x01: JSON.stringify(dataArray)
									},
									{
										dataType: 'json',
										success: function(data) {
											apex.message.showPageSuccess(selectedRecords.length + " employee(s) inserted successfully!");
											// Refresh the IG
											apex.region("emp_ig").refresh();
										},
										error: function(jqXHR, textStatus, errorThrown) {
											apex.message.alert("Error: " + textStatus);
										}
									}
									);

        }
    }
);


================AJAX Call back process=======

create a process name is "INSERT_CONFIRMATION_DATA" and Past into PL/SQL Code.


DECLARE
    l_data         APEX_JSON.T_VALUES;
    l_count        NUMBER := 0;
    l_finger_id    VARCHAR2(100);
    l_id_number    VARCHAR2(100);
    l_emp_name     VARCHAR2(200);
    l_designation  VARCHAR2(200);
    l_department   VARCHAR2(200);
    l_hire_date    DATE;
    l_provision    NUMBER;
    l_confirm_date DATE;
    l_effective_date DATE;
BEGIN
    -- Parse the JSON data
    APEX_JSON.parse(l_data, apex_application.g_x01);
    
    -- Get count of records
    FOR i IN 1 .. APEX_JSON.get_count(p_path => '.', p_values => l_data) LOOP
        BEGIN
            -- Extract values from JSON
            l_finger_id := APEX_JSON.get_varchar2(
                p_path => '[%d].fingerId', 
                p0 => i, 
                p_values => l_data
            );
            
            l_id_number := APEX_JSON.get_varchar2(
                p_path => '[%d].idNumber', 
                p0 => i, 
                p_values => l_data
            );
            
            l_emp_name := APEX_JSON.get_varchar2(
                p_path => '[%d].empName', 
                p0 => i, 
                p_values => l_data
            );
            
            l_designation := APEX_JSON.get_varchar2(
                p_path => '[%d].designation', 
                p0 => i, 
                p_values => l_data
            );
            
            l_department := APEX_JSON.get_varchar2(
                p_path => '[%d].department', 
                p0 => i, 
                p_values => l_data
            );
            
            l_provision := APEX_JSON.get_number(
                p_path => '[%d].provisionPeriod', 
                p0 => i, 
                p_values => l_data
            );
            
            -- Handle date conversions
            BEGIN
                l_hire_date := TO_DATE(
                    APEX_JSON.get_varchar2(p_path => '[%d].hireDate', p0 => i, p_values => l_data),
                    'YYYY-MM-DD'
                );
            EXCEPTION
                WHEN OTHERS THEN
                    l_hire_date := NULL;
            END;
            
            BEGIN
                l_confirm_date := TO_DATE(
                    APEX_JSON.get_varchar2(p_path => '[%d].confirmationDate', p0 => i, p_values => l_data),
                    'YYYY-MM-DD'
                );
            EXCEPTION
                WHEN OTHERS THEN
                    l_confirm_date := NULL;
            END;
            
            BEGIN
                l_effective_date := TO_DATE(
                    APEX_JSON.get_varchar2(p_path => '[%d].effectiveDate', p0 => i, p_values => l_data),
                    'YYYY-MM-DD'
                );
            EXCEPTION
                WHEN OTHERS THEN
                    l_effective_date := NULL;
            END;
            
            -- Insert into employee_confirmation table
            -- Adjust column names based on your actual table structure
            INSERT INTO employee_confirmation2 (
                finger_id,
                id_number,
                emp_name,
                designation,
                department,
                hire_date,
                provision_period,
                confirmation_date,
                effective_date
            ) VALUES (
                l_finger_id,
                l_id_number,
                l_emp_name,
                l_designation,
                l_department,
                l_hire_date,
                l_provision,
                l_confirm_date,
                l_effective_date
            );
            
            l_count := l_count + 1;
            
        EXCEPTION
            WHEN DUP_VAL_ON_INDEX THEN
                -- Handle duplicate records (if primary key exists)
                NULL; -- Skip duplicate
            WHEN OTHERS THEN
                -- Log error but continue processing other records
                apex_debug.error('Error inserting record ' || i || ': ' || SQLERRM);
        END;
    END LOOP;
    
    -- Commit the transaction
    COMMIT;
    
    -- Return JSON response
    apex_json.open_object;
    apex_json.write('success', true);
    apex_json.write('count', l_count);
    apex_json.write('message', l_count || ' employee(s) processed successfully');
    apex_json.close_object;
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        apex_json.open_object;
        apex_json.write('success', false);
        apex_json.write('error', SQLERRM);
        apex_json.write('count', 0);
        apex_json.close_object;
END;