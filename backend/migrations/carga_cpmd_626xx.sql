-- Ingesta CPMD exportada a SQL
-- Fecha: 2026-04-15 09:34:04
BEGIN;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '10.00.00', 'e-label Memory Error', 'An e-label Memory Error on toner cartridge. The printer is unable to read the toner cartridge data. The toner cartridge is present but defective. When this error occurs, a question mark appears on the gas gauge of the supply or supplies with the error.', 
        '["Check the toner cartridge.", "If the message displays again, turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 35, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '10.00.10', 'e-label Missing Memory Error', 'The printer is unable to detect the e-label. This message indicates that the printer has determined that the e-label is missing. When this error occurs, a question mark appears on the gas gauge of the supply or supplies with the error.', 
        '["Check the toner cartridge.", "If the message displays again, turn the printer off, and then on.", "If the error persists, replace the toner cartridge.", "If the error persists, please contact customer support.", "Check the toner cartridge."]'::jsonb, '[]'::jsonb, 
        'customers', 37, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '10.00.15', 'Install Toner Cartridge', 'A supply is either not installed or not correctly installed in the printer. The 10.00.15 is an event log only message, it will not show on the control panel. The only message to display will be Install Toner Cartridge.', 
        '["Replace or reinstall the toner cartridge correctly to continue printing.", "Test printer with a new toner cartridge.", "If the error persists with a new toner cartridge check the toner cartridge contacts inside the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 38, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '10.23.15', 'Install Fuser kit', 'The fuser is either not installed, or not correctly installed in the printer.', 
        '["Turn the printer off.", "Remove, and then reinstall the fuser."]'::jsonb, '[]'::jsonb, 
        'customers', 41, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '11.WX.YZ', 'error messages', '11.* errors Errors in the 11.* family are related to the printer real-time clock.', 
        '["Set the time and date on the printer control panel.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Set the time and date on the printer control panel.", "If the error persists, remove and reinstall the formatter. Make sure it is fully seated.", "If the error still persists, replace the formatter."]'::jsonb, '[]'::jsonb, 
        'customers', 65, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.WX.YZ', 'error messages', '13.* errors Errors in the 13.* family are related to jams. More than 1000 unique error codes are possible. Use the following information to understand the jam code. Not all codes apply to all printers. Message format: 13.WX.YZ ● W represents the jam location. ● X represents the sensor or door that triggered the jam. ● Y represents the jam condition (delay, stay, wrap, etc.) ● Z represents the paper source, fuser mode, or destination Table 6-4 Potential values for W and X W Jam location X Sensor or door A Input area 0 Envelope feeder A Input area 1 Tray 1 feed (unless Tray 1 feed is the registration sensor) A Input area 2 Tray 2 feed (unless Tray 2 feed is the registration sensor) A Input area 3 Tray 3 feed A Input area 4 Tray 4 feed NOTE: If available for specified printer A Input area 5 Tray 5 feed NOTE: If available for specified printer A Input area 6 Tray 6 feed NOTE: If available for specified printer A Input area 7 Optional tray exit sensor A Input area A Door 1 A Input area B Door 2 A Input area C Door 3 NOTE: If available for specified printer A Input area D Door 4 NOTE: If available for specified printer A Input area E Door 5 NOTE: If available for specified printer A Input area F Multiple sensors or doors B Image area 0 Media sensor for forbidden transparencies 56 Chapter 6 Numerical control panel messages Table 6-4 Potential values for W and X (continued) W Jam location X Sensor or door B Image area 2 Registration/top of page B Image area 3 Top of page B Image area 4 Loop B Image area 5 Fuser input B Image area 9 Fuser output B Image area A Door 1 B Image area B Door 2 B Image area F Multiple sensors or doors C Switchback area (between the fuser and the output bin) 1 Intermediate switchback sensor C Switchback area (between the fuser and the output bin) 2 Switchback media stay sensor C Switchback area (between the fuser and the output bin) 3 Paper delivery sensor D Duplex area 1 Duplex switchback D Duplex area 2 Duplex delivery D Duplex area 3 Duplex refeed D Duplex area A Door 1 (if different than the imaging area) D Duplex area B Door 2 (if different than the imaging area) D Duplex area F Multiple sensors or doors E Output or intermediate paper transport unit (IPTU) area 1 Output bin full sensor E Output or intermediate paper transport unit (IPTU) area 2 IPTU feed sensor 1 E Output or intermediate paper transport unit (IPTU) area 3 IPTU sensor 2 E Output or intermediate paper transport unit (IPTU) area 4 IPTU sensor 3 E Output or intermediate paper transport unit (IPTU) area 5 IPTU bin full sensor 4 E Output or intermediate paper transport unit (IPTU) area 6 Output sensor E Output or intermediate paper transport unit (IPTU) area A Door 1 E Output or intermediate paper transport unit (IPTU) area F Multiple sensors or doors F Multiple subsystems (occurs when paper is stuck in several areas) F Multiple sensors or doors 1 Jetlink input device 4 Tray 4 feed sensor NOTE: If available for specified printer 13.* errors 57 Table 6-4 Potential values for W and X (continued) W Jam location X Sensor or door 1 Jetlink Input device 5 Tray 5 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 6 Tray 6 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 7 Tray 7 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 8 Tray 8 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 9 Tray 9 feed sensor NOTE: If available for specified printer 1 Jetlink Input device A Door 1 1 Jetlink Input device B Door 2 1 Jetlink Input device F Multiple sensors or doors 2 Buffer pass unit 0 Buffer pass inlet sensor 2 Buffer pass unit 9 Buffer pass exit sensor 2 Buffer pass unit A Door 1 3 Page insert unit 0 Page insertion inlet sensor 3 Page insert unit 1 Page insertion tray 1 feed sensor 3 Page insert unit 2 Page insertion tray 2 feed sensor 3 Page insert unit 3 Page insertion tray 3 feed sensor 3 Page insert unit 4 Page insertion tray 4 feed sensor 3 Page insert unit 7 Output path feed sensor 3 Page insert unit 9 Page insertion exit sensor 3 Page insert unit A Door 1 4 Punch unit 0 Puncher inlet sensor 4 Punch unit 1 Puncher jam sensor 4 Punch unit 9 Puncher exit sensor 4 Punch unit A Door 1 5 Folding unit 0 Folder inlet sensor 5 Folding unit 1 Folder sensor 5 Folding unit 9 Folder exit sensor 5 Folding unit A Door 1 6 Stacker unit 0 Stacker inlet sensor 6 Stacker unit 4 Stacker outlet sensor 58 Chapter 6 Numerical control panel messages Table 6-4 Potential values for W and X (continued) W Jam location X Sensor or door 6 Stacker unit 7 Stacker switchback entrance sensor 6 Stacker unit 8 Stacker switchback registration sensor 6 Stacker unit 9 Stacker switchback lower sensor 7 Multi-bin mailbox (MBM) unit 0 MBM inlet sensor 7 Multi-bin mailbox (MBM) unit 1 MBM middle sensor 7 Multi-bin mailbox (MBM) unit 9 Stapler sensor 7 Multi-bin mailbox (MBM) unit A Door 1 7 Multi-bin mailbox (MBM) unit B Door 2 7 Multi-bin mailbox (MBM) unit C Door 3 7 Multi-bin mailbox (MBM) unit F Multiple sensors or doors 8 Stapler/stacker (SS) unit 0 SS inlet sensor 8 Stapler/stacker (SS) unit 1 SS Bin Z 8 Stapler/stacker (SS) unit 3 SS unit middle sensor 8 Stapler/stacker (SS) unit 4 SS unit outlet sensor 1 8 Stapler/stacker (SS) unit 5 SS unit outlet sensor 2 8 Stapler/stacker (SS) unit 9 Stapler sensor 8 Stapler/stacker (SS) unit A Door 1 8 Stapler/stacker (SS) unit B Door 2 9 Booklet maker unit 0 Booklet maker input sensor 9 Booklet maker unit 2 Booklet maker feed sensor 2 9 Booklet maker unit 2 Booklet maker feed sensor 3 9 Booklet maker unit 4 Booklet maker delivery sensor 9 Booklet maker unit 5 Booklet maker vertical paper path sensor 9 Booklet maker unit 6 Booklet unit front staple sensor 9 Booklet maker unit 7 Booklet unit rear staple sensor 9 Booklet maker unit 8 Booklet unit outlet sensor 9 Booklet maker unit A Door 1 9 Booklet maker unit B Door 2 9 Booklet maker unit C Door 3 9 Booklet maker unit F Multiple sensors or doors 0 Unknown 0 Unknown 13.* errors 59 Table 6-5 Potential values for Y (jam condition) Y Jam condition 0 Unknown 1 Unexpected sheet (duplex) 2 Staple jam 3 Jam caused by an open door (duplex) 4 Stay jam (the page never left the tray – duplex) A Stay jam (the page never left the tray – simplex) B Multifeed C Wrap D Delay (the page did not reach the sensor within the expected time – simplex) E Door open F Residual (paper is detected in the paper path when it should not be there) The information represented by the value for Z depends on where the paper is in the paper path. Table 6-6 Potential values for Z (source, fuser mode, or destination) Paper location Z Source, fuser mode, or destination When paper has not reached the fuser, Z represents the paper source. 1 Tray 1 Z represents the paper source. 2 Tray 2 Z represents the paper source. 3 Tray 3 Z represents the paper source. 4 Tray 4 If available for specified printer Z represents the paper source. 5 Tray 5 If available for specified printer Z represents the paper source. 6 Tray 6 If available for specified printer Z represents the paper source. D Duplexer Z represents the paper source. E Envelope feeder When paper has reached the fuser, is in the duplex path, or in the output path, Z represents the fuser mode. Jams can occur when there is a mismatch between the actual paper and the fuser mode setting. 0 Photo 1, 2, or 3 Designated 2 or 3 Z represents the fuser mode. 1 Normal (automatically sensed rather than based on the paper type set at the control panel) Z represents the fuser mode. 2 Normal (based on the paper type set at the control panel) 60 Chapter 6 Numerical control panel messages Table 6-6 Potential values for Z (source, fuser mode, or destination) (continued) Paper location Z Source, fuser mode, or destination Z represents the fuser mode. 3 Light 1, 2, or 3 Z represents the fuser mode. 4 Heavy 1 Z represents the fuser mode. 5 Heavy 2 Z represents the fuser mode. 6 Heavy 3 Z represents the fuser mode. 7 Glossy 1 Z represents the fuser mode. 8 Glossy 2 Z represents the fuser mode. 9 Glossy 3 Z represents the fuser mode. A Glossy Film Z represents the fuser mode. B Transparency Z represents the fuser mode. C Label Z represents the fuser mode. D Envelope 1, 2, or 3 Z represents the fuser mode. E Rough When paper has entered the output bin, Z represents the output bin, numbered from top to bottom. 0 Unknown bin Z represents the output bin 1 Bin 1 Z represents the output bin 2 Bin 2 Z represents the output bin 3 Bin 3 Z represents the output bin 4 Bin 4 Z represents the output bin 5 Bin 5 Z represents the output bin 6 Bin 6 Z represents the output bin 7 Bin 7 Z represents the output bin 8 Bin 8 Z represents the output bin 9 Bin 9 All paper locations E Door open jam All paper locations F Residual jam All paper locations 0 Forbidden OHT jam (when Y=2)', 
        '["Follow the instructions on the control panel to clear the jam. Check for paper in all possible jam locations.", "Verify that no doors are open.", "Check the paper tray to make sure paper is loaded correctly. The paper guides should be adjusted to the", "Make sure the type and quality of the paper being used meets the HP specifications for the printer.", "Use a damp, lint-free cloth to clean the rollers in the appropriate tray. Replace rollers that are worn."]'::jsonb, '[]'::jsonb, 
        'customers', 70, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.AA.EE', 'Left door open', 'The left door was opened during printing.', 
        '["Close the left door to allow the printer to attempt to clear the jam.", "If the error persists, please contact customer support.", "Close the left door to allow the printer to attempt to clear the jam.", "Check the projection part on the left door that defeats the left door interlocks. If broken replace the left", "Check SW1 using the manual sensor test."]'::jsonb, '[]'::jsonb, 
        'customers', 96, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.AB.EE', 'Right door Open', 'The right door was opened during printing.', 
        '["Close the right door to allow the printer to attempt to clear the jam.", "Check the projection part on the right door that defeats the right door interlocks. If broken replace the right"]'::jsonb, '[]'::jsonb, 
        'customers', 97, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B2.AZ', 'Jam in right door', 'Paper stay jam in the right door at the image area. Paper present at PS4550 after a specified time limit has passed. ● 13.B2.A1 This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from Tray 1. ● 13.B2.A2 This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from Tray 2. ● 13.B2.A3 This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from Tray 3. ● 13.B2.AD This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from the duplexer. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 99, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B2.D1', 'Jam in right door', 'Paper delay jam in the right door at the image area. Paper did not reach PS4550 in the specified time when printing from Tray 1. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "Ensure that the tray 1 pickup and separation rollers are installed correctly and show no damage or wear.", "Clean or replace the pickup, feed, and separation rollers as needed.", "If the error persists, please contact customer support."]'::jsonb, '[]'::jsonb, 
        'customers', 101, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B2.D2', 'Jam in right door', 'Paper delay jam at the image area. Paper did not reach PS4550 in the specified time when printing from Tray 2. This error might occur in conjunction with the Tray 2 Overfilled or Roller Issue message.. If using adhesive or self-sealing media, please see the instructions in (ish_3199741-3199797-16).', 
        '["Clear the paper jam."]'::jsonb, '[]'::jsonb, 
        'customers', 103, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B2.D2', 'Jam in right door 89', 'b. Look for and clear any paper present or obstructions in the paper path. Grasp the jammed paper with both hands and pull it straight out to remove it out of the printer. c. Close the right door to allow the printer to attempt to clear the jam message. 2. Turn the printer off and unplug the power cord. 3. Open the left door and clear any paper present or obstructions in the paper path. Grasp any jammed paper with both hands and pull it straight out to remove it out of the printer. 4. Plug the power cord in and turn on the printer. 5. If the error persists, ensure the type and quality of the paper being used meets the HP specifications for the printer. NOTE: For supported sizes and types view HP LaserJet Enterprise M631-M633, HP LaserJet Managed E62555-E62575, E62655-E62675 - Supported paper sizes and types c05495229. 6. Pull out tray 2 completely out of the printer to remove it. 7. Ensure that the protective orange plastic shipping locks are removed, if present. 8. Remove any jammed or damaged sheets of paper from the tray. 9. If the error persists, ensure that the tray width and length guides are set to the correct paper size for the paper being installed into the tray. Figure 6-42 Tray 2 paper guides 90 Chapter 6 Numerical control panel messages 10. Ensure the paper is not filled above the fill mark (line below 3 triangles). Remove any excess media. Figure 6-43 Paper height guides Figure 6-44 Overfilled tray Figure 6-45 Stack of paper not overfilled in tray 2 11. Ensure that the feed and separation rollers are installed correctly and show no damage or wear.', 
        '["Reinstall tray 2.", "If the error persists, please contact customer support at: www.hp.com/go/contactHP.", "Clear the paper jam.", "Turn the printer off and unplug the power cord.", "Open the left door and clear any paper present or obstructions in the paper path."]'::jsonb, '[]'::jsonb, 
        'customers', 103, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B2.DX', 'Jam in right door', 'Paper delay jam at the image area. Paper passed PS3601 feed sensor in Tray 3 but did not reach the registration sensor (PS4550) in the designated amount of time when printing from Tray 3. Paper passed PS3601 feed sensor in Tray 3 but did not reach the registration sensor (PS4550) in the designated amount of time when printing from Tray 4. Paper passed PS3601 feed sensor in Tray 3 but did not reach the registration sensor (PS4550) in the designated amount of time when printing from Tray 5.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 119, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B2.FF', 'Jam in right door', 'Paper residual jam at image area. Paper present at PS4550, at power on or after clearing a jam. If using adhesive or self-sealing media, please see the instructions in (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Toggle the registration/TOP sensor (PS4550) to ensure that it moves freely.", "Test the registration/TOP sensor (PS4550) using the manual sensor test."]'::jsonb, '[]'::jsonb, 
        'customers', 124, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B4.FF', 'Jam in right door', 'Paper residual jam at image area. Paper present at fuser loop sensor PS4500 at power on or after clearing a jam. If using adhesive or self-sealing media, please see the instructions in (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Remove the fuser and check for paper and the correct movement of the sensors PS4500."]'::jsonb, '[]'::jsonb, 
        'customers', 125, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B9.AZ', 'Fuser jam 113', '● The output bin rollers are not turning. Because there is very little distance from the fuser exit to the output bin, paper stopped at the rollers can cause a fuser jam. ● A sticky fuser exit flag. If the flag is stuck or even delayed momentarily in the activated position it can cause this jam. ● Self-sealing or adhesive media is being used. Please see the instructions in . (ish_3199741-3199797-16). ● 13.B9.A1 jam is detected when printing from Tray 1. ● 13.B9.A2 jam is detected when printing from Tray 2. ● 13.B9.A3 jam is detected when printing from Tray 3. ● 13.B9.A4 jam is detected when printing from Tray 4. ● 13.B9.A5 jam is detected when printing from Tray 5. ● 13.B9.AD jam is detected when printing from the duplexer.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 127, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B9.CZ', '115', '● 13.B9.C1 Fuser wrap jam when Auto Sense (Normal). ● 13.B9.C2 Fuser wrap jam when Normal. ● 13.B9.C3 Fuser wrap jam when Light 1 or Light 2. ● 13.B9.C4 Fuser wrap jam when Heavy 1. ● 13.B9.C5 Fuser wrap jam when Heavy 2. ● 13.B9.C6 Fuser wrap jam when Heavy Paper 3. ● 13.B9.C7 Fuser wrap jam when Glossy Paper 1. ● 13.B9.C8 Fuser wrap jam when Glossy Paper 2. ● 13.B9.C9 Fuser wrap jam when Glossy Paper 3. ● 13.B9.CB Fuser wrap jam when Transparency. ● 13.B9.CC Fuser wrap jam when Label. ● 13.B9.CD Fuser wrap jam when Envelope 1 or Envelope 2. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16)', 
        '["Clear the paper jam.", "Print a cleaning page to ensure that all of the toner is removed from the fuser roller.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam."]'::jsonb, '[]'::jsonb, 
        'customers', 129, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.D3.DZ', '121', 'c. Close the right door to allow the printer to attempt to clear the jam message. 2. Ensure the type and quality of the paper being used meets the HP specifications for the printer. 3. If the error persists, please contact customer support. Recommended action for call-center agents and onsite technicians 1. Clear the paper jam. a. Open the right door. b. Look for and clear any paper present or obstructions in the paper path. c. Close the right door to allow the printer to attempt to clear the jam message. 2. Perform the continuous paper path test in simplex mode of at least 50 pages to ensure that issue is occurring while duplex printing only. 3. Test duplexing from multiple trays to see if issue is tray specific or not. If the jam occurs from only one specific tray, troubleshoot the tray for pick and feed issues. a. Ensure the type and quality of the paper being used meets the HP specifications for the printer. b. Ensure the tray is set correctly. If Tray 1 is set to ANY size ANY type, set it to the size the customer is trying to print on. c. Ensure that the tray width and length guides are set to the correct paper size being installed into the tray and that the tray is not over filled above the fill mark or over the tab on the tray. d. Ensure that the tray pickup, feed, and separation rollers are installed correctly and show no damage or wear. Clean or replace the rollers as needed. 4. Test the duplex sensor (PS4700) using the manual sensor test. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Manual Sensor Test c. Select from the following tests: ● All Sensors , Engine Sensors ● Done (return to the Troubleshooting menu) ● Reset (reset the selected sensor’s state) d. Test the duplex sensor to verify that the sensor is functioning correctly. If the sensor does not function, replace the right door sub assembly. NOTE: Before replacing any parts check connector J309 on the DC controller. Part number: RM2-0849-000CN For instructions: See the Repair Service Manual for this product. 122 Chapter 6 Numerical control panel messages 5. Enter the component test menu to run diagnostics on the printer. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Components Test 6. Run the Duplex refeed clutch solenoid. If the tests fail, replace the delivery assembly. Paper delivery assembly part number: RM2-6787-000CN For instuctions: See the Repair Service Manual for this product. 7. Check the right door assembly and rollers for any damage or debris. Replace the right door assembly as needed. Part number: RM2-0849-000CN For instructions: See the Repair Service Manual for this product. 13.D3.FF A power on jam has occurred at the duplex refeed sensor.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Test the duplex sensor (PS4700) using the manual sensor test."]'::jsonb, '[]'::jsonb, 
        'customers', 135, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.E1.D3', 'Fuser Area Jam', 'Output delivery delay jam. Paper did not reach the output bin full sensor in time.', 
        '["Follow the instructions on the control panel to clear the jam. Check for paper in all possible jam locations.", "Verify that no doors are open.", "Check the paper tray to make sure paper is loaded correctly. The paper guides should be adjusted to the", "Verify that the paper meets specifications for this printer.", "Use a damp, lint-free cloth to clean the rollers in the appropriate tray. Replace rollers that are worn."]'::jsonb, '[]'::jsonb, 
        'customers', 138, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.E1.D2', 'This event code was detected when the gear on the delivery assembly is separated from the fuser drive assembly', 'This event code was detected when the gear on the delivery assembly is separated from the fuser drive assembly and is not in contact with the fuser drive assembly.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Clear the paper jam.", "Check if the gear on the Delivery assembly is separated from and Fuser drive assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 140, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.80.F0', '143', 'e. Remove the fuser unit. CAUTION: The fuser might be hot. f. Remove all paper found and then reinstall the fuser. g. Close the printer right door. 2. If the issue persists, replace the lower paper feed assembly. Part number: RM2-1071-000CN For instructions: See the Repair Service Manual for this product. 13.83.Az Paper stay jam right door of the stapler/stacker. The paper stopped at the staple entry sensor in the designated time. ● 13.83.A1 A jam is detected when printing to output bin 1. ● 13.83.A2 A jam is detected when printing to output bin 2.', 
        '["Clear the paper jam.", "If the error persists, please contact customer support.", "Clear the paper jam.", "If the issue persists, replace the upper paper feed assembly.", "If the issue persists, replace the jog assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 157, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.83.DZ', '145', 'd. Open the printer right door. e. Remove the fuser unit. CAUTION: The fuser might be hot. f. Remove all paper found and then reinstall the fuser. g. Close the printer right door. 2. If the issue persists, replace the lower paper feed assembly. Part number: RM2-1071-000CN For instructions: See the Repair Service Manual for this product. 3. If the issue persists, replace the upper paper feed assembly. Part number: RM2-1067-000CN For instructions: See the Repair Service Manual for this product. 13.83.FO Power on Jam/Stacker jam – middle sensor.', 
        '["Check the printer for a jam in the stapler/stacker.", "Look for and clear any paper in the upper right cover of the stapler/stacker.", "View the event log to determine if any other jam errors are occurring and troubleshoot those errors.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Check the printer for a paper jam."]'::jsonb, '[]'::jsonb, 
        'customers', 159, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.WX.YZ', 'error messages', '30.* errors Errors in the 30.* family are related to the flatbed scanner. Recommended action Follow these troubleshooting steps in the order presented. Use the following general troubleshooting steps to try to resolve the problem. If the error persists, contact your HP-authorized service or support provider, or contact HP support at www.hp.com/go/contactHP. 1. Calibrate the scanner. Open these menus: Device Maintenance > Calibrate-Cleaning > Calibrate Scanner. 2. Clean the scanner glass and glass strips. 3. Perform the tests for scanner diagnostics. Open these menus: Administration > Troubleshooting > Diagnostic Tests > Scanner Tests. 4. Upgrade the firmware. For the latest firmware versions, go to HP FutureSmart - Latest Firmware Versions 5. Check all connections on the scanner control board and from the scanner control board to the formatter and the DC controller or the engine control board. If all connections are good, replace the scanner control board. 6. Replace the formatter. 7. If the error persists, replace the scanner assembly. The flatbed cover sensor was interrupted. The scanner flatbed cover is open. This message appears only in the event log and is not posted on the control panel. The control panel will read Flatbed Cover Open.', 
        '["Turn the printer off, and then on.", "This error message should automatically clear.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn off the printer and then turn on the printer.", "Open the scanner lid or automatic document feeder (ADF)."]'::jsonb, '[]'::jsonb, 
        'customers', 163, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.01.08', 'Home position error', 'The scanner optic failed to return to the home position. 156 Chapter 6 Numerical control panel messages', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Print a Configuration Page to check if the latest version of the printer and scanner firmware is installed. If", "Observe whether the movement of the optics assembly moves correctly."]'::jsonb, '[]'::jsonb, 
        'customers', 170, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.01.41', 'Scanner error', 'The formatter lost connections with the SCB or communication was corrupted. NOTE: Check the voltage of the unit on the regulatory sticker. In the past, this event is directly related to a 220V printer being plugged into a 110V outlet. Ensure that the voltage of the outlet matches the voltage of the printer. 164 Chapter 6 Numerical control panel messages', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer power off, and then disconnect the power cable from the printer.", "Wait for one minute, reconnect the power cable, and then turn the printer power on."]'::jsonb, '[]'::jsonb, 
        'customers', 178, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.01.43', 'SCB memory failure 169', '3. Check the cables on the scanner control board (SCB). Make sure the flat flexible cables (FFC''s) are seated correctly. NOTE: When disconnecting and reseating flat flexible cables (FFC’s) on the Scanner Control Board (SCB) it’s important to know that the connectors are Zero Insertion Force (ZIF) connectors. ZIF connectors have gates that need to be opened and closed for proper removal/reinsertion. These connectors are significantly different than the Light Insertion Force (LIF) connectors found on the LaserJet M527 and Color LaserJet M577 printers. Figure 6-116 Gate Closed Figure 6-117 Proper insertion Figure 6-118 Improper insertion 170 Chapter 6 Numerical control panel messages 4. Disconnect and reconnect all cables between the formatter and the scanner control board (SCB). Table 6-33 SCB sensor callout descriptions Callout Description 1 Flatbed sensor/motor 2 Flatbed FFC 3 ADF sensor 4 ADF FFC 5 ADF Motor 5. Restart the printer and check if the error persists. 6. If the error persists, replace the scanner control board (SCB). Table 6-34 SCB part numbers for Enterprise and Flow models Description Part number SCB Enterprise 5851-7764 Scanner control board (SCB) Flow series 5851-7347 For instructions: See the Repair Service Manual for this product. 7. If the error persists, replace the formatter. Table 6-35 Formatter part number Description/ Product models Part number Formatter (main logic) PC board For products: M631, M632, M633, E62555, E62565, E62575 J8J61-60001 Formatter (main logic) PC board For products: E62655/E62665/E62675 3GY14-67901 Recommended action for onsite technicians 171 Table 6-35 Formatter part number (continued) Description/ Product models Part number Kit -Formatter For products: E62655/E62665/E62675 (India/China) 3GY14-67902 Formatter For products: M634, M635, M636, M637 (India/China) 7PS94-67901 Formatter For products: M634, M635, M636, M637 7PS94-67902 For instructions: See the Repair Service Manual for this product. SCB communication error.', 
        '["Turn the printer power off, and then disconnect the power cable from the printer.", "Wait for one minute, reconnect the power cable, and then turn the printer power on.", "If the error persists, upgrade the printer firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer power off, and then disconnect the power cable from the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 183, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.01.54', '179', 'For additional troubleshooting steps, go to WISE and search for the following document: HP LaserJet Enterprise MFP M631-M633, HP LaserJet Managed MFP E62555-E62575 Non-Flow - Control panel is not responsive and/or a 30.01.41 error (Emerging Issue) (document c06103348).', 
        '["Turn the printer off, and then on.", "This error message should automatically clear.", "If the error persists, download FutureSmart firmware 4.7 or later.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 193, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.03.14', '183', 'Front side scanner not detected.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the error persists, replace the image scanner assembly.", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 197, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.04.02', 'Flatbed FFC Cable Not Detected', 'The flatbed FFC cable is not attached or did not sync with scanner controller board FW at power up. Cables are only accessible to a service technician.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, replace the image scanner assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 221, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.04.03', 'ADF FFC Cable Disconnected', 'The automatic document feeder FFC cable is not attached or did not sync with scanner controller board FW at power up. Cables are not accessible to the user. 210 Chapter 6 Numerical control panel messages', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Dispatch a technician onsite to perform the following tasks:", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 224, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.04.04', 'ADF Motor Cable Disconnected', 'The automatic document motor cable is not attached or did not sync with scanner controller board FW at power up. Cables are not accessible to the user.', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Dispatch a technician onsite to perform the following tasks:", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 228, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.04.05', 'ADF Sensor Cable Disconnected', 'The document feeder sensor cable is not attached or did not sync with scanner controller board FW at power up. Cables are not accessible to the user.', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Dispatch a technician onsite to perform the following tasks:"]'::jsonb, '[]'::jsonb, 
        'customers', 231, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '31.01.47', 'Document feeder not detected', 'The document feeder was not detected, or the document feeder might not be connected. The flatbed glass is still available for scanning.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact HP customer support.", "Turn the printer off, and then on.", "If the error persists, replace the document feeder.", "Before replacing the document feeder, the on-site technician should verify that the connections between"]'::jsonb, '[]'::jsonb, 
        'customers', 235, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '31.03.20', 'Backside scanner not detected', 'Backside scanner not detected.', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 237, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '31.03.22', 'Scanner calibration failure', 'Backside illumination calibration failure.', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, please contact HP customer support."]'::jsonb, '[]'::jsonb, 
        'customers', 241, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '31.03.30', 'Document feeder pick motor error', 'The document feeder pick motor is not turning.', 
        '["Open the top cover and remove any paper present. Close the top cover.", "Turn the printer off, and then on.", "Verify that the paper being used meets the HP specifications for the printer.", "Ensure that the input tray is not overloaded and that the tray guides are set to the correct size.", "If the error persists, please contact customer support at: www.hp.com/go/contactHP."]'::jsonb, '[]'::jsonb, 
        'customers', 243, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '31.03.31', 'Document feeder motor stall', 'The document feeder feed motor is not turning.', 
        '["Open the top cover and remove any paper present. Close the top cover.", "Turn the printer off, and then on.", "Verify that the paper being used meets the HP specifications for the printer.", "Ensure that the input tray is not overloaded and that the tray guides are set to the correct size.", "If the error persists, please contact HP customer support."]'::jsonb, '[]'::jsonb, 
        'customers', 245, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '31.13.00', 'Document feeder multi-pick error', 'A multiple pick error was reported by the document feeder assembly (ADF). Issue might be described as the following: ● Picking multiple documents ● Picking more than one page ● Multiple sheets pulled from ADF ● Multiple pages picked', 
        '["Remove any paper in the paper path.", "Open the automatic document feeder cover, pull all the sheets back into the tray and then resume the job.", "Lift the document-feeder input tray and remove any jammed paper."]'::jsonb, '[]'::jsonb, 
        'customers', 251, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '31.13.00', 'Document feeder multi-pick error 237', 'a. Lift the document feeder input tray b. Remove any paper found under the tray. c. Lower the document-feeder input tray and then close the document feeder cover. NOTE: Verify that the latch on the top of the document-feeder cover is completely closed. 4. For 31.13.02, check for any paper jams or remnants under the document feeder (ADF) blocking in the paper path 238 Chapter 6 Numerical control panel messages a. Open the ADF and remove any paper found. b. Check for any paper remnants blocking the sensor as well as wiping any paper dust off the glass in the region shown below. If significant debris has accumulated over the circular mirror (used for paper edge sensing) this can cause a paper jam error. Callout 1: Check for paper blocking this area. Callout 2: Clean this area with a damp lint free cloth. c. Close the document feeder. 5. Ensure that the paper meets the document feeder (ADF) specifications for the printer. This document outlines the supported weights and sizes of the ADF including best practices: Go to or search for document: HP LaserJet and PageWide Array Enterprise and Managed 500 and 600 - Use the automatic document feeder (ADF):', 
        '["Ensure that the input tray is not overloaded and that the tray guides are set to the correct size. Make sure", "Check the Document Feeder Kit consumable status.", "Check and clean the document feeder pickup rollers and separation rollers by removing any visible lint or", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Remove any paper in the paper path."]'::jsonb, '[]'::jsonb, 
        'customers', 251, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '31.13.02', '275', 'a. Lift the document feeder input tray b. Remove any paper found under the tray. c. Lower the document-feeder input tray and then close the document feeder cover. NOTE: Verify that the latch on the top of the document-feeder cover is completely closed. 4. For 31.13.02, check for any paper jams or remnants under the document feeder (ADF) blocking in the paper path 276 Chapter 6 Numerical control panel messages a. Open the ADF and remove any paper found. b. Check for any paper remnants blocking the sensor as well as wiping any paper dust off the glass in the region shown below. If significant debris has accumulated over the circular mirror (used for paper edge sensing) this can cause a paper jam error. Callout 1: Check for paper blocking this area. Callout 2: Clean this area with a damp lint free cloth. c. Close the document feeder. 5. Ensure that the paper meets the document feeder (ADF) specifications for the printer. This document outlines the supported weights and sizes of the ADF including best practices: Go to or search for document: HP LaserJet and PageWide Array Enterprise and Managed 500 and 600 - Use the automatic document feeder (ADF):', 
        '["Ensure that the input tray is not overloaded and that the tray guides are set to the correct size. Make sure", "Check the Document Feeder Kit consumable status.", "Check and clean the document feeder pickup rollers and separation rollers by removing any visible lint or", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Remove any paper in the paper path."]'::jsonb, '[]'::jsonb, 
        'customers', 289, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '33.WX.YZ', 'error messages', '33.* errors Errors in the 33.* family are related to the printer’s storage system or the formatter. The component might have been previously installed in another printer and is therefore locked to that other printer. Or, the component might be incorrect for this printer.', 
        '["Turn the printer off, and then on.", "If the issue persists, investigate if the solid state drive (SSD) or hard disk drive (HDD) or formatter are", "If the issue persists, locate and notate the complete 33.WX.YZ error message as displayed on the control", "Turn off the printer, and then turn on the printer.", "If the issue persists, investigate if the solid state drive (SSD) or hard disk drive (HDD) or formatter are the"]'::jsonb, '[]'::jsonb, 
        'customers', 320, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '33.02.02', 'Save Recover Status Error', 'Save Recover Status Error The save or recover is disabled, (one or both disabled) (Event Log Only) Recommended action There is no action needed for this message. ■ No action necessary. Data size mismatch. Unable to recover DCC NVRAM.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Turn the printer off, and then ensure that all the connectors on the DC controller PCA are connected", "If the error persists, replace the DC Controller."]'::jsonb, '[]'::jsonb, 
        'customers', 322, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '33.03.05', 'EFI Boot error', 'EFI BIOS event showing that a replacement formatter Recover attempt was unsuccessful.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn off the printer, and then turn on the printer.", "If the error persists, ensure to use the Backup/Restore feature to save the printer settings, and then", "If the error persists, download and install the latest printer firmware available at HP Customer Support -"]'::jsonb, '[]'::jsonb, 
        'customers', 324, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '33.04.05', 'TPM (Trusted Platform Module) Security Error', 'TPM (Trusted Platform Module) Security Error This system contains a TPM module that is not supported on the device or belongs to another device. Recommended action 313 TPM is unique for each device. For units that shipped with a TPM on board standard (most newer models): If the original TPM installed in the factory is unavailable or damaged, DO NOT replace any parts. Follow the recommended action.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Do not replace the formatter or HDD. It will not solve this issue.", "Perform a Format Disk procedure, select Continue in the Pre-boot menu, and then reboot the device.", "Perform a Format Disk procedure again, and then reboot the device."]'::jsonb, '[]'::jsonb, 
        'customers', 327, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '33.05.2X', 'Intrusion detection errors', 'The intrusion detection system has encountered an error. The intrusion detection memory process determined an unauthorized change in system memory. ● 33.05.21 Security alert ● 33.05.21 Potential intrusion (Event code) The intrusion detection memory process heartbeat was not detected. ● 33.05.22 Security alert ● 33.05.22 Cannot scan for potential intrusions (Event code) 316 Chapter 6 Numerical control panel messages The intrusion detection memory process did not initialize. ● 33.05.23 Security alert ● 33.05.23 Intrusion detection not initialized (Event code) ● 33.05.24 Intrusion detection initialization error (Event code)', 
        '["Turn the printer off then on.", "Make sure that the printer is in a Ready state.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off then on.", "Make sure that the printer is in a Ready state."]'::jsonb, '[]'::jsonb, 
        'customers', 330, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '33.05.5Z', 'Intrusion detection errors', 'The intrusion detection system has encountered an error. The intrusion detection memory process determined an unauthorized change in system memory. ● 33.05.51 Security alert ● 33.05.51 Potential intrusion (Event code) The intrusion detection memory process heartbeat was not detected. ● 33.05.52 Security alert ● 33.05.52 Cannot scan for potential intrusions (Event code) The intrusion detection memory process did not initialize. ● 33.05.53 Security alert ● 33.05.53 Intrusion detection not initialized (Event code) ● 33.05.54 Intrusion detection initialization error (Event code)', 
        '["Turn the printer off then on.", "Make sure that the printer is in a Ready state.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off then on.", "Make sure that the printer is in a Ready state."]'::jsonb, '[]'::jsonb, 
        'customers', 331, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '41.02.00', 'Error', 'A beam detected misprint error occurred.', 
        '["Touch OK to clear the error.", "If the error is not cleared, press the power button to turn off the printer, and then to turn on the printer.", "If the error persists, attempt to remove and reinstall the toner cartridge.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 337, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '41.03.FZ', 'Unknown Misprint Error', 'This is a general misprint error. Either the paper is loaded off-center with the guides in the tray, or a paper width sensor failure occurred from an unknown tray. The error will be one of the following: ● 41.03.F0 ● 41.03.F1 ● 41.03.F2 ● 41.03.F3 ● 41.03.F4 ● 41.03.F5 ● 41.03.FD', 
        '["Touch OK to clear the error.", "Remove the paper and the reload the tray. Ensure that the tray width and length guides are set to the correct", "If the error is not cleared, turn the printer off, and then on.", "If the error persists, please contact customer support.", "Remove the paper and the reload the tray. Ensure that the tray width and length guides are set to the correct"]'::jsonb, '[]'::jsonb, 
        'customers', 340, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '41.03.YZ', 'Unexpected size in tray <X> 327', '● Z = E Source is the envelope feeder. ● Z = 1 Source is Tray 1. ● Z = 2 Source is Tray 2. ● Z = 3 Source is Tray 3. ● Z = 4 Source is Tray 4. ● Z = 5 Source is Tray 5.', 
        '["Touch OK to use another tray.", "Print a configuration page to verify the size and type the trays are set to.", "Ensure that the tray width and length guides are set to the correct paper size being installed into the tray", "Verify that the error is not occurring as a result of an unexpected paper size trigger caused by a multi-page", "If the paper is jammed inside the printer, ensure it is completely removed. If paper has been ripped during"]'::jsonb, '[]'::jsonb, 
        'customers', 341, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '41.04.YZ', 'Printer Error 329', '● Y = 3: Light Paper 1, 2, or 3 mode ● Y = 4: Heavy Paper 1 ● Y = 5: Heavy Paper 2 ● Y = 6: Heavy Paper 3 ● Y = 7: Glossy Paper 1 ● Y = 8: Glossy Paper 2 ● Y = 9: Glossy Paper 3 ● Y = A: Glossy film ● Y = B: OHT ● Y = C: Label ● Y = D: Envelope 1, 2, or 3 mode ● Y = E: Rough ● Y = F: Other mode ● Z = D: Source is the duplexer. ● Z = 0: Source is the envelope feeder. ● Z = 1: Source is Tray 1. ● Z = 2: Source is Tray 2. ● Z = 3: Source is Tray 3. ● Z = 4: Source is Tray 4. ● Z = 5: Source is Tray 5.', 
        '["Touch OK to clear the error.", "If the error does not clear, turn the printer off, and then on.", "Swap out or re-seat each toner cartridge to test the toner cartridges.", "If the error persists, please contact customer support.", "Touch OK to clear the error."]'::jsonb, '[]'::jsonb, 
        'customers', 343, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '42.WX.YZ', 'error messages', '42.* errors Errors in the 42.* family indicate an internal system failure has occurred.', 
        '["Turn the printer off, and then on. Retry the job.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on. Retry the job.", "If the error persists, perform a Format Disk procedure using the Preboot menu."]'::jsonb, '[]'::jsonb, 
        'customers', 346, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '44.03.XX', 'Error Event log message', 'A digital send error has occurred.', 
        '["Use optimal resolution and image quality settings.", "Wait until all the digital send jobs have been processed.", "Turn the printer off, and then on and retry the job.", "Verify if there is an attachment limit on the email.", "Verify network connectivity, SMTP gateways, access to folder share."]'::jsonb, '[]'::jsonb, 
        'customers', 348, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '46.WX.YZ', 'error messages', '46.* error messages Errors in the 46.* family occur when the printer is trying to perform an action that it is not able to complete. ● No network connectivity ● A problem with the file being printed, with the software application sending the job, or with the print driver', 
        '["Turn the printer off, and then on.", "Verify the printer is connected to the network, look at the network port connection on the back of the", "Send a different file from the same software application to see if the error is specific to the original file.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 357, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '47.WX.YZ', 'error messages', '47.* errors Errors in the 47.* family indicate an internal error has occurred.', 
        '["Turn the printer off, and then on.", "Resend the print job.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Resend the print job."]'::jsonb, '[]'::jsonb, 
        'customers', 359, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '47.03.XX', '347', '3. If the error persists, clear the active partition by using the Format Disk item in the Preboot menu. For the steps to perform a Clean or Format Disk procedure, search for "HP LaserJet Enterprise, HP LaserJet Managed - Various methods to clean the hard disk drives or solid-state drives" (ish_4502973-4502949-16) - . 47.05.xx Print spooler framework internal error.', 
        '["Turn the printer off, and then on.", "Resend the print job.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Resend the print job."]'::jsonb, '[]'::jsonb, 
        'customers', 361, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '47.FC.YZ', 'Printer Calibration Failed To continue, touch “OK”', 'The device is unable to access or implement one of the image patterns files. y = Calibration type, z = Event ● 47.FC.00 (event code) Color plane registration (CPR) Image not found at system initialization ● 47.FC.01 (event code) CPR Store Image failure ● 47.FC.02 (event code) CPR Image not found ● 47.FC.03 (event code) CPR Print engine execution failure ● 47.FC.10 (event code) Consecutive Dmax Dhalf Image not found at system initialization ● 47.FC.11 (event code) Consecutive Dmax Dhalf Store image failure ● 47.FC.12 (event code) Consecutive Dmax Dhalf Image not found ● 47.FC.13 (event code) Consecutive Dmax Dhalf Print engine execution failure ● 47.FC.20 (event code) Error Diffusion Image not found at system initialization ● 47.FC.21 (event code) Error Diffusion Store image failure ● 47.FC.22 (event code) Error Diffusion Image not found ● 47.FC.23 Error Diffusion Print engine execution failure ● 47.FC.30 0 (event code) Drum Speed Adjustment Image not found at system initialization ● 47.FC.31 (event code) Drum Speed Adjustment Store image failure ● 47.FC.32 (event code) Drum Speed Adjustment Image not found ● 47.FC.33 (event code) Drum Speed Adjustment Print engine execution failure ● 47.FC.40 (event code) Pulse Width Modulation Image not found at system initialization ● 47.FC.41 (event code) Pulse Width Modulation Store image failure ● 47.FC.42 (event code) Pulse Width Modulation Image not found ● 47.FC.43 (event code) Pulse Width Modulation Print engine execution failure', 
        '["Turn the product off, and then on again.", "If the error persists, reload the firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 363, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '48.WX.YZ', 'error messages', '48.* errors Errors in the 48.* family indicate an internal error has occurred.', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "In most cases, no action is necessary.", "If the error persists, upgrade the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 365, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '49.WX.YZ', 'error messages', '49.XX.YY Error To continue turn off then on A firmware error occurred. Possible causes: ● Corrupted print jobs ● Software application issues ● Non-product specific print drivers ● Poor quality USB or network cables ● Bad network connections or incorrect configurations ● Invalid firmware operations ● Unsupported accessories A 49 error might happen at any time for multiple reasons. Although some types of 49 errors can be caused by hardware failures, it is more common for 49 errors to be caused by printing a specific document or performing some task on the printer. 49 errors most often occur when a printer is asked to perform an action that the printer firmware is not capable of and might not have been designed to comply with, such as: ● Printing files with unsupported programming commands ● A unique combination of user environment and user interactions with the printer ● Interfacing with a third-party solution that was not designed to work with the printer ● Specific timing, network traffic, or concurrent processing of jobs', 
        '["Turn the printer off, and then on.", "If the error persists, check the following:", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, check the following:"]'::jsonb, '[]'::jsonb, 
        'customers', 366, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.WX.YZ', 'error messages', '50.* errors Errors in the 50.* family indicate a problem with the fuser.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and remove the fuser. Check the fuser for damage or obstructions. Reinstall or replace", "Check the connectors between the fuser and the DC controller and from the fuser to the printer.", "Replace the fuser. If it has already been replaced, replace the fuser power supply."]'::jsonb, '[]'::jsonb, 
        'customers', 370, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.1X.YZ', 'Low fuser temperature failure', 'Low fuser temperature failure x = fuser mode, y = previous printer sleep state, and z = next printer sleep state.', 
        '["Turn the printer off, and then on.", "Ensure the printer is plugged directly into a wall outlet and that the outlet voltages matches the", "Ensure the paper type and fuser mode are correct for the paper being used.", "Make sure the paper type is set correctly on the printer and that the printer driver matches the type of paper", "Retest the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 370, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.6X.YZ', 'Open fuser circuit (heating element failure)', 'Open fuser circuit (heating element failure)', 
        '["Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 381, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.7F.00', 'Fuser pressure-release mechanism failure', 'Fuser pressure-release mechanism failure', 
        '["Turn the printer off, and then on.", "Ensure the printer is plugged directly into a wall outlet and that the outlet voltages matches the", "Ensure the paper type and fuser mode are correct for the paper being used.", "Make sure the paper type is set correctly on the printer and that the printer driver matches the type of paper", "Retest the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 385, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.BX.YZ', '381', '2. Remove and reinstall the fuser. Ensure that the fuser is seated correctly. CAUTION: The fuser might be hot. a. Open the rear door. b. Grasp the blue handles on both sides of the fuser and pull straight out to remove it. c. Ensure that there is no residual paper in the fuser. 382 Chapter 6 Numerical control panel messages d. Reseat the fuser. e. Close the front door. 3. Check the printer power source. Ensure that the power source meets the printer requirements. Ensure that the printer is the only device using the circuit. NOTE: If the printer does not meet the power requirement of 43 to 67Hz frequency, the fuser temperature control does not work correctly and this will cause the error. 4. Check connections J401 and J402 on the DC controller PCA. 5. If the fuser has not been replaced, replace the fuser. 110V part number: RM2-1256-000CN For intsrructions: See the Repair Service Manual for this product. 220V part number: RM2-1257-000CN For intsrructions: See the Repair Service Manual for this product. 6. If the error persists, replace the low voltage power supply (LVPS). 110V LVPS part number: RM2-6797-000CN For instructions: See the Repair Service Manual for this product. 220V LVPS part number: RM2-6798-000CN For instructions: See the Repair Service Manual for this product. Recommended action for call-center agents and onsite technicians 383 51.WX.YZ, 52.WX.YZ error messages 51.* errors Errors in the 51.* family are related to the laser scanner.', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Ensure the printer is running the most current version of firmware.", "Check all connections on the laser/scanner and from the laser/scanner to the DC controller, and reseat them"]'::jsonb, '[]'::jsonb, 
        'customers', 395, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '53.WX.YZ', 'error messages', '53.A0.y0 Tray "Y" side guide misalignment resolved. The engine detected that the tray guide misalignment has been resolved. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A0.10: Tray 1 Side guide misalignment resolved. ● 53.A0.20: Tray 2 side guide misalignment resolved. ● 53.A0.30: Tray 3 side guide misalignment resolved. ● 53.A0.40: Tray 4 side guide misalignment resolved. ● 53.A0.50: Tray 5 side guide misalignment resolved. ● 53.A0.60: Tray 6 side guide misalignment resolved. Recommended action No Action necessary. ■ This is an informational message; no action is necessary. 53.A0.y1 Tray "Y" Side guide misalignment proactive warning. The engine detected a tray "Y" side guide misalignment. This is a proactive warning intended to avoid a jam event. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A0.11: Tray 1 side guide misalignment warning. ● 53.A0.21: Tray 2 side guide misalignment warning. ● 53.A0.31: Tray 3 side guide misalignment warning. ● 53.A0.41: Tray 4 side guide misalignment warning. ● 53.A0.51: Tray 5 side guide misalignment warning. ● 53.A0.61: Tray 6 side guide misalignment warning.', 
        '["Ensure that the paper size in the tray matches the tray size in the Trays menu.", "If the trays are not locked, ensure the tray guides are correctly aligned to the size of paper being installed.", "If the trays are locked, contact your managed print provider if you need to change the paper size from the", "Ask the customer to check the paper size loaded in the tray to see if it matches the size listed in the Trays", "If the trays are not locked, educate the customer on the correct way to align the side guides when refilling"]'::jsonb, '[]'::jsonb, 
        'customers', 400, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '53.A1.Y0', 'Enter error message', 'Tray "Y" paper delivery direction misalignment resolved. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A1.10: Tray 1 Side guide misalignment resolved. ● 53.A1.20: Tray 2 side guide misalignment resolved. ● 53.A1.30: Tray 3 side guide misalignment resolved. ● 53.A1.40: Tray 4 side guide misalignment resolved. ● 53.A1.50: Tray 5 side guide misalignment resolved. ● 53.A1.60: Tray 6 side guide misalignment resolved. Recommended action No Action necessary. ■ This is an informational message; no action is necessary. 53.A1.y1 Tray "Y" paper delivery direction misalignment warning. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A1.11: Tray 1 paper delivery direction misalignment warning. ● 53.A1.21: Tray 2 paper delivery direction misalignment warning. ● 53.A1.31: Tray 3 paper delivery direction misalignment warning. ● 53.A1.41: Tray 4 paper delivery direction misalignment warning. Recommended action for call-center agents and onsite technicians 387 ● 53.A1.51: Tray 5 paper delivery direction misalignment warning. ● 53.A1.61: Tray 6 paper delivery direction misalignment warning.', 
        '["Ensure that the paper size in the tray matches the tray size in the Trays menu.", "If the trays are not locked, ensure the tray guides are correctly aligned to the size of paper being installed.", "If the trays are locked, contact your managed print provider if you need to change the paper size from the", "Ensure that the paper tray guides are set to the correct paper size that is being loaded into the paper tray.", "Ensure that the rear paper guide is set to the correct paper length."]'::jsonb, '[]'::jsonb, 
        'customers', 401, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '53.B2.0Z', '391', 'The specified tray contains a size that does not match the configured size. The tray is configured to support the only size indicated Confirm guides are in correct position. This issue occurs when the managed print provider has locked the paper tray to either letter or A4 and the tray has a different size paper loaded. NOTE: This can occur if the tray was swapped out or the physical trays locks in the tray were removed and the guides changed. ● 53.C1.02: Tray 2 size mismatch. ● 53.C1.03: Tray 3 size mismatch. ● 53.C1.04: Tray 4 size mismatch. ● 53.C1.05: Tray 5 size mismatch. ● 53.C1.06: Tray 6 size mismatch.', 
        '["Ensure that the paper size in the tray matches the tray size in the Trays menu.", "Contact your managed print provider if you need to change the paper size from the one selected.", "Ask the customer to check the media size loaded in the tray to see if it matches the size listed in the Trays", "Instruct the customer to contact the managed print provider if the paper size needs to be changed from the"]'::jsonb, '[]'::jsonb, 
        'customers', 405, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '54.WX.YZ', 'error messages', '54.* errors Errors in the 54.* family are related to the image-formation system. ● For HP LaserJet printers, they can indicate a problem with the toner cartridges or the transfer unit (color printers only), or they can indicate a problem with a sensor, such as with the laser/scanner. ● For HP PageWide printers, they can indicate a problem with the calibration process.', 
        '["Turn the printer off, and then on.", "Make sure the printer is running the most current version of firmware.", "Check the supplies status page using the Supplies menu on the control panel to verify that toner cartridges,", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 407, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '55.00.05', 'Engine Firmware RFU Error 397', '55.01.06, 55.02.06 DC controller error To continue turn off then on NVRAM memory warning ● 55.01.06 (event code) NVRAM memory data error warning. ● 55.02.06 (event code) NVRAM memory access error warning.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, check the input and output accessories (envelop feeder, stapler/stacker for example)", "Press the power button to turn off the printer, attempt to remove the installed accessories, and then turn on"]'::jsonb, '[]'::jsonb, 
        'customers', 411, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '57.WX.YZ', 'error mesages', '57.* errors Errors in the 57.* family indicate a problem with a fan.', 
        '["Press the Power button on the front of the printer to turn it off, and then wait 10 seconds.", "Press the Power button again to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the printer troubleshooting manual to identify the locations of each fan. Turn the printer off and then", "Update the firmware to the latest version. If the latest version firmware is already installed, reinstall it now."]'::jsonb, '[]'::jsonb, 
        'customers', 415, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '57.00.01', 'Fan failure', 'Cartridge upper (FM3) failure.', 
        '["Press the Power button on the front of the printer to turn it off, and then wait 10 seconds.", "Press the Power button again to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, then on.", "Replace the cartridge upper fan FM3."]'::jsonb, '[]'::jsonb, 
        'customers', 415, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '57.00.02', 'Fan failure', 'Cartridge lower fan (FM4) error.', 
        '["Press the Power button on the front of the printer to turn it off, and then wait 10 seconds.", "Press the Power button again to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, then on.", "Remove and reconnect (J6405) on the cartridge lower fan."]'::jsonb, '[]'::jsonb, 
        'customers', 416, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '58.WX.YZ', 'error messages', '58.* errors Errors in the 58.* family indicate an electrical problem inside the printer.', 
        '["Turn the printer off, and then on.", "Make sure the printer is connected to a dedicated power outlet and not to a surge protector or other type of", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Make sure the printer is connected to a dedicated power outlet and not to a surge protector or other type of"]'::jsonb, '[]'::jsonb, 
        'customers', 420, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '58.00.04', 'Error', 'Low-voltage power supply unit malfunction.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact customer support.", "Turn the printer off, and then on.", "Ensure the printer is plugged into a dedicated power outlet.", "If the error persists, replace the low-voltage power supply (LVPS)."]'::jsonb, '[]'::jsonb, 
        'customers', 422, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '58.01.04', 'Error', '24V power supply error during operation. 408 Chapter 6 Numerical control panel messages During a regular printing operation the 24V power supply experienced an error.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact customer support.", "Turn the printer off, and then on.", "Ensure the printer is plugged into a dedicated power outlet.", "If the error persists, replace the low-voltage power supply (LVPS)."]'::jsonb, '[]'::jsonb, 
        'customers', 422, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '58.02.04', 'Error', '24V power supply error during printer power on or wake up. During the printer power on, or when waking from a sleep mode, the printer experienced an error with the 24V power supply. NOTE: Check the voltage of the unit on the regulatory sticker. This event is directly related to a 220V printer being plugged into a 110V outlet. Ensure that the voltage of the outlet matches the voltage of the printer.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact customer support.", "Turn the printer off, and then on.", "Ensure the printer is plugged into a dedicated power outlet.", "If the error persists, replace the low-voltage power supply (LVPS)."]'::jsonb, '[]'::jsonb, 
        'customers', 423, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '59.WX.YZ', 'error messages', '59.* errors Errors in the 59.* family indicate a problem with one of the motors or with the lifter drive assembly for one of the trays.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Check all connections on the main control board of the printer, (DC controller, Engine control board ECB),", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 425, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '60.01.04', '423', '2. Close the tray to check if the error persists. 3. Reload the paper and test the printer. 4. If the error persists, contact your HP-authorized service or support provider, or contact customer support at www.hp.com/go/contactHP. Recommended action for call-center agents and onsite technicians 1. Re-seat connector on the Feeder Controller/HCI Controller PCA assembly from the lifter drive assembly. 2. If the error persists, replace the Lifter drive Assembly based on the input tray. Table 6-128 Parts Part Name Part Number Instructions link 1x550 Input Tray Lifter Drive Assembly (M3601) RM2-0895-000CN For instructions: See the Repair Service Manual for this product. 1x550 Envelope feeder Lifter Drive Assembly (M3601) RM2-0895-000CN For instructions: See the Repair Service Manual for this product. 1x550 Sheet Feeder stand Lifter Drive Assembly (M3401) RM2-0948-000CN For instructions: See the Repair Service Manual for this product. 3x550 Sheet Feeder Lifter Drive Assembly (M3401) 3x550 Upper, middle and lower trays. 2,550 Upper cassette tray RM2-0948-000CN For instructions: See the Repair Service Manual for this product. See the Repair Service Manual for this product. See the Repair Service Manual for this product. 2,550 Sheet Feeder stand 2,000 sheet deck Lifter Drive Assembly (M3401) RM2-0948-000CN See the Repair Service Manual for this product. for instructions: See the Repair Service Manual for this product. 3. If the error persists, replace the Feeder Controller PCA Assembly. Table 6-129 Parts Part Name Part Number Instructions link 1x550 Input Tray Controller PCA RM2–8767-000CN For instructions: See the Repair Service Manual for this product. 1x550 Envelope feeder Controller PCA RM2-8785-000CN For instructions: See the Repair Service Manual for this product. 1x550 Sheet Feeder stand Controller RM2-8827-000CN For instructions: See the Repair Service Manual for this product. 3x550 Sheet Feeder Controller PCA RM2-8807-000CN For instructions: See the Repair Service Manual for this product. 2,550 Sheet Feeder stand Controller PCA RM2-9020-000CN for instructions: See the Repair Service Manual for this product. 424 Chapter 6 Numerical control panel messages Tray 5 lifting error.', 
        '["Open the failing tray and remove all paper from the tray.", "Close the tray to check if the error persists.", "Reload the paper and test the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Re-seat connector on the Feeder Controller/HCI Controller PCA assembly from the lifter drive assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 437, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '60.01.05', '425', '3. If the error persists, replace the Feeder Controller PCA Assembly. Table 6-131 Parts Part Name Part Number Instructions link 1x550 Input Tray Controller PCA RM2–8767-000CN For instructions: See the Repair Service Manual for this product. 1x550 Envelope feeder Controller PCA RM2-8785-000CN For instructions: See the Repair Service Manual for this product. 1x550 Sheet Feeder stand Controller RM2-8827-000CN For instructions: See the Repair Service Manual for this product. 3x550 Sheet Feeder Controller PCA RM2-8807-000CN For instructions: See the Repair Service Manual for this product. 2,550 Sheet Feeder stand Controller PCA RM2-9020-000CN for instructions: See the Repair Service Manual for this product. Tray 6 lifting error.', 
        '["Open the failing tray and remove all paper from the tray.", "Close the tray to check if the error persists.", "Reload the paper and test the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Re-seat connector on the Feeder Controller/HCI Controller PCA assembly from the lifter drive assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 439, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '66.00.77', 'Output accessory failure', 'The output device experienced an internal communication malfunction', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, replace the output accessory controller PCA."]'::jsonb, '[]'::jsonb, 
        'customers', 444, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '66.80.17', 'device failure', 'An external paper handling accessory error has occurred. ● 66.80.17 Fan malfunction', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, replace the fan.", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 446, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '70.WX.YZ', 'error messages', '70.* errors Messages in the 70.* family indicate a problem with the DC controller or Formatter (ECB) depending on your printer.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Replace the DC controller or the Formatter as needed."]'::jsonb, '[]'::jsonb, 
        'customers', 448, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '80.0X.YZ', 'Embedded Jetdirect Error', 'An Embedded HP JetDirect print server critical error has occurred. ● 80.01.80 (event log) No heartbeat ● 80.01.81 (event log) Reclaim time-out ● 80.01.82 (event log) Invalid data length ● 80.01.8B (event log) Invalid max outstanding packet header field ● 80.01.8C (event log) Invalid channel mapping response ● 80.03.01 (event log) No PGP buffers ● 80.03.02 (event log) Channel table full ● 80.03.03 (event log) Producer index not reset ● 80.03.04 (event log) Consumer index not reset ● 80.03.05 (event log) Queue position size too small ● 80.03.06 (event log) Transport overflow ● 80.03.07 (event log) No overflow packets ● 80.03.08 (event log) Invalid identify response ● 80.03.09 (event log) Invalid channel map return status ● 80.03.10 (event log) Invalid reclaim return status ● 80.03.12 (event log) Datagram invalid buffer ● 80.03.13 (event log) Max stream channels ● 80.03.14 (event log) Max datagram channels ● 80.03.15 (event log) Card reset failed ● 80.03.16 (event log) Self-test failure ● 80.03.17 (event log) Unknown PGP packet ● 80.03.18 (event log) Duplicate I/O channel', 
        '["Press the power button to turn off the printer.", "Disconnect the network (Ethernet) cable.", "Press the power button to turn on the printer.", "Turn off the printer, and then reconnect the Ethernet cable to the Ethernet port on the printer and on the", "Turn on the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 450, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '81.WX.YZ', 'EIO Error To continue turn off then on', 'An external I/O card has failed on the printer.', 
        '["Press the power button to turn off the printer.", "Disconnect the network (Ethernet) cable.", "Press the power button to turn on the printer.", "Turn off the printer, and then reconnect the Ethernet cable to the Ethernet port on the printer and on the", "Turn on the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 452, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '81.09.00', 'Error', 'Internal Jetdirect Inside Networking event.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Verify that the issue occurs with the latest version of firmware.", "Verify that the issue occurs when the device has the latest firmware and is not connected to the network.", "Verify that the issue occurs when disconnected from the network and with default configuration."]'::jsonb, '[]'::jsonb, 
        'customers', 454, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '82.0X.YZ', 'Internal disk device failure', 'The internal disk failed on the printer.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, turn off the printer, and then disconnect the power cable.", "Remove the Hard disk drive (HDD), and then reinstall the HDD.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 457, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '82.73.45', 'Disk Successfully cleaned', 'Event log only, disk successfully cleaned. Recommended action See recommended action. ■ No action necessary. 82.73.46, 82.73.47 A hard disk drive (HDD), solid state drive (SDD), or compact flash disk cleaning failed. This error is usually caused by a failure of the disk hardware.', 
        '["Turn the product off, and then on.", "Reload the printer firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Use the Format Disk item in the Preboot menu."]'::jsonb, '[]'::jsonb, 
        'customers', 460, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '90.WX.YZ', 'error messages', '90.* errors Errors in the 90.* family are related to the control panel.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, dispatch an onsite technician.", "Turn the printer off by holding down the power button for at least 10 seconds."]'::jsonb, '[]'::jsonb, 
        'customers', 461, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '98.0X.0Y', 'error messages', '98.00.0c Data corruption has occurred and fails to mount partition.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "Check if the 98.00.0c event is intermittent or persistent and perform the appropriate task."]'::jsonb, '[]'::jsonb, 
        'customers', 464, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '98.00.02', 'Corrupt data in the solutions volume', 'Data corruption has occurred in the solutions volume.', 
        '["Turn the printer off, and then on.", "Download and install the latest firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "Check if the 98.00.0c event is intermittent or persistent, and then perform the appropriate task."]'::jsonb, '[]'::jsonb, 
        'customers', 468, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '98.00.03', 'Corrupt data in the configuration volume', 'Data corruption has occurred in the configuration volume.', 
        '["Turn the printer off, and then on.", "Download and install the latest firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 471, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.WX.YZ', 'error messages', '99.* errors Errors in the 99.* family are related to the firmware upgrade process.', 
        '["Make sure the connection to the network is good, and then try the firmware upgrade again.", "If the error persists, try using the USB upgrade method.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Make sure the connection to the network is good, and then try the upgrade again.", "Try using the USB upgrade method."]'::jsonb, '[]'::jsonb, 
        'customers', 473, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.00.03', 'Upgrade not performed error writing to disk', 'A remote firmware upgrade (RFU) was not performed. This is a disk error. It might indicate a problem or a hard disk drive failure. It might be necessary to check the connection to the hard disk drive or replace the hard disk drive.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 474, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.00.06', 'Upgrade not performed error reading upgrade', 'A remote firmware upgrade (RFU) was not performed. This is an unexpected read error when reading the header number and size.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 478, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.00.07', 'Upgrade not performed error reading upgrade', 'A remote firmware upgrade (RFU) was not performed. This is an unexpected read error when reading the rest of the header.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 482, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.00.08', 'Upgrade not performed error reading upgrade', 'A remote firmware upgrade (RFU) was not performed. This is an unexpected read error when reading image data.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 485, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.07.22', 'Firmware install error', 'This error indicates that the firmware installation failed. It displays on the printer control panel when the fax modem installer fails to download the installed firmware to the modem.', 
        '["Make sure that the network connection is stable and good, and then attempt to update the firmware again.", "If the error persists, try to update the firmware at the control panel using a USB flash drive.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Make sure that the network connection is stable and good, and then attempt to update the firmware again.", "If the error persists, try to update the firmware at the control panel using a USB flash drive."]'::jsonb, '[]'::jsonb, 
        'customers', 492, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.09.62', 'Unknown disk', 'This error indicates that there is an encryption mismatch between the HDD or SSD and the formatter. This typically happens because an HDD or SSD was swapped into a device from another device.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the Preboot menu to unlock the disk.", "If a disk is to be reused in a different product, execute the Erase and Unlock procedure from the Preboot", "If the issue persists, replace the HDD/SSD as needed."]'::jsonb, '[]'::jsonb, 
        'customers', 495, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.09.64', 'Disk Nonfunctional', 'A fatal hard disk drive failure has occurred.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, turn off the printer, and then disconnect the power cable.", "Remove the Hard disk drive (HDD), and then reinstall the HDD.", "If the error persists, the hard disk drive needs to be replaced. Contact your HP-authorized service or"]'::jsonb, '[]'::jsonb, 
        'customers', 496, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.09.65', 'Disk data error', 'Disk data corruption has occurred. Recommended action Follow these troubleshooting steps in the order presented. NOTE: Do NOT replace the formatter board, it will not resolve this error. ■ Use the Format Disk procedure from the Preboot menu, and then resend the remote firmware upgrade (RFU). For the steps to perform a Clean or Format Disk procedure, search for "HP LaserJet Enterprise, HP LaserJet Managed - Various methods to clean the hard disk drives or solid-state drives" (ish_4502973-4502949-16) 99.09.66 No boot device. A hard disk drive or eMMC is not installed in the printer.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, turn off the printer, and then disconnect the power cable.", "Remove the Hard disk drive (HDD), and then reinstall the HDD.", "If the error persists, the hard disk drive needs to be replaced. Contact your HP-authorized service or"]'::jsonb, '[]'::jsonb, 
        'customers', 500, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.09.67', 'Disk is not bootable please download firmware', 'There is no firmware installed on the hard disk drive. This is usually the result of installing a new hard disk drive or performing a Clean Disk procedure from the Preboot menu. NOTE: When installing a new hard drive or eMMC, the disk should be formatted through the Preboot menu, BEFORE loading firmware. 492 Chapter 6 Numerical control panel messages', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, replace the Hard disk drive (HDD).", "If the error persists, verify a compatible hard disk drive (HDD) is installed.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 506, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '99.39.67', 'eMMC Not Bootable', 'Data on the eMMC cannot be secured or encrypted. When the hard disk drive is installed all data on the eMMC is automatically migrated to the hard disk drive and erased from the eMMC. As long as the hard disk drive is installed the eMMC is non-functional. The customer passed the data migration and put the eMMC back in. Recommended action 1. Download firmware to the eMMC. 2. If the download fails to eMMC, replace the eMMC. Do NOT replace the formatter board, it will not resolve this. NOTE: The device is unusable until a new eMMC is installed. Recommended action 497 Alphabetical control panel messages7 Use the following alphabetical message to see further information on the message. 498 Chapter 7 Alphabetical control panel messages Alphabetical messages Accept bad signature The product is performing a remote firmware upgrade and the code signature is invalid. Recommended action Follow these troubleshooting steps in the order presented. ■ Download the correct firmware upgrade file for the product, and then reinstall the upgrade. For the latest firmware versions, go to: HP FutureSmart - Latest Firmware Versions Authentication required A user name and password are required. Recommended action ■ Type the user name and password, or contact the network administrator. Bad optional tray connection The optional tray is not connected, not connected correctly, or a connection is not working correctly. Recommended action 1. Turn the printer off. 2. Remove and then reinstall the optional tray. 3. If more than one extra 550 Sheet feeder is available swap trays and test again. 4. Remove the tray and inspect the connectors on the tray and printer for damage. If either of them are broken, have bent pins, or otherwise appear damaged, replace them. 5. Carefully reposition printer base onto the optional tray. HP recommends that two people lift the printer. 6. If the problem continues, replace the connector for the tray. 550 Sheet feeder upper cable assembly part number: RM2-8880-000CN 550 Sheet feeder lower cable assembly part number: RM2-8881-000CN 1X550, 3X550 and 2,550 Sheet feeder stand cable assembly part number: RM2-9286-000CN Canceling...<jobname> The printer is canceling the current job <jobname>. Recommended action See recommended action. ■ No action necessary. Accept bad signature 499 Cartridge low If this message appears even though the toner cartridge is new, perform the following. Recommended action 1. Remove, and then reinstall the toner cartridge. 2. Make sure a genuine HP supply is used. 3. If the error persists, replace the toner cartridge. Cartridge Memory Abnormal This message appears even though the toner cartridge is new. Recommended action 1. Remove, and then reinstall the toner cartridge. 2. If the error persists, replace the toner cartridge. Cartridge out This message appears even though the toner cartridge is new. Recommended action 1. Remove, and then reinstall the toner cartridge. 2. Make sure a genuine HP supply is used. 3. If the error persists, replace the toner cartridge. Checking engine The printer is conducting an internal test. Recommended action See recommended action. ■ No action necessary. Checking paper path The printer is checking for possible paper jams. Recommended action See recommended action. ■ No action necessary. Chosen personality not available To continue touch “OK” A print job requested a printer language (personality) that is not available for this printer. The job will not print and will be cleared from memory. 500 Chapter 7 Alphabetical control panel messages Recommended action Follow these troubleshooting steps in the order presented. ■ Print the job by using a print driver for a different printer language, or add the requested language to the printer (if possible). To see a list of available personalities, print a configuration page. a. From the Home screen on the printer control panel, go to the following menus: Reports > Configuration/Status Pages b. Select Configuration Page, then select the Print button to print the pages. Cleaning The printer is performing an automatic cleaning cycle. Printing will continue after the cleaning is complete. Recommended action See recommended action. ■ No action necessary. Clearing activity log This message is displayed while the activity log is cleared. The printer exits the menus when the log has been cleared. Recommended action ■ No action necessary. Clearing paper path The printer is attempting to eject jammed paper. Recommended action Follow these troubleshooting steps in the order presented. ■ Check the progress at the bottom of the display. Close left door The left door is open. This message appears even though the top left door is closed. Recommended action for customers 1. Close the left door to allow the printer to attempt to clear the jam. 2. Open then close the left door to ensure it is fully closed. Recommended action for call-center agents and onsite technicians 1. Close the left door to allow the printer to attempt to clear the jam. Recommended action 501 2. Check the projection part on the left door that defeats the left door interlocks. If broken replace the left door assembly. Part number: RM2-0850-000CN For instructions: See the Repair Service Manual for this product. 3. Check SW1 using the manual sensor test. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Manual Sensor Test c. Select from the following tests: ● All Sensors , Engine Sensors ● Done (return to the Troubleshooting menu) ● Reset(reset the selected sensor’s state) d. Test SW2 using folded paper or another object to defect the interlock. If the switch test fails, replace the laser shutter assembly. Part number: RM2-6755-000CN NOTE: Before replacing any parts check connector J308 on the DC controller. Close right door The right door is open. Recommended action for customers ■ Close the right door to allow the printer to attempt to clear the jam. 502 Chapter 7 Alphabetical control panel messages Recommended action for call-center agents and onsite technicians 1. Close the right door to allow the printer to attempt to clear the jam. 2. Check the projection part on the right door that defeats the right door interlocks. If broken replace the right door assembly. Part number: RM2-0849-000CN For instructions: See the Repair Service Manual for this product. 3. Check SW1 using the manual sensor test. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Manual Sensor Test c. Select from the following tests: ● All Sensors , Engine Sensors ● Done (return to the Troubleshooting menu) ● Reset(reset the selected sensor’s state) d. Test SW1 using folded paper or another object to defect the interlock. If the switch test fails, replace the laser shutter assembly. Part number: RM2-6755-000CN NOTE: Before replacing any parts check connector J321 on the DC controller. Recommended action for call-center agents and onsite technicians 503 Communication lost A Communication Lost message appears on the control panel in five different languages. The communication path from the control panel to the formatter includes the Control Panel, USB cable, and the formatter. Recommended action for customers Follow these troubleshooting steps in the order presented. 1. Turn the printer off, and then on. 2. If the error persists, contact your HP-authorized service or support provider, or contact customer support at www.hp.com/go/contactHP. Recommended action for call agents Follow these troubleshooting steps in the order presented. 1. Turn the printer off, and then on. 2. If the issue persists, check the heartbeat LED on the formatter located on the rear of the printer. ● If the formatter heartbeat LED status flashes yellow, it indicates a communication problem between the control panel and the formatter. Replace the control panel. Table 7-1 Control panel part numbers Description Part number Control panel assembly B5L47-67018 ● If the formatter heartbeat LED status is solid red, it indicates a problem with the formatter. Replace the formatter. Table 7-2 Formatter part numbers Description Part number Formatter (main logic) PC board J8J61-60001 504 Chapter 7 Alphabetical control panel messages', 
        '["Turn the printer off, and then on.", "If the issue persists, turn off the printer, and then reseat the USB cable connection in the control panel.", "Press the power button to turn on the printer.", "If the printer returns to a \"Ready\" state, verify functionality of the control panel.", "If the issue persists, turn the printer off."]'::jsonb, '[]'::jsonb, 
        'service', 511, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '82.0X.YY', '(event code)', 'The internal hard drive is not functioning correctly. Recommended action Follow these troubleshooting steps in the order presented. 1. Turn off the printer, and then remove and reinstall the hard drive. 2. Turn on the printer. 3. If the error persists, replace the internal hard drive. NOTE: Most customers have the self-encrypting drive (SED) and should not have a Federal Information Processing Standards (FIPS) drive. Only send the FIPS drive for federal government printers, customers that require FIPS per HP agreement, or customers that have bought the FIPS drive as an accessory. 512 Chapter 7 Alphabetical control panel messages Table 7-6 Hard disk drive (HDD) part number Description Part number Self-Encrypting Drive, SED (HDD) L41606-011 Federal Information Processing Standards Drive, FIPS (HDD) See NOTE above. L42243-021 See NOTE above. For intsructions: See the Repair Service Manual for this product. Internal disk not initialized The internal hard disk drive file system must be initialized before it can be used. Recommended action Follow these troubleshooting steps in the order presented. ■ Initialize the internal hard disk drive file system. For information on performing various actions on the hard disk drive, go to: HP LaserJet, OfficeJet, PageWide, ScanJet - HP FutureSmart Firmware Device Hard Disk, SSD, and eMMC Security (white paper) Internal disk spinning up The internal hard disk drive device is spinning up its platter. Jobs that require hard disk drive access must wait. Recommended action See recommended action. ■ No action necessary. Load Tray <X>: [Type], [Size] To use another tray, press “OK” This message displays when the indicated tray is selected, but is not loaded, and other paper trays are available for use. It also displays when the tray is configured for a different paper type or size than the print job requires. Recommended action 1. Load the correct paper in the tray. 2. If prompted, confirm the size and type of paper loaded. 3. Otherwise, press the OK button to select another tray. 4. If error persists, use the cassette paper present sensor test in the Tray/bin manual sensor test to verify that the sensor is functioning correctly. 5. Make sure that the sensor flag on the paper presence sensor is not damaged and moves freely. 6. Reconnect the corresponding connector. Internal disk not initialized 513 Loading program <XX> Do not power off Programs and fonts can be stored on the printer’s file system and are loaded into RAM when the printer is turned on. The number <XX> specifies a sequence number indicating the current program being loaded. Recommended action See recommended action. ■ No action necessary. Manually feed output stack Then touch "OK" to print second side The printer has printed the first side of a manual duplex job and is waiting for you (or the applicable user) to insert the output stack to print the second side. Recommended action Follow these troubleshooting steps in the order presented. 1. Maintaining the same orientation, remove the pages from the output bin. 2. Flip the document printed side up. 3. Load the document in Tray 1. 4. Touch the OK button to print the second side of the job. Manually feed: <Type><Size> This message appears when manual feed is selected, Tray 1 is not loaded, and other trays are empty. Recommended action Follow these troubleshooting steps in the order presented. 1. Load the tray with requested paper. 2. If the paper is already in the tray, press the Help button to exit the message and then press the OK button to print. 3. To use another tray, clear paper from Tray 1, press the Help button to exit the message and then press the OK button. No job to cancel You have pressed the stop button but the printer is not actively processing any jobs. Recommended action See recommended action. ■ No action necessary. No USB drive or files found The formatter was not able to detect the USB thumb drive. 514 Chapter 7 Alphabetical control panel messages If you experience the “No USB drive or files found” attempting to upgrade printer firmware via the walk up easy-access USB port perform the following.', 
        '["1. After the firmware file has been downloaded from hp.com uncompress the file and copy the", "If the issue persists, verify the USB flash drive is formatted as FAT32. If unsure, format the flash drive as", "If the issue persists, the USB flash drive can be inserted directly into a USB port on the printer’s formatter", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Try another thumb drive."]'::jsonb, '[]'::jsonb, 
        'customers', 526, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '10.23.70', 'Fuser kit (event code)', 'Recommended action ■ Replace the specified supply. Or, configure the printer to continue printing using the Manage Supplies menu on the printer control panel. Resend external accessory firmware An external accessory requires a firmware upgrade. Printing can continue, but jams might occur if the job uses the external accessory. Recommended action Follow these troubleshooting steps in the order presented. ■ Perform a firmware upgrade. For the latest firmware versions, go to: HP FutureSmart - Latest Firmware Versions 522 Chapter 7 Alphabetical control panel messages Resend Upgrade A firmware upgrade did not complete successfully. Recommended action Follow these troubleshooting steps in the order presented. ■ Upgrade the firmware again. For the latest firmware versions, go to: HP FutureSmart - Latest Firmware Versions Restore Factory Settings The printer is restoring factory settings. Recommended action See recommended action. ■ No action necessary. RFU Load Error Send full RFU on <X> Port The printer displays this message before the firmware is loaded at initialization when an error has occurred during a firmware upgrade. Recommended action ■ Resend the firmware upgrade. ROM disk device failed To clear press “OK” The specified device failed. Recommended action Follow these troubleshooting steps in the order presented. ■ Touch the OK button to clear the error. ROM disk file operation failed To clear press “OK” A PJL command was received that attempted to perform an illegal operation, such as downloading a file to a nonexistent directory. Recommended action Follow these troubleshooting steps in the order presented. ■ Touch the OK button to clear the error. ROM disk file system is full To clear press “OK” The specified device is full. Recommended action Follow these troubleshooting steps in the order presented. Resend Upgrade 523 ■ Touch the OK button to clear the error. ROM disk is write protected To clear press “OK” The device is protected and no new files can be written to it. Recommended action Follow these troubleshooting steps in the order presented. ■ Touch the OK button to clear the error. ROM disk not initialized To clear press “OK” The ROM disk file system must be initialized before it can be used. Recommended action Follow these troubleshooting steps in the order presented. ■ Initialize the ROM disk file system. Sanitizing disk <X> complete Do Not power off The hard disk is being cleaned. Recommended action ■ Contact the network administrator. Size mismatch in Tray <X> The paper in the listed tray does not match the size specified for that tray. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16) Recommended action 1. Load the correct paper. 2. Make sure that the paper is positioned correctly. 3. Close the tray, and then make sure that the control panel lists the correct size and type for the specified tray. 4. If necessary, use the control panel menus to reconfigure the size and type settings for the specified tray. 5. If this message appears even though the correct size paper is loaded in the correct paper tray perform the following. a. Use the Tray size switch test in the Tray/Bin manual sensor test to test the switch. If it does not respond, replace the tray drive assembly. Part number: RM2-0875-000CN 550 Sheet feeder instructions: See the Repair Service Manual for this product. Removal and replacement: See the Repair Service Manual for this product. 3X550 Sheet paper deck instructions: See the Repair Service Manual for this product. 524 Chapter 7 Alphabetical control panel messages 2550 Sheet feeder deck instructions: See the Repair Service Manual for this product. b. Reconnect tray connectors on the media size switch, and then reconnect connector on the DC controller to tray. Sleep mode on The printer is in sleep mode. Pressing a control-panel button, receiving a print job, or occurrence of an error condition clears this message. Recommended action See recommended action. ■ No action necessary. Supplies low Multiple supplies on the printer have reached the low threshold. Recommended action Follow these troubleshooting steps in the order presented. ■ Replace the supply when print quality is no longer acceptable. Supply memory warning The printer cannot read or write to the e-label or the e-label is missing. Recommended action See recommended action. ■ No action necessary. Too many jobs in queue This message displays when the user selects a USB file to print, and 100 files are already in the print queue. Recommended action ■ To select another file, touch the OK button. Tray <X> empty: [Type], [Size] The specified tray is empty and the current job does not need this tray to print. ● X = 1: Tray 1 ● X = 2: Tray 2 ● X = 3: Tray 3 ● X = 4: Tray 4 ● X = 5: Tray 5 Sleep mode on 525 Recommended action ■ Refill the tray at a convenient time. NOTE: This could be a false message. If the tray is loaded without removing the shipping lock, the printer does not sense that the paper is loaded. Remove the shipping lock, and then load the tray. Tray 2 empty: [Type], [Size] Tray 2 is empty and the current job does not need this tray to print. Recommended action 1. Check the tray, and refill it if it is empty. 2. If the error persists, unplug the printer cord and rotate the printer so that the rear door of the printer is in front of you. 3. Raise the primary transfer assembly. Figure 7-5 Raise the transfer assembly 4. Open the rear door to check the feed rollers. 526 Chapter 7 Alphabetical control panel messages a. Pull the green tab located on the upper left-hand side to open the lower-access cover. Figure 7-6 Open the jam access door b. Check the rollers to ensure that they are installed correctly. ● If the flap of the blue roller tab is down, the rollers are not installed correctly. NOTE: If the blue tab is DOWN, Tray 2 will not lift, and the control panel will indicate that Tray 2 is empty. ● If the flap of the blue roller tab is up, the rollers are installed correctly. 5. If the error persists, contact customer support. Tray <X> lifting The printer is in the process of lifting paper in the indicated tray. ● X = 2: Tray 2 ● X = 3: Tray 3 ● X = 4: Tray 4 ● X = 5: Tray 5 Recommended action ■ No action necessary. Tray <X> open The specified tray is open or not closed completely. ● X = 2: Tray 2 ● X = 3: Tray 3 Tray <X> lifting 527 ● X = 4: Tray 4 ● X = 5: Tray 5 Recommended action 1. Close the tray. 2. If this message displays after the lifter drive assembly was removed or replaced, make sure that the connector of the assembly is connected correctly and fully seated. 3. If the error persists, use the Media size switches test in the Tray/Bin manual sensor test to test the switches. If they do not respond, replace associated the lifter drive assembly. 4. If the switches do not respond, replace the associated lifter drive assembly. Tray <X> [type] [size] The paper in the specified tray is detected as the specified size and type. The custom switch was not changed. Recommended action ■ If the paper is a custom size or type, change the custom-size switch on the tray as necessary. Tray 2 overfilled or roller issue The upper pick roller is not seated correctly or the paper sensor is missing, damaged, or dislodged. The error message displays the following message on the printer control panel Check that the tray is not loaded above the fill lines. Remove any excess paper. If a new pickup roller was recently installed, check to see that the parts are firmly seated, and the access latch is closed.', 
        '["Pull out tray 2 completely out of the printer to remove it.", "Check if the paper sensor flag located inside tray 2 next to the roller is missing, damaged, or dislodged.", "Ensure that the stack of paper in the tray is not above the fill mark (line below the three triangles) as", "Make sure to remove any excess pages from the tray.", "Check if the rollers are installed correctly."]'::jsonb, '[]'::jsonb, 
        'customers', 536, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.B9.FF', 'Atasco de papel', 'Papel atascado o bloqueo en la ruta de papel, posiblemente en el fusor, rodillos de presión o entrega.', 
        '["Abre la puerta derecha y retira cualquier papel o obstrucción en la ruta", "Inspecciona el fusor, rodillo de presión y rodillo de entrega para detectar bloqueos o daños", "Prueba el sensor del fusor (PS4650) mediante diagnóstico manual en Support Tools > Troubleshooting > Diagnostic Tests > Manual Sensor Test", "Verifica los conectores J401 y J402 en el controlador DC", "Reemplaza el fusor si el sensor no funciona correctamente"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6763-000CN", "description": "Ensamble del motor de accionamiento del fusor"}]'::jsonb, 
        'customers', 133, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.80.D1', 'Atasco de papel en grapadora/apilador', 'Papel atascado o bloqueo en el dispositivo de salida de la grapadora/apilador, posiblemente en rodillos o sensores.', 
        '["Abre la puerta derecha del dispositivo de salida y retira todo el papel", "Verifica que no haya residuos del atasco anterior en el fusor y rodillos de entrada/salida", "Confirma que los rodillos del depósito de salida estén girando correctamente", "Revisa el registro de eventos para detectar otros errores de atasco", "Reemplaza el microinterruptor de la grapadora/apilador si el error persiste"]'::jsonb, '[{"part_number": "WC4-5171-000CN", "description": "Microinterruptor (grapadora/apilador)"}]'::jsonb, 
        'customers', 155, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '13.80.D2', 'Atasco de papel con retraso en grapadora/apilador', 'El papel no alcanzó el sensor de entrada del apilador en el tiempo designado, posiblemente debido a bloqueo en la ruta de alimentación inferior.', 
        '["Abre la puerta derecha del dispositivo de salida, retira el papel y ciérrala", "Abre la puerta derecha de la impresora, retira el fusor con cuidado y verifica bloqueos de papel", "Reinstala el fusor y cierra la puerta", "Revisa el registro de eventos para otros errores relacionados", "Reemplaza el ensamble de alimentación de papel inferior si el error persiste"]'::jsonb, '[{"part_number": "RM2-1071-000CN", "description": "Ensamble de alimentación de papel inferior"}]'::jsonb, 
        'customers', 175, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.01.14', 'Error de EEPROM del sistema de escaneo', 'Fallo en la memoria EEPROM de la placa de control del escáner (SCB), impidiendo la comunicación correcta.', 
        '["Apaga la impresora y vuelve a encenderla", "Revisa el registro de eventos para otros errores del escáner", "Desconecta y reconecta los conectores de cable plano (FFC) en la SCB prestando atención a los conectores ZIF", "Ejecuta diagnósticos de componentes desde Support Tools > Troubleshooting > Diagnostic Tests", "Reemplaza la placa de control del escáner si el error persiste"]'::jsonb, '[{"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 183, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.01.43', 'Fallo de memoria del SCB', 'Error de memoria en la placa de control del escáner (SCB), posiblemente por fallo de conexión o corrupción de datos.', 
        '["Apaga la impresora y vuelve a encenderla", "Verifica que todos los conectores en la SCB estén correctamente asientos", "Desconecta y reconecta los cables de alimentación y HDMI en la SCB", "Ejecuta diagnósticos desde Support Tools para verificar conexiones", "Reemplaza la placa de control del escáner si el error persiste"]'::jsonb, '[{"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 191, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.01.46', 'Error de firmware del escáner', 'Fallo en el firmware de la placa de control del escáner (SCB) o corrupción de datos durante la carga.', 
        '["Apaga la impresora y vuelve a encenderla", "Actualiza el firmware a la última versión disponible desde HP Customer Support", "Revisa el registro de eventos para otros errores del escáner", "Verifica conexiones de cables en la SCB incluyendo el HDMI", "Reemplaza la placa de control del escáner (SCB) si el error persiste"]'::jsonb, '[{"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 201, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.03.22', 'Fallo del escáner', 'El cabezal de escaneo no se actuata correctamente o hay fallo en los sensores ópticos de escaneo.', 
        '["Apaga la impresora y vuelve a encenderla", "Limpia el cristal del escáner, las tiras del alimentador de documentos y el respaldo de plástico blanco", "Actualiza el firmware a la última versión", "Desconecta y reconecta todos los conectores FFC en la SCB (puertas ZIF)", "Ejecuta la prueba de escaneo continuo (Continuous Scan) en Support Tools para verificar el movimiento del cabezal"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 205, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.03.23', 'Fallo del escáner', 'Fallo en la óptica de escaneo, sensor o motor del cabezal de escaneo.', 
        '["Apaga la impresora y vuelve a encenderla", "Actualiza el firmware a la última versión disponible", "Revisa el registro de eventos para otros errores del escáner", "Desconecta y reconecta los conectores FFC en la SCB usando técnica ZIF", "Ejecuta la prueba de escaneo continuo para verificar que el cabezal se actuate correctamente"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 209, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.03.30', 'Fallo del escáner', 'Fallo en los componentes del escáner de imagen o pérdida de comunicación con la placa de control.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta y reconecta todos los cables en la SCB incluyendo cables planos (FFC) y HDMI", "Ejecuta la prueba de escaneo continuo desde Support Tools > Troubleshooting > Diagnostic Tests", "Verifica que el cabezal de escaneo se mueva desde la posición de inicio a través del escaneo y regrese", "Reemplaza el ensamble del escáner de imagen si el cabezal no se actuata"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 213, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.03.45', 'Error del escáner - apagar y encender', 'Error en los sensores ópticos o en la comunicación del cabezal de escaneo con la placa de control.', 
        '["Apaga la impresora y vuelve a encenderla", "Actualiza el firmware a la última versión disponible", "Revisa el registro de eventos para otros errores del escáner y resuélvelos", "Desconecta y reconecta conectores FFC en la SCB (ZIF) y verifica funcionalidad", "Ejecuta la prueba de escaneo continuo para verificar el movimiento del cabezal de escaneo"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 217, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '30.04.01', 'Cable del sensor de cristal plano no detectado', 'El cable del sensor de cristal plano (flatbed) no está conectado o está desconectado en la placa de control del escáner.', 
        '["Apaga la impresora y vuelve a encenderla", "Apaga la impresora nuevamente", "Desconecta y reconecta el cable MOT/SNS (sensor de cristal plano) en la SCB etiquetado como callout 1", "Reinicia la impresora y verifica funcionalidad", "Reemplaza el ensamble del escáner de imagen si el error persiste"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}, {"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 247, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '31.03.33', 'Área de calibración del escáner de reverso sucio', 'La franja blanca en el cristal del platen o cristal del lado 2 del alimentador está sucia, afectando la calibración del escáner.', 
        '["Limpia la franja blanca en el cristal del platen y en el cristal del lado 2 del alimentador de documentos", "Apaga la impresora y vuelve a encenderla", "Verifica que el papel utilizado cumpla con las especificaciones de HP", "Confirma que la bandeja de entrada no esté sobrecargada y que las guías estén ajustadas correctamente", "Reemplaza el ensamble del alimentador de documentos si el error persiste"]'::jsonb, '[{"part_number": "5851-7203", "description": "Kit del alimentador de documentos"}, {"part_number": "5851-7204", "description": "Kit del alimentador de documentos FLOW Models"}]'::jsonb, 
        'customers', 335, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '41.01.YZ', 'Error del ensamble del escáner láser', 'Fallo en el ensamble del escáner láser o pérdida de conexión del arnés de cableado con el controlador DC.', 
        '["Toca OK para limpiar el error", "Apaga la impresora y vuelve a encenderla", "Verifica que el arnés de cableado del escáner láser al controlador DC esté correctamente asentado", "Reemplaza el ensamble del escáner láser si el error persiste", "Reemplaza el controlador DC PCA si el error continúa después de cambiar el escáner"]'::jsonb, '[{"part_number": "RM2-0906-000CN", "description": "Ensamble del escáner láser"}, {"part_number": "RM2-9493-000CN", "description": "Placa de circuito del controlador DC (M631/M632/M633/E62555/E62565/E62575)"}, {"part_number": "RM3-8458-000CN", "description": "Placa de circuito del controlador DC (M634/M635/M636/M637)"}, {"part_number": "RM3-7621-000CN", "description": "Placa de circuito del controlador DC (E62655/E62665/E62675)"}]'::jsonb, 
        'customers', 373, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.2X.YZ', 'Error de calentamiento del fusor', 'El fusor no alcanza la temperatura de funcionamiento correcta, posiblemente por problemas de alimentación eléctrica.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de cualquier regleta de enchufes o UPS y conecta directamente a una toma de corriente de pared", "Verifica que el voltaje de la salida coincida con la especificación de la impresora", "Verifica que el tipo y configuración de papel sean correctos", "Reemplaza el fusor o la fuente de alimentación de bajo voltaje si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}]'::jsonb, 
        'customers', 376, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.3X.YZ', 'Temperatura alta del fusor', 'El fusor excede la temperatura máxima de funcionamiento, posiblemente por falla del sensor, fuente de alimentación o problemas eléctricos.', 
        '["Apaga la impresora", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Verifica conexiones del fusor y reemplázalo si el conector está dañado", "Verifica conexiones J401 y J402 en el controlador DC PCA", "Reemplaza la fuente de alimentación de bajo voltaje (LVPS) si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6797-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 110V"}, {"part_number": "RM2-6798-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 220V"}]'::jsonb, 
        'customers', 379, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.4X.YZ', 'Fallo del circuito de accionamiento', 'Fallo en el circuito de control de potencia del fusor, posiblemente por problemas de alimentación eléctrica o componentes dañados.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de cualquier regleta de enchufes y conecta directamente a una toma de corriente de pared", "Verifica que el voltaje de la salida coincida con la especificación de la impresora", "Verifica que el tipo y configuración de papel sean correctos", "Reemplaza la fuente de alimentación de bajo voltaje si el error persiste"]'::jsonb, '[]'::jsonb, 
        'customers', 388, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.8X.YZ', 'Temperatura baja del fusor 2', 'El fusor no mantiene la temperatura mínima requerida, posiblemente por falla del sensor, conexión suelta o fuente de alimentación deficiente.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared con circuito dedicado", "Verifica que la fuente de alimentación cumpla con requisitos de frecuencia (43-67Hz)", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Verifica conexiones J401 y J402 en el controlador DC"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6797-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 110V"}, {"part_number": "RM2-6798-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 220V"}]'::jsonb, 
        'customers', 390, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.9X.YZ', 'Temperatura alta del fusor 2', 'El fusor excede la temperatura máxima, posiblemente por falla del sensor, control de potencia defectuoso o problemas de alimentación eléctrica.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared con circuito dedicado", "Verifica que la fuente de alimentación cumpla con requisitos (43-67Hz)", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Reemplaza el fusor y verifica conexiones J401 y J402"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6797-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 110V"}, {"part_number": "RM2-6798-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 220V"}]'::jsonb, 
        'customers', 393, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.AX.YZ', 'Temperatura baja del fusor 3', 'El fusor no alcanza la temperatura mínima de funcionamiento, posiblemente por falla del sensor o problemas con la fuente de alimentación.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared con circuito dedicado", "Verifica que el voltaje y la frecuencia sean correctos (43-67Hz)", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Reemplaza la fuente de alimentación de bajo voltaje si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}]'::jsonb, 
        'customers', 395, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '50.BX.YZ', 'Temperatura alta del fusor 3', 'El fusor excede la temperatura máxima de funcionamiento, posiblemente por falla del sensor o control defectuoso.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared", "Verifica que el voltaje de salida coincida con la especificación de la impresora", "Verifica que el tipo y configuración de papel sean correctos", "Reemplaza el fusor si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}]'::jsonb, 
        'customers', 416, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '57.00.03', 'Fallo del ventilador', 'El ventilador de dúplex FM2 no funciona correctamente, posiblemente por desconexión de cables, tornillo suelto o falla del componente.', 
        '["Apaga la impresora, espera 10 segundos y vuelve a encenderla", "Aprieta el tornillo en el ensamble de guía de alimentación de papel superior", "Desconecta y reconecta el conector J13L en el ensamble de puerta y J13 en el controlador DC PCA", "Reemplaza el ventilador FM2 si el error persiste después de apretar el tornillo", "Reemplaza el controlador DC si el error continúa después del cambio del ventilador"]'::jsonb, '[{"part_number": "RK2-8948-000CN", "description": "Ventilador 2 (FM2)"}, {"part_number": "RM2-9493-000CN", "description": "Controlador DC (M631, M632, M633, E62555, E62565, E62575)"}, {"part_number": "RM3-7621-000CN", "description": "Controlador DC (E62655, E62665, E62675)"}, {"part_number": "RM3-8458-000CN", "description": "Controlador DC (M634, M635, M636, M637)"}]'::jsonb, 
        'customers', 418, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '57.00.04', 'Fallo del ventilador del escáner', 'El ventilador FM1 del escáner ha fallado o perdido contacto en sus conectores, impidiendo la refrigeración del módulo de escaneo.', 
        '["Apagar y encender la impresora", "Desconectar y reconectar el conector J6402 en el ventilador del escáner", "Desconectar y reconectar el conector J211 en la PCA del controlador DC", "Reemplazar el ventilador del escáner FM1 si el error persiste"]'::jsonb, '[{"part_number": "RK2-8946-000CN", "description": "Ventilador del escáner FM1"}]'::jsonb, 
        'customers', 420, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '58.00.02', 'Fallo del sensor ambiental', 'El sensor ambiental ha fallado o sus conexiones están sueltas, lo que afecta la detección de condiciones ambientales o está causado por problemas de calidad de alimentación eléctrica.', 
        '["Apagar y encender la impresora", "Verificar que el conector J4200 del sensor ambiental esté correctamente asiento y sin daños", "Verificar que el conector J16 en la PCA del controlador DC esté correctamente asiento", "Reemplazar el sensor ambiental si el error persiste"]'::jsonb, '[{"part_number": "RM2-9037-000CN", "description": "Sensor ambiental"}]'::jsonb, 
        'customers', 421, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '58.00.03', 'Fallo del controlador DC', 'La PCA del controlador DC ha fallado o sus conexiones están sueltas, impidiendo la comunicación y el control del sistema.', 
        '["Apagar y encender la impresora", "Desconectar y reconectar todos los cables en la PCA del controlador DC", "Verificar que las conexiones no estén dañadas y estén correctamente asiento", "Reemplazar la PCA del controlador DC si el error persiste"]'::jsonb, '[{"part_number": "RM2-9493-000CN", "description": "PCA del controlador DC para M631/M632/M633/E62555/E62565/E62575"}, {"part_number": "RM3-8458-000CN", "description": "Controlador DC para M634/M635/M636/M637"}, {"part_number": "RM3-7621-000CN", "description": "PCA del controlador DC para E62655/E62665/E62675"}]'::jsonb, 
        'customers', 444, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('7ba8faf2-2570-4c70-a2aa-945ae102cb74', '66.00.0A', 'Fallo del accesorio de salida', 'Error de timeout en el control del accesorio de salida, indicando que la PCA del controlador del accesorio de salida no responde en el tiempo esperado.', 
        '["Apagar y encender la impresora", "Verificar que no haya atascos de papel u obstrucciones en el dispositivo de salida", "Reemplazar la PCA del controlador del accesorio de salida si el error persiste"]'::jsonb, '[{"part_number": "RM2-8847-000CN", "description": "PCA del controlador del accesorio de salida"}, {"part_number": "RM2-1066-000CN", "description": "Conjunto de alimentador de grapas (jogger)"}, {"part_number": "RM2-1067-000CN", "description": "Conjunto alimentador superior"}, {"part_number": "RK2-8148-000CN", "description": "Grapadora"}]'::jsonb, 
        'customers', 448, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '10.00.00', 'e-label Memory Error', 'An e-label Memory Error on toner cartridge. The printer is unable to read the toner cartridge data. The toner cartridge is present but defective. When this error occurs, a question mark appears on the gas gauge of the supply or supplies with the error.', 
        '["Check the toner cartridge.", "If the message displays again, turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 35, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '10.00.10', 'e-label Missing Memory Error', 'The printer is unable to detect the e-label. This message indicates that the printer has determined that the e-label is missing. When this error occurs, a question mark appears on the gas gauge of the supply or supplies with the error.', 
        '["Check the toner cartridge.", "If the message displays again, turn the printer off, and then on.", "If the error persists, replace the toner cartridge.", "If the error persists, please contact customer support.", "Check the toner cartridge."]'::jsonb, '[]'::jsonb, 
        'customers', 37, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '10.00.15', 'Install Toner Cartridge', 'A supply is either not installed or not correctly installed in the printer. The 10.00.15 is an event log only message, it will not show on the control panel. The only message to display will be Install Toner Cartridge.', 
        '["Replace or reinstall the toner cartridge correctly to continue printing.", "Test printer with a new toner cartridge.", "If the error persists with a new toner cartridge check the toner cartridge contacts inside the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 38, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '10.23.15', 'Install Fuser kit', 'The fuser is either not installed, or not correctly installed in the printer.', 
        '["Turn the printer off.", "Remove, and then reinstall the fuser."]'::jsonb, '[]'::jsonb, 
        'customers', 41, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '11.WX.YZ', 'error messages', '11.* errors Errors in the 11.* family are related to the printer real-time clock.', 
        '["Set the time and date on the printer control panel.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Set the time and date on the printer control panel.", "If the error persists, remove and reinstall the formatter. Make sure it is fully seated.", "If the error still persists, replace the formatter."]'::jsonb, '[]'::jsonb, 
        'customers', 65, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.WX.YZ', 'error messages', '13.* errors Errors in the 13.* family are related to jams. More than 1000 unique error codes are possible. Use the following information to understand the jam code. Not all codes apply to all printers. Message format: 13.WX.YZ ● W represents the jam location. ● X represents the sensor or door that triggered the jam. ● Y represents the jam condition (delay, stay, wrap, etc.) ● Z represents the paper source, fuser mode, or destination Table 6-4 Potential values for W and X W Jam location X Sensor or door A Input area 0 Envelope feeder A Input area 1 Tray 1 feed (unless Tray 1 feed is the registration sensor) A Input area 2 Tray 2 feed (unless Tray 2 feed is the registration sensor) A Input area 3 Tray 3 feed A Input area 4 Tray 4 feed NOTE: If available for specified printer A Input area 5 Tray 5 feed NOTE: If available for specified printer A Input area 6 Tray 6 feed NOTE: If available for specified printer A Input area 7 Optional tray exit sensor A Input area A Door 1 A Input area B Door 2 A Input area C Door 3 NOTE: If available for specified printer A Input area D Door 4 NOTE: If available for specified printer A Input area E Door 5 NOTE: If available for specified printer A Input area F Multiple sensors or doors B Image area 0 Media sensor for forbidden transparencies 56 Chapter 6 Numerical control panel messages Table 6-4 Potential values for W and X (continued) W Jam location X Sensor or door B Image area 2 Registration/top of page B Image area 3 Top of page B Image area 4 Loop B Image area 5 Fuser input B Image area 9 Fuser output B Image area A Door 1 B Image area B Door 2 B Image area F Multiple sensors or doors C Switchback area (between the fuser and the output bin) 1 Intermediate switchback sensor C Switchback area (between the fuser and the output bin) 2 Switchback media stay sensor C Switchback area (between the fuser and the output bin) 3 Paper delivery sensor D Duplex area 1 Duplex switchback D Duplex area 2 Duplex delivery D Duplex area 3 Duplex refeed D Duplex area A Door 1 (if different than the imaging area) D Duplex area B Door 2 (if different than the imaging area) D Duplex area F Multiple sensors or doors E Output or intermediate paper transport unit (IPTU) area 1 Output bin full sensor E Output or intermediate paper transport unit (IPTU) area 2 IPTU feed sensor 1 E Output or intermediate paper transport unit (IPTU) area 3 IPTU sensor 2 E Output or intermediate paper transport unit (IPTU) area 4 IPTU sensor 3 E Output or intermediate paper transport unit (IPTU) area 5 IPTU bin full sensor 4 E Output or intermediate paper transport unit (IPTU) area 6 Output sensor E Output or intermediate paper transport unit (IPTU) area A Door 1 E Output or intermediate paper transport unit (IPTU) area F Multiple sensors or doors F Multiple subsystems (occurs when paper is stuck in several areas) F Multiple sensors or doors 1 Jetlink input device 4 Tray 4 feed sensor NOTE: If available for specified printer 13.* errors 57 Table 6-4 Potential values for W and X (continued) W Jam location X Sensor or door 1 Jetlink Input device 5 Tray 5 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 6 Tray 6 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 7 Tray 7 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 8 Tray 8 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 9 Tray 9 feed sensor NOTE: If available for specified printer 1 Jetlink Input device A Door 1 1 Jetlink Input device B Door 2 1 Jetlink Input device F Multiple sensors or doors 2 Buffer pass unit 0 Buffer pass inlet sensor 2 Buffer pass unit 9 Buffer pass exit sensor 2 Buffer pass unit A Door 1 3 Page insert unit 0 Page insertion inlet sensor 3 Page insert unit 1 Page insertion tray 1 feed sensor 3 Page insert unit 2 Page insertion tray 2 feed sensor 3 Page insert unit 3 Page insertion tray 3 feed sensor 3 Page insert unit 4 Page insertion tray 4 feed sensor 3 Page insert unit 7 Output path feed sensor 3 Page insert unit 9 Page insertion exit sensor 3 Page insert unit A Door 1 4 Punch unit 0 Puncher inlet sensor 4 Punch unit 1 Puncher jam sensor 4 Punch unit 9 Puncher exit sensor 4 Punch unit A Door 1 5 Folding unit 0 Folder inlet sensor 5 Folding unit 1 Folder sensor 5 Folding unit 9 Folder exit sensor 5 Folding unit A Door 1 6 Stacker unit 0 Stacker inlet sensor 6 Stacker unit 4 Stacker outlet sensor 58 Chapter 6 Numerical control panel messages Table 6-4 Potential values for W and X (continued) W Jam location X Sensor or door 6 Stacker unit 7 Stacker switchback entrance sensor 6 Stacker unit 8 Stacker switchback registration sensor 6 Stacker unit 9 Stacker switchback lower sensor 7 Multi-bin mailbox (MBM) unit 0 MBM inlet sensor 7 Multi-bin mailbox (MBM) unit 1 MBM middle sensor 7 Multi-bin mailbox (MBM) unit 9 Stapler sensor 7 Multi-bin mailbox (MBM) unit A Door 1 7 Multi-bin mailbox (MBM) unit B Door 2 7 Multi-bin mailbox (MBM) unit C Door 3 7 Multi-bin mailbox (MBM) unit F Multiple sensors or doors 8 Stapler/stacker (SS) unit 0 SS inlet sensor 8 Stapler/stacker (SS) unit 1 SS Bin Z 8 Stapler/stacker (SS) unit 3 SS unit middle sensor 8 Stapler/stacker (SS) unit 4 SS unit outlet sensor 1 8 Stapler/stacker (SS) unit 5 SS unit outlet sensor 2 8 Stapler/stacker (SS) unit 9 Stapler sensor 8 Stapler/stacker (SS) unit A Door 1 8 Stapler/stacker (SS) unit B Door 2 9 Booklet maker unit 0 Booklet maker input sensor 9 Booklet maker unit 2 Booklet maker feed sensor 2 9 Booklet maker unit 2 Booklet maker feed sensor 3 9 Booklet maker unit 4 Booklet maker delivery sensor 9 Booklet maker unit 5 Booklet maker vertical paper path sensor 9 Booklet maker unit 6 Booklet unit front staple sensor 9 Booklet maker unit 7 Booklet unit rear staple sensor 9 Booklet maker unit 8 Booklet unit outlet sensor 9 Booklet maker unit A Door 1 9 Booklet maker unit B Door 2 9 Booklet maker unit C Door 3 9 Booklet maker unit F Multiple sensors or doors 0 Unknown 0 Unknown 13.* errors 59 Table 6-5 Potential values for Y (jam condition) Y Jam condition 0 Unknown 1 Unexpected sheet (duplex) 2 Staple jam 3 Jam caused by an open door (duplex) 4 Stay jam (the page never left the tray – duplex) A Stay jam (the page never left the tray – simplex) B Multifeed C Wrap D Delay (the page did not reach the sensor within the expected time – simplex) E Door open F Residual (paper is detected in the paper path when it should not be there) The information represented by the value for Z depends on where the paper is in the paper path. Table 6-6 Potential values for Z (source, fuser mode, or destination) Paper location Z Source, fuser mode, or destination When paper has not reached the fuser, Z represents the paper source. 1 Tray 1 Z represents the paper source. 2 Tray 2 Z represents the paper source. 3 Tray 3 Z represents the paper source. 4 Tray 4 If available for specified printer Z represents the paper source. 5 Tray 5 If available for specified printer Z represents the paper source. 6 Tray 6 If available for specified printer Z represents the paper source. D Duplexer Z represents the paper source. E Envelope feeder When paper has reached the fuser, is in the duplex path, or in the output path, Z represents the fuser mode. Jams can occur when there is a mismatch between the actual paper and the fuser mode setting. 0 Photo 1, 2, or 3 Designated 2 or 3 Z represents the fuser mode. 1 Normal (automatically sensed rather than based on the paper type set at the control panel) Z represents the fuser mode. 2 Normal (based on the paper type set at the control panel) 60 Chapter 6 Numerical control panel messages Table 6-6 Potential values for Z (source, fuser mode, or destination) (continued) Paper location Z Source, fuser mode, or destination Z represents the fuser mode. 3 Light 1, 2, or 3 Z represents the fuser mode. 4 Heavy 1 Z represents the fuser mode. 5 Heavy 2 Z represents the fuser mode. 6 Heavy 3 Z represents the fuser mode. 7 Glossy 1 Z represents the fuser mode. 8 Glossy 2 Z represents the fuser mode. 9 Glossy 3 Z represents the fuser mode. A Glossy Film Z represents the fuser mode. B Transparency Z represents the fuser mode. C Label Z represents the fuser mode. D Envelope 1, 2, or 3 Z represents the fuser mode. E Rough When paper has entered the output bin, Z represents the output bin, numbered from top to bottom. 0 Unknown bin Z represents the output bin 1 Bin 1 Z represents the output bin 2 Bin 2 Z represents the output bin 3 Bin 3 Z represents the output bin 4 Bin 4 Z represents the output bin 5 Bin 5 Z represents the output bin 6 Bin 6 Z represents the output bin 7 Bin 7 Z represents the output bin 8 Bin 8 Z represents the output bin 9 Bin 9 All paper locations E Door open jam All paper locations F Residual jam All paper locations 0 Forbidden OHT jam (when Y=2)', 
        '["Follow the instructions on the control panel to clear the jam. Check for paper in all possible jam locations.", "Verify that no doors are open.", "Check the paper tray to make sure paper is loaded correctly. The paper guides should be adjusted to the", "Make sure the type and quality of the paper being used meets the HP specifications for the printer.", "Use a damp, lint-free cloth to clean the rollers in the appropriate tray. Replace rollers that are worn."]'::jsonb, '[]'::jsonb, 
        'customers', 70, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.AA.EE', 'Left door open', 'The left door was opened during printing.', 
        '["Close the left door to allow the printer to attempt to clear the jam.", "If the error persists, please contact customer support.", "Close the left door to allow the printer to attempt to clear the jam.", "Check the projection part on the left door that defeats the left door interlocks. If broken replace the left", "Check SW1 using the manual sensor test."]'::jsonb, '[]'::jsonb, 
        'customers', 96, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.AB.EE', 'Right door Open', 'The right door was opened during printing.', 
        '["Close the right door to allow the printer to attempt to clear the jam.", "Check the projection part on the right door that defeats the right door interlocks. If broken replace the right"]'::jsonb, '[]'::jsonb, 
        'customers', 97, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B2.AZ', 'Jam in right door', 'Paper stay jam in the right door at the image area. Paper present at PS4550 after a specified time limit has passed. ● 13.B2.A1 This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from Tray 1. ● 13.B2.A2 This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from Tray 2. ● 13.B2.A3 This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from Tray 3. ● 13.B2.AD This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from the duplexer. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 99, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B2.D1', 'Jam in right door', 'Paper delay jam in the right door at the image area. Paper did not reach PS4550 in the specified time when printing from Tray 1. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "Ensure that the tray 1 pickup and separation rollers are installed correctly and show no damage or wear.", "Clean or replace the pickup, feed, and separation rollers as needed.", "If the error persists, please contact customer support."]'::jsonb, '[]'::jsonb, 
        'customers', 101, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B2.D2', 'Jam in right door', 'Paper delay jam at the image area. Paper did not reach PS4550 in the specified time when printing from Tray 2. This error might occur in conjunction with the Tray 2 Overfilled or Roller Issue message.. If using adhesive or self-sealing media, please see the instructions in (ish_3199741-3199797-16).', 
        '["Clear the paper jam."]'::jsonb, '[]'::jsonb, 
        'customers', 103, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B2.D2', 'Jam in right door 89', 'b. Look for and clear any paper present or obstructions in the paper path. Grasp the jammed paper with both hands and pull it straight out to remove it out of the printer. c. Close the right door to allow the printer to attempt to clear the jam message. 2. Turn the printer off and unplug the power cord. 3. Open the left door and clear any paper present or obstructions in the paper path. Grasp any jammed paper with both hands and pull it straight out to remove it out of the printer. 4. Plug the power cord in and turn on the printer. 5. If the error persists, ensure the type and quality of the paper being used meets the HP specifications for the printer. NOTE: For supported sizes and types view HP LaserJet Enterprise M631-M633, HP LaserJet Managed E62555-E62575, E62655-E62675 - Supported paper sizes and types c05495229. 6. Pull out tray 2 completely out of the printer to remove it. 7. Ensure that the protective orange plastic shipping locks are removed, if present. 8. Remove any jammed or damaged sheets of paper from the tray. 9. If the error persists, ensure that the tray width and length guides are set to the correct paper size for the paper being installed into the tray. Figure 6-42 Tray 2 paper guides 90 Chapter 6 Numerical control panel messages 10. Ensure the paper is not filled above the fill mark (line below 3 triangles). Remove any excess media. Figure 6-43 Paper height guides Figure 6-44 Overfilled tray Figure 6-45 Stack of paper not overfilled in tray 2 11. Ensure that the feed and separation rollers are installed correctly and show no damage or wear.', 
        '["Reinstall tray 2.", "If the error persists, please contact customer support at: www.hp.com/go/contactHP.", "Clear the paper jam.", "Turn the printer off and unplug the power cord.", "Open the left door and clear any paper present or obstructions in the paper path."]'::jsonb, '[]'::jsonb, 
        'customers', 103, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B2.DX', 'Jam in right door', 'Paper delay jam at the image area. Paper passed PS3601 feed sensor in Tray 3 but did not reach the registration sensor (PS4550) in the designated amount of time when printing from Tray 3. Paper passed PS3601 feed sensor in Tray 3 but did not reach the registration sensor (PS4550) in the designated amount of time when printing from Tray 4. Paper passed PS3601 feed sensor in Tray 3 but did not reach the registration sensor (PS4550) in the designated amount of time when printing from Tray 5.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 119, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B2.FF', 'Jam in right door', 'Paper residual jam at image area. Paper present at PS4550, at power on or after clearing a jam. If using adhesive or self-sealing media, please see the instructions in (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Toggle the registration/TOP sensor (PS4550) to ensure that it moves freely.", "Test the registration/TOP sensor (PS4550) using the manual sensor test."]'::jsonb, '[]'::jsonb, 
        'customers', 124, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B4.FF', 'Jam in right door', 'Paper residual jam at image area. Paper present at fuser loop sensor PS4500 at power on or after clearing a jam. If using adhesive or self-sealing media, please see the instructions in (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Remove the fuser and check for paper and the correct movement of the sensors PS4500."]'::jsonb, '[]'::jsonb, 
        'customers', 125, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B9.AZ', 'Fuser jam 113', '● The output bin rollers are not turning. Because there is very little distance from the fuser exit to the output bin, paper stopped at the rollers can cause a fuser jam. ● A sticky fuser exit flag. If the flag is stuck or even delayed momentarily in the activated position it can cause this jam. ● Self-sealing or adhesive media is being used. Please see the instructions in . (ish_3199741-3199797-16). ● 13.B9.A1 jam is detected when printing from Tray 1. ● 13.B9.A2 jam is detected when printing from Tray 2. ● 13.B9.A3 jam is detected when printing from Tray 3. ● 13.B9.A4 jam is detected when printing from Tray 4. ● 13.B9.A5 jam is detected when printing from Tray 5. ● 13.B9.AD jam is detected when printing from the duplexer.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 127, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B9.CZ', '115', '● 13.B9.C1 Fuser wrap jam when Auto Sense (Normal). ● 13.B9.C2 Fuser wrap jam when Normal. ● 13.B9.C3 Fuser wrap jam when Light 1 or Light 2. ● 13.B9.C4 Fuser wrap jam when Heavy 1. ● 13.B9.C5 Fuser wrap jam when Heavy 2. ● 13.B9.C6 Fuser wrap jam when Heavy Paper 3. ● 13.B9.C7 Fuser wrap jam when Glossy Paper 1. ● 13.B9.C8 Fuser wrap jam when Glossy Paper 2. ● 13.B9.C9 Fuser wrap jam when Glossy Paper 3. ● 13.B9.CB Fuser wrap jam when Transparency. ● 13.B9.CC Fuser wrap jam when Label. ● 13.B9.CD Fuser wrap jam when Envelope 1 or Envelope 2. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16)', 
        '["Clear the paper jam.", "Print a cleaning page to ensure that all of the toner is removed from the fuser roller.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam."]'::jsonb, '[]'::jsonb, 
        'customers', 129, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.D3.DZ', '121', 'c. Close the right door to allow the printer to attempt to clear the jam message. 2. Ensure the type and quality of the paper being used meets the HP specifications for the printer. 3. If the error persists, please contact customer support. Recommended action for call-center agents and onsite technicians 1. Clear the paper jam. a. Open the right door. b. Look for and clear any paper present or obstructions in the paper path. c. Close the right door to allow the printer to attempt to clear the jam message. 2. Perform the continuous paper path test in simplex mode of at least 50 pages to ensure that issue is occurring while duplex printing only. 3. Test duplexing from multiple trays to see if issue is tray specific or not. If the jam occurs from only one specific tray, troubleshoot the tray for pick and feed issues. a. Ensure the type and quality of the paper being used meets the HP specifications for the printer. b. Ensure the tray is set correctly. If Tray 1 is set to ANY size ANY type, set it to the size the customer is trying to print on. c. Ensure that the tray width and length guides are set to the correct paper size being installed into the tray and that the tray is not over filled above the fill mark or over the tab on the tray. d. Ensure that the tray pickup, feed, and separation rollers are installed correctly and show no damage or wear. Clean or replace the rollers as needed. 4. Test the duplex sensor (PS4700) using the manual sensor test. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Manual Sensor Test c. Select from the following tests: ● All Sensors , Engine Sensors ● Done (return to the Troubleshooting menu) ● Reset (reset the selected sensor’s state) d. Test the duplex sensor to verify that the sensor is functioning correctly. If the sensor does not function, replace the right door sub assembly. NOTE: Before replacing any parts check connector J309 on the DC controller. Part number: RM2-0849-000CN For instructions: See the Repair Service Manual for this product. 122 Chapter 6 Numerical control panel messages 5. Enter the component test menu to run diagnostics on the printer. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Components Test 6. Run the Duplex refeed clutch solenoid. If the tests fail, replace the delivery assembly. Paper delivery assembly part number: RM2-6787-000CN For instuctions: See the Repair Service Manual for this product. 7. Check the right door assembly and rollers for any damage or debris. Replace the right door assembly as needed. Part number: RM2-0849-000CN For instructions: See the Repair Service Manual for this product. 13.D3.FF A power on jam has occurred at the duplex refeed sensor.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Test the duplex sensor (PS4700) using the manual sensor test."]'::jsonb, '[]'::jsonb, 
        'customers', 135, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.E1.D3', 'Fuser Area Jam', 'Output delivery delay jam. Paper did not reach the output bin full sensor in time.', 
        '["Follow the instructions on the control panel to clear the jam. Check for paper in all possible jam locations.", "Verify that no doors are open.", "Check the paper tray to make sure paper is loaded correctly. The paper guides should be adjusted to the", "Verify that the paper meets specifications for this printer.", "Use a damp, lint-free cloth to clean the rollers in the appropriate tray. Replace rollers that are worn."]'::jsonb, '[]'::jsonb, 
        'customers', 138, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.E1.D2', 'This event code was detected when the gear on the delivery assembly is separated from the fuser drive assembly', 'This event code was detected when the gear on the delivery assembly is separated from the fuser drive assembly and is not in contact with the fuser drive assembly.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Clear the paper jam.", "Check if the gear on the Delivery assembly is separated from and Fuser drive assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 140, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.80.F0', '143', 'e. Remove the fuser unit. CAUTION: The fuser might be hot. f. Remove all paper found and then reinstall the fuser. g. Close the printer right door. 2. If the issue persists, replace the lower paper feed assembly. Part number: RM2-1071-000CN For instructions: See the Repair Service Manual for this product. 13.83.Az Paper stay jam right door of the stapler/stacker. The paper stopped at the staple entry sensor in the designated time. ● 13.83.A1 A jam is detected when printing to output bin 1. ● 13.83.A2 A jam is detected when printing to output bin 2.', 
        '["Clear the paper jam.", "If the error persists, please contact customer support.", "Clear the paper jam.", "If the issue persists, replace the upper paper feed assembly.", "If the issue persists, replace the jog assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 157, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.83.DZ', '145', 'd. Open the printer right door. e. Remove the fuser unit. CAUTION: The fuser might be hot. f. Remove all paper found and then reinstall the fuser. g. Close the printer right door. 2. If the issue persists, replace the lower paper feed assembly. Part number: RM2-1071-000CN For instructions: See the Repair Service Manual for this product. 3. If the issue persists, replace the upper paper feed assembly. Part number: RM2-1067-000CN For instructions: See the Repair Service Manual for this product. 13.83.FO Power on Jam/Stacker jam – middle sensor.', 
        '["Check the printer for a jam in the stapler/stacker.", "Look for and clear any paper in the upper right cover of the stapler/stacker.", "View the event log to determine if any other jam errors are occurring and troubleshoot those errors.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Check the printer for a paper jam."]'::jsonb, '[]'::jsonb, 
        'customers', 159, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.WX.YZ', 'error messages', '30.* errors Errors in the 30.* family are related to the flatbed scanner. Recommended action Follow these troubleshooting steps in the order presented. Use the following general troubleshooting steps to try to resolve the problem. If the error persists, contact your HP-authorized service or support provider, or contact HP support at www.hp.com/go/contactHP. 1. Calibrate the scanner. Open these menus: Device Maintenance > Calibrate-Cleaning > Calibrate Scanner. 2. Clean the scanner glass and glass strips. 3. Perform the tests for scanner diagnostics. Open these menus: Administration > Troubleshooting > Diagnostic Tests > Scanner Tests. 4. Upgrade the firmware. For the latest firmware versions, go to HP FutureSmart - Latest Firmware Versions 5. Check all connections on the scanner control board and from the scanner control board to the formatter and the DC controller or the engine control board. If all connections are good, replace the scanner control board. 6. Replace the formatter. 7. If the error persists, replace the scanner assembly. The flatbed cover sensor was interrupted. The scanner flatbed cover is open. This message appears only in the event log and is not posted on the control panel. The control panel will read Flatbed Cover Open.', 
        '["Turn the printer off, and then on.", "This error message should automatically clear.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn off the printer and then turn on the printer.", "Open the scanner lid or automatic document feeder (ADF)."]'::jsonb, '[]'::jsonb, 
        'customers', 163, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.01.08', 'Home position error', 'The scanner optic failed to return to the home position. 156 Chapter 6 Numerical control panel messages', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Print a Configuration Page to check if the latest version of the printer and scanner firmware is installed. If", "Observe whether the movement of the optics assembly moves correctly."]'::jsonb, '[]'::jsonb, 
        'customers', 170, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.01.41', 'Scanner error', 'The formatter lost connections with the SCB or communication was corrupted. NOTE: Check the voltage of the unit on the regulatory sticker. In the past, this event is directly related to a 220V printer being plugged into a 110V outlet. Ensure that the voltage of the outlet matches the voltage of the printer. 164 Chapter 6 Numerical control panel messages', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer power off, and then disconnect the power cable from the printer.", "Wait for one minute, reconnect the power cable, and then turn the printer power on."]'::jsonb, '[]'::jsonb, 
        'customers', 178, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.01.43', 'SCB memory failure 169', '3. Check the cables on the scanner control board (SCB). Make sure the flat flexible cables (FFC''s) are seated correctly. NOTE: When disconnecting and reseating flat flexible cables (FFC’s) on the Scanner Control Board (SCB) it’s important to know that the connectors are Zero Insertion Force (ZIF) connectors. ZIF connectors have gates that need to be opened and closed for proper removal/reinsertion. These connectors are significantly different than the Light Insertion Force (LIF) connectors found on the LaserJet M527 and Color LaserJet M577 printers. Figure 6-116 Gate Closed Figure 6-117 Proper insertion Figure 6-118 Improper insertion 170 Chapter 6 Numerical control panel messages 4. Disconnect and reconnect all cables between the formatter and the scanner control board (SCB). Table 6-33 SCB sensor callout descriptions Callout Description 1 Flatbed sensor/motor 2 Flatbed FFC 3 ADF sensor 4 ADF FFC 5 ADF Motor 5. Restart the printer and check if the error persists. 6. If the error persists, replace the scanner control board (SCB). Table 6-34 SCB part numbers for Enterprise and Flow models Description Part number SCB Enterprise 5851-7764 Scanner control board (SCB) Flow series 5851-7347 For instructions: See the Repair Service Manual for this product. 7. If the error persists, replace the formatter. Table 6-35 Formatter part number Description/ Product models Part number Formatter (main logic) PC board For products: M631, M632, M633, E62555, E62565, E62575 J8J61-60001 Formatter (main logic) PC board For products: E62655/E62665/E62675 3GY14-67901 Recommended action for onsite technicians 171 Table 6-35 Formatter part number (continued) Description/ Product models Part number Kit -Formatter For products: E62655/E62665/E62675 (India/China) 3GY14-67902 Formatter For products: M634, M635, M636, M637 (India/China) 7PS94-67901 Formatter For products: M634, M635, M636, M637 7PS94-67902 For instructions: See the Repair Service Manual for this product. SCB communication error.', 
        '["Turn the printer power off, and then disconnect the power cable from the printer.", "Wait for one minute, reconnect the power cable, and then turn the printer power on.", "If the error persists, upgrade the printer firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer power off, and then disconnect the power cable from the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 183, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.01.54', '179', 'For additional troubleshooting steps, go to WISE and search for the following document: HP LaserJet Enterprise MFP M631-M633, HP LaserJet Managed MFP E62555-E62575 Non-Flow - Control panel is not responsive and/or a 30.01.41 error (Emerging Issue) (document c06103348).', 
        '["Turn the printer off, and then on.", "This error message should automatically clear.", "If the error persists, download FutureSmart firmware 4.7 or later.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 193, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.03.14', '183', 'Front side scanner not detected.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the error persists, replace the image scanner assembly.", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 197, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.04.02', 'Flatbed FFC Cable Not Detected', 'The flatbed FFC cable is not attached or did not sync with scanner controller board FW at power up. Cables are only accessible to a service technician.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, replace the image scanner assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 221, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.04.03', 'ADF FFC Cable Disconnected', 'The automatic document feeder FFC cable is not attached or did not sync with scanner controller board FW at power up. Cables are not accessible to the user. 210 Chapter 6 Numerical control panel messages', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Dispatch a technician onsite to perform the following tasks:", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 224, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.04.04', 'ADF Motor Cable Disconnected', 'The automatic document motor cable is not attached or did not sync with scanner controller board FW at power up. Cables are not accessible to the user.', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Dispatch a technician onsite to perform the following tasks:", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 228, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.04.05', 'ADF Sensor Cable Disconnected', 'The document feeder sensor cable is not attached or did not sync with scanner controller board FW at power up. Cables are not accessible to the user.', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Dispatch a technician onsite to perform the following tasks:"]'::jsonb, '[]'::jsonb, 
        'customers', 231, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '31.01.47', 'Document feeder not detected', 'The document feeder was not detected, or the document feeder might not be connected. The flatbed glass is still available for scanning.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact HP customer support.", "Turn the printer off, and then on.", "If the error persists, replace the document feeder.", "Before replacing the document feeder, the on-site technician should verify that the connections between"]'::jsonb, '[]'::jsonb, 
        'customers', 235, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '31.03.20', 'Backside scanner not detected', 'Backside scanner not detected.', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 237, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '31.03.22', 'Scanner calibration failure', 'Backside illumination calibration failure.', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, please contact HP customer support."]'::jsonb, '[]'::jsonb, 
        'customers', 241, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '31.03.30', 'Document feeder pick motor error', 'The document feeder pick motor is not turning.', 
        '["Open the top cover and remove any paper present. Close the top cover.", "Turn the printer off, and then on.", "Verify that the paper being used meets the HP specifications for the printer.", "Ensure that the input tray is not overloaded and that the tray guides are set to the correct size.", "If the error persists, please contact customer support at: www.hp.com/go/contactHP."]'::jsonb, '[]'::jsonb, 
        'customers', 243, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '31.03.31', 'Document feeder motor stall', 'The document feeder feed motor is not turning.', 
        '["Open the top cover and remove any paper present. Close the top cover.", "Turn the printer off, and then on.", "Verify that the paper being used meets the HP specifications for the printer.", "Ensure that the input tray is not overloaded and that the tray guides are set to the correct size.", "If the error persists, please contact HP customer support."]'::jsonb, '[]'::jsonb, 
        'customers', 245, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '31.13.00', 'Document feeder multi-pick error', 'A multiple pick error was reported by the document feeder assembly (ADF). Issue might be described as the following: ● Picking multiple documents ● Picking more than one page ● Multiple sheets pulled from ADF ● Multiple pages picked', 
        '["Remove any paper in the paper path.", "Open the automatic document feeder cover, pull all the sheets back into the tray and then resume the job.", "Lift the document-feeder input tray and remove any jammed paper."]'::jsonb, '[]'::jsonb, 
        'customers', 251, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '31.13.00', 'Document feeder multi-pick error 237', 'a. Lift the document feeder input tray b. Remove any paper found under the tray. c. Lower the document-feeder input tray and then close the document feeder cover. NOTE: Verify that the latch on the top of the document-feeder cover is completely closed. 4. For 31.13.02, check for any paper jams or remnants under the document feeder (ADF) blocking in the paper path 238 Chapter 6 Numerical control panel messages a. Open the ADF and remove any paper found. b. Check for any paper remnants blocking the sensor as well as wiping any paper dust off the glass in the region shown below. If significant debris has accumulated over the circular mirror (used for paper edge sensing) this can cause a paper jam error. Callout 1: Check for paper blocking this area. Callout 2: Clean this area with a damp lint free cloth. c. Close the document feeder. 5. Ensure that the paper meets the document feeder (ADF) specifications for the printer. This document outlines the supported weights and sizes of the ADF including best practices: Go to or search for document: HP LaserJet and PageWide Array Enterprise and Managed 500 and 600 - Use the automatic document feeder (ADF):', 
        '["Ensure that the input tray is not overloaded and that the tray guides are set to the correct size. Make sure", "Check the Document Feeder Kit consumable status.", "Check and clean the document feeder pickup rollers and separation rollers by removing any visible lint or", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Remove any paper in the paper path."]'::jsonb, '[]'::jsonb, 
        'customers', 251, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '31.13.02', '275', 'a. Lift the document feeder input tray b. Remove any paper found under the tray. c. Lower the document-feeder input tray and then close the document feeder cover. NOTE: Verify that the latch on the top of the document-feeder cover is completely closed. 4. For 31.13.02, check for any paper jams or remnants under the document feeder (ADF) blocking in the paper path 276 Chapter 6 Numerical control panel messages a. Open the ADF and remove any paper found. b. Check for any paper remnants blocking the sensor as well as wiping any paper dust off the glass in the region shown below. If significant debris has accumulated over the circular mirror (used for paper edge sensing) this can cause a paper jam error. Callout 1: Check for paper blocking this area. Callout 2: Clean this area with a damp lint free cloth. c. Close the document feeder. 5. Ensure that the paper meets the document feeder (ADF) specifications for the printer. This document outlines the supported weights and sizes of the ADF including best practices: Go to or search for document: HP LaserJet and PageWide Array Enterprise and Managed 500 and 600 - Use the automatic document feeder (ADF):', 
        '["Ensure that the input tray is not overloaded and that the tray guides are set to the correct size. Make sure", "Check the Document Feeder Kit consumable status.", "Check and clean the document feeder pickup rollers and separation rollers by removing any visible lint or", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Remove any paper in the paper path."]'::jsonb, '[]'::jsonb, 
        'customers', 289, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '33.WX.YZ', 'error messages', '33.* errors Errors in the 33.* family are related to the printer’s storage system or the formatter. The component might have been previously installed in another printer and is therefore locked to that other printer. Or, the component might be incorrect for this printer.', 
        '["Turn the printer off, and then on.", "If the issue persists, investigate if the solid state drive (SSD) or hard disk drive (HDD) or formatter are", "If the issue persists, locate and notate the complete 33.WX.YZ error message as displayed on the control", "Turn off the printer, and then turn on the printer.", "If the issue persists, investigate if the solid state drive (SSD) or hard disk drive (HDD) or formatter are the"]'::jsonb, '[]'::jsonb, 
        'customers', 320, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '33.02.02', 'Save Recover Status Error', 'Save Recover Status Error The save or recover is disabled, (one or both disabled) (Event Log Only) Recommended action There is no action needed for this message. ■ No action necessary. Data size mismatch. Unable to recover DCC NVRAM.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Turn the printer off, and then ensure that all the connectors on the DC controller PCA are connected", "If the error persists, replace the DC Controller."]'::jsonb, '[]'::jsonb, 
        'customers', 322, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '33.03.05', 'EFI Boot error', 'EFI BIOS event showing that a replacement formatter Recover attempt was unsuccessful.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn off the printer, and then turn on the printer.", "If the error persists, ensure to use the Backup/Restore feature to save the printer settings, and then", "If the error persists, download and install the latest printer firmware available at HP Customer Support -"]'::jsonb, '[]'::jsonb, 
        'customers', 324, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '33.04.05', 'TPM (Trusted Platform Module) Security Error', 'TPM (Trusted Platform Module) Security Error This system contains a TPM module that is not supported on the device or belongs to another device. Recommended action 313 TPM is unique for each device. For units that shipped with a TPM on board standard (most newer models): If the original TPM installed in the factory is unavailable or damaged, DO NOT replace any parts. Follow the recommended action.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Do not replace the formatter or HDD. It will not solve this issue.", "Perform a Format Disk procedure, select Continue in the Pre-boot menu, and then reboot the device.", "Perform a Format Disk procedure again, and then reboot the device."]'::jsonb, '[]'::jsonb, 
        'customers', 327, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '33.05.2X', 'Intrusion detection errors', 'The intrusion detection system has encountered an error. The intrusion detection memory process determined an unauthorized change in system memory. ● 33.05.21 Security alert ● 33.05.21 Potential intrusion (Event code) The intrusion detection memory process heartbeat was not detected. ● 33.05.22 Security alert ● 33.05.22 Cannot scan for potential intrusions (Event code) 316 Chapter 6 Numerical control panel messages The intrusion detection memory process did not initialize. ● 33.05.23 Security alert ● 33.05.23 Intrusion detection not initialized (Event code) ● 33.05.24 Intrusion detection initialization error (Event code)', 
        '["Turn the printer off then on.", "Make sure that the printer is in a Ready state.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off then on.", "Make sure that the printer is in a Ready state."]'::jsonb, '[]'::jsonb, 
        'customers', 330, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '33.05.5Z', 'Intrusion detection errors', 'The intrusion detection system has encountered an error. The intrusion detection memory process determined an unauthorized change in system memory. ● 33.05.51 Security alert ● 33.05.51 Potential intrusion (Event code) The intrusion detection memory process heartbeat was not detected. ● 33.05.52 Security alert ● 33.05.52 Cannot scan for potential intrusions (Event code) The intrusion detection memory process did not initialize. ● 33.05.53 Security alert ● 33.05.53 Intrusion detection not initialized (Event code) ● 33.05.54 Intrusion detection initialization error (Event code)', 
        '["Turn the printer off then on.", "Make sure that the printer is in a Ready state.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off then on.", "Make sure that the printer is in a Ready state."]'::jsonb, '[]'::jsonb, 
        'customers', 331, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '41.02.00', 'Error', 'A beam detected misprint error occurred.', 
        '["Touch OK to clear the error.", "If the error is not cleared, press the power button to turn off the printer, and then to turn on the printer.", "If the error persists, attempt to remove and reinstall the toner cartridge.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 337, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '41.03.FZ', 'Unknown Misprint Error', 'This is a general misprint error. Either the paper is loaded off-center with the guides in the tray, or a paper width sensor failure occurred from an unknown tray. The error will be one of the following: ● 41.03.F0 ● 41.03.F1 ● 41.03.F2 ● 41.03.F3 ● 41.03.F4 ● 41.03.F5 ● 41.03.FD', 
        '["Touch OK to clear the error.", "Remove the paper and the reload the tray. Ensure that the tray width and length guides are set to the correct", "If the error is not cleared, turn the printer off, and then on.", "If the error persists, please contact customer support.", "Remove the paper and the reload the tray. Ensure that the tray width and length guides are set to the correct"]'::jsonb, '[]'::jsonb, 
        'customers', 340, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '41.03.YZ', 'Unexpected size in tray <X> 327', '● Z = E Source is the envelope feeder. ● Z = 1 Source is Tray 1. ● Z = 2 Source is Tray 2. ● Z = 3 Source is Tray 3. ● Z = 4 Source is Tray 4. ● Z = 5 Source is Tray 5.', 
        '["Touch OK to use another tray.", "Print a configuration page to verify the size and type the trays are set to.", "Ensure that the tray width and length guides are set to the correct paper size being installed into the tray", "Verify that the error is not occurring as a result of an unexpected paper size trigger caused by a multi-page", "If the paper is jammed inside the printer, ensure it is completely removed. If paper has been ripped during"]'::jsonb, '[]'::jsonb, 
        'customers', 341, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '41.04.YZ', 'Printer Error 329', '● Y = 3: Light Paper 1, 2, or 3 mode ● Y = 4: Heavy Paper 1 ● Y = 5: Heavy Paper 2 ● Y = 6: Heavy Paper 3 ● Y = 7: Glossy Paper 1 ● Y = 8: Glossy Paper 2 ● Y = 9: Glossy Paper 3 ● Y = A: Glossy film ● Y = B: OHT ● Y = C: Label ● Y = D: Envelope 1, 2, or 3 mode ● Y = E: Rough ● Y = F: Other mode ● Z = D: Source is the duplexer. ● Z = 0: Source is the envelope feeder. ● Z = 1: Source is Tray 1. ● Z = 2: Source is Tray 2. ● Z = 3: Source is Tray 3. ● Z = 4: Source is Tray 4. ● Z = 5: Source is Tray 5.', 
        '["Touch OK to clear the error.", "If the error does not clear, turn the printer off, and then on.", "Swap out or re-seat each toner cartridge to test the toner cartridges.", "If the error persists, please contact customer support.", "Touch OK to clear the error."]'::jsonb, '[]'::jsonb, 
        'customers', 343, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '42.WX.YZ', 'error messages', '42.* errors Errors in the 42.* family indicate an internal system failure has occurred.', 
        '["Turn the printer off, and then on. Retry the job.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on. Retry the job.", "If the error persists, perform a Format Disk procedure using the Preboot menu."]'::jsonb, '[]'::jsonb, 
        'customers', 346, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '44.03.XX', 'Error Event log message', 'A digital send error has occurred.', 
        '["Use optimal resolution and image quality settings.", "Wait until all the digital send jobs have been processed.", "Turn the printer off, and then on and retry the job.", "Verify if there is an attachment limit on the email.", "Verify network connectivity, SMTP gateways, access to folder share."]'::jsonb, '[]'::jsonb, 
        'customers', 348, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '46.WX.YZ', 'error messages', '46.* error messages Errors in the 46.* family occur when the printer is trying to perform an action that it is not able to complete. ● No network connectivity ● A problem with the file being printed, with the software application sending the job, or with the print driver', 
        '["Turn the printer off, and then on.", "Verify the printer is connected to the network, look at the network port connection on the back of the", "Send a different file from the same software application to see if the error is specific to the original file.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 357, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '47.WX.YZ', 'error messages', '47.* errors Errors in the 47.* family indicate an internal error has occurred.', 
        '["Turn the printer off, and then on.", "Resend the print job.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Resend the print job."]'::jsonb, '[]'::jsonb, 
        'customers', 359, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '47.03.XX', '347', '3. If the error persists, clear the active partition by using the Format Disk item in the Preboot menu. For the steps to perform a Clean or Format Disk procedure, search for "HP LaserJet Enterprise, HP LaserJet Managed - Various methods to clean the hard disk drives or solid-state drives" (ish_4502973-4502949-16) - . 47.05.xx Print spooler framework internal error.', 
        '["Turn the printer off, and then on.", "Resend the print job.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Resend the print job."]'::jsonb, '[]'::jsonb, 
        'customers', 361, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '47.FC.YZ', 'Printer Calibration Failed To continue, touch “OK”', 'The device is unable to access or implement one of the image patterns files. y = Calibration type, z = Event ● 47.FC.00 (event code) Color plane registration (CPR) Image not found at system initialization ● 47.FC.01 (event code) CPR Store Image failure ● 47.FC.02 (event code) CPR Image not found ● 47.FC.03 (event code) CPR Print engine execution failure ● 47.FC.10 (event code) Consecutive Dmax Dhalf Image not found at system initialization ● 47.FC.11 (event code) Consecutive Dmax Dhalf Store image failure ● 47.FC.12 (event code) Consecutive Dmax Dhalf Image not found ● 47.FC.13 (event code) Consecutive Dmax Dhalf Print engine execution failure ● 47.FC.20 (event code) Error Diffusion Image not found at system initialization ● 47.FC.21 (event code) Error Diffusion Store image failure ● 47.FC.22 (event code) Error Diffusion Image not found ● 47.FC.23 Error Diffusion Print engine execution failure ● 47.FC.30 0 (event code) Drum Speed Adjustment Image not found at system initialization ● 47.FC.31 (event code) Drum Speed Adjustment Store image failure ● 47.FC.32 (event code) Drum Speed Adjustment Image not found ● 47.FC.33 (event code) Drum Speed Adjustment Print engine execution failure ● 47.FC.40 (event code) Pulse Width Modulation Image not found at system initialization ● 47.FC.41 (event code) Pulse Width Modulation Store image failure ● 47.FC.42 (event code) Pulse Width Modulation Image not found ● 47.FC.43 (event code) Pulse Width Modulation Print engine execution failure', 
        '["Turn the product off, and then on again.", "If the error persists, reload the firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 363, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '48.WX.YZ', 'error messages', '48.* errors Errors in the 48.* family indicate an internal error has occurred.', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "In most cases, no action is necessary.", "If the error persists, upgrade the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 365, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '49.WX.YZ', 'error messages', '49.XX.YY Error To continue turn off then on A firmware error occurred. Possible causes: ● Corrupted print jobs ● Software application issues ● Non-product specific print drivers ● Poor quality USB or network cables ● Bad network connections or incorrect configurations ● Invalid firmware operations ● Unsupported accessories A 49 error might happen at any time for multiple reasons. Although some types of 49 errors can be caused by hardware failures, it is more common for 49 errors to be caused by printing a specific document or performing some task on the printer. 49 errors most often occur when a printer is asked to perform an action that the printer firmware is not capable of and might not have been designed to comply with, such as: ● Printing files with unsupported programming commands ● A unique combination of user environment and user interactions with the printer ● Interfacing with a third-party solution that was not designed to work with the printer ● Specific timing, network traffic, or concurrent processing of jobs', 
        '["Turn the printer off, and then on.", "If the error persists, check the following:", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, check the following:"]'::jsonb, '[]'::jsonb, 
        'customers', 366, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.WX.YZ', 'error messages', '50.* errors Errors in the 50.* family indicate a problem with the fuser.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and remove the fuser. Check the fuser for damage or obstructions. Reinstall or replace", "Check the connectors between the fuser and the DC controller and from the fuser to the printer.", "Replace the fuser. If it has already been replaced, replace the fuser power supply."]'::jsonb, '[]'::jsonb, 
        'customers', 370, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.1X.YZ', 'Low fuser temperature failure', 'Low fuser temperature failure x = fuser mode, y = previous printer sleep state, and z = next printer sleep state.', 
        '["Turn the printer off, and then on.", "Ensure the printer is plugged directly into a wall outlet and that the outlet voltages matches the", "Ensure the paper type and fuser mode are correct for the paper being used.", "Make sure the paper type is set correctly on the printer and that the printer driver matches the type of paper", "Retest the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 370, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.6X.YZ', 'Open fuser circuit (heating element failure)', 'Open fuser circuit (heating element failure)', 
        '["Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 381, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.7F.00', 'Fuser pressure-release mechanism failure', 'Fuser pressure-release mechanism failure', 
        '["Turn the printer off, and then on.", "Ensure the printer is plugged directly into a wall outlet and that the outlet voltages matches the", "Ensure the paper type and fuser mode are correct for the paper being used.", "Make sure the paper type is set correctly on the printer and that the printer driver matches the type of paper", "Retest the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 385, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.BX.YZ', '381', '2. Remove and reinstall the fuser. Ensure that the fuser is seated correctly. CAUTION: The fuser might be hot. a. Open the rear door. b. Grasp the blue handles on both sides of the fuser and pull straight out to remove it. c. Ensure that there is no residual paper in the fuser. 382 Chapter 6 Numerical control panel messages d. Reseat the fuser. e. Close the front door. 3. Check the printer power source. Ensure that the power source meets the printer requirements. Ensure that the printer is the only device using the circuit. NOTE: If the printer does not meet the power requirement of 43 to 67Hz frequency, the fuser temperature control does not work correctly and this will cause the error. 4. Check connections J401 and J402 on the DC controller PCA. 5. If the fuser has not been replaced, replace the fuser. 110V part number: RM2-1256-000CN For intsrructions: See the Repair Service Manual for this product. 220V part number: RM2-1257-000CN For intsrructions: See the Repair Service Manual for this product. 6. If the error persists, replace the low voltage power supply (LVPS). 110V LVPS part number: RM2-6797-000CN For instructions: See the Repair Service Manual for this product. 220V LVPS part number: RM2-6798-000CN For instructions: See the Repair Service Manual for this product. Recommended action for call-center agents and onsite technicians 383 51.WX.YZ, 52.WX.YZ error messages 51.* errors Errors in the 51.* family are related to the laser scanner.', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Ensure the printer is running the most current version of firmware.", "Check all connections on the laser/scanner and from the laser/scanner to the DC controller, and reseat them"]'::jsonb, '[]'::jsonb, 
        'customers', 395, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '53.WX.YZ', 'error messages', '53.A0.y0 Tray "Y" side guide misalignment resolved. The engine detected that the tray guide misalignment has been resolved. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A0.10: Tray 1 Side guide misalignment resolved. ● 53.A0.20: Tray 2 side guide misalignment resolved. ● 53.A0.30: Tray 3 side guide misalignment resolved. ● 53.A0.40: Tray 4 side guide misalignment resolved. ● 53.A0.50: Tray 5 side guide misalignment resolved. ● 53.A0.60: Tray 6 side guide misalignment resolved. Recommended action No Action necessary. ■ This is an informational message; no action is necessary. 53.A0.y1 Tray "Y" Side guide misalignment proactive warning. The engine detected a tray "Y" side guide misalignment. This is a proactive warning intended to avoid a jam event. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A0.11: Tray 1 side guide misalignment warning. ● 53.A0.21: Tray 2 side guide misalignment warning. ● 53.A0.31: Tray 3 side guide misalignment warning. ● 53.A0.41: Tray 4 side guide misalignment warning. ● 53.A0.51: Tray 5 side guide misalignment warning. ● 53.A0.61: Tray 6 side guide misalignment warning.', 
        '["Ensure that the paper size in the tray matches the tray size in the Trays menu.", "If the trays are not locked, ensure the tray guides are correctly aligned to the size of paper being installed.", "If the trays are locked, contact your managed print provider if you need to change the paper size from the", "Ask the customer to check the paper size loaded in the tray to see if it matches the size listed in the Trays", "If the trays are not locked, educate the customer on the correct way to align the side guides when refilling"]'::jsonb, '[]'::jsonb, 
        'customers', 400, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '53.A1.Y0', 'Enter error message', 'Tray "Y" paper delivery direction misalignment resolved. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A1.10: Tray 1 Side guide misalignment resolved. ● 53.A1.20: Tray 2 side guide misalignment resolved. ● 53.A1.30: Tray 3 side guide misalignment resolved. ● 53.A1.40: Tray 4 side guide misalignment resolved. ● 53.A1.50: Tray 5 side guide misalignment resolved. ● 53.A1.60: Tray 6 side guide misalignment resolved. Recommended action No Action necessary. ■ This is an informational message; no action is necessary. 53.A1.y1 Tray "Y" paper delivery direction misalignment warning. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A1.11: Tray 1 paper delivery direction misalignment warning. ● 53.A1.21: Tray 2 paper delivery direction misalignment warning. ● 53.A1.31: Tray 3 paper delivery direction misalignment warning. ● 53.A1.41: Tray 4 paper delivery direction misalignment warning. Recommended action for call-center agents and onsite technicians 387 ● 53.A1.51: Tray 5 paper delivery direction misalignment warning. ● 53.A1.61: Tray 6 paper delivery direction misalignment warning.', 
        '["Ensure that the paper size in the tray matches the tray size in the Trays menu.", "If the trays are not locked, ensure the tray guides are correctly aligned to the size of paper being installed.", "If the trays are locked, contact your managed print provider if you need to change the paper size from the", "Ensure that the paper tray guides are set to the correct paper size that is being loaded into the paper tray.", "Ensure that the rear paper guide is set to the correct paper length."]'::jsonb, '[]'::jsonb, 
        'customers', 401, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '53.B2.0Z', '391', 'The specified tray contains a size that does not match the configured size. The tray is configured to support the only size indicated Confirm guides are in correct position. This issue occurs when the managed print provider has locked the paper tray to either letter or A4 and the tray has a different size paper loaded. NOTE: This can occur if the tray was swapped out or the physical trays locks in the tray were removed and the guides changed. ● 53.C1.02: Tray 2 size mismatch. ● 53.C1.03: Tray 3 size mismatch. ● 53.C1.04: Tray 4 size mismatch. ● 53.C1.05: Tray 5 size mismatch. ● 53.C1.06: Tray 6 size mismatch.', 
        '["Ensure that the paper size in the tray matches the tray size in the Trays menu.", "Contact your managed print provider if you need to change the paper size from the one selected.", "Ask the customer to check the media size loaded in the tray to see if it matches the size listed in the Trays", "Instruct the customer to contact the managed print provider if the paper size needs to be changed from the"]'::jsonb, '[]'::jsonb, 
        'customers', 405, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '54.WX.YZ', 'error messages', '54.* errors Errors in the 54.* family are related to the image-formation system. ● For HP LaserJet printers, they can indicate a problem with the toner cartridges or the transfer unit (color printers only), or they can indicate a problem with a sensor, such as with the laser/scanner. ● For HP PageWide printers, they can indicate a problem with the calibration process.', 
        '["Turn the printer off, and then on.", "Make sure the printer is running the most current version of firmware.", "Check the supplies status page using the Supplies menu on the control panel to verify that toner cartridges,", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 407, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '55.00.05', 'Engine Firmware RFU Error 397', '55.01.06, 55.02.06 DC controller error To continue turn off then on NVRAM memory warning ● 55.01.06 (event code) NVRAM memory data error warning. ● 55.02.06 (event code) NVRAM memory access error warning.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, check the input and output accessories (envelop feeder, stapler/stacker for example)", "Press the power button to turn off the printer, attempt to remove the installed accessories, and then turn on"]'::jsonb, '[]'::jsonb, 
        'customers', 411, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '57.WX.YZ', 'error mesages', '57.* errors Errors in the 57.* family indicate a problem with a fan.', 
        '["Press the Power button on the front of the printer to turn it off, and then wait 10 seconds.", "Press the Power button again to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the printer troubleshooting manual to identify the locations of each fan. Turn the printer off and then", "Update the firmware to the latest version. If the latest version firmware is already installed, reinstall it now."]'::jsonb, '[]'::jsonb, 
        'customers', 415, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '57.00.01', 'Fan failure', 'Cartridge upper (FM3) failure.', 
        '["Press the Power button on the front of the printer to turn it off, and then wait 10 seconds.", "Press the Power button again to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, then on.", "Replace the cartridge upper fan FM3."]'::jsonb, '[]'::jsonb, 
        'customers', 415, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '57.00.02', 'Fan failure', 'Cartridge lower fan (FM4) error.', 
        '["Press the Power button on the front of the printer to turn it off, and then wait 10 seconds.", "Press the Power button again to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, then on.", "Remove and reconnect (J6405) on the cartridge lower fan."]'::jsonb, '[]'::jsonb, 
        'customers', 416, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '58.WX.YZ', 'error messages', '58.* errors Errors in the 58.* family indicate an electrical problem inside the printer.', 
        '["Turn the printer off, and then on.", "Make sure the printer is connected to a dedicated power outlet and not to a surge protector or other type of", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Make sure the printer is connected to a dedicated power outlet and not to a surge protector or other type of"]'::jsonb, '[]'::jsonb, 
        'customers', 420, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '58.00.04', 'Error', 'Low-voltage power supply unit malfunction.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact customer support.", "Turn the printer off, and then on.", "Ensure the printer is plugged into a dedicated power outlet.", "If the error persists, replace the low-voltage power supply (LVPS)."]'::jsonb, '[]'::jsonb, 
        'customers', 422, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '58.01.04', 'Error', '24V power supply error during operation. 408 Chapter 6 Numerical control panel messages During a regular printing operation the 24V power supply experienced an error.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact customer support.", "Turn the printer off, and then on.", "Ensure the printer is plugged into a dedicated power outlet.", "If the error persists, replace the low-voltage power supply (LVPS)."]'::jsonb, '[]'::jsonb, 
        'customers', 422, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '58.02.04', 'Error', '24V power supply error during printer power on or wake up. During the printer power on, or when waking from a sleep mode, the printer experienced an error with the 24V power supply. NOTE: Check the voltage of the unit on the regulatory sticker. This event is directly related to a 220V printer being plugged into a 110V outlet. Ensure that the voltage of the outlet matches the voltage of the printer.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact customer support.", "Turn the printer off, and then on.", "Ensure the printer is plugged into a dedicated power outlet.", "If the error persists, replace the low-voltage power supply (LVPS)."]'::jsonb, '[]'::jsonb, 
        'customers', 423, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '59.WX.YZ', 'error messages', '59.* errors Errors in the 59.* family indicate a problem with one of the motors or with the lifter drive assembly for one of the trays.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Check all connections on the main control board of the printer, (DC controller, Engine control board ECB),", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 425, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '60.01.04', '423', '2. Close the tray to check if the error persists. 3. Reload the paper and test the printer. 4. If the error persists, contact your HP-authorized service or support provider, or contact customer support at www.hp.com/go/contactHP. Recommended action for call-center agents and onsite technicians 1. Re-seat connector on the Feeder Controller/HCI Controller PCA assembly from the lifter drive assembly. 2. If the error persists, replace the Lifter drive Assembly based on the input tray. Table 6-128 Parts Part Name Part Number Instructions link 1x550 Input Tray Lifter Drive Assembly (M3601) RM2-0895-000CN For instructions: See the Repair Service Manual for this product. 1x550 Envelope feeder Lifter Drive Assembly (M3601) RM2-0895-000CN For instructions: See the Repair Service Manual for this product. 1x550 Sheet Feeder stand Lifter Drive Assembly (M3401) RM2-0948-000CN For instructions: See the Repair Service Manual for this product. 3x550 Sheet Feeder Lifter Drive Assembly (M3401) 3x550 Upper, middle and lower trays. 2,550 Upper cassette tray RM2-0948-000CN For instructions: See the Repair Service Manual for this product. See the Repair Service Manual for this product. See the Repair Service Manual for this product. 2,550 Sheet Feeder stand 2,000 sheet deck Lifter Drive Assembly (M3401) RM2-0948-000CN See the Repair Service Manual for this product. for instructions: See the Repair Service Manual for this product. 3. If the error persists, replace the Feeder Controller PCA Assembly. Table 6-129 Parts Part Name Part Number Instructions link 1x550 Input Tray Controller PCA RM2–8767-000CN For instructions: See the Repair Service Manual for this product. 1x550 Envelope feeder Controller PCA RM2-8785-000CN For instructions: See the Repair Service Manual for this product. 1x550 Sheet Feeder stand Controller RM2-8827-000CN For instructions: See the Repair Service Manual for this product. 3x550 Sheet Feeder Controller PCA RM2-8807-000CN For instructions: See the Repair Service Manual for this product. 2,550 Sheet Feeder stand Controller PCA RM2-9020-000CN for instructions: See the Repair Service Manual for this product. 424 Chapter 6 Numerical control panel messages Tray 5 lifting error.', 
        '["Open the failing tray and remove all paper from the tray.", "Close the tray to check if the error persists.", "Reload the paper and test the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Re-seat connector on the Feeder Controller/HCI Controller PCA assembly from the lifter drive assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 437, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '60.01.05', '425', '3. If the error persists, replace the Feeder Controller PCA Assembly. Table 6-131 Parts Part Name Part Number Instructions link 1x550 Input Tray Controller PCA RM2–8767-000CN For instructions: See the Repair Service Manual for this product. 1x550 Envelope feeder Controller PCA RM2-8785-000CN For instructions: See the Repair Service Manual for this product. 1x550 Sheet Feeder stand Controller RM2-8827-000CN For instructions: See the Repair Service Manual for this product. 3x550 Sheet Feeder Controller PCA RM2-8807-000CN For instructions: See the Repair Service Manual for this product. 2,550 Sheet Feeder stand Controller PCA RM2-9020-000CN for instructions: See the Repair Service Manual for this product. Tray 6 lifting error.', 
        '["Open the failing tray and remove all paper from the tray.", "Close the tray to check if the error persists.", "Reload the paper and test the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Re-seat connector on the Feeder Controller/HCI Controller PCA assembly from the lifter drive assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 439, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '66.00.77', 'Output accessory failure', 'The output device experienced an internal communication malfunction', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, replace the output accessory controller PCA."]'::jsonb, '[]'::jsonb, 
        'customers', 444, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '66.80.17', 'device failure', 'An external paper handling accessory error has occurred. ● 66.80.17 Fan malfunction', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, replace the fan.", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 446, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '70.WX.YZ', 'error messages', '70.* errors Messages in the 70.* family indicate a problem with the DC controller or Formatter (ECB) depending on your printer.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Replace the DC controller or the Formatter as needed."]'::jsonb, '[]'::jsonb, 
        'customers', 448, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '80.0X.YZ', 'Embedded Jetdirect Error', 'An Embedded HP JetDirect print server critical error has occurred. ● 80.01.80 (event log) No heartbeat ● 80.01.81 (event log) Reclaim time-out ● 80.01.82 (event log) Invalid data length ● 80.01.8B (event log) Invalid max outstanding packet header field ● 80.01.8C (event log) Invalid channel mapping response ● 80.03.01 (event log) No PGP buffers ● 80.03.02 (event log) Channel table full ● 80.03.03 (event log) Producer index not reset ● 80.03.04 (event log) Consumer index not reset ● 80.03.05 (event log) Queue position size too small ● 80.03.06 (event log) Transport overflow ● 80.03.07 (event log) No overflow packets ● 80.03.08 (event log) Invalid identify response ● 80.03.09 (event log) Invalid channel map return status ● 80.03.10 (event log) Invalid reclaim return status ● 80.03.12 (event log) Datagram invalid buffer ● 80.03.13 (event log) Max stream channels ● 80.03.14 (event log) Max datagram channels ● 80.03.15 (event log) Card reset failed ● 80.03.16 (event log) Self-test failure ● 80.03.17 (event log) Unknown PGP packet ● 80.03.18 (event log) Duplicate I/O channel', 
        '["Press the power button to turn off the printer.", "Disconnect the network (Ethernet) cable.", "Press the power button to turn on the printer.", "Turn off the printer, and then reconnect the Ethernet cable to the Ethernet port on the printer and on the", "Turn on the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 450, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '81.WX.YZ', 'EIO Error To continue turn off then on', 'An external I/O card has failed on the printer.', 
        '["Press the power button to turn off the printer.", "Disconnect the network (Ethernet) cable.", "Press the power button to turn on the printer.", "Turn off the printer, and then reconnect the Ethernet cable to the Ethernet port on the printer and on the", "Turn on the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 452, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '81.09.00', 'Error', 'Internal Jetdirect Inside Networking event.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Verify that the issue occurs with the latest version of firmware.", "Verify that the issue occurs when the device has the latest firmware and is not connected to the network.", "Verify that the issue occurs when disconnected from the network and with default configuration."]'::jsonb, '[]'::jsonb, 
        'customers', 454, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '82.0X.YZ', 'Internal disk device failure', 'The internal disk failed on the printer.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, turn off the printer, and then disconnect the power cable.", "Remove the Hard disk drive (HDD), and then reinstall the HDD.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 457, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '82.73.45', 'Disk Successfully cleaned', 'Event log only, disk successfully cleaned. Recommended action See recommended action. ■ No action necessary. 82.73.46, 82.73.47 A hard disk drive (HDD), solid state drive (SDD), or compact flash disk cleaning failed. This error is usually caused by a failure of the disk hardware.', 
        '["Turn the product off, and then on.", "Reload the printer firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Use the Format Disk item in the Preboot menu."]'::jsonb, '[]'::jsonb, 
        'customers', 460, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '90.WX.YZ', 'error messages', '90.* errors Errors in the 90.* family are related to the control panel.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, dispatch an onsite technician.", "Turn the printer off by holding down the power button for at least 10 seconds."]'::jsonb, '[]'::jsonb, 
        'customers', 461, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '98.0X.0Y', 'error messages', '98.00.0c Data corruption has occurred and fails to mount partition.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "Check if the 98.00.0c event is intermittent or persistent and perform the appropriate task."]'::jsonb, '[]'::jsonb, 
        'customers', 464, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '98.00.02', 'Corrupt data in the solutions volume', 'Data corruption has occurred in the solutions volume.', 
        '["Turn the printer off, and then on.", "Download and install the latest firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "Check if the 98.00.0c event is intermittent or persistent, and then perform the appropriate task."]'::jsonb, '[]'::jsonb, 
        'customers', 468, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '98.00.03', 'Corrupt data in the configuration volume', 'Data corruption has occurred in the configuration volume.', 
        '["Turn the printer off, and then on.", "Download and install the latest firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 471, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.WX.YZ', 'error messages', '99.* errors Errors in the 99.* family are related to the firmware upgrade process.', 
        '["Make sure the connection to the network is good, and then try the firmware upgrade again.", "If the error persists, try using the USB upgrade method.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Make sure the connection to the network is good, and then try the upgrade again.", "Try using the USB upgrade method."]'::jsonb, '[]'::jsonb, 
        'customers', 473, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.00.03', 'Upgrade not performed error writing to disk', 'A remote firmware upgrade (RFU) was not performed. This is a disk error. It might indicate a problem or a hard disk drive failure. It might be necessary to check the connection to the hard disk drive or replace the hard disk drive.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 474, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.00.06', 'Upgrade not performed error reading upgrade', 'A remote firmware upgrade (RFU) was not performed. This is an unexpected read error when reading the header number and size.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 478, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.00.07', 'Upgrade not performed error reading upgrade', 'A remote firmware upgrade (RFU) was not performed. This is an unexpected read error when reading the rest of the header.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 482, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.00.08', 'Upgrade not performed error reading upgrade', 'A remote firmware upgrade (RFU) was not performed. This is an unexpected read error when reading image data.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 485, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.07.22', 'Firmware install error', 'This error indicates that the firmware installation failed. It displays on the printer control panel when the fax modem installer fails to download the installed firmware to the modem.', 
        '["Make sure that the network connection is stable and good, and then attempt to update the firmware again.", "If the error persists, try to update the firmware at the control panel using a USB flash drive.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Make sure that the network connection is stable and good, and then attempt to update the firmware again.", "If the error persists, try to update the firmware at the control panel using a USB flash drive."]'::jsonb, '[]'::jsonb, 
        'customers', 492, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.09.62', 'Unknown disk', 'This error indicates that there is an encryption mismatch between the HDD or SSD and the formatter. This typically happens because an HDD or SSD was swapped into a device from another device.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the Preboot menu to unlock the disk.", "If a disk is to be reused in a different product, execute the Erase and Unlock procedure from the Preboot", "If the issue persists, replace the HDD/SSD as needed."]'::jsonb, '[]'::jsonb, 
        'customers', 495, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.09.64', 'Disk Nonfunctional', 'A fatal hard disk drive failure has occurred.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, turn off the printer, and then disconnect the power cable.", "Remove the Hard disk drive (HDD), and then reinstall the HDD.", "If the error persists, the hard disk drive needs to be replaced. Contact your HP-authorized service or"]'::jsonb, '[]'::jsonb, 
        'customers', 496, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.09.65', 'Disk data error', 'Disk data corruption has occurred. Recommended action Follow these troubleshooting steps in the order presented. NOTE: Do NOT replace the formatter board, it will not resolve this error. ■ Use the Format Disk procedure from the Preboot menu, and then resend the remote firmware upgrade (RFU). For the steps to perform a Clean or Format Disk procedure, search for "HP LaserJet Enterprise, HP LaserJet Managed - Various methods to clean the hard disk drives or solid-state drives" (ish_4502973-4502949-16) 99.09.66 No boot device. A hard disk drive or eMMC is not installed in the printer.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, turn off the printer, and then disconnect the power cable.", "Remove the Hard disk drive (HDD), and then reinstall the HDD.", "If the error persists, the hard disk drive needs to be replaced. Contact your HP-authorized service or"]'::jsonb, '[]'::jsonb, 
        'customers', 500, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.09.67', 'Disk is not bootable please download firmware', 'There is no firmware installed on the hard disk drive. This is usually the result of installing a new hard disk drive or performing a Clean Disk procedure from the Preboot menu. NOTE: When installing a new hard drive or eMMC, the disk should be formatted through the Preboot menu, BEFORE loading firmware. 492 Chapter 6 Numerical control panel messages', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, replace the Hard disk drive (HDD).", "If the error persists, verify a compatible hard disk drive (HDD) is installed.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 506, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '99.39.67', 'eMMC Not Bootable', 'Data on the eMMC cannot be secured or encrypted. When the hard disk drive is installed all data on the eMMC is automatically migrated to the hard disk drive and erased from the eMMC. As long as the hard disk drive is installed the eMMC is non-functional. The customer passed the data migration and put the eMMC back in. Recommended action 1. Download firmware to the eMMC. 2. If the download fails to eMMC, replace the eMMC. Do NOT replace the formatter board, it will not resolve this. NOTE: The device is unusable until a new eMMC is installed. Recommended action 497 Alphabetical control panel messages7 Use the following alphabetical message to see further information on the message. 498 Chapter 7 Alphabetical control panel messages Alphabetical messages Accept bad signature The product is performing a remote firmware upgrade and the code signature is invalid. Recommended action Follow these troubleshooting steps in the order presented. ■ Download the correct firmware upgrade file for the product, and then reinstall the upgrade. For the latest firmware versions, go to: HP FutureSmart - Latest Firmware Versions Authentication required A user name and password are required. Recommended action ■ Type the user name and password, or contact the network administrator. Bad optional tray connection The optional tray is not connected, not connected correctly, or a connection is not working correctly. Recommended action 1. Turn the printer off. 2. Remove and then reinstall the optional tray. 3. If more than one extra 550 Sheet feeder is available swap trays and test again. 4. Remove the tray and inspect the connectors on the tray and printer for damage. If either of them are broken, have bent pins, or otherwise appear damaged, replace them. 5. Carefully reposition printer base onto the optional tray. HP recommends that two people lift the printer. 6. If the problem continues, replace the connector for the tray. 550 Sheet feeder upper cable assembly part number: RM2-8880-000CN 550 Sheet feeder lower cable assembly part number: RM2-8881-000CN 1X550, 3X550 and 2,550 Sheet feeder stand cable assembly part number: RM2-9286-000CN Canceling...<jobname> The printer is canceling the current job <jobname>. Recommended action See recommended action. ■ No action necessary. Accept bad signature 499 Cartridge low If this message appears even though the toner cartridge is new, perform the following. Recommended action 1. Remove, and then reinstall the toner cartridge. 2. Make sure a genuine HP supply is used. 3. If the error persists, replace the toner cartridge. Cartridge Memory Abnormal This message appears even though the toner cartridge is new. Recommended action 1. Remove, and then reinstall the toner cartridge. 2. If the error persists, replace the toner cartridge. Cartridge out This message appears even though the toner cartridge is new. Recommended action 1. Remove, and then reinstall the toner cartridge. 2. Make sure a genuine HP supply is used. 3. If the error persists, replace the toner cartridge. Checking engine The printer is conducting an internal test. Recommended action See recommended action. ■ No action necessary. Checking paper path The printer is checking for possible paper jams. Recommended action See recommended action. ■ No action necessary. Chosen personality not available To continue touch “OK” A print job requested a printer language (personality) that is not available for this printer. The job will not print and will be cleared from memory. 500 Chapter 7 Alphabetical control panel messages Recommended action Follow these troubleshooting steps in the order presented. ■ Print the job by using a print driver for a different printer language, or add the requested language to the printer (if possible). To see a list of available personalities, print a configuration page. a. From the Home screen on the printer control panel, go to the following menus: Reports > Configuration/Status Pages b. Select Configuration Page, then select the Print button to print the pages. Cleaning The printer is performing an automatic cleaning cycle. Printing will continue after the cleaning is complete. Recommended action See recommended action. ■ No action necessary. Clearing activity log This message is displayed while the activity log is cleared. The printer exits the menus when the log has been cleared. Recommended action ■ No action necessary. Clearing paper path The printer is attempting to eject jammed paper. Recommended action Follow these troubleshooting steps in the order presented. ■ Check the progress at the bottom of the display. Close left door The left door is open. This message appears even though the top left door is closed. Recommended action for customers 1. Close the left door to allow the printer to attempt to clear the jam. 2. Open then close the left door to ensure it is fully closed. Recommended action for call-center agents and onsite technicians 1. Close the left door to allow the printer to attempt to clear the jam. Recommended action 501 2. Check the projection part on the left door that defeats the left door interlocks. If broken replace the left door assembly. Part number: RM2-0850-000CN For instructions: See the Repair Service Manual for this product. 3. Check SW1 using the manual sensor test. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Manual Sensor Test c. Select from the following tests: ● All Sensors , Engine Sensors ● Done (return to the Troubleshooting menu) ● Reset(reset the selected sensor’s state) d. Test SW2 using folded paper or another object to defect the interlock. If the switch test fails, replace the laser shutter assembly. Part number: RM2-6755-000CN NOTE: Before replacing any parts check connector J308 on the DC controller. Close right door The right door is open. Recommended action for customers ■ Close the right door to allow the printer to attempt to clear the jam. 502 Chapter 7 Alphabetical control panel messages Recommended action for call-center agents and onsite technicians 1. Close the right door to allow the printer to attempt to clear the jam. 2. Check the projection part on the right door that defeats the right door interlocks. If broken replace the right door assembly. Part number: RM2-0849-000CN For instructions: See the Repair Service Manual for this product. 3. Check SW1 using the manual sensor test. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Manual Sensor Test c. Select from the following tests: ● All Sensors , Engine Sensors ● Done (return to the Troubleshooting menu) ● Reset(reset the selected sensor’s state) d. Test SW1 using folded paper or another object to defect the interlock. If the switch test fails, replace the laser shutter assembly. Part number: RM2-6755-000CN NOTE: Before replacing any parts check connector J321 on the DC controller. Recommended action for call-center agents and onsite technicians 503 Communication lost A Communication Lost message appears on the control panel in five different languages. The communication path from the control panel to the formatter includes the Control Panel, USB cable, and the formatter. Recommended action for customers Follow these troubleshooting steps in the order presented. 1. Turn the printer off, and then on. 2. If the error persists, contact your HP-authorized service or support provider, or contact customer support at www.hp.com/go/contactHP. Recommended action for call agents Follow these troubleshooting steps in the order presented. 1. Turn the printer off, and then on. 2. If the issue persists, check the heartbeat LED on the formatter located on the rear of the printer. ● If the formatter heartbeat LED status flashes yellow, it indicates a communication problem between the control panel and the formatter. Replace the control panel. Table 7-1 Control panel part numbers Description Part number Control panel assembly B5L47-67018 ● If the formatter heartbeat LED status is solid red, it indicates a problem with the formatter. Replace the formatter. Table 7-2 Formatter part numbers Description Part number Formatter (main logic) PC board J8J61-60001 504 Chapter 7 Alphabetical control panel messages', 
        '["Turn the printer off, and then on.", "If the issue persists, turn off the printer, and then reseat the USB cable connection in the control panel.", "Press the power button to turn on the printer.", "If the printer returns to a \"Ready\" state, verify functionality of the control panel.", "If the issue persists, turn the printer off."]'::jsonb, '[]'::jsonb, 
        'service', 511, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '82.0X.YY', '(event code)', 'The internal hard drive is not functioning correctly. Recommended action Follow these troubleshooting steps in the order presented. 1. Turn off the printer, and then remove and reinstall the hard drive. 2. Turn on the printer. 3. If the error persists, replace the internal hard drive. NOTE: Most customers have the self-encrypting drive (SED) and should not have a Federal Information Processing Standards (FIPS) drive. Only send the FIPS drive for federal government printers, customers that require FIPS per HP agreement, or customers that have bought the FIPS drive as an accessory. 512 Chapter 7 Alphabetical control panel messages Table 7-6 Hard disk drive (HDD) part number Description Part number Self-Encrypting Drive, SED (HDD) L41606-011 Federal Information Processing Standards Drive, FIPS (HDD) See NOTE above. L42243-021 See NOTE above. For intsructions: See the Repair Service Manual for this product. Internal disk not initialized The internal hard disk drive file system must be initialized before it can be used. Recommended action Follow these troubleshooting steps in the order presented. ■ Initialize the internal hard disk drive file system. For information on performing various actions on the hard disk drive, go to: HP LaserJet, OfficeJet, PageWide, ScanJet - HP FutureSmart Firmware Device Hard Disk, SSD, and eMMC Security (white paper) Internal disk spinning up The internal hard disk drive device is spinning up its platter. Jobs that require hard disk drive access must wait. Recommended action See recommended action. ■ No action necessary. Load Tray <X>: [Type], [Size] To use another tray, press “OK” This message displays when the indicated tray is selected, but is not loaded, and other paper trays are available for use. It also displays when the tray is configured for a different paper type or size than the print job requires. Recommended action 1. Load the correct paper in the tray. 2. If prompted, confirm the size and type of paper loaded. 3. Otherwise, press the OK button to select another tray. 4. If error persists, use the cassette paper present sensor test in the Tray/bin manual sensor test to verify that the sensor is functioning correctly. 5. Make sure that the sensor flag on the paper presence sensor is not damaged and moves freely. 6. Reconnect the corresponding connector. Internal disk not initialized 513 Loading program <XX> Do not power off Programs and fonts can be stored on the printer’s file system and are loaded into RAM when the printer is turned on. The number <XX> specifies a sequence number indicating the current program being loaded. Recommended action See recommended action. ■ No action necessary. Manually feed output stack Then touch "OK" to print second side The printer has printed the first side of a manual duplex job and is waiting for you (or the applicable user) to insert the output stack to print the second side. Recommended action Follow these troubleshooting steps in the order presented. 1. Maintaining the same orientation, remove the pages from the output bin. 2. Flip the document printed side up. 3. Load the document in Tray 1. 4. Touch the OK button to print the second side of the job. Manually feed: <Type><Size> This message appears when manual feed is selected, Tray 1 is not loaded, and other trays are empty. Recommended action Follow these troubleshooting steps in the order presented. 1. Load the tray with requested paper. 2. If the paper is already in the tray, press the Help button to exit the message and then press the OK button to print. 3. To use another tray, clear paper from Tray 1, press the Help button to exit the message and then press the OK button. No job to cancel You have pressed the stop button but the printer is not actively processing any jobs. Recommended action See recommended action. ■ No action necessary. No USB drive or files found The formatter was not able to detect the USB thumb drive. 514 Chapter 7 Alphabetical control panel messages If you experience the “No USB drive or files found” attempting to upgrade printer firmware via the walk up easy-access USB port perform the following.', 
        '["1. After the firmware file has been downloaded from hp.com uncompress the file and copy the", "If the issue persists, verify the USB flash drive is formatted as FAT32. If unsure, format the flash drive as", "If the issue persists, the USB flash drive can be inserted directly into a USB port on the printer’s formatter", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Try another thumb drive."]'::jsonb, '[]'::jsonb, 
        'customers', 526, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '10.23.70', 'Fuser kit (event code)', 'Recommended action ■ Replace the specified supply. Or, configure the printer to continue printing using the Manage Supplies menu on the printer control panel. Resend external accessory firmware An external accessory requires a firmware upgrade. Printing can continue, but jams might occur if the job uses the external accessory. Recommended action Follow these troubleshooting steps in the order presented. ■ Perform a firmware upgrade. For the latest firmware versions, go to: HP FutureSmart - Latest Firmware Versions 522 Chapter 7 Alphabetical control panel messages Resend Upgrade A firmware upgrade did not complete successfully. Recommended action Follow these troubleshooting steps in the order presented. ■ Upgrade the firmware again. For the latest firmware versions, go to: HP FutureSmart - Latest Firmware Versions Restore Factory Settings The printer is restoring factory settings. Recommended action See recommended action. ■ No action necessary. RFU Load Error Send full RFU on <X> Port The printer displays this message before the firmware is loaded at initialization when an error has occurred during a firmware upgrade. Recommended action ■ Resend the firmware upgrade. ROM disk device failed To clear press “OK” The specified device failed. Recommended action Follow these troubleshooting steps in the order presented. ■ Touch the OK button to clear the error. ROM disk file operation failed To clear press “OK” A PJL command was received that attempted to perform an illegal operation, such as downloading a file to a nonexistent directory. Recommended action Follow these troubleshooting steps in the order presented. ■ Touch the OK button to clear the error. ROM disk file system is full To clear press “OK” The specified device is full. Recommended action Follow these troubleshooting steps in the order presented. Resend Upgrade 523 ■ Touch the OK button to clear the error. ROM disk is write protected To clear press “OK” The device is protected and no new files can be written to it. Recommended action Follow these troubleshooting steps in the order presented. ■ Touch the OK button to clear the error. ROM disk not initialized To clear press “OK” The ROM disk file system must be initialized before it can be used. Recommended action Follow these troubleshooting steps in the order presented. ■ Initialize the ROM disk file system. Sanitizing disk <X> complete Do Not power off The hard disk is being cleaned. Recommended action ■ Contact the network administrator. Size mismatch in Tray <X> The paper in the listed tray does not match the size specified for that tray. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16) Recommended action 1. Load the correct paper. 2. Make sure that the paper is positioned correctly. 3. Close the tray, and then make sure that the control panel lists the correct size and type for the specified tray. 4. If necessary, use the control panel menus to reconfigure the size and type settings for the specified tray. 5. If this message appears even though the correct size paper is loaded in the correct paper tray perform the following. a. Use the Tray size switch test in the Tray/Bin manual sensor test to test the switch. If it does not respond, replace the tray drive assembly. Part number: RM2-0875-000CN 550 Sheet feeder instructions: See the Repair Service Manual for this product. Removal and replacement: See the Repair Service Manual for this product. 3X550 Sheet paper deck instructions: See the Repair Service Manual for this product. 524 Chapter 7 Alphabetical control panel messages 2550 Sheet feeder deck instructions: See the Repair Service Manual for this product. b. Reconnect tray connectors on the media size switch, and then reconnect connector on the DC controller to tray. Sleep mode on The printer is in sleep mode. Pressing a control-panel button, receiving a print job, or occurrence of an error condition clears this message. Recommended action See recommended action. ■ No action necessary. Supplies low Multiple supplies on the printer have reached the low threshold. Recommended action Follow these troubleshooting steps in the order presented. ■ Replace the supply when print quality is no longer acceptable. Supply memory warning The printer cannot read or write to the e-label or the e-label is missing. Recommended action See recommended action. ■ No action necessary. Too many jobs in queue This message displays when the user selects a USB file to print, and 100 files are already in the print queue. Recommended action ■ To select another file, touch the OK button. Tray <X> empty: [Type], [Size] The specified tray is empty and the current job does not need this tray to print. ● X = 1: Tray 1 ● X = 2: Tray 2 ● X = 3: Tray 3 ● X = 4: Tray 4 ● X = 5: Tray 5 Sleep mode on 525 Recommended action ■ Refill the tray at a convenient time. NOTE: This could be a false message. If the tray is loaded without removing the shipping lock, the printer does not sense that the paper is loaded. Remove the shipping lock, and then load the tray. Tray 2 empty: [Type], [Size] Tray 2 is empty and the current job does not need this tray to print. Recommended action 1. Check the tray, and refill it if it is empty. 2. If the error persists, unplug the printer cord and rotate the printer so that the rear door of the printer is in front of you. 3. Raise the primary transfer assembly. Figure 7-5 Raise the transfer assembly 4. Open the rear door to check the feed rollers. 526 Chapter 7 Alphabetical control panel messages a. Pull the green tab located on the upper left-hand side to open the lower-access cover. Figure 7-6 Open the jam access door b. Check the rollers to ensure that they are installed correctly. ● If the flap of the blue roller tab is down, the rollers are not installed correctly. NOTE: If the blue tab is DOWN, Tray 2 will not lift, and the control panel will indicate that Tray 2 is empty. ● If the flap of the blue roller tab is up, the rollers are installed correctly. 5. If the error persists, contact customer support. Tray <X> lifting The printer is in the process of lifting paper in the indicated tray. ● X = 2: Tray 2 ● X = 3: Tray 3 ● X = 4: Tray 4 ● X = 5: Tray 5 Recommended action ■ No action necessary. Tray <X> open The specified tray is open or not closed completely. ● X = 2: Tray 2 ● X = 3: Tray 3 Tray <X> lifting 527 ● X = 4: Tray 4 ● X = 5: Tray 5 Recommended action 1. Close the tray. 2. If this message displays after the lifter drive assembly was removed or replaced, make sure that the connector of the assembly is connected correctly and fully seated. 3. If the error persists, use the Media size switches test in the Tray/Bin manual sensor test to test the switches. If they do not respond, replace associated the lifter drive assembly. 4. If the switches do not respond, replace the associated lifter drive assembly. Tray <X> [type] [size] The paper in the specified tray is detected as the specified size and type. The custom switch was not changed. Recommended action ■ If the paper is a custom size or type, change the custom-size switch on the tray as necessary. Tray 2 overfilled or roller issue The upper pick roller is not seated correctly or the paper sensor is missing, damaged, or dislodged. The error message displays the following message on the printer control panel Check that the tray is not loaded above the fill lines. Remove any excess paper. If a new pickup roller was recently installed, check to see that the parts are firmly seated, and the access latch is closed.', 
        '["Pull out tray 2 completely out of the printer to remove it.", "Check if the paper sensor flag located inside tray 2 next to the roller is missing, damaged, or dislodged.", "Ensure that the stack of paper in the tray is not above the fill mark (line below the three triangles) as", "Make sure to remove any excess pages from the tray.", "Check if the rollers are installed correctly."]'::jsonb, '[]'::jsonb, 
        'customers', 536, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.B9.FF', 'Atasco de papel', 'Papel atascado o bloqueo en la ruta de papel, posiblemente en el fusor, rodillos de presión o entrega.', 
        '["Abre la puerta derecha y retira cualquier papel o obstrucción en la ruta", "Inspecciona el fusor, rodillo de presión y rodillo de entrega para detectar bloqueos o daños", "Prueba el sensor del fusor (PS4650) mediante diagnóstico manual en Support Tools > Troubleshooting > Diagnostic Tests > Manual Sensor Test", "Verifica los conectores J401 y J402 en el controlador DC", "Reemplaza el fusor si el sensor no funciona correctamente"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6763-000CN", "description": "Ensamble del motor de accionamiento del fusor"}]'::jsonb, 
        'customers', 133, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.80.D1', 'Atasco de papel en grapadora/apilador', 'Papel atascado o bloqueo en el dispositivo de salida de la grapadora/apilador, posiblemente en rodillos o sensores.', 
        '["Abre la puerta derecha del dispositivo de salida y retira todo el papel", "Verifica que no haya residuos del atasco anterior en el fusor y rodillos de entrada/salida", "Confirma que los rodillos del depósito de salida estén girando correctamente", "Revisa el registro de eventos para detectar otros errores de atasco", "Reemplaza el microinterruptor de la grapadora/apilador si el error persiste"]'::jsonb, '[{"part_number": "WC4-5171-000CN", "description": "Microinterruptor (grapadora/apilador)"}]'::jsonb, 
        'customers', 155, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '13.80.D2', 'Atasco de papel con retraso en grapadora/apilador', 'El papel no alcanzó el sensor de entrada del apilador en el tiempo designado, posiblemente debido a bloqueo en la ruta de alimentación inferior.', 
        '["Abre la puerta derecha del dispositivo de salida, retira el papel y ciérrala", "Abre la puerta derecha de la impresora, retira el fusor con cuidado y verifica bloqueos de papel", "Reinstala el fusor y cierra la puerta", "Revisa el registro de eventos para otros errores relacionados", "Reemplaza el ensamble de alimentación de papel inferior si el error persiste"]'::jsonb, '[{"part_number": "RM2-1071-000CN", "description": "Ensamble de alimentación de papel inferior"}]'::jsonb, 
        'customers', 175, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.01.14', 'Error de EEPROM del sistema de escaneo', 'Fallo en la memoria EEPROM de la placa de control del escáner (SCB), impidiendo la comunicación correcta.', 
        '["Apaga la impresora y vuelve a encenderla", "Revisa el registro de eventos para otros errores del escáner", "Desconecta y reconecta los conectores de cable plano (FFC) en la SCB prestando atención a los conectores ZIF", "Ejecuta diagnósticos de componentes desde Support Tools > Troubleshooting > Diagnostic Tests", "Reemplaza la placa de control del escáner si el error persiste"]'::jsonb, '[{"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 183, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.01.43', 'Fallo de memoria del SCB', 'Error de memoria en la placa de control del escáner (SCB), posiblemente por fallo de conexión o corrupción de datos.', 
        '["Apaga la impresora y vuelve a encenderla", "Verifica que todos los conectores en la SCB estén correctamente asientos", "Desconecta y reconecta los cables de alimentación y HDMI en la SCB", "Ejecuta diagnósticos desde Support Tools para verificar conexiones", "Reemplaza la placa de control del escáner si el error persiste"]'::jsonb, '[{"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 191, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.01.46', 'Error de firmware del escáner', 'Fallo en el firmware de la placa de control del escáner (SCB) o corrupción de datos durante la carga.', 
        '["Apaga la impresora y vuelve a encenderla", "Actualiza el firmware a la última versión disponible desde HP Customer Support", "Revisa el registro de eventos para otros errores del escáner", "Verifica conexiones de cables en la SCB incluyendo el HDMI", "Reemplaza la placa de control del escáner (SCB) si el error persiste"]'::jsonb, '[{"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 201, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.03.22', 'Fallo del escáner', 'El cabezal de escaneo no se actuata correctamente o hay fallo en los sensores ópticos de escaneo.', 
        '["Apaga la impresora y vuelve a encenderla", "Limpia el cristal del escáner, las tiras del alimentador de documentos y el respaldo de plástico blanco", "Actualiza el firmware a la última versión", "Desconecta y reconecta todos los conectores FFC en la SCB (puertas ZIF)", "Ejecuta la prueba de escaneo continuo (Continuous Scan) en Support Tools para verificar el movimiento del cabezal"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 205, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.03.23', 'Fallo del escáner', 'Fallo en la óptica de escaneo, sensor o motor del cabezal de escaneo.', 
        '["Apaga la impresora y vuelve a encenderla", "Actualiza el firmware a la última versión disponible", "Revisa el registro de eventos para otros errores del escáner", "Desconecta y reconecta los conectores FFC en la SCB usando técnica ZIF", "Ejecuta la prueba de escaneo continuo para verificar que el cabezal se actuate correctamente"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 209, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.03.30', 'Fallo del escáner', 'Fallo en los componentes del escáner de imagen o pérdida de comunicación con la placa de control.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta y reconecta todos los cables en la SCB incluyendo cables planos (FFC) y HDMI", "Ejecuta la prueba de escaneo continuo desde Support Tools > Troubleshooting > Diagnostic Tests", "Verifica que el cabezal de escaneo se mueva desde la posición de inicio a través del escaneo y regrese", "Reemplaza el ensamble del escáner de imagen si el cabezal no se actuata"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 213, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.03.45', 'Error del escáner - apagar y encender', 'Error en los sensores ópticos o en la comunicación del cabezal de escaneo con la placa de control.', 
        '["Apaga la impresora y vuelve a encenderla", "Actualiza el firmware a la última versión disponible", "Revisa el registro de eventos para otros errores del escáner y resuélvelos", "Desconecta y reconecta conectores FFC en la SCB (ZIF) y verifica funcionalidad", "Ejecuta la prueba de escaneo continuo para verificar el movimiento del cabezal de escaneo"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 217, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '30.04.01', 'Cable del sensor de cristal plano no detectado', 'El cable del sensor de cristal plano (flatbed) no está conectado o está desconectado en la placa de control del escáner.', 
        '["Apaga la impresora y vuelve a encenderla", "Apaga la impresora nuevamente", "Desconecta y reconecta el cable MOT/SNS (sensor de cristal plano) en la SCB etiquetado como callout 1", "Reinicia la impresora y verifica funcionalidad", "Reemplaza el ensamble del escáner de imagen si el error persiste"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}, {"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 247, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '31.03.33', 'Área de calibración del escáner de reverso sucio', 'La franja blanca en el cristal del platen o cristal del lado 2 del alimentador está sucia, afectando la calibración del escáner.', 
        '["Limpia la franja blanca en el cristal del platen y en el cristal del lado 2 del alimentador de documentos", "Apaga la impresora y vuelve a encenderla", "Verifica que el papel utilizado cumpla con las especificaciones de HP", "Confirma que la bandeja de entrada no esté sobrecargada y que las guías estén ajustadas correctamente", "Reemplaza el ensamble del alimentador de documentos si el error persiste"]'::jsonb, '[{"part_number": "5851-7203", "description": "Kit del alimentador de documentos"}, {"part_number": "5851-7204", "description": "Kit del alimentador de documentos FLOW Models"}]'::jsonb, 
        'customers', 335, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '41.01.YZ', 'Error del ensamble del escáner láser', 'Fallo en el ensamble del escáner láser o pérdida de conexión del arnés de cableado con el controlador DC.', 
        '["Toca OK para limpiar el error", "Apaga la impresora y vuelve a encenderla", "Verifica que el arnés de cableado del escáner láser al controlador DC esté correctamente asentado", "Reemplaza el ensamble del escáner láser si el error persiste", "Reemplaza el controlador DC PCA si el error continúa después de cambiar el escáner"]'::jsonb, '[{"part_number": "RM2-0906-000CN", "description": "Ensamble del escáner láser"}, {"part_number": "RM2-9493-000CN", "description": "Placa de circuito del controlador DC (M631/M632/M633/E62555/E62565/E62575)"}, {"part_number": "RM3-8458-000CN", "description": "Placa de circuito del controlador DC (M634/M635/M636/M637)"}, {"part_number": "RM3-7621-000CN", "description": "Placa de circuito del controlador DC (E62655/E62665/E62675)"}]'::jsonb, 
        'customers', 373, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.2X.YZ', 'Error de calentamiento del fusor', 'El fusor no alcanza la temperatura de funcionamiento correcta, posiblemente por problemas de alimentación eléctrica.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de cualquier regleta de enchufes o UPS y conecta directamente a una toma de corriente de pared", "Verifica que el voltaje de la salida coincida con la especificación de la impresora", "Verifica que el tipo y configuración de papel sean correctos", "Reemplaza el fusor o la fuente de alimentación de bajo voltaje si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}]'::jsonb, 
        'customers', 376, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.3X.YZ', 'Temperatura alta del fusor', 'El fusor excede la temperatura máxima de funcionamiento, posiblemente por falla del sensor, fuente de alimentación o problemas eléctricos.', 
        '["Apaga la impresora", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Verifica conexiones del fusor y reemplázalo si el conector está dañado", "Verifica conexiones J401 y J402 en el controlador DC PCA", "Reemplaza la fuente de alimentación de bajo voltaje (LVPS) si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6797-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 110V"}, {"part_number": "RM2-6798-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 220V"}]'::jsonb, 
        'customers', 379, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.4X.YZ', 'Fallo del circuito de accionamiento', 'Fallo en el circuito de control de potencia del fusor, posiblemente por problemas de alimentación eléctrica o componentes dañados.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de cualquier regleta de enchufes y conecta directamente a una toma de corriente de pared", "Verifica que el voltaje de la salida coincida con la especificación de la impresora", "Verifica que el tipo y configuración de papel sean correctos", "Reemplaza la fuente de alimentación de bajo voltaje si el error persiste"]'::jsonb, '[]'::jsonb, 
        'customers', 388, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.8X.YZ', 'Temperatura baja del fusor 2', 'El fusor no mantiene la temperatura mínima requerida, posiblemente por falla del sensor, conexión suelta o fuente de alimentación deficiente.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared con circuito dedicado", "Verifica que la fuente de alimentación cumpla con requisitos de frecuencia (43-67Hz)", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Verifica conexiones J401 y J402 en el controlador DC"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6797-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 110V"}, {"part_number": "RM2-6798-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 220V"}]'::jsonb, 
        'customers', 390, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.9X.YZ', 'Temperatura alta del fusor 2', 'El fusor excede la temperatura máxima, posiblemente por falla del sensor, control de potencia defectuoso o problemas de alimentación eléctrica.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared con circuito dedicado", "Verifica que la fuente de alimentación cumpla con requisitos (43-67Hz)", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Reemplaza el fusor y verifica conexiones J401 y J402"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6797-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 110V"}, {"part_number": "RM2-6798-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 220V"}]'::jsonb, 
        'customers', 393, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.AX.YZ', 'Temperatura baja del fusor 3', 'El fusor no alcanza la temperatura mínima de funcionamiento, posiblemente por falla del sensor o problemas con la fuente de alimentación.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared con circuito dedicado", "Verifica que el voltaje y la frecuencia sean correctos (43-67Hz)", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Reemplaza la fuente de alimentación de bajo voltaje si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}]'::jsonb, 
        'customers', 395, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '50.BX.YZ', 'Temperatura alta del fusor 3', 'El fusor excede la temperatura máxima de funcionamiento, posiblemente por falla del sensor o control defectuoso.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared", "Verifica que el voltaje de salida coincida con la especificación de la impresora", "Verifica que el tipo y configuración de papel sean correctos", "Reemplaza el fusor si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}]'::jsonb, 
        'customers', 416, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '57.00.03', 'Fallo del ventilador', 'El ventilador de dúplex FM2 no funciona correctamente, posiblemente por desconexión de cables, tornillo suelto o falla del componente.', 
        '["Apaga la impresora, espera 10 segundos y vuelve a encenderla", "Aprieta el tornillo en el ensamble de guía de alimentación de papel superior", "Desconecta y reconecta el conector J13L en el ensamble de puerta y J13 en el controlador DC PCA", "Reemplaza el ventilador FM2 si el error persiste después de apretar el tornillo", "Reemplaza el controlador DC si el error continúa después del cambio del ventilador"]'::jsonb, '[{"part_number": "RK2-8948-000CN", "description": "Ventilador 2 (FM2)"}, {"part_number": "RM2-9493-000CN", "description": "Controlador DC (M631, M632, M633, E62555, E62565, E62575)"}, {"part_number": "RM3-7621-000CN", "description": "Controlador DC (E62655, E62665, E62675)"}, {"part_number": "RM3-8458-000CN", "description": "Controlador DC (M634, M635, M636, M637)"}]'::jsonb, 
        'customers', 418, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '57.00.04', 'Fallo del ventilador del escáner', 'El ventilador FM1 del escáner ha fallado o perdido contacto en sus conectores, impidiendo la refrigeración del módulo de escaneo.', 
        '["Apagar y encender la impresora", "Desconectar y reconectar el conector J6402 en el ventilador del escáner", "Desconectar y reconectar el conector J211 en la PCA del controlador DC", "Reemplazar el ventilador del escáner FM1 si el error persiste"]'::jsonb, '[{"part_number": "RK2-8946-000CN", "description": "Ventilador del escáner FM1"}]'::jsonb, 
        'customers', 420, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '58.00.02', 'Fallo del sensor ambiental', 'El sensor ambiental ha fallado o sus conexiones están sueltas, lo que afecta la detección de condiciones ambientales o está causado por problemas de calidad de alimentación eléctrica.', 
        '["Apagar y encender la impresora", "Verificar que el conector J4200 del sensor ambiental esté correctamente asiento y sin daños", "Verificar que el conector J16 en la PCA del controlador DC esté correctamente asiento", "Reemplazar el sensor ambiental si el error persiste"]'::jsonb, '[{"part_number": "RM2-9037-000CN", "description": "Sensor ambiental"}]'::jsonb, 
        'customers', 421, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '58.00.03', 'Fallo del controlador DC', 'La PCA del controlador DC ha fallado o sus conexiones están sueltas, impidiendo la comunicación y el control del sistema.', 
        '["Apagar y encender la impresora", "Desconectar y reconectar todos los cables en la PCA del controlador DC", "Verificar que las conexiones no estén dañadas y estén correctamente asiento", "Reemplazar la PCA del controlador DC si el error persiste"]'::jsonb, '[{"part_number": "RM2-9493-000CN", "description": "PCA del controlador DC para M631/M632/M633/E62555/E62565/E62575"}, {"part_number": "RM3-8458-000CN", "description": "Controlador DC para M634/M635/M636/M637"}, {"part_number": "RM3-7621-000CN", "description": "PCA del controlador DC para E62655/E62665/E62675"}]'::jsonb, 
        'customers', 444, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('5753ed43-2732-40f7-819a-429ed518c571', '66.00.0A', 'Fallo del accesorio de salida', 'Error de timeout en el control del accesorio de salida, indicando que la PCA del controlador del accesorio de salida no responde en el tiempo esperado.', 
        '["Apagar y encender la impresora", "Verificar que no haya atascos de papel u obstrucciones en el dispositivo de salida", "Reemplazar la PCA del controlador del accesorio de salida si el error persiste"]'::jsonb, '[{"part_number": "RM2-8847-000CN", "description": "PCA del controlador del accesorio de salida"}, {"part_number": "RM2-1066-000CN", "description": "Conjunto de alimentador de grapas (jogger)"}, {"part_number": "RM2-1067-000CN", "description": "Conjunto alimentador superior"}, {"part_number": "RK2-8148-000CN", "description": "Grapadora"}]'::jsonb, 
        'customers', 448, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '10.00.00', 'e-label Memory Error', 'An e-label Memory Error on toner cartridge. The printer is unable to read the toner cartridge data. The toner cartridge is present but defective. When this error occurs, a question mark appears on the gas gauge of the supply or supplies with the error.', 
        '["Check the toner cartridge.", "If the message displays again, turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 35, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '10.00.10', 'e-label Missing Memory Error', 'The printer is unable to detect the e-label. This message indicates that the printer has determined that the e-label is missing. When this error occurs, a question mark appears on the gas gauge of the supply or supplies with the error.', 
        '["Check the toner cartridge.", "If the message displays again, turn the printer off, and then on.", "If the error persists, replace the toner cartridge.", "If the error persists, please contact customer support.", "Check the toner cartridge."]'::jsonb, '[]'::jsonb, 
        'customers', 37, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '10.00.15', 'Install Toner Cartridge', 'A supply is either not installed or not correctly installed in the printer. The 10.00.15 is an event log only message, it will not show on the control panel. The only message to display will be Install Toner Cartridge.', 
        '["Replace or reinstall the toner cartridge correctly to continue printing.", "Test printer with a new toner cartridge.", "If the error persists with a new toner cartridge check the toner cartridge contacts inside the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 38, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '10.23.15', 'Install Fuser kit', 'The fuser is either not installed, or not correctly installed in the printer.', 
        '["Turn the printer off.", "Remove, and then reinstall the fuser."]'::jsonb, '[]'::jsonb, 
        'customers', 41, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '11.WX.YZ', 'error messages', '11.* errors Errors in the 11.* family are related to the printer real-time clock.', 
        '["Set the time and date on the printer control panel.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Set the time and date on the printer control panel.", "If the error persists, remove and reinstall the formatter. Make sure it is fully seated.", "If the error still persists, replace the formatter."]'::jsonb, '[]'::jsonb, 
        'customers', 65, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.WX.YZ', 'error messages', '13.* errors Errors in the 13.* family are related to jams. More than 1000 unique error codes are possible. Use the following information to understand the jam code. Not all codes apply to all printers. Message format: 13.WX.YZ ● W represents the jam location. ● X represents the sensor or door that triggered the jam. ● Y represents the jam condition (delay, stay, wrap, etc.) ● Z represents the paper source, fuser mode, or destination Table 6-4 Potential values for W and X W Jam location X Sensor or door A Input area 0 Envelope feeder A Input area 1 Tray 1 feed (unless Tray 1 feed is the registration sensor) A Input area 2 Tray 2 feed (unless Tray 2 feed is the registration sensor) A Input area 3 Tray 3 feed A Input area 4 Tray 4 feed NOTE: If available for specified printer A Input area 5 Tray 5 feed NOTE: If available for specified printer A Input area 6 Tray 6 feed NOTE: If available for specified printer A Input area 7 Optional tray exit sensor A Input area A Door 1 A Input area B Door 2 A Input area C Door 3 NOTE: If available for specified printer A Input area D Door 4 NOTE: If available for specified printer A Input area E Door 5 NOTE: If available for specified printer A Input area F Multiple sensors or doors B Image area 0 Media sensor for forbidden transparencies 56 Chapter 6 Numerical control panel messages Table 6-4 Potential values for W and X (continued) W Jam location X Sensor or door B Image area 2 Registration/top of page B Image area 3 Top of page B Image area 4 Loop B Image area 5 Fuser input B Image area 9 Fuser output B Image area A Door 1 B Image area B Door 2 B Image area F Multiple sensors or doors C Switchback area (between the fuser and the output bin) 1 Intermediate switchback sensor C Switchback area (between the fuser and the output bin) 2 Switchback media stay sensor C Switchback area (between the fuser and the output bin) 3 Paper delivery sensor D Duplex area 1 Duplex switchback D Duplex area 2 Duplex delivery D Duplex area 3 Duplex refeed D Duplex area A Door 1 (if different than the imaging area) D Duplex area B Door 2 (if different than the imaging area) D Duplex area F Multiple sensors or doors E Output or intermediate paper transport unit (IPTU) area 1 Output bin full sensor E Output or intermediate paper transport unit (IPTU) area 2 IPTU feed sensor 1 E Output or intermediate paper transport unit (IPTU) area 3 IPTU sensor 2 E Output or intermediate paper transport unit (IPTU) area 4 IPTU sensor 3 E Output or intermediate paper transport unit (IPTU) area 5 IPTU bin full sensor 4 E Output or intermediate paper transport unit (IPTU) area 6 Output sensor E Output or intermediate paper transport unit (IPTU) area A Door 1 E Output or intermediate paper transport unit (IPTU) area F Multiple sensors or doors F Multiple subsystems (occurs when paper is stuck in several areas) F Multiple sensors or doors 1 Jetlink input device 4 Tray 4 feed sensor NOTE: If available for specified printer 13.* errors 57 Table 6-4 Potential values for W and X (continued) W Jam location X Sensor or door 1 Jetlink Input device 5 Tray 5 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 6 Tray 6 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 7 Tray 7 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 8 Tray 8 feed sensor NOTE: If available for specified printer 1 Jetlink Input device 9 Tray 9 feed sensor NOTE: If available for specified printer 1 Jetlink Input device A Door 1 1 Jetlink Input device B Door 2 1 Jetlink Input device F Multiple sensors or doors 2 Buffer pass unit 0 Buffer pass inlet sensor 2 Buffer pass unit 9 Buffer pass exit sensor 2 Buffer pass unit A Door 1 3 Page insert unit 0 Page insertion inlet sensor 3 Page insert unit 1 Page insertion tray 1 feed sensor 3 Page insert unit 2 Page insertion tray 2 feed sensor 3 Page insert unit 3 Page insertion tray 3 feed sensor 3 Page insert unit 4 Page insertion tray 4 feed sensor 3 Page insert unit 7 Output path feed sensor 3 Page insert unit 9 Page insertion exit sensor 3 Page insert unit A Door 1 4 Punch unit 0 Puncher inlet sensor 4 Punch unit 1 Puncher jam sensor 4 Punch unit 9 Puncher exit sensor 4 Punch unit A Door 1 5 Folding unit 0 Folder inlet sensor 5 Folding unit 1 Folder sensor 5 Folding unit 9 Folder exit sensor 5 Folding unit A Door 1 6 Stacker unit 0 Stacker inlet sensor 6 Stacker unit 4 Stacker outlet sensor 58 Chapter 6 Numerical control panel messages Table 6-4 Potential values for W and X (continued) W Jam location X Sensor or door 6 Stacker unit 7 Stacker switchback entrance sensor 6 Stacker unit 8 Stacker switchback registration sensor 6 Stacker unit 9 Stacker switchback lower sensor 7 Multi-bin mailbox (MBM) unit 0 MBM inlet sensor 7 Multi-bin mailbox (MBM) unit 1 MBM middle sensor 7 Multi-bin mailbox (MBM) unit 9 Stapler sensor 7 Multi-bin mailbox (MBM) unit A Door 1 7 Multi-bin mailbox (MBM) unit B Door 2 7 Multi-bin mailbox (MBM) unit C Door 3 7 Multi-bin mailbox (MBM) unit F Multiple sensors or doors 8 Stapler/stacker (SS) unit 0 SS inlet sensor 8 Stapler/stacker (SS) unit 1 SS Bin Z 8 Stapler/stacker (SS) unit 3 SS unit middle sensor 8 Stapler/stacker (SS) unit 4 SS unit outlet sensor 1 8 Stapler/stacker (SS) unit 5 SS unit outlet sensor 2 8 Stapler/stacker (SS) unit 9 Stapler sensor 8 Stapler/stacker (SS) unit A Door 1 8 Stapler/stacker (SS) unit B Door 2 9 Booklet maker unit 0 Booklet maker input sensor 9 Booklet maker unit 2 Booklet maker feed sensor 2 9 Booklet maker unit 2 Booklet maker feed sensor 3 9 Booklet maker unit 4 Booklet maker delivery sensor 9 Booklet maker unit 5 Booklet maker vertical paper path sensor 9 Booklet maker unit 6 Booklet unit front staple sensor 9 Booklet maker unit 7 Booklet unit rear staple sensor 9 Booklet maker unit 8 Booklet unit outlet sensor 9 Booklet maker unit A Door 1 9 Booklet maker unit B Door 2 9 Booklet maker unit C Door 3 9 Booklet maker unit F Multiple sensors or doors 0 Unknown 0 Unknown 13.* errors 59 Table 6-5 Potential values for Y (jam condition) Y Jam condition 0 Unknown 1 Unexpected sheet (duplex) 2 Staple jam 3 Jam caused by an open door (duplex) 4 Stay jam (the page never left the tray – duplex) A Stay jam (the page never left the tray – simplex) B Multifeed C Wrap D Delay (the page did not reach the sensor within the expected time – simplex) E Door open F Residual (paper is detected in the paper path when it should not be there) The information represented by the value for Z depends on where the paper is in the paper path. Table 6-6 Potential values for Z (source, fuser mode, or destination) Paper location Z Source, fuser mode, or destination When paper has not reached the fuser, Z represents the paper source. 1 Tray 1 Z represents the paper source. 2 Tray 2 Z represents the paper source. 3 Tray 3 Z represents the paper source. 4 Tray 4 If available for specified printer Z represents the paper source. 5 Tray 5 If available for specified printer Z represents the paper source. 6 Tray 6 If available for specified printer Z represents the paper source. D Duplexer Z represents the paper source. E Envelope feeder When paper has reached the fuser, is in the duplex path, or in the output path, Z represents the fuser mode. Jams can occur when there is a mismatch between the actual paper and the fuser mode setting. 0 Photo 1, 2, or 3 Designated 2 or 3 Z represents the fuser mode. 1 Normal (automatically sensed rather than based on the paper type set at the control panel) Z represents the fuser mode. 2 Normal (based on the paper type set at the control panel) 60 Chapter 6 Numerical control panel messages Table 6-6 Potential values for Z (source, fuser mode, or destination) (continued) Paper location Z Source, fuser mode, or destination Z represents the fuser mode. 3 Light 1, 2, or 3 Z represents the fuser mode. 4 Heavy 1 Z represents the fuser mode. 5 Heavy 2 Z represents the fuser mode. 6 Heavy 3 Z represents the fuser mode. 7 Glossy 1 Z represents the fuser mode. 8 Glossy 2 Z represents the fuser mode. 9 Glossy 3 Z represents the fuser mode. A Glossy Film Z represents the fuser mode. B Transparency Z represents the fuser mode. C Label Z represents the fuser mode. D Envelope 1, 2, or 3 Z represents the fuser mode. E Rough When paper has entered the output bin, Z represents the output bin, numbered from top to bottom. 0 Unknown bin Z represents the output bin 1 Bin 1 Z represents the output bin 2 Bin 2 Z represents the output bin 3 Bin 3 Z represents the output bin 4 Bin 4 Z represents the output bin 5 Bin 5 Z represents the output bin 6 Bin 6 Z represents the output bin 7 Bin 7 Z represents the output bin 8 Bin 8 Z represents the output bin 9 Bin 9 All paper locations E Door open jam All paper locations F Residual jam All paper locations 0 Forbidden OHT jam (when Y=2)', 
        '["Follow the instructions on the control panel to clear the jam. Check for paper in all possible jam locations.", "Verify that no doors are open.", "Check the paper tray to make sure paper is loaded correctly. The paper guides should be adjusted to the", "Make sure the type and quality of the paper being used meets the HP specifications for the printer.", "Use a damp, lint-free cloth to clean the rollers in the appropriate tray. Replace rollers that are worn."]'::jsonb, '[]'::jsonb, 
        'customers', 70, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.AA.EE', 'Left door open', 'The left door was opened during printing.', 
        '["Close the left door to allow the printer to attempt to clear the jam.", "If the error persists, please contact customer support.", "Close the left door to allow the printer to attempt to clear the jam.", "Check the projection part on the left door that defeats the left door interlocks. If broken replace the left", "Check SW1 using the manual sensor test."]'::jsonb, '[]'::jsonb, 
        'customers', 96, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.AB.EE', 'Right door Open', 'The right door was opened during printing.', 
        '["Close the right door to allow the printer to attempt to clear the jam.", "Check the projection part on the right door that defeats the right door interlocks. If broken replace the right"]'::jsonb, '[]'::jsonb, 
        'customers', 97, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B2.AZ', 'Jam in right door', 'Paper stay jam in the right door at the image area. Paper present at PS4550 after a specified time limit has passed. ● 13.B2.A1 This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from Tray 1. ● 13.B2.A2 This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from Tray 2. ● 13.B2.A3 This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from Tray 3. ● 13.B2.AD This jam occurs when the registration sensor (PS4550) detects paper present longer than the expected time based on the paper size when printing from the duplexer. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 99, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B2.D1', 'Jam in right door', 'Paper delay jam in the right door at the image area. Paper did not reach PS4550 in the specified time when printing from Tray 1. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "Ensure that the tray 1 pickup and separation rollers are installed correctly and show no damage or wear.", "Clean or replace the pickup, feed, and separation rollers as needed.", "If the error persists, please contact customer support."]'::jsonb, '[]'::jsonb, 
        'customers', 101, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B2.D2', 'Jam in right door', 'Paper delay jam at the image area. Paper did not reach PS4550 in the specified time when printing from Tray 2. This error might occur in conjunction with the Tray 2 Overfilled or Roller Issue message.. If using adhesive or self-sealing media, please see the instructions in (ish_3199741-3199797-16).', 
        '["Clear the paper jam."]'::jsonb, '[]'::jsonb, 
        'customers', 103, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B2.D2', 'Jam in right door 89', 'b. Look for and clear any paper present or obstructions in the paper path. Grasp the jammed paper with both hands and pull it straight out to remove it out of the printer. c. Close the right door to allow the printer to attempt to clear the jam message. 2. Turn the printer off and unplug the power cord. 3. Open the left door and clear any paper present or obstructions in the paper path. Grasp any jammed paper with both hands and pull it straight out to remove it out of the printer. 4. Plug the power cord in and turn on the printer. 5. If the error persists, ensure the type and quality of the paper being used meets the HP specifications for the printer. NOTE: For supported sizes and types view HP LaserJet Enterprise M631-M633, HP LaserJet Managed E62555-E62575, E62655-E62675 - Supported paper sizes and types c05495229. 6. Pull out tray 2 completely out of the printer to remove it. 7. Ensure that the protective orange plastic shipping locks are removed, if present. 8. Remove any jammed or damaged sheets of paper from the tray. 9. If the error persists, ensure that the tray width and length guides are set to the correct paper size for the paper being installed into the tray. Figure 6-42 Tray 2 paper guides 90 Chapter 6 Numerical control panel messages 10. Ensure the paper is not filled above the fill mark (line below 3 triangles). Remove any excess media. Figure 6-43 Paper height guides Figure 6-44 Overfilled tray Figure 6-45 Stack of paper not overfilled in tray 2 11. Ensure that the feed and separation rollers are installed correctly and show no damage or wear.', 
        '["Reinstall tray 2.", "If the error persists, please contact customer support at: www.hp.com/go/contactHP.", "Clear the paper jam.", "Turn the printer off and unplug the power cord.", "Open the left door and clear any paper present or obstructions in the paper path."]'::jsonb, '[]'::jsonb, 
        'customers', 103, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B2.DX', 'Jam in right door', 'Paper delay jam at the image area. Paper passed PS3601 feed sensor in Tray 3 but did not reach the registration sensor (PS4550) in the designated amount of time when printing from Tray 3. Paper passed PS3601 feed sensor in Tray 3 but did not reach the registration sensor (PS4550) in the designated amount of time when printing from Tray 4. Paper passed PS3601 feed sensor in Tray 3 but did not reach the registration sensor (PS4550) in the designated amount of time when printing from Tray 5.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 119, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B2.FF', 'Jam in right door', 'Paper residual jam at image area. Paper present at PS4550, at power on or after clearing a jam. If using adhesive or self-sealing media, please see the instructions in (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Toggle the registration/TOP sensor (PS4550) to ensure that it moves freely.", "Test the registration/TOP sensor (PS4550) using the manual sensor test."]'::jsonb, '[]'::jsonb, 
        'customers', 124, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B4.FF', 'Jam in right door', 'Paper residual jam at image area. Paper present at fuser loop sensor PS4500 at power on or after clearing a jam. If using adhesive or self-sealing media, please see the instructions in (ish_3199741-3199797-16).', 
        '["Clear the paper jam.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Remove the fuser and check for paper and the correct movement of the sensors PS4500."]'::jsonb, '[]'::jsonb, 
        'customers', 125, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B9.AZ', 'Fuser jam 113', '● The output bin rollers are not turning. Because there is very little distance from the fuser exit to the output bin, paper stopped at the rollers can cause a fuser jam. ● A sticky fuser exit flag. If the flag is stuck or even delayed momentarily in the activated position it can cause this jam. ● Self-sealing or adhesive media is being used. Please see the instructions in . (ish_3199741-3199797-16). ● 13.B9.A1 jam is detected when printing from Tray 1. ● 13.B9.A2 jam is detected when printing from Tray 2. ● 13.B9.A3 jam is detected when printing from Tray 3. ● 13.B9.A4 jam is detected when printing from Tray 4. ● 13.B9.A5 jam is detected when printing from Tray 5. ● 13.B9.AD jam is detected when printing from the duplexer.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 127, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B9.CZ', '115', '● 13.B9.C1 Fuser wrap jam when Auto Sense (Normal). ● 13.B9.C2 Fuser wrap jam when Normal. ● 13.B9.C3 Fuser wrap jam when Light 1 or Light 2. ● 13.B9.C4 Fuser wrap jam when Heavy 1. ● 13.B9.C5 Fuser wrap jam when Heavy 2. ● 13.B9.C6 Fuser wrap jam when Heavy Paper 3. ● 13.B9.C7 Fuser wrap jam when Glossy Paper 1. ● 13.B9.C8 Fuser wrap jam when Glossy Paper 2. ● 13.B9.C9 Fuser wrap jam when Glossy Paper 3. ● 13.B9.CB Fuser wrap jam when Transparency. ● 13.B9.CC Fuser wrap jam when Label. ● 13.B9.CD Fuser wrap jam when Envelope 1 or Envelope 2. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16)', 
        '["Clear the paper jam.", "Print a cleaning page to ensure that all of the toner is removed from the fuser roller.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam."]'::jsonb, '[]'::jsonb, 
        'customers', 129, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.D3.DZ', '121', 'c. Close the right door to allow the printer to attempt to clear the jam message. 2. Ensure the type and quality of the paper being used meets the HP specifications for the printer. 3. If the error persists, please contact customer support. Recommended action for call-center agents and onsite technicians 1. Clear the paper jam. a. Open the right door. b. Look for and clear any paper present or obstructions in the paper path. c. Close the right door to allow the printer to attempt to clear the jam message. 2. Perform the continuous paper path test in simplex mode of at least 50 pages to ensure that issue is occurring while duplex printing only. 3. Test duplexing from multiple trays to see if issue is tray specific or not. If the jam occurs from only one specific tray, troubleshoot the tray for pick and feed issues. a. Ensure the type and quality of the paper being used meets the HP specifications for the printer. b. Ensure the tray is set correctly. If Tray 1 is set to ANY size ANY type, set it to the size the customer is trying to print on. c. Ensure that the tray width and length guides are set to the correct paper size being installed into the tray and that the tray is not over filled above the fill mark or over the tab on the tray. d. Ensure that the tray pickup, feed, and separation rollers are installed correctly and show no damage or wear. Clean or replace the rollers as needed. 4. Test the duplex sensor (PS4700) using the manual sensor test. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Manual Sensor Test c. Select from the following tests: ● All Sensors , Engine Sensors ● Done (return to the Troubleshooting menu) ● Reset (reset the selected sensor’s state) d. Test the duplex sensor to verify that the sensor is functioning correctly. If the sensor does not function, replace the right door sub assembly. NOTE: Before replacing any parts check connector J309 on the DC controller. Part number: RM2-0849-000CN For instructions: See the Repair Service Manual for this product. 122 Chapter 6 Numerical control panel messages 5. Enter the component test menu to run diagnostics on the printer. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Components Test 6. Run the Duplex refeed clutch solenoid. If the tests fail, replace the delivery assembly. Paper delivery assembly part number: RM2-6787-000CN For instuctions: See the Repair Service Manual for this product. 7. Check the right door assembly and rollers for any damage or debris. Replace the right door assembly as needed. Part number: RM2-0849-000CN For instructions: See the Repair Service Manual for this product. 13.D3.FF A power on jam has occurred at the duplex refeed sensor.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, please contact customer support.", "Clear the paper jam.", "Test the duplex sensor (PS4700) using the manual sensor test."]'::jsonb, '[]'::jsonb, 
        'customers', 135, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.E1.D3', 'Fuser Area Jam', 'Output delivery delay jam. Paper did not reach the output bin full sensor in time.', 
        '["Follow the instructions on the control panel to clear the jam. Check for paper in all possible jam locations.", "Verify that no doors are open.", "Check the paper tray to make sure paper is loaded correctly. The paper guides should be adjusted to the", "Verify that the paper meets specifications for this printer.", "Use a damp, lint-free cloth to clean the rollers in the appropriate tray. Replace rollers that are worn."]'::jsonb, '[]'::jsonb, 
        'customers', 138, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.E1.D2', 'This event code was detected when the gear on the delivery assembly is separated from the fuser drive assembly', 'This event code was detected when the gear on the delivery assembly is separated from the fuser drive assembly and is not in contact with the fuser drive assembly.', 
        '["Clear the paper jam.", "Ensure the type and quality of the paper being used meets the HP specifications for the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Clear the paper jam.", "Check if the gear on the Delivery assembly is separated from and Fuser drive assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 140, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.80.F0', '143', 'e. Remove the fuser unit. CAUTION: The fuser might be hot. f. Remove all paper found and then reinstall the fuser. g. Close the printer right door. 2. If the issue persists, replace the lower paper feed assembly. Part number: RM2-1071-000CN For instructions: See the Repair Service Manual for this product. 13.83.Az Paper stay jam right door of the stapler/stacker. The paper stopped at the staple entry sensor in the designated time. ● 13.83.A1 A jam is detected when printing to output bin 1. ● 13.83.A2 A jam is detected when printing to output bin 2.', 
        '["Clear the paper jam.", "If the error persists, please contact customer support.", "Clear the paper jam.", "If the issue persists, replace the upper paper feed assembly.", "If the issue persists, replace the jog assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 157, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.83.DZ', '145', 'd. Open the printer right door. e. Remove the fuser unit. CAUTION: The fuser might be hot. f. Remove all paper found and then reinstall the fuser. g. Close the printer right door. 2. If the issue persists, replace the lower paper feed assembly. Part number: RM2-1071-000CN For instructions: See the Repair Service Manual for this product. 3. If the issue persists, replace the upper paper feed assembly. Part number: RM2-1067-000CN For instructions: See the Repair Service Manual for this product. 13.83.FO Power on Jam/Stacker jam – middle sensor.', 
        '["Check the printer for a jam in the stapler/stacker.", "Look for and clear any paper in the upper right cover of the stapler/stacker.", "View the event log to determine if any other jam errors are occurring and troubleshoot those errors.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Check the printer for a paper jam."]'::jsonb, '[]'::jsonb, 
        'customers', 159, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.WX.YZ', 'error messages', '30.* errors Errors in the 30.* family are related to the flatbed scanner. Recommended action Follow these troubleshooting steps in the order presented. Use the following general troubleshooting steps to try to resolve the problem. If the error persists, contact your HP-authorized service or support provider, or contact HP support at www.hp.com/go/contactHP. 1. Calibrate the scanner. Open these menus: Device Maintenance > Calibrate-Cleaning > Calibrate Scanner. 2. Clean the scanner glass and glass strips. 3. Perform the tests for scanner diagnostics. Open these menus: Administration > Troubleshooting > Diagnostic Tests > Scanner Tests. 4. Upgrade the firmware. For the latest firmware versions, go to HP FutureSmart - Latest Firmware Versions 5. Check all connections on the scanner control board and from the scanner control board to the formatter and the DC controller or the engine control board. If all connections are good, replace the scanner control board. 6. Replace the formatter. 7. If the error persists, replace the scanner assembly. The flatbed cover sensor was interrupted. The scanner flatbed cover is open. This message appears only in the event log and is not posted on the control panel. The control panel will read Flatbed Cover Open.', 
        '["Turn the printer off, and then on.", "This error message should automatically clear.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn off the printer and then turn on the printer.", "Open the scanner lid or automatic document feeder (ADF)."]'::jsonb, '[]'::jsonb, 
        'customers', 163, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.01.08', 'Home position error', 'The scanner optic failed to return to the home position. 156 Chapter 6 Numerical control panel messages', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Print a Configuration Page to check if the latest version of the printer and scanner firmware is installed. If", "Observe whether the movement of the optics assembly moves correctly."]'::jsonb, '[]'::jsonb, 
        'customers', 170, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.01.41', 'Scanner error', 'The formatter lost connections with the SCB or communication was corrupted. NOTE: Check the voltage of the unit on the regulatory sticker. In the past, this event is directly related to a 220V printer being plugged into a 110V outlet. Ensure that the voltage of the outlet matches the voltage of the printer. 164 Chapter 6 Numerical control panel messages', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer power off, and then disconnect the power cable from the printer.", "Wait for one minute, reconnect the power cable, and then turn the printer power on."]'::jsonb, '[]'::jsonb, 
        'customers', 178, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.01.43', 'SCB memory failure 169', '3. Check the cables on the scanner control board (SCB). Make sure the flat flexible cables (FFC''s) are seated correctly. NOTE: When disconnecting and reseating flat flexible cables (FFC’s) on the Scanner Control Board (SCB) it’s important to know that the connectors are Zero Insertion Force (ZIF) connectors. ZIF connectors have gates that need to be opened and closed for proper removal/reinsertion. These connectors are significantly different than the Light Insertion Force (LIF) connectors found on the LaserJet M527 and Color LaserJet M577 printers. Figure 6-116 Gate Closed Figure 6-117 Proper insertion Figure 6-118 Improper insertion 170 Chapter 6 Numerical control panel messages 4. Disconnect and reconnect all cables between the formatter and the scanner control board (SCB). Table 6-33 SCB sensor callout descriptions Callout Description 1 Flatbed sensor/motor 2 Flatbed FFC 3 ADF sensor 4 ADF FFC 5 ADF Motor 5. Restart the printer and check if the error persists. 6. If the error persists, replace the scanner control board (SCB). Table 6-34 SCB part numbers for Enterprise and Flow models Description Part number SCB Enterprise 5851-7764 Scanner control board (SCB) Flow series 5851-7347 For instructions: See the Repair Service Manual for this product. 7. If the error persists, replace the formatter. Table 6-35 Formatter part number Description/ Product models Part number Formatter (main logic) PC board For products: M631, M632, M633, E62555, E62565, E62575 J8J61-60001 Formatter (main logic) PC board For products: E62655/E62665/E62675 3GY14-67901 Recommended action for onsite technicians 171 Table 6-35 Formatter part number (continued) Description/ Product models Part number Kit -Formatter For products: E62655/E62665/E62675 (India/China) 3GY14-67902 Formatter For products: M634, M635, M636, M637 (India/China) 7PS94-67901 Formatter For products: M634, M635, M636, M637 7PS94-67902 For instructions: See the Repair Service Manual for this product. SCB communication error.', 
        '["Turn the printer power off, and then disconnect the power cable from the printer.", "Wait for one minute, reconnect the power cable, and then turn the printer power on.", "If the error persists, upgrade the printer firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer power off, and then disconnect the power cable from the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 183, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.01.54', '179', 'For additional troubleshooting steps, go to WISE and search for the following document: HP LaserJet Enterprise MFP M631-M633, HP LaserJet Managed MFP E62555-E62575 Non-Flow - Control panel is not responsive and/or a 30.01.41 error (Emerging Issue) (document c06103348).', 
        '["Turn the printer off, and then on.", "This error message should automatically clear.", "If the error persists, download FutureSmart firmware 4.7 or later.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 193, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.03.14', '183', 'Front side scanner not detected.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the error persists, replace the image scanner assembly.", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 197, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.04.02', 'Flatbed FFC Cable Not Detected', 'The flatbed FFC cable is not attached or did not sync with scanner controller board FW at power up. Cables are only accessible to a service technician.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, replace the image scanner assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 221, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.04.03', 'ADF FFC Cable Disconnected', 'The automatic document feeder FFC cable is not attached or did not sync with scanner controller board FW at power up. Cables are not accessible to the user. 210 Chapter 6 Numerical control panel messages', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Dispatch a technician onsite to perform the following tasks:", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 224, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.04.04', 'ADF Motor Cable Disconnected', 'The automatic document motor cable is not attached or did not sync with scanner controller board FW at power up. Cables are not accessible to the user.', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Dispatch a technician onsite to perform the following tasks:", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 228, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.04.05', 'ADF Sensor Cable Disconnected', 'The document feeder sensor cable is not attached or did not sync with scanner controller board FW at power up. Cables are not accessible to the user.', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Dispatch a technician onsite to perform the following tasks:"]'::jsonb, '[]'::jsonb, 
        'customers', 231, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '31.01.47', 'Document feeder not detected', 'The document feeder was not detected, or the document feeder might not be connected. The flatbed glass is still available for scanning.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact HP customer support.", "Turn the printer off, and then on.", "If the error persists, replace the document feeder.", "Before replacing the document feeder, the on-site technician should verify that the connections between"]'::jsonb, '[]'::jsonb, 
        'customers', 235, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '31.03.20', 'Backside scanner not detected', 'Backside scanner not detected.', 
        '["Press the power button to turn off the printer, and then press the power button to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 237, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '31.03.22', 'Scanner calibration failure', 'Backside illumination calibration failure.', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, please contact HP customer support."]'::jsonb, '[]'::jsonb, 
        'customers', 241, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '31.03.30', 'Document feeder pick motor error', 'The document feeder pick motor is not turning.', 
        '["Open the top cover and remove any paper present. Close the top cover.", "Turn the printer off, and then on.", "Verify that the paper being used meets the HP specifications for the printer.", "Ensure that the input tray is not overloaded and that the tray guides are set to the correct size.", "If the error persists, please contact customer support at: www.hp.com/go/contactHP."]'::jsonb, '[]'::jsonb, 
        'customers', 243, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '31.03.31', 'Document feeder motor stall', 'The document feeder feed motor is not turning.', 
        '["Open the top cover and remove any paper present. Close the top cover.", "Turn the printer off, and then on.", "Verify that the paper being used meets the HP specifications for the printer.", "Ensure that the input tray is not overloaded and that the tray guides are set to the correct size.", "If the error persists, please contact HP customer support."]'::jsonb, '[]'::jsonb, 
        'customers', 245, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '31.13.00', 'Document feeder multi-pick error', 'A multiple pick error was reported by the document feeder assembly (ADF). Issue might be described as the following: ● Picking multiple documents ● Picking more than one page ● Multiple sheets pulled from ADF ● Multiple pages picked', 
        '["Remove any paper in the paper path.", "Open the automatic document feeder cover, pull all the sheets back into the tray and then resume the job.", "Lift the document-feeder input tray and remove any jammed paper."]'::jsonb, '[]'::jsonb, 
        'customers', 251, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '31.13.00', 'Document feeder multi-pick error 237', 'a. Lift the document feeder input tray b. Remove any paper found under the tray. c. Lower the document-feeder input tray and then close the document feeder cover. NOTE: Verify that the latch on the top of the document-feeder cover is completely closed. 4. For 31.13.02, check for any paper jams or remnants under the document feeder (ADF) blocking in the paper path 238 Chapter 6 Numerical control panel messages a. Open the ADF and remove any paper found. b. Check for any paper remnants blocking the sensor as well as wiping any paper dust off the glass in the region shown below. If significant debris has accumulated over the circular mirror (used for paper edge sensing) this can cause a paper jam error. Callout 1: Check for paper blocking this area. Callout 2: Clean this area with a damp lint free cloth. c. Close the document feeder. 5. Ensure that the paper meets the document feeder (ADF) specifications for the printer. This document outlines the supported weights and sizes of the ADF including best practices: Go to or search for document: HP LaserJet and PageWide Array Enterprise and Managed 500 and 600 - Use the automatic document feeder (ADF):', 
        '["Ensure that the input tray is not overloaded and that the tray guides are set to the correct size. Make sure", "Check the Document Feeder Kit consumable status.", "Check and clean the document feeder pickup rollers and separation rollers by removing any visible lint or", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Remove any paper in the paper path."]'::jsonb, '[]'::jsonb, 
        'customers', 251, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '31.13.02', '275', 'a. Lift the document feeder input tray b. Remove any paper found under the tray. c. Lower the document-feeder input tray and then close the document feeder cover. NOTE: Verify that the latch on the top of the document-feeder cover is completely closed. 4. For 31.13.02, check for any paper jams or remnants under the document feeder (ADF) blocking in the paper path 276 Chapter 6 Numerical control panel messages a. Open the ADF and remove any paper found. b. Check for any paper remnants blocking the sensor as well as wiping any paper dust off the glass in the region shown below. If significant debris has accumulated over the circular mirror (used for paper edge sensing) this can cause a paper jam error. Callout 1: Check for paper blocking this area. Callout 2: Clean this area with a damp lint free cloth. c. Close the document feeder. 5. Ensure that the paper meets the document feeder (ADF) specifications for the printer. This document outlines the supported weights and sizes of the ADF including best practices: Go to or search for document: HP LaserJet and PageWide Array Enterprise and Managed 500 and 600 - Use the automatic document feeder (ADF):', 
        '["Ensure that the input tray is not overloaded and that the tray guides are set to the correct size. Make sure", "Check the Document Feeder Kit consumable status.", "Check and clean the document feeder pickup rollers and separation rollers by removing any visible lint or", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Remove any paper in the paper path."]'::jsonb, '[]'::jsonb, 
        'customers', 289, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '33.WX.YZ', 'error messages', '33.* errors Errors in the 33.* family are related to the printer’s storage system or the formatter. The component might have been previously installed in another printer and is therefore locked to that other printer. Or, the component might be incorrect for this printer.', 
        '["Turn the printer off, and then on.", "If the issue persists, investigate if the solid state drive (SSD) or hard disk drive (HDD) or formatter are", "If the issue persists, locate and notate the complete 33.WX.YZ error message as displayed on the control", "Turn off the printer, and then turn on the printer.", "If the issue persists, investigate if the solid state drive (SSD) or hard disk drive (HDD) or formatter are the"]'::jsonb, '[]'::jsonb, 
        'customers', 320, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '33.02.02', 'Save Recover Status Error', 'Save Recover Status Error The save or recover is disabled, (one or both disabled) (Event Log Only) Recommended action There is no action needed for this message. ■ No action necessary. Data size mismatch. Unable to recover DCC NVRAM.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Turn the printer off, and then ensure that all the connectors on the DC controller PCA are connected", "If the error persists, replace the DC Controller."]'::jsonb, '[]'::jsonb, 
        'customers', 322, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '33.03.05', 'EFI Boot error', 'EFI BIOS event showing that a replacement formatter Recover attempt was unsuccessful.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn off the printer, and then turn on the printer.", "If the error persists, ensure to use the Backup/Restore feature to save the printer settings, and then", "If the error persists, download and install the latest printer firmware available at HP Customer Support -"]'::jsonb, '[]'::jsonb, 
        'customers', 324, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '33.04.05', 'TPM (Trusted Platform Module) Security Error', 'TPM (Trusted Platform Module) Security Error This system contains a TPM module that is not supported on the device or belongs to another device. Recommended action 313 TPM is unique for each device. For units that shipped with a TPM on board standard (most newer models): If the original TPM installed in the factory is unavailable or damaged, DO NOT replace any parts. Follow the recommended action.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Do not replace the formatter or HDD. It will not solve this issue.", "Perform a Format Disk procedure, select Continue in the Pre-boot menu, and then reboot the device.", "Perform a Format Disk procedure again, and then reboot the device."]'::jsonb, '[]'::jsonb, 
        'customers', 327, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '33.05.2X', 'Intrusion detection errors', 'The intrusion detection system has encountered an error. The intrusion detection memory process determined an unauthorized change in system memory. ● 33.05.21 Security alert ● 33.05.21 Potential intrusion (Event code) The intrusion detection memory process heartbeat was not detected. ● 33.05.22 Security alert ● 33.05.22 Cannot scan for potential intrusions (Event code) 316 Chapter 6 Numerical control panel messages The intrusion detection memory process did not initialize. ● 33.05.23 Security alert ● 33.05.23 Intrusion detection not initialized (Event code) ● 33.05.24 Intrusion detection initialization error (Event code)', 
        '["Turn the printer off then on.", "Make sure that the printer is in a Ready state.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off then on.", "Make sure that the printer is in a Ready state."]'::jsonb, '[]'::jsonb, 
        'customers', 330, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '33.05.5Z', 'Intrusion detection errors', 'The intrusion detection system has encountered an error. The intrusion detection memory process determined an unauthorized change in system memory. ● 33.05.51 Security alert ● 33.05.51 Potential intrusion (Event code) The intrusion detection memory process heartbeat was not detected. ● 33.05.52 Security alert ● 33.05.52 Cannot scan for potential intrusions (Event code) The intrusion detection memory process did not initialize. ● 33.05.53 Security alert ● 33.05.53 Intrusion detection not initialized (Event code) ● 33.05.54 Intrusion detection initialization error (Event code)', 
        '["Turn the printer off then on.", "Make sure that the printer is in a Ready state.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off then on.", "Make sure that the printer is in a Ready state."]'::jsonb, '[]'::jsonb, 
        'customers', 331, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '41.02.00', 'Error', 'A beam detected misprint error occurred.', 
        '["Touch OK to clear the error.", "If the error is not cleared, press the power button to turn off the printer, and then to turn on the printer.", "If the error persists, attempt to remove and reinstall the toner cartridge.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 337, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '41.03.FZ', 'Unknown Misprint Error', 'This is a general misprint error. Either the paper is loaded off-center with the guides in the tray, or a paper width sensor failure occurred from an unknown tray. The error will be one of the following: ● 41.03.F0 ● 41.03.F1 ● 41.03.F2 ● 41.03.F3 ● 41.03.F4 ● 41.03.F5 ● 41.03.FD', 
        '["Touch OK to clear the error.", "Remove the paper and the reload the tray. Ensure that the tray width and length guides are set to the correct", "If the error is not cleared, turn the printer off, and then on.", "If the error persists, please contact customer support.", "Remove the paper and the reload the tray. Ensure that the tray width and length guides are set to the correct"]'::jsonb, '[]'::jsonb, 
        'customers', 340, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '41.03.YZ', 'Unexpected size in tray <X> 327', '● Z = E Source is the envelope feeder. ● Z = 1 Source is Tray 1. ● Z = 2 Source is Tray 2. ● Z = 3 Source is Tray 3. ● Z = 4 Source is Tray 4. ● Z = 5 Source is Tray 5.', 
        '["Touch OK to use another tray.", "Print a configuration page to verify the size and type the trays are set to.", "Ensure that the tray width and length guides are set to the correct paper size being installed into the tray", "Verify that the error is not occurring as a result of an unexpected paper size trigger caused by a multi-page", "If the paper is jammed inside the printer, ensure it is completely removed. If paper has been ripped during"]'::jsonb, '[]'::jsonb, 
        'customers', 341, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '41.04.YZ', 'Printer Error 329', '● Y = 3: Light Paper 1, 2, or 3 mode ● Y = 4: Heavy Paper 1 ● Y = 5: Heavy Paper 2 ● Y = 6: Heavy Paper 3 ● Y = 7: Glossy Paper 1 ● Y = 8: Glossy Paper 2 ● Y = 9: Glossy Paper 3 ● Y = A: Glossy film ● Y = B: OHT ● Y = C: Label ● Y = D: Envelope 1, 2, or 3 mode ● Y = E: Rough ● Y = F: Other mode ● Z = D: Source is the duplexer. ● Z = 0: Source is the envelope feeder. ● Z = 1: Source is Tray 1. ● Z = 2: Source is Tray 2. ● Z = 3: Source is Tray 3. ● Z = 4: Source is Tray 4. ● Z = 5: Source is Tray 5.', 
        '["Touch OK to clear the error.", "If the error does not clear, turn the printer off, and then on.", "Swap out or re-seat each toner cartridge to test the toner cartridges.", "If the error persists, please contact customer support.", "Touch OK to clear the error."]'::jsonb, '[]'::jsonb, 
        'customers', 343, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '42.WX.YZ', 'error messages', '42.* errors Errors in the 42.* family indicate an internal system failure has occurred.', 
        '["Turn the printer off, and then on. Retry the job.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on. Retry the job.", "If the error persists, perform a Format Disk procedure using the Preboot menu."]'::jsonb, '[]'::jsonb, 
        'customers', 346, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '44.03.XX', 'Error Event log message', 'A digital send error has occurred.', 
        '["Use optimal resolution and image quality settings.", "Wait until all the digital send jobs have been processed.", "Turn the printer off, and then on and retry the job.", "Verify if there is an attachment limit on the email.", "Verify network connectivity, SMTP gateways, access to folder share."]'::jsonb, '[]'::jsonb, 
        'customers', 348, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '46.WX.YZ', 'error messages', '46.* error messages Errors in the 46.* family occur when the printer is trying to perform an action that it is not able to complete. ● No network connectivity ● A problem with the file being printed, with the software application sending the job, or with the print driver', 
        '["Turn the printer off, and then on.", "Verify the printer is connected to the network, look at the network port connection on the back of the", "Send a different file from the same software application to see if the error is specific to the original file.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 357, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '47.WX.YZ', 'error messages', '47.* errors Errors in the 47.* family indicate an internal error has occurred.', 
        '["Turn the printer off, and then on.", "Resend the print job.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Resend the print job."]'::jsonb, '[]'::jsonb, 
        'customers', 359, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '47.03.XX', '347', '3. If the error persists, clear the active partition by using the Format Disk item in the Preboot menu. For the steps to perform a Clean or Format Disk procedure, search for "HP LaserJet Enterprise, HP LaserJet Managed - Various methods to clean the hard disk drives or solid-state drives" (ish_4502973-4502949-16) - . 47.05.xx Print spooler framework internal error.', 
        '["Turn the printer off, and then on.", "Resend the print job.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Resend the print job."]'::jsonb, '[]'::jsonb, 
        'customers', 361, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '47.FC.YZ', 'Printer Calibration Failed To continue, touch “OK”', 'The device is unable to access or implement one of the image patterns files. y = Calibration type, z = Event ● 47.FC.00 (event code) Color plane registration (CPR) Image not found at system initialization ● 47.FC.01 (event code) CPR Store Image failure ● 47.FC.02 (event code) CPR Image not found ● 47.FC.03 (event code) CPR Print engine execution failure ● 47.FC.10 (event code) Consecutive Dmax Dhalf Image not found at system initialization ● 47.FC.11 (event code) Consecutive Dmax Dhalf Store image failure ● 47.FC.12 (event code) Consecutive Dmax Dhalf Image not found ● 47.FC.13 (event code) Consecutive Dmax Dhalf Print engine execution failure ● 47.FC.20 (event code) Error Diffusion Image not found at system initialization ● 47.FC.21 (event code) Error Diffusion Store image failure ● 47.FC.22 (event code) Error Diffusion Image not found ● 47.FC.23 Error Diffusion Print engine execution failure ● 47.FC.30 0 (event code) Drum Speed Adjustment Image not found at system initialization ● 47.FC.31 (event code) Drum Speed Adjustment Store image failure ● 47.FC.32 (event code) Drum Speed Adjustment Image not found ● 47.FC.33 (event code) Drum Speed Adjustment Print engine execution failure ● 47.FC.40 (event code) Pulse Width Modulation Image not found at system initialization ● 47.FC.41 (event code) Pulse Width Modulation Store image failure ● 47.FC.42 (event code) Pulse Width Modulation Image not found ● 47.FC.43 (event code) Pulse Width Modulation Print engine execution failure', 
        '["Turn the product off, and then on again.", "If the error persists, reload the firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 363, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '48.WX.YZ', 'error messages', '48.* errors Errors in the 48.* family indicate an internal error has occurred.', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "In most cases, no action is necessary.", "If the error persists, upgrade the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 365, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '49.WX.YZ', 'error messages', '49.XX.YY Error To continue turn off then on A firmware error occurred. Possible causes: ● Corrupted print jobs ● Software application issues ● Non-product specific print drivers ● Poor quality USB or network cables ● Bad network connections or incorrect configurations ● Invalid firmware operations ● Unsupported accessories A 49 error might happen at any time for multiple reasons. Although some types of 49 errors can be caused by hardware failures, it is more common for 49 errors to be caused by printing a specific document or performing some task on the printer. 49 errors most often occur when a printer is asked to perform an action that the printer firmware is not capable of and might not have been designed to comply with, such as: ● Printing files with unsupported programming commands ● A unique combination of user environment and user interactions with the printer ● Interfacing with a third-party solution that was not designed to work with the printer ● Specific timing, network traffic, or concurrent processing of jobs', 
        '["Turn the printer off, and then on.", "If the error persists, check the following:", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, check the following:"]'::jsonb, '[]'::jsonb, 
        'customers', 366, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.WX.YZ', 'error messages', '50.* errors Errors in the 50.* family indicate a problem with the fuser.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and remove the fuser. Check the fuser for damage or obstructions. Reinstall or replace", "Check the connectors between the fuser and the DC controller and from the fuser to the printer.", "Replace the fuser. If it has already been replaced, replace the fuser power supply."]'::jsonb, '[]'::jsonb, 
        'customers', 370, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.1X.YZ', 'Low fuser temperature failure', 'Low fuser temperature failure x = fuser mode, y = previous printer sleep state, and z = next printer sleep state.', 
        '["Turn the printer off, and then on.", "Ensure the printer is plugged directly into a wall outlet and that the outlet voltages matches the", "Ensure the paper type and fuser mode are correct for the paper being used.", "Make sure the paper type is set correctly on the printer and that the printer driver matches the type of paper", "Retest the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 370, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.6X.YZ', 'Open fuser circuit (heating element failure)', 'Open fuser circuit (heating element failure)', 
        '["Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 381, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.7F.00', 'Fuser pressure-release mechanism failure', 'Fuser pressure-release mechanism failure', 
        '["Turn the printer off, and then on.", "Ensure the printer is plugged directly into a wall outlet and that the outlet voltages matches the", "Ensure the paper type and fuser mode are correct for the paper being used.", "Make sure the paper type is set correctly on the printer and that the printer driver matches the type of paper", "Retest the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 385, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.BX.YZ', '381', '2. Remove and reinstall the fuser. Ensure that the fuser is seated correctly. CAUTION: The fuser might be hot. a. Open the rear door. b. Grasp the blue handles on both sides of the fuser and pull straight out to remove it. c. Ensure that there is no residual paper in the fuser. 382 Chapter 6 Numerical control panel messages d. Reseat the fuser. e. Close the front door. 3. Check the printer power source. Ensure that the power source meets the printer requirements. Ensure that the printer is the only device using the circuit. NOTE: If the printer does not meet the power requirement of 43 to 67Hz frequency, the fuser temperature control does not work correctly and this will cause the error. 4. Check connections J401 and J402 on the DC controller PCA. 5. If the fuser has not been replaced, replace the fuser. 110V part number: RM2-1256-000CN For intsrructions: See the Repair Service Manual for this product. 220V part number: RM2-1257-000CN For intsrructions: See the Repair Service Manual for this product. 6. If the error persists, replace the low voltage power supply (LVPS). 110V LVPS part number: RM2-6797-000CN For instructions: See the Repair Service Manual for this product. 220V LVPS part number: RM2-6798-000CN For instructions: See the Repair Service Manual for this product. Recommended action for call-center agents and onsite technicians 383 51.WX.YZ, 52.WX.YZ error messages 51.* errors Errors in the 51.* family are related to the laser scanner.', 
        '["Turn the printer off, and then on.", "Upgrade the firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Ensure the printer is running the most current version of firmware.", "Check all connections on the laser/scanner and from the laser/scanner to the DC controller, and reseat them"]'::jsonb, '[]'::jsonb, 
        'customers', 395, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '53.WX.YZ', 'error messages', '53.A0.y0 Tray "Y" side guide misalignment resolved. The engine detected that the tray guide misalignment has been resolved. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A0.10: Tray 1 Side guide misalignment resolved. ● 53.A0.20: Tray 2 side guide misalignment resolved. ● 53.A0.30: Tray 3 side guide misalignment resolved. ● 53.A0.40: Tray 4 side guide misalignment resolved. ● 53.A0.50: Tray 5 side guide misalignment resolved. ● 53.A0.60: Tray 6 side guide misalignment resolved. Recommended action No Action necessary. ■ This is an informational message; no action is necessary. 53.A0.y1 Tray "Y" Side guide misalignment proactive warning. The engine detected a tray "Y" side guide misalignment. This is a proactive warning intended to avoid a jam event. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A0.11: Tray 1 side guide misalignment warning. ● 53.A0.21: Tray 2 side guide misalignment warning. ● 53.A0.31: Tray 3 side guide misalignment warning. ● 53.A0.41: Tray 4 side guide misalignment warning. ● 53.A0.51: Tray 5 side guide misalignment warning. ● 53.A0.61: Tray 6 side guide misalignment warning.', 
        '["Ensure that the paper size in the tray matches the tray size in the Trays menu.", "If the trays are not locked, ensure the tray guides are correctly aligned to the size of paper being installed.", "If the trays are locked, contact your managed print provider if you need to change the paper size from the", "Ask the customer to check the paper size loaded in the tray to see if it matches the size listed in the Trays", "If the trays are not locked, educate the customer on the correct way to align the side guides when refilling"]'::jsonb, '[]'::jsonb, 
        'customers', 400, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '53.A1.Y0', 'Enter error message', 'Tray "Y" paper delivery direction misalignment resolved. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A1.10: Tray 1 Side guide misalignment resolved. ● 53.A1.20: Tray 2 side guide misalignment resolved. ● 53.A1.30: Tray 3 side guide misalignment resolved. ● 53.A1.40: Tray 4 side guide misalignment resolved. ● 53.A1.50: Tray 5 side guide misalignment resolved. ● 53.A1.60: Tray 6 side guide misalignment resolved. Recommended action No Action necessary. ■ This is an informational message; no action is necessary. 53.A1.y1 Tray "Y" paper delivery direction misalignment warning. NOTE: This is an event log only message, it will not show on the control panel. "Y" = Tray number. ● 53.A1.11: Tray 1 paper delivery direction misalignment warning. ● 53.A1.21: Tray 2 paper delivery direction misalignment warning. ● 53.A1.31: Tray 3 paper delivery direction misalignment warning. ● 53.A1.41: Tray 4 paper delivery direction misalignment warning. Recommended action for call-center agents and onsite technicians 387 ● 53.A1.51: Tray 5 paper delivery direction misalignment warning. ● 53.A1.61: Tray 6 paper delivery direction misalignment warning.', 
        '["Ensure that the paper size in the tray matches the tray size in the Trays menu.", "If the trays are not locked, ensure the tray guides are correctly aligned to the size of paper being installed.", "If the trays are locked, contact your managed print provider if you need to change the paper size from the", "Ensure that the paper tray guides are set to the correct paper size that is being loaded into the paper tray.", "Ensure that the rear paper guide is set to the correct paper length."]'::jsonb, '[]'::jsonb, 
        'customers', 401, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '53.B2.0Z', '391', 'The specified tray contains a size that does not match the configured size. The tray is configured to support the only size indicated Confirm guides are in correct position. This issue occurs when the managed print provider has locked the paper tray to either letter or A4 and the tray has a different size paper loaded. NOTE: This can occur if the tray was swapped out or the physical trays locks in the tray were removed and the guides changed. ● 53.C1.02: Tray 2 size mismatch. ● 53.C1.03: Tray 3 size mismatch. ● 53.C1.04: Tray 4 size mismatch. ● 53.C1.05: Tray 5 size mismatch. ● 53.C1.06: Tray 6 size mismatch.', 
        '["Ensure that the paper size in the tray matches the tray size in the Trays menu.", "Contact your managed print provider if you need to change the paper size from the one selected.", "Ask the customer to check the media size loaded in the tray to see if it matches the size listed in the Trays", "Instruct the customer to contact the managed print provider if the paper size needs to be changed from the"]'::jsonb, '[]'::jsonb, 
        'customers', 405, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '54.WX.YZ', 'error messages', '54.* errors Errors in the 54.* family are related to the image-formation system. ● For HP LaserJet printers, they can indicate a problem with the toner cartridges or the transfer unit (color printers only), or they can indicate a problem with a sensor, such as with the laser/scanner. ● For HP PageWide printers, they can indicate a problem with the calibration process.', 
        '["Turn the printer off, and then on.", "Make sure the printer is running the most current version of firmware.", "Check the supplies status page using the Supplies menu on the control panel to verify that toner cartridges,", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 407, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '55.00.05', 'Engine Firmware RFU Error 397', '55.01.06, 55.02.06 DC controller error To continue turn off then on NVRAM memory warning ● 55.01.06 (event code) NVRAM memory data error warning. ● 55.02.06 (event code) NVRAM memory access error warning.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, check the input and output accessories (envelop feeder, stapler/stacker for example)", "Press the power button to turn off the printer, attempt to remove the installed accessories, and then turn on"]'::jsonb, '[]'::jsonb, 
        'customers', 411, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '57.WX.YZ', 'error mesages', '57.* errors Errors in the 57.* family indicate a problem with a fan.', 
        '["Press the Power button on the front of the printer to turn it off, and then wait 10 seconds.", "Press the Power button again to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the printer troubleshooting manual to identify the locations of each fan. Turn the printer off and then", "Update the firmware to the latest version. If the latest version firmware is already installed, reinstall it now."]'::jsonb, '[]'::jsonb, 
        'customers', 415, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '57.00.01', 'Fan failure', 'Cartridge upper (FM3) failure.', 
        '["Press the Power button on the front of the printer to turn it off, and then wait 10 seconds.", "Press the Power button again to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, then on.", "Replace the cartridge upper fan FM3."]'::jsonb, '[]'::jsonb, 
        'customers', 415, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '57.00.02', 'Fan failure', 'Cartridge lower fan (FM4) error.', 
        '["Press the Power button on the front of the printer to turn it off, and then wait 10 seconds.", "Press the Power button again to turn on the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, then on.", "Remove and reconnect (J6405) on the cartridge lower fan."]'::jsonb, '[]'::jsonb, 
        'customers', 416, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '58.WX.YZ', 'error messages', '58.* errors Errors in the 58.* family indicate an electrical problem inside the printer.', 
        '["Turn the printer off, and then on.", "Make sure the printer is connected to a dedicated power outlet and not to a surge protector or other type of", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Make sure the printer is connected to a dedicated power outlet and not to a surge protector or other type of"]'::jsonb, '[]'::jsonb, 
        'customers', 420, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '58.00.04', 'Error', 'Low-voltage power supply unit malfunction.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact customer support.", "Turn the printer off, and then on.", "Ensure the printer is plugged into a dedicated power outlet.", "If the error persists, replace the low-voltage power supply (LVPS)."]'::jsonb, '[]'::jsonb, 
        'customers', 422, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '58.01.04', 'Error', '24V power supply error during operation. 408 Chapter 6 Numerical control panel messages During a regular printing operation the 24V power supply experienced an error.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact customer support.", "Turn the printer off, and then on.", "Ensure the printer is plugged into a dedicated power outlet.", "If the error persists, replace the low-voltage power supply (LVPS)."]'::jsonb, '[]'::jsonb, 
        'customers', 422, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '58.02.04', 'Error', '24V power supply error during printer power on or wake up. During the printer power on, or when waking from a sleep mode, the printer experienced an error with the 24V power supply. NOTE: Check the voltage of the unit on the regulatory sticker. This event is directly related to a 220V printer being plugged into a 110V outlet. Ensure that the voltage of the outlet matches the voltage of the printer.', 
        '["Turn the printer off, and then on.", "If the error persists, please contact customer support.", "Turn the printer off, and then on.", "Ensure the printer is plugged into a dedicated power outlet.", "If the error persists, replace the low-voltage power supply (LVPS)."]'::jsonb, '[]'::jsonb, 
        'customers', 423, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '59.WX.YZ', 'error messages', '59.* errors Errors in the 59.* family indicate a problem with one of the motors or with the lifter drive assembly for one of the trays.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Check all connections on the main control board of the printer, (DC controller, Engine control board ECB),", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 425, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '60.01.04', '423', '2. Close the tray to check if the error persists. 3. Reload the paper and test the printer. 4. If the error persists, contact your HP-authorized service or support provider, or contact customer support at www.hp.com/go/contactHP. Recommended action for call-center agents and onsite technicians 1. Re-seat connector on the Feeder Controller/HCI Controller PCA assembly from the lifter drive assembly. 2. If the error persists, replace the Lifter drive Assembly based on the input tray. Table 6-128 Parts Part Name Part Number Instructions link 1x550 Input Tray Lifter Drive Assembly (M3601) RM2-0895-000CN For instructions: See the Repair Service Manual for this product. 1x550 Envelope feeder Lifter Drive Assembly (M3601) RM2-0895-000CN For instructions: See the Repair Service Manual for this product. 1x550 Sheet Feeder stand Lifter Drive Assembly (M3401) RM2-0948-000CN For instructions: See the Repair Service Manual for this product. 3x550 Sheet Feeder Lifter Drive Assembly (M3401) 3x550 Upper, middle and lower trays. 2,550 Upper cassette tray RM2-0948-000CN For instructions: See the Repair Service Manual for this product. See the Repair Service Manual for this product. See the Repair Service Manual for this product. 2,550 Sheet Feeder stand 2,000 sheet deck Lifter Drive Assembly (M3401) RM2-0948-000CN See the Repair Service Manual for this product. for instructions: See the Repair Service Manual for this product. 3. If the error persists, replace the Feeder Controller PCA Assembly. Table 6-129 Parts Part Name Part Number Instructions link 1x550 Input Tray Controller PCA RM2–8767-000CN For instructions: See the Repair Service Manual for this product. 1x550 Envelope feeder Controller PCA RM2-8785-000CN For instructions: See the Repair Service Manual for this product. 1x550 Sheet Feeder stand Controller RM2-8827-000CN For instructions: See the Repair Service Manual for this product. 3x550 Sheet Feeder Controller PCA RM2-8807-000CN For instructions: See the Repair Service Manual for this product. 2,550 Sheet Feeder stand Controller PCA RM2-9020-000CN for instructions: See the Repair Service Manual for this product. 424 Chapter 6 Numerical control panel messages Tray 5 lifting error.', 
        '["Open the failing tray and remove all paper from the tray.", "Close the tray to check if the error persists.", "Reload the paper and test the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Re-seat connector on the Feeder Controller/HCI Controller PCA assembly from the lifter drive assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 437, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '60.01.05', '425', '3. If the error persists, replace the Feeder Controller PCA Assembly. Table 6-131 Parts Part Name Part Number Instructions link 1x550 Input Tray Controller PCA RM2–8767-000CN For instructions: See the Repair Service Manual for this product. 1x550 Envelope feeder Controller PCA RM2-8785-000CN For instructions: See the Repair Service Manual for this product. 1x550 Sheet Feeder stand Controller RM2-8827-000CN For instructions: See the Repair Service Manual for this product. 3x550 Sheet Feeder Controller PCA RM2-8807-000CN For instructions: See the Repair Service Manual for this product. 2,550 Sheet Feeder stand Controller PCA RM2-9020-000CN for instructions: See the Repair Service Manual for this product. Tray 6 lifting error.', 
        '["Open the failing tray and remove all paper from the tray.", "Close the tray to check if the error persists.", "Reload the paper and test the printer.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Re-seat connector on the Feeder Controller/HCI Controller PCA assembly from the lifter drive assembly."]'::jsonb, '[]'::jsonb, 
        'customers', 439, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '66.00.77', 'Output accessory failure', 'The output device experienced an internal communication malfunction', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, replace the output accessory controller PCA."]'::jsonb, '[]'::jsonb, 
        'customers', 444, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '66.80.17', 'device failure', 'An external paper handling accessory error has occurred. ● 66.80.17 Fan malfunction', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, replace the fan.", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 446, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '70.WX.YZ', 'error messages', '70.* errors Messages in the 70.* family indicate a problem with the DC controller or Formatter (ECB) depending on your printer.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Replace the DC controller or the Formatter as needed."]'::jsonb, '[]'::jsonb, 
        'customers', 448, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '80.0X.YZ', 'Embedded Jetdirect Error', 'An Embedded HP JetDirect print server critical error has occurred. ● 80.01.80 (event log) No heartbeat ● 80.01.81 (event log) Reclaim time-out ● 80.01.82 (event log) Invalid data length ● 80.01.8B (event log) Invalid max outstanding packet header field ● 80.01.8C (event log) Invalid channel mapping response ● 80.03.01 (event log) No PGP buffers ● 80.03.02 (event log) Channel table full ● 80.03.03 (event log) Producer index not reset ● 80.03.04 (event log) Consumer index not reset ● 80.03.05 (event log) Queue position size too small ● 80.03.06 (event log) Transport overflow ● 80.03.07 (event log) No overflow packets ● 80.03.08 (event log) Invalid identify response ● 80.03.09 (event log) Invalid channel map return status ● 80.03.10 (event log) Invalid reclaim return status ● 80.03.12 (event log) Datagram invalid buffer ● 80.03.13 (event log) Max stream channels ● 80.03.14 (event log) Max datagram channels ● 80.03.15 (event log) Card reset failed ● 80.03.16 (event log) Self-test failure ● 80.03.17 (event log) Unknown PGP packet ● 80.03.18 (event log) Duplicate I/O channel', 
        '["Press the power button to turn off the printer.", "Disconnect the network (Ethernet) cable.", "Press the power button to turn on the printer.", "Turn off the printer, and then reconnect the Ethernet cable to the Ethernet port on the printer and on the", "Turn on the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 450, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '81.WX.YZ', 'EIO Error To continue turn off then on', 'An external I/O card has failed on the printer.', 
        '["Press the power button to turn off the printer.", "Disconnect the network (Ethernet) cable.", "Press the power button to turn on the printer.", "Turn off the printer, and then reconnect the Ethernet cable to the Ethernet port on the printer and on the", "Turn on the printer."]'::jsonb, '[]'::jsonb, 
        'customers', 452, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '81.09.00', 'Error', 'Internal Jetdirect Inside Networking event.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Verify that the issue occurs with the latest version of firmware.", "Verify that the issue occurs when the device has the latest firmware and is not connected to the network.", "Verify that the issue occurs when disconnected from the network and with default configuration."]'::jsonb, '[]'::jsonb, 
        'customers', 454, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '82.0X.YZ', 'Internal disk device failure', 'The internal disk failed on the printer.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, turn off the printer, and then disconnect the power cable.", "Remove the Hard disk drive (HDD), and then reinstall the HDD.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 457, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '82.73.45', 'Disk Successfully cleaned', 'Event log only, disk successfully cleaned. Recommended action See recommended action. ■ No action necessary. 82.73.46, 82.73.47 A hard disk drive (HDD), solid state drive (SDD), or compact flash disk cleaning failed. This error is usually caused by a failure of the disk hardware.', 
        '["Turn the product off, and then on.", "Reload the printer firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "Use the Format Disk item in the Preboot menu."]'::jsonb, '[]'::jsonb, 
        'customers', 460, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '90.WX.YZ', 'error messages', '90.* errors Errors in the 90.* family are related to the control panel.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on.", "If the error persists, dispatch an onsite technician.", "Turn the printer off by holding down the power button for at least 10 seconds."]'::jsonb, '[]'::jsonb, 
        'customers', 461, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '98.0X.0Y', 'error messages', '98.00.0c Data corruption has occurred and fails to mount partition.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "Check if the 98.00.0c event is intermittent or persistent and perform the appropriate task."]'::jsonb, '[]'::jsonb, 
        'customers', 464, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '98.00.02', 'Corrupt data in the solutions volume', 'Data corruption has occurred in the solutions volume.', 
        '["Turn the printer off, and then on.", "Download and install the latest firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "Check if the 98.00.0c event is intermittent or persistent, and then perform the appropriate task."]'::jsonb, '[]'::jsonb, 
        'customers', 468, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '98.00.03', 'Corrupt data in the configuration volume', 'Data corruption has occurred in the configuration volume.', 
        '["Turn the printer off, and then on.", "Download and install the latest firmware.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Turn the printer off, and then on."]'::jsonb, '[]'::jsonb, 
        'customers', 471, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.WX.YZ', 'error messages', '99.* errors Errors in the 99.* family are related to the firmware upgrade process.', 
        '["Make sure the connection to the network is good, and then try the firmware upgrade again.", "If the error persists, try using the USB upgrade method.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Make sure the connection to the network is good, and then try the upgrade again.", "Try using the USB upgrade method."]'::jsonb, '[]'::jsonb, 
        'customers', 473, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.00.03', 'Upgrade not performed error writing to disk', 'A remote firmware upgrade (RFU) was not performed. This is a disk error. It might indicate a problem or a hard disk drive failure. It might be necessary to check the connection to the hard disk drive or replace the hard disk drive.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 474, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.00.06', 'Upgrade not performed error reading upgrade', 'A remote firmware upgrade (RFU) was not performed. This is an unexpected read error when reading the header number and size.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 478, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.00.07', 'Upgrade not performed error reading upgrade', 'A remote firmware upgrade (RFU) was not performed. This is an unexpected read error when reading the rest of the header.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 482, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.00.08', 'Upgrade not performed error reading upgrade', 'A remote firmware upgrade (RFU) was not performed. This is an unexpected read error when reading image data.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, update the printer firmware to the latest version.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the power button to turn off the printer, and then to turn on the printer.", "If the issue persists, download and update the printer firmware."]'::jsonb, '[]'::jsonb, 
        'customers', 485, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.07.22', 'Firmware install error', 'This error indicates that the firmware installation failed. It displays on the printer control panel when the fax modem installer fails to download the installed firmware to the modem.', 
        '["Make sure that the network connection is stable and good, and then attempt to update the firmware again.", "If the error persists, try to update the firmware at the control panel using a USB flash drive.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Make sure that the network connection is stable and good, and then attempt to update the firmware again.", "If the error persists, try to update the firmware at the control panel using a USB flash drive."]'::jsonb, '[]'::jsonb, 
        'customers', 492, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.09.62', 'Unknown disk', 'This error indicates that there is an encryption mismatch between the HDD or SSD and the formatter. This typically happens because an HDD or SSD was swapped into a device from another device.', 
        '["Turn the printer off, and then on.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Use the Preboot menu to unlock the disk.", "If a disk is to be reused in a different product, execute the Erase and Unlock procedure from the Preboot", "If the issue persists, replace the HDD/SSD as needed."]'::jsonb, '[]'::jsonb, 
        'customers', 495, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.09.64', 'Disk Nonfunctional', 'A fatal hard disk drive failure has occurred.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, turn off the printer, and then disconnect the power cable.", "Remove the Hard disk drive (HDD), and then reinstall the HDD.", "If the error persists, the hard disk drive needs to be replaced. Contact your HP-authorized service or"]'::jsonb, '[]'::jsonb, 
        'customers', 496, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.09.65', 'Disk data error', 'Disk data corruption has occurred. Recommended action Follow these troubleshooting steps in the order presented. NOTE: Do NOT replace the formatter board, it will not resolve this error. ■ Use the Format Disk procedure from the Preboot menu, and then resend the remote firmware upgrade (RFU). For the steps to perform a Clean or Format Disk procedure, search for "HP LaserJet Enterprise, HP LaserJet Managed - Various methods to clean the hard disk drives or solid-state drives" (ish_4502973-4502949-16) 99.09.66 No boot device. A hard disk drive or eMMC is not installed in the printer.', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, turn off the printer, and then disconnect the power cable.", "Remove the Hard disk drive (HDD), and then reinstall the HDD.", "If the error persists, the hard disk drive needs to be replaced. Contact your HP-authorized service or"]'::jsonb, '[]'::jsonb, 
        'customers', 500, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.09.67', 'Disk is not bootable please download firmware', 'There is no firmware installed on the hard disk drive. This is usually the result of installing a new hard disk drive or performing a Clean Disk procedure from the Preboot menu. NOTE: When installing a new hard drive or eMMC, the disk should be formatted through the Preboot menu, BEFORE loading firmware. 492 Chapter 6 Numerical control panel messages', 
        '["Use the power button to turn off the printer, and then to turn on the printer.", "Check if the error persists.", "If the error persists, replace the Hard disk drive (HDD).", "If the error persists, verify a compatible hard disk drive (HDD) is installed.", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at"]'::jsonb, '[]'::jsonb, 
        'customers', 506, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '99.39.67', 'eMMC Not Bootable', 'Data on the eMMC cannot be secured or encrypted. When the hard disk drive is installed all data on the eMMC is automatically migrated to the hard disk drive and erased from the eMMC. As long as the hard disk drive is installed the eMMC is non-functional. The customer passed the data migration and put the eMMC back in. Recommended action 1. Download firmware to the eMMC. 2. If the download fails to eMMC, replace the eMMC. Do NOT replace the formatter board, it will not resolve this. NOTE: The device is unusable until a new eMMC is installed. Recommended action 497 Alphabetical control panel messages7 Use the following alphabetical message to see further information on the message. 498 Chapter 7 Alphabetical control panel messages Alphabetical messages Accept bad signature The product is performing a remote firmware upgrade and the code signature is invalid. Recommended action Follow these troubleshooting steps in the order presented. ■ Download the correct firmware upgrade file for the product, and then reinstall the upgrade. For the latest firmware versions, go to: HP FutureSmart - Latest Firmware Versions Authentication required A user name and password are required. Recommended action ■ Type the user name and password, or contact the network administrator. Bad optional tray connection The optional tray is not connected, not connected correctly, or a connection is not working correctly. Recommended action 1. Turn the printer off. 2. Remove and then reinstall the optional tray. 3. If more than one extra 550 Sheet feeder is available swap trays and test again. 4. Remove the tray and inspect the connectors on the tray and printer for damage. If either of them are broken, have bent pins, or otherwise appear damaged, replace them. 5. Carefully reposition printer base onto the optional tray. HP recommends that two people lift the printer. 6. If the problem continues, replace the connector for the tray. 550 Sheet feeder upper cable assembly part number: RM2-8880-000CN 550 Sheet feeder lower cable assembly part number: RM2-8881-000CN 1X550, 3X550 and 2,550 Sheet feeder stand cable assembly part number: RM2-9286-000CN Canceling...<jobname> The printer is canceling the current job <jobname>. Recommended action See recommended action. ■ No action necessary. Accept bad signature 499 Cartridge low If this message appears even though the toner cartridge is new, perform the following. Recommended action 1. Remove, and then reinstall the toner cartridge. 2. Make sure a genuine HP supply is used. 3. If the error persists, replace the toner cartridge. Cartridge Memory Abnormal This message appears even though the toner cartridge is new. Recommended action 1. Remove, and then reinstall the toner cartridge. 2. If the error persists, replace the toner cartridge. Cartridge out This message appears even though the toner cartridge is new. Recommended action 1. Remove, and then reinstall the toner cartridge. 2. Make sure a genuine HP supply is used. 3. If the error persists, replace the toner cartridge. Checking engine The printer is conducting an internal test. Recommended action See recommended action. ■ No action necessary. Checking paper path The printer is checking for possible paper jams. Recommended action See recommended action. ■ No action necessary. Chosen personality not available To continue touch “OK” A print job requested a printer language (personality) that is not available for this printer. The job will not print and will be cleared from memory. 500 Chapter 7 Alphabetical control panel messages Recommended action Follow these troubleshooting steps in the order presented. ■ Print the job by using a print driver for a different printer language, or add the requested language to the printer (if possible). To see a list of available personalities, print a configuration page. a. From the Home screen on the printer control panel, go to the following menus: Reports > Configuration/Status Pages b. Select Configuration Page, then select the Print button to print the pages. Cleaning The printer is performing an automatic cleaning cycle. Printing will continue after the cleaning is complete. Recommended action See recommended action. ■ No action necessary. Clearing activity log This message is displayed while the activity log is cleared. The printer exits the menus when the log has been cleared. Recommended action ■ No action necessary. Clearing paper path The printer is attempting to eject jammed paper. Recommended action Follow these troubleshooting steps in the order presented. ■ Check the progress at the bottom of the display. Close left door The left door is open. This message appears even though the top left door is closed. Recommended action for customers 1. Close the left door to allow the printer to attempt to clear the jam. 2. Open then close the left door to ensure it is fully closed. Recommended action for call-center agents and onsite technicians 1. Close the left door to allow the printer to attempt to clear the jam. Recommended action 501 2. Check the projection part on the left door that defeats the left door interlocks. If broken replace the left door assembly. Part number: RM2-0850-000CN For instructions: See the Repair Service Manual for this product. 3. Check SW1 using the manual sensor test. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Manual Sensor Test c. Select from the following tests: ● All Sensors , Engine Sensors ● Done (return to the Troubleshooting menu) ● Reset(reset the selected sensor’s state) d. Test SW2 using folded paper or another object to defect the interlock. If the switch test fails, replace the laser shutter assembly. Part number: RM2-6755-000CN NOTE: Before replacing any parts check connector J308 on the DC controller. Close right door The right door is open. Recommended action for customers ■ Close the right door to allow the printer to attempt to clear the jam. 502 Chapter 7 Alphabetical control panel messages Recommended action for call-center agents and onsite technicians 1. Close the right door to allow the printer to attempt to clear the jam. 2. Check the projection part on the right door that defeats the right door interlocks. If broken replace the right door assembly. Part number: RM2-0849-000CN For instructions: See the Repair Service Manual for this product. 3. Check SW1 using the manual sensor test. a. From the home screen on the printer control panel, touch “Support Tools”. b. Open the following menus: ● Troubleshooting ● Diagnostic Tests ● Manual Sensor Test c. Select from the following tests: ● All Sensors , Engine Sensors ● Done (return to the Troubleshooting menu) ● Reset(reset the selected sensor’s state) d. Test SW1 using folded paper or another object to defect the interlock. If the switch test fails, replace the laser shutter assembly. Part number: RM2-6755-000CN NOTE: Before replacing any parts check connector J321 on the DC controller. Recommended action for call-center agents and onsite technicians 503 Communication lost A Communication Lost message appears on the control panel in five different languages. The communication path from the control panel to the formatter includes the Control Panel, USB cable, and the formatter. Recommended action for customers Follow these troubleshooting steps in the order presented. 1. Turn the printer off, and then on. 2. If the error persists, contact your HP-authorized service or support provider, or contact customer support at www.hp.com/go/contactHP. Recommended action for call agents Follow these troubleshooting steps in the order presented. 1. Turn the printer off, and then on. 2. If the issue persists, check the heartbeat LED on the formatter located on the rear of the printer. ● If the formatter heartbeat LED status flashes yellow, it indicates a communication problem between the control panel and the formatter. Replace the control panel. Table 7-1 Control panel part numbers Description Part number Control panel assembly B5L47-67018 ● If the formatter heartbeat LED status is solid red, it indicates a problem with the formatter. Replace the formatter. Table 7-2 Formatter part numbers Description Part number Formatter (main logic) PC board J8J61-60001 504 Chapter 7 Alphabetical control panel messages', 
        '["Turn the printer off, and then on.", "If the issue persists, turn off the printer, and then reseat the USB cable connection in the control panel.", "Press the power button to turn on the printer.", "If the printer returns to a \"Ready\" state, verify functionality of the control panel.", "If the issue persists, turn the printer off."]'::jsonb, '[]'::jsonb, 
        'service', 511, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '82.0X.YY', '(event code)', 'The internal hard drive is not functioning correctly. Recommended action Follow these troubleshooting steps in the order presented. 1. Turn off the printer, and then remove and reinstall the hard drive. 2. Turn on the printer. 3. If the error persists, replace the internal hard drive. NOTE: Most customers have the self-encrypting drive (SED) and should not have a Federal Information Processing Standards (FIPS) drive. Only send the FIPS drive for federal government printers, customers that require FIPS per HP agreement, or customers that have bought the FIPS drive as an accessory. 512 Chapter 7 Alphabetical control panel messages Table 7-6 Hard disk drive (HDD) part number Description Part number Self-Encrypting Drive, SED (HDD) L41606-011 Federal Information Processing Standards Drive, FIPS (HDD) See NOTE above. L42243-021 See NOTE above. For intsructions: See the Repair Service Manual for this product. Internal disk not initialized The internal hard disk drive file system must be initialized before it can be used. Recommended action Follow these troubleshooting steps in the order presented. ■ Initialize the internal hard disk drive file system. For information on performing various actions on the hard disk drive, go to: HP LaserJet, OfficeJet, PageWide, ScanJet - HP FutureSmart Firmware Device Hard Disk, SSD, and eMMC Security (white paper) Internal disk spinning up The internal hard disk drive device is spinning up its platter. Jobs that require hard disk drive access must wait. Recommended action See recommended action. ■ No action necessary. Load Tray <X>: [Type], [Size] To use another tray, press “OK” This message displays when the indicated tray is selected, but is not loaded, and other paper trays are available for use. It also displays when the tray is configured for a different paper type or size than the print job requires. Recommended action 1. Load the correct paper in the tray. 2. If prompted, confirm the size and type of paper loaded. 3. Otherwise, press the OK button to select another tray. 4. If error persists, use the cassette paper present sensor test in the Tray/bin manual sensor test to verify that the sensor is functioning correctly. 5. Make sure that the sensor flag on the paper presence sensor is not damaged and moves freely. 6. Reconnect the corresponding connector. Internal disk not initialized 513 Loading program <XX> Do not power off Programs and fonts can be stored on the printer’s file system and are loaded into RAM when the printer is turned on. The number <XX> specifies a sequence number indicating the current program being loaded. Recommended action See recommended action. ■ No action necessary. Manually feed output stack Then touch "OK" to print second side The printer has printed the first side of a manual duplex job and is waiting for you (or the applicable user) to insert the output stack to print the second side. Recommended action Follow these troubleshooting steps in the order presented. 1. Maintaining the same orientation, remove the pages from the output bin. 2. Flip the document printed side up. 3. Load the document in Tray 1. 4. Touch the OK button to print the second side of the job. Manually feed: <Type><Size> This message appears when manual feed is selected, Tray 1 is not loaded, and other trays are empty. Recommended action Follow these troubleshooting steps in the order presented. 1. Load the tray with requested paper. 2. If the paper is already in the tray, press the Help button to exit the message and then press the OK button to print. 3. To use another tray, clear paper from Tray 1, press the Help button to exit the message and then press the OK button. No job to cancel You have pressed the stop button but the printer is not actively processing any jobs. Recommended action See recommended action. ■ No action necessary. No USB drive or files found The formatter was not able to detect the USB thumb drive. 514 Chapter 7 Alphabetical control panel messages If you experience the “No USB drive or files found” attempting to upgrade printer firmware via the walk up easy-access USB port perform the following.', 
        '["1. After the firmware file has been downloaded from hp.com uncompress the file and copy the", "If the issue persists, verify the USB flash drive is formatted as FAT32. If unsure, format the flash drive as", "If the issue persists, the USB flash drive can be inserted directly into a USB port on the printer’s formatter", "If the error persists, contact your HP-authorized service or support provider, or contact customer support at", "Try another thumb drive."]'::jsonb, '[]'::jsonb, 
        'customers', 526, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '10.23.70', 'Fuser kit (event code)', 'Recommended action ■ Replace the specified supply. Or, configure the printer to continue printing using the Manage Supplies menu on the printer control panel. Resend external accessory firmware An external accessory requires a firmware upgrade. Printing can continue, but jams might occur if the job uses the external accessory. Recommended action Follow these troubleshooting steps in the order presented. ■ Perform a firmware upgrade. For the latest firmware versions, go to: HP FutureSmart - Latest Firmware Versions 522 Chapter 7 Alphabetical control panel messages Resend Upgrade A firmware upgrade did not complete successfully. Recommended action Follow these troubleshooting steps in the order presented. ■ Upgrade the firmware again. For the latest firmware versions, go to: HP FutureSmart - Latest Firmware Versions Restore Factory Settings The printer is restoring factory settings. Recommended action See recommended action. ■ No action necessary. RFU Load Error Send full RFU on <X> Port The printer displays this message before the firmware is loaded at initialization when an error has occurred during a firmware upgrade. Recommended action ■ Resend the firmware upgrade. ROM disk device failed To clear press “OK” The specified device failed. Recommended action Follow these troubleshooting steps in the order presented. ■ Touch the OK button to clear the error. ROM disk file operation failed To clear press “OK” A PJL command was received that attempted to perform an illegal operation, such as downloading a file to a nonexistent directory. Recommended action Follow these troubleshooting steps in the order presented. ■ Touch the OK button to clear the error. ROM disk file system is full To clear press “OK” The specified device is full. Recommended action Follow these troubleshooting steps in the order presented. Resend Upgrade 523 ■ Touch the OK button to clear the error. ROM disk is write protected To clear press “OK” The device is protected and no new files can be written to it. Recommended action Follow these troubleshooting steps in the order presented. ■ Touch the OK button to clear the error. ROM disk not initialized To clear press “OK” The ROM disk file system must be initialized before it can be used. Recommended action Follow these troubleshooting steps in the order presented. ■ Initialize the ROM disk file system. Sanitizing disk <X> complete Do Not power off The hard disk is being cleaned. Recommended action ■ Contact the network administrator. Size mismatch in Tray <X> The paper in the listed tray does not match the size specified for that tray. If using adhesive or self-sealing media, please see the instructions in . (ish_3199741-3199797-16) Recommended action 1. Load the correct paper. 2. Make sure that the paper is positioned correctly. 3. Close the tray, and then make sure that the control panel lists the correct size and type for the specified tray. 4. If necessary, use the control panel menus to reconfigure the size and type settings for the specified tray. 5. If this message appears even though the correct size paper is loaded in the correct paper tray perform the following. a. Use the Tray size switch test in the Tray/Bin manual sensor test to test the switch. If it does not respond, replace the tray drive assembly. Part number: RM2-0875-000CN 550 Sheet feeder instructions: See the Repair Service Manual for this product. Removal and replacement: See the Repair Service Manual for this product. 3X550 Sheet paper deck instructions: See the Repair Service Manual for this product. 524 Chapter 7 Alphabetical control panel messages 2550 Sheet feeder deck instructions: See the Repair Service Manual for this product. b. Reconnect tray connectors on the media size switch, and then reconnect connector on the DC controller to tray. Sleep mode on The printer is in sleep mode. Pressing a control-panel button, receiving a print job, or occurrence of an error condition clears this message. Recommended action See recommended action. ■ No action necessary. Supplies low Multiple supplies on the printer have reached the low threshold. Recommended action Follow these troubleshooting steps in the order presented. ■ Replace the supply when print quality is no longer acceptable. Supply memory warning The printer cannot read or write to the e-label or the e-label is missing. Recommended action See recommended action. ■ No action necessary. Too many jobs in queue This message displays when the user selects a USB file to print, and 100 files are already in the print queue. Recommended action ■ To select another file, touch the OK button. Tray <X> empty: [Type], [Size] The specified tray is empty and the current job does not need this tray to print. ● X = 1: Tray 1 ● X = 2: Tray 2 ● X = 3: Tray 3 ● X = 4: Tray 4 ● X = 5: Tray 5 Sleep mode on 525 Recommended action ■ Refill the tray at a convenient time. NOTE: This could be a false message. If the tray is loaded without removing the shipping lock, the printer does not sense that the paper is loaded. Remove the shipping lock, and then load the tray. Tray 2 empty: [Type], [Size] Tray 2 is empty and the current job does not need this tray to print. Recommended action 1. Check the tray, and refill it if it is empty. 2. If the error persists, unplug the printer cord and rotate the printer so that the rear door of the printer is in front of you. 3. Raise the primary transfer assembly. Figure 7-5 Raise the transfer assembly 4. Open the rear door to check the feed rollers. 526 Chapter 7 Alphabetical control panel messages a. Pull the green tab located on the upper left-hand side to open the lower-access cover. Figure 7-6 Open the jam access door b. Check the rollers to ensure that they are installed correctly. ● If the flap of the blue roller tab is down, the rollers are not installed correctly. NOTE: If the blue tab is DOWN, Tray 2 will not lift, and the control panel will indicate that Tray 2 is empty. ● If the flap of the blue roller tab is up, the rollers are installed correctly. 5. If the error persists, contact customer support. Tray <X> lifting The printer is in the process of lifting paper in the indicated tray. ● X = 2: Tray 2 ● X = 3: Tray 3 ● X = 4: Tray 4 ● X = 5: Tray 5 Recommended action ■ No action necessary. Tray <X> open The specified tray is open or not closed completely. ● X = 2: Tray 2 ● X = 3: Tray 3 Tray <X> lifting 527 ● X = 4: Tray 4 ● X = 5: Tray 5 Recommended action 1. Close the tray. 2. If this message displays after the lifter drive assembly was removed or replaced, make sure that the connector of the assembly is connected correctly and fully seated. 3. If the error persists, use the Media size switches test in the Tray/Bin manual sensor test to test the switches. If they do not respond, replace associated the lifter drive assembly. 4. If the switches do not respond, replace the associated lifter drive assembly. Tray <X> [type] [size] The paper in the specified tray is detected as the specified size and type. The custom switch was not changed. Recommended action ■ If the paper is a custom size or type, change the custom-size switch on the tray as necessary. Tray 2 overfilled or roller issue The upper pick roller is not seated correctly or the paper sensor is missing, damaged, or dislodged. The error message displays the following message on the printer control panel Check that the tray is not loaded above the fill lines. Remove any excess paper. If a new pickup roller was recently installed, check to see that the parts are firmly seated, and the access latch is closed.', 
        '["Pull out tray 2 completely out of the printer to remove it.", "Check if the paper sensor flag located inside tray 2 next to the roller is missing, damaged, or dislodged.", "Ensure that the stack of paper in the tray is not above the fill mark (line below the three triangles) as", "Make sure to remove any excess pages from the tray.", "Check if the rollers are installed correctly."]'::jsonb, '[]'::jsonb, 
        'customers', 536, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.B9.FF', 'Atasco de papel', 'Papel atascado o bloqueo en la ruta de papel, posiblemente en el fusor, rodillos de presión o entrega.', 
        '["Abre la puerta derecha y retira cualquier papel o obstrucción en la ruta", "Inspecciona el fusor, rodillo de presión y rodillo de entrega para detectar bloqueos o daños", "Prueba el sensor del fusor (PS4650) mediante diagnóstico manual en Support Tools > Troubleshooting > Diagnostic Tests > Manual Sensor Test", "Verifica los conectores J401 y J402 en el controlador DC", "Reemplaza el fusor si el sensor no funciona correctamente"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6763-000CN", "description": "Ensamble del motor de accionamiento del fusor"}]'::jsonb, 
        'customers', 133, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.80.D1', 'Atasco de papel en grapadora/apilador', 'Papel atascado o bloqueo en el dispositivo de salida de la grapadora/apilador, posiblemente en rodillos o sensores.', 
        '["Abre la puerta derecha del dispositivo de salida y retira todo el papel", "Verifica que no haya residuos del atasco anterior en el fusor y rodillos de entrada/salida", "Confirma que los rodillos del depósito de salida estén girando correctamente", "Revisa el registro de eventos para detectar otros errores de atasco", "Reemplaza el microinterruptor de la grapadora/apilador si el error persiste"]'::jsonb, '[{"part_number": "WC4-5171-000CN", "description": "Microinterruptor (grapadora/apilador)"}]'::jsonb, 
        'customers', 155, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '13.80.D2', 'Atasco de papel con retraso en grapadora/apilador', 'El papel no alcanzó el sensor de entrada del apilador en el tiempo designado, posiblemente debido a bloqueo en la ruta de alimentación inferior.', 
        '["Abre la puerta derecha del dispositivo de salida, retira el papel y ciérrala", "Abre la puerta derecha de la impresora, retira el fusor con cuidado y verifica bloqueos de papel", "Reinstala el fusor y cierra la puerta", "Revisa el registro de eventos para otros errores relacionados", "Reemplaza el ensamble de alimentación de papel inferior si el error persiste"]'::jsonb, '[{"part_number": "RM2-1071-000CN", "description": "Ensamble de alimentación de papel inferior"}]'::jsonb, 
        'customers', 175, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.01.14', 'Error de EEPROM del sistema de escaneo', 'Fallo en la memoria EEPROM de la placa de control del escáner (SCB), impidiendo la comunicación correcta.', 
        '["Apaga la impresora y vuelve a encenderla", "Revisa el registro de eventos para otros errores del escáner", "Desconecta y reconecta los conectores de cable plano (FFC) en la SCB prestando atención a los conectores ZIF", "Ejecuta diagnósticos de componentes desde Support Tools > Troubleshooting > Diagnostic Tests", "Reemplaza la placa de control del escáner si el error persiste"]'::jsonb, '[{"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 183, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.01.43', 'Fallo de memoria del SCB', 'Error de memoria en la placa de control del escáner (SCB), posiblemente por fallo de conexión o corrupción de datos.', 
        '["Apaga la impresora y vuelve a encenderla", "Verifica que todos los conectores en la SCB estén correctamente asientos", "Desconecta y reconecta los cables de alimentación y HDMI en la SCB", "Ejecuta diagnósticos desde Support Tools para verificar conexiones", "Reemplaza la placa de control del escáner si el error persiste"]'::jsonb, '[{"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 191, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.01.46', 'Error de firmware del escáner', 'Fallo en el firmware de la placa de control del escáner (SCB) o corrupción de datos durante la carga.', 
        '["Apaga la impresora y vuelve a encenderla", "Actualiza el firmware a la última versión disponible desde HP Customer Support", "Revisa el registro de eventos para otros errores del escáner", "Verifica conexiones de cables en la SCB incluyendo el HDMI", "Reemplaza la placa de control del escáner (SCB) si el error persiste"]'::jsonb, '[{"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 201, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.03.22', 'Fallo del escáner', 'El cabezal de escaneo no se actuata correctamente o hay fallo en los sensores ópticos de escaneo.', 
        '["Apaga la impresora y vuelve a encenderla", "Limpia el cristal del escáner, las tiras del alimentador de documentos y el respaldo de plástico blanco", "Actualiza el firmware a la última versión", "Desconecta y reconecta todos los conectores FFC en la SCB (puertas ZIF)", "Ejecuta la prueba de escaneo continuo (Continuous Scan) en Support Tools para verificar el movimiento del cabezal"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 205, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.03.23', 'Fallo del escáner', 'Fallo en la óptica de escaneo, sensor o motor del cabezal de escaneo.', 
        '["Apaga la impresora y vuelve a encenderla", "Actualiza el firmware a la última versión disponible", "Revisa el registro de eventos para otros errores del escáner", "Desconecta y reconecta los conectores FFC en la SCB usando técnica ZIF", "Ejecuta la prueba de escaneo continuo para verificar que el cabezal se actuate correctamente"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 209, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.03.30', 'Fallo del escáner', 'Fallo en los componentes del escáner de imagen o pérdida de comunicación con la placa de control.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta y reconecta todos los cables en la SCB incluyendo cables planos (FFC) y HDMI", "Ejecuta la prueba de escaneo continuo desde Support Tools > Troubleshooting > Diagnostic Tests", "Verifica que el cabezal de escaneo se mueva desde la posición de inicio a través del escaneo y regrese", "Reemplaza el ensamble del escáner de imagen si el cabezal no se actuata"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 213, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.03.45', 'Error del escáner - apagar y encender', 'Error en los sensores ópticos o en la comunicación del cabezal de escaneo con la placa de control.', 
        '["Apaga la impresora y vuelve a encenderla", "Actualiza el firmware a la última versión disponible", "Revisa el registro de eventos para otros errores del escáner y resuélvelos", "Desconecta y reconecta conectores FFC en la SCB (ZIF) y verifica funcionalidad", "Ejecuta la prueba de escaneo continuo para verificar el movimiento del cabezal de escaneo"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}]'::jsonb, 
        'customers', 217, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '30.04.01', 'Cable del sensor de cristal plano no detectado', 'El cable del sensor de cristal plano (flatbed) no está conectado o está desconectado en la placa de control del escáner.', 
        '["Apaga la impresora y vuelve a encenderla", "Apaga la impresora nuevamente", "Desconecta y reconecta el cable MOT/SNS (sensor de cristal plano) en la SCB etiquetado como callout 1", "Reinicia la impresora y verifica funcionalidad", "Reemplaza el ensamble del escáner de imagen si el error persiste"]'::jsonb, '[{"part_number": "J8J64-67901", "description": "Ensamble del escáner de imagen (incluye respaldo blanco y clips de retención)"}, {"part_number": "5851-7764", "description": "Placa de control del escáner (SCB) Enterprise"}, {"part_number": "5851-7347", "description": "Placa de control del escáner (SCB) Flow series"}]'::jsonb, 
        'customers', 247, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '31.03.33', 'Área de calibración del escáner de reverso sucio', 'La franja blanca en el cristal del platen o cristal del lado 2 del alimentador está sucia, afectando la calibración del escáner.', 
        '["Limpia la franja blanca en el cristal del platen y en el cristal del lado 2 del alimentador de documentos", "Apaga la impresora y vuelve a encenderla", "Verifica que el papel utilizado cumpla con las especificaciones de HP", "Confirma que la bandeja de entrada no esté sobrecargada y que las guías estén ajustadas correctamente", "Reemplaza el ensamble del alimentador de documentos si el error persiste"]'::jsonb, '[{"part_number": "5851-7203", "description": "Kit del alimentador de documentos"}, {"part_number": "5851-7204", "description": "Kit del alimentador de documentos FLOW Models"}]'::jsonb, 
        'customers', 335, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '41.01.YZ', 'Error del ensamble del escáner láser', 'Fallo en el ensamble del escáner láser o pérdida de conexión del arnés de cableado con el controlador DC.', 
        '["Toca OK para limpiar el error", "Apaga la impresora y vuelve a encenderla", "Verifica que el arnés de cableado del escáner láser al controlador DC esté correctamente asentado", "Reemplaza el ensamble del escáner láser si el error persiste", "Reemplaza el controlador DC PCA si el error continúa después de cambiar el escáner"]'::jsonb, '[{"part_number": "RM2-0906-000CN", "description": "Ensamble del escáner láser"}, {"part_number": "RM2-9493-000CN", "description": "Placa de circuito del controlador DC (M631/M632/M633/E62555/E62565/E62575)"}, {"part_number": "RM3-8458-000CN", "description": "Placa de circuito del controlador DC (M634/M635/M636/M637)"}, {"part_number": "RM3-7621-000CN", "description": "Placa de circuito del controlador DC (E62655/E62665/E62675)"}]'::jsonb, 
        'customers', 373, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.2X.YZ', 'Error de calentamiento del fusor', 'El fusor no alcanza la temperatura de funcionamiento correcta, posiblemente por problemas de alimentación eléctrica.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de cualquier regleta de enchufes o UPS y conecta directamente a una toma de corriente de pared", "Verifica que el voltaje de la salida coincida con la especificación de la impresora", "Verifica que el tipo y configuración de papel sean correctos", "Reemplaza el fusor o la fuente de alimentación de bajo voltaje si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}]'::jsonb, 
        'customers', 376, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.3X.YZ', 'Temperatura alta del fusor', 'El fusor excede la temperatura máxima de funcionamiento, posiblemente por falla del sensor, fuente de alimentación o problemas eléctricos.', 
        '["Apaga la impresora", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Verifica conexiones del fusor y reemplázalo si el conector está dañado", "Verifica conexiones J401 y J402 en el controlador DC PCA", "Reemplaza la fuente de alimentación de bajo voltaje (LVPS) si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6797-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 110V"}, {"part_number": "RM2-6798-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 220V"}]'::jsonb, 
        'customers', 379, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.4X.YZ', 'Fallo del circuito de accionamiento', 'Fallo en el circuito de control de potencia del fusor, posiblemente por problemas de alimentación eléctrica o componentes dañados.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de cualquier regleta de enchufes y conecta directamente a una toma de corriente de pared", "Verifica que el voltaje de la salida coincida con la especificación de la impresora", "Verifica que el tipo y configuración de papel sean correctos", "Reemplaza la fuente de alimentación de bajo voltaje si el error persiste"]'::jsonb, '[]'::jsonb, 
        'customers', 388, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.8X.YZ', 'Temperatura baja del fusor 2', 'El fusor no mantiene la temperatura mínima requerida, posiblemente por falla del sensor, conexión suelta o fuente de alimentación deficiente.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared con circuito dedicado", "Verifica que la fuente de alimentación cumpla con requisitos de frecuencia (43-67Hz)", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Verifica conexiones J401 y J402 en el controlador DC"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6797-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 110V"}, {"part_number": "RM2-6798-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 220V"}]'::jsonb, 
        'customers', 390, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.9X.YZ', 'Temperatura alta del fusor 2', 'El fusor excede la temperatura máxima, posiblemente por falla del sensor, control de potencia defectuoso o problemas de alimentación eléctrica.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared con circuito dedicado", "Verifica que la fuente de alimentación cumpla con requisitos (43-67Hz)", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Reemplaza el fusor y verifica conexiones J401 y J402"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}, {"part_number": "RM2-6797-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 110V"}, {"part_number": "RM2-6798-000CN", "description": "Fuente de alimentación de bajo voltaje (LVPS) 220V"}]'::jsonb, 
        'customers', 393, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.AX.YZ', 'Temperatura baja del fusor 3', 'El fusor no alcanza la temperatura mínima de funcionamiento, posiblemente por falla del sensor o problemas con la fuente de alimentación.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared con circuito dedicado", "Verifica que el voltaje y la frecuencia sean correctos (43-67Hz)", "Retira y reinstala el fusor asegurándote de que esté bien asentado", "Reemplaza la fuente de alimentación de bajo voltaje si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}]'::jsonb, 
        'customers', 395, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '50.BX.YZ', 'Temperatura alta del fusor 3', 'El fusor excede la temperatura máxima de funcionamiento, posiblemente por falla del sensor o control defectuoso.', 
        '["Apaga la impresora y vuelve a encenderla", "Desconecta de regletas y conecta directamente a una toma de pared", "Verifica que el voltaje de salida coincida con la especificación de la impresora", "Verifica que el tipo y configuración de papel sean correctos", "Reemplaza el fusor si el error persiste"]'::jsonb, '[{"part_number": "RM2-1256-000CN", "description": "Fusor 110V"}, {"part_number": "RM2-1257-000CN", "description": "Fusor 220V"}]'::jsonb, 
        'customers', 416, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '57.00.03', 'Fallo del ventilador', 'El ventilador de dúplex FM2 no funciona correctamente, posiblemente por desconexión de cables, tornillo suelto o falla del componente.', 
        '["Apaga la impresora, espera 10 segundos y vuelve a encenderla", "Aprieta el tornillo en el ensamble de guía de alimentación de papel superior", "Desconecta y reconecta el conector J13L en el ensamble de puerta y J13 en el controlador DC PCA", "Reemplaza el ventilador FM2 si el error persiste después de apretar el tornillo", "Reemplaza el controlador DC si el error continúa después del cambio del ventilador"]'::jsonb, '[{"part_number": "RK2-8948-000CN", "description": "Ventilador 2 (FM2)"}, {"part_number": "RM2-9493-000CN", "description": "Controlador DC (M631, M632, M633, E62555, E62565, E62575)"}, {"part_number": "RM3-7621-000CN", "description": "Controlador DC (E62655, E62665, E62675)"}, {"part_number": "RM3-8458-000CN", "description": "Controlador DC (M634, M635, M636, M637)"}]'::jsonb, 
        'customers', 418, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '57.00.04', 'Fallo del ventilador del escáner', 'El ventilador FM1 del escáner ha fallado o perdido contacto en sus conectores, impidiendo la refrigeración del módulo de escaneo.', 
        '["Apagar y encender la impresora", "Desconectar y reconectar el conector J6402 en el ventilador del escáner", "Desconectar y reconectar el conector J211 en la PCA del controlador DC", "Reemplazar el ventilador del escáner FM1 si el error persiste"]'::jsonb, '[{"part_number": "RK2-8946-000CN", "description": "Ventilador del escáner FM1"}]'::jsonb, 
        'customers', 420, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '58.00.02', 'Fallo del sensor ambiental', 'El sensor ambiental ha fallado o sus conexiones están sueltas, lo que afecta la detección de condiciones ambientales o está causado por problemas de calidad de alimentación eléctrica.', 
        '["Apagar y encender la impresora", "Verificar que el conector J4200 del sensor ambiental esté correctamente asiento y sin daños", "Verificar que el conector J16 en la PCA del controlador DC esté correctamente asiento", "Reemplazar el sensor ambiental si el error persiste"]'::jsonb, '[{"part_number": "RM2-9037-000CN", "description": "Sensor ambiental"}]'::jsonb, 
        'customers', 421, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '58.00.03', 'Fallo del controlador DC', 'La PCA del controlador DC ha fallado o sus conexiones están sueltas, impidiendo la comunicación y el control del sistema.', 
        '["Apagar y encender la impresora", "Desconectar y reconectar todos los cables en la PCA del controlador DC", "Verificar que las conexiones no estén dañadas y estén correctamente asiento", "Reemplazar la PCA del controlador DC si el error persiste"]'::jsonb, '[{"part_number": "RM2-9493-000CN", "description": "PCA del controlador DC para M631/M632/M633/E62555/E62565/E62575"}, {"part_number": "RM3-8458-000CN", "description": "Controlador DC para M634/M635/M636/M637"}, {"part_number": "RM3-7621-000CN", "description": "PCA del controlador DC para E62655/E62665/E62675"}]'::jsonb, 
        'customers', 444, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

INSERT INTO error_solutions
    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)
VALUES ('66446748-8412-44f7-96dd-b51b5067df16', '66.00.0A', 'Fallo del accesorio de salida', 'Error de timeout en el control del accesorio de salida, indicando que la PCA del controlador del accesorio de salida no responde en el tiempo esperado.', 
        '["Apagar y encender la impresora", "Verificar que no haya atascos de papel u obstrucciones en el dispositivo de salida", "Reemplazar la PCA del controlador del accesorio de salida si el error persiste"]'::jsonb, '[{"part_number": "RM2-8847-000CN", "description": "PCA del controlador del accesorio de salida"}, {"part_number": "RM2-1066-000CN", "description": "Conjunto de alimentador de grapas (jogger)"}, {"part_number": "RM2-1067-000CN", "description": "Conjunto alimentador superior"}, {"part_number": "RK2-8148-000CN", "description": "Grapadora"}]'::jsonb, 
        'customers', 448, 'f6b775cf712a0342e73db268ea64762171910cf92d0e056f4ccd7d1b9c0eccb4')
ON CONFLICT (model_id, code) DO UPDATE SET
    title             = EXCLUDED.title,
    cause             = EXCLUDED.cause,
    technician_steps  = EXCLUDED.technician_steps,
    frus              = EXCLUDED.frus,
    source_audience   = EXCLUDED.source_audience,
    source_page       = EXCLUDED.source_page,
    cpmd_hash         = EXCLUDED.cpmd_hash;

COMMIT;