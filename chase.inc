<?php 
/**
 * Page callback for /hello.
 */
function helloworld_page() {
	header('Content-Type: text/xml');
  print "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ord=\"http://orderUpdate.webservice.st.com/\">  <soapenv:Header/> <soapenv:Body>  <ord:orderStatusUpdate>  <ORDERS> <item>5000002</item></ORDERS></ord:orderStatusUpdate>  </soapenv:Body> </soapenv:Envelope>";
  drupal_exit();
}

function helloworld_other(){
	header('Content-Type: text/xml');
	print "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ord=\"http://order.webservice.st.com/\"><soapenv:Header/><soapenv:Body><ord:estoreOrderDetailsResponse><response><error_code>0</error_code><error_description>Ok</error_description></response></ord:estoreOrderDetailsResponse></soapenv:Body></soapenv:Envelope>";
	drupal_exit();
}

function helloworld_third(){

	header('Content-Type: text/xml');
	print "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:ord=\"http://orderUpdate.webservice.st.com/\"> <soapenv:Header/> <soapenv:Body> <ord:orderStatusUpdateResponse> <response> <error_code>0</error_code> <error_description>Ok</error_description> <orders> <orderId>12345</orderId> <status>ZACC</status> </orders> </response> </ord:orderStatusUpdateResponse> </soapenv:Body></soapenv:Envelope>";
	drupal_exit();
}

function helloworld_wsdl(){
	header('Content-Type: text/xml');
	print "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:sxd=\"http://employees.6dlabs.6dglobal.com/\"><soapenv:Header/><soapenv:Body> <sxd:employeesAvailableResponse><employeesAvailable><responseStatus>EMP_AVAILABLE</responseStatus><employees><availableEmployee><id>12345</id><lengthAvailable>P1Y</lengthAvailable><couldStartDate>1442255516</couldStartDate><remote>true</remote><companyEmployeeDeltaT>P3H</companyEmployeeDeltaT></availableEmployee></employees></employeesAvailable></sxd:employeesAvailableResponse></soapenv:Body></soapenv:Envelope>";
	drupal_exit();
}

function helloworld_wsdo(){
	header('Content-Type: text/xml');
	print "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:sxd=\"http://employees.6dlabs.6dglobal.com/\"><soapenv:Header/><soapenv:Body><sxd:employeeStatusResponse><employeeStatus><responseStatus>HIRED</responseStatus><employees><employeeId>12345</employeeId><status>HIRED</status><employeeId>22345</employeeId><status>NOT_HIRED</status><employeeId>32345</employeeId><status>PENDING</status></employees></employeeStatus></sxd:employeeStatusResponse></soapenv:Body></soapenv:Envelope>";
	drupal_exit();
}

function helloworld_stock(){
	drupal_add_http_header('Content-Type', 'text/html; charset=utf-8');
	$csv = array_map('str_getcsv', file('table.csv'));
	$x = count($csv);	
	$avgVolume = 0;
	$avgPrice = 0;
	echo "<html><head><title>hi</title><style> body { margin: 0; } canvas { width: 100%; height: 100%  </style></head><body>";
	echo "<script src='jquery-2.1.4.min.js'></script>";
	echo "<script src='three.min.js'></script>";	
	echo "<script src='Detector.js'></script>";
	echo "<script src='OrbitControls.js'></script>";
	echo "<script src='THREEx.FullScreen.js'></script>";
	echo "<script src='THREEx.KeyboardState.js'></script>";
	echo "<script src='THREEx.WindowResize.js'></script>";
	
	echo "<div id='3JS' style='z-index: 1; position: absolute; left:0px; top:0px'></div>";
	
	echo "<script> var stockData = []; var week;";
 
	for( $y = 1; $y <= $x; $y++){
		$current = $csv[$y];
		if($avgPrice == 0){
		    $avgPrice = $current[4];
		}else{
		    $avgPrice = ($avgPrice + $current[4]) /2;
		}
		$price_percent = -1 * ($avgPrice - $current[4]) / $avgPrice;
		$range_percent = ($current[2] - $current[3]) / ( ($current[1] + $current[4])/2 );
		if($avgVolume == 0){
			$avgVolume = $current[5];			
		}else{
			$avgVolume = ($avgVolume + $current[5]) / 2;
		}
		$volume_percent = -1 * ($avgVolume - $current[5]) / $avgVolume ;
		echo "week = {}; week.raw = []; week.price = $price_percent; week.range = $range_percent; week.volume = $volume_percent; week.raw[0] = {$current[0]}; week.raw[1] = {$current[1]}; week.raw[2] = {$current[2]}; week.raw[3] = {$current[3]}; week.raw[4] = {$current[4]}; week.raw[5] = {$current[5]};     stockData.push(week);";
	}
	echo "</script>";	
	
	echo "<script src='dat.gui.min.js'></script>";	
	echo "<script src ='stockgraph3d.js'></script>";
	
	//dom now has .dg .ac thing, correct z-index
	echo "<script> $(function(){ console.log('resetting'); $('.dg').css('z-index', 1); });</script>";
	
	
	echo "</body></html>";
	drupal_exit();
}
