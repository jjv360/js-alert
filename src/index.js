//
// Main class for the JSAlert package

export default class JSAlert {
	
	/** @static Creates and shows a new alert with the specified text */
	static alert(text, title, closeText = "Close") {
		
		// Check if not in a browser
		if (typeof window === "undefined")
			return Promise.resolve(console.log(text));
		
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