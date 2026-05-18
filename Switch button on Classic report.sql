
==========sql Query Example============

SELECT 
    user_id,
    username,
    -- Other columns...
    EDTPERMI,
    '<input type="checkbox" class="edit-switch" 
     data-id="' || user_id || '" 
     ' || CASE WHEN EDTPERMI = 1 THEN 'checked' ELSE '' END || '>' AS EDIT_SWITCH
FROM tbluser


===============Inline css on page===========
.edit-switch {
  appearance: none;
  -webkit-appearance: none;
  width: 44px;
  height: 24px;
  background: #ccc;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
  outline: none;
}

.edit-switch::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.edit-switch:checked {
  background: #0076df;
}

.edit-switch:checked::before {
  transform: translateX(20px);
}

========Create Dynamic Action=========

Step 5 — Create the Dynamic Action

Right-click Dynamic Actions → Create
Fill in:

Setting 						Value 
Name 							Update EDTPERMI on Switch Toggle
Event							Change
Selection Type					jQuery Selector
jQuery Selector					.edit-switch (Note# it is class name of column)
Condition					  — (none needed)


========Step 6 — Add a True Action: Execute JavaScript==========
Under the Dynamic Action True branch, add Execute JavaScript Code:


var checkbox = this.triggeringElement;
var userId   = $(checkbox).data('id');
var newVal   = checkbox.checked ? 1 : 0;

// Store in hidden item
$s('P1_SELECTED_USER_ID', userId);						/* Pick Value to Item */

// Call AJAX to update DB
apex.server.process('UPDATE_PROCESS', {   				/*Note# UPDATE_PROCESS IS Ajax Process Name*/
    x01: userId,
    x02: newVal
}, {
    success: function(data) {
        if (data.status === 'success') {
            apex.message.showPageSuccess('Permission updated successfully.');
        } else {
            apex.message.showErrors([{
                type:     'error',
                location: 'page',
                message:  'Update failed. Please try again.',
                unsafe:   false
            }]);
        }
    },
    error: function() {
        apex.message.showErrors([{
            type:     'error',
            location: 'page',
            message:  'Server error occurred.',
            unsafe:   false
        }]);
    }
});


============Step 7 — Create the AJAX Callback Process===============

DECLARE
    v_user_id  NUMBER := TO_NUMBER(apex_application.g_x01);
    v_new_val  NUMBER := TO_NUMBER(apex_application.g_x02);
BEGIN
    UPDATE tbluser
    SET    EDTPERMI = v_new_val
    WHERE  user_id  = v_user_id;
    
    COMMIT;
    
    apex_json.open_object;
    apex_json.write('status', 'success');
    apex_json.close_object;
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        apex_json.open_object;
        apex_json.write('status',  'error');
        apex_json.write('message', SQLERRM);
        apex_json.close_object;
END;




==============End of Process====================
