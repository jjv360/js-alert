//
// Main class for the JSAlert package

export default class JSAlert {
	
	/** @static Creates and shows a new alert with the specified text */
	static alert(text, title, closeText = "Close") {
		
		// Create alert
		var alert = new JSAlert();
		alert.text = text;
		
		window.alert(text);
		
		return alert.show();
		
	}
	
	
	/** Shows the alert. Returns a Promise which is resolved when the alert closes. */
	show() {
		
		return Promise.resolve(true);
		
	}
	
}