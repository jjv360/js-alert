//
// Main class for the JSAlert package

import Queue from './queue.js'
import EventSource from './event-source.js'

export default class JSAlert extends EventSource {
	
	/** @static Creates and shows a new alert with the specified text */
	static alert(text, title, closeText = "Close") {
		
		// Check if not in a browser
		if (typeof window === "undefined")
			return Promise.resolve(console.log("Alert: " + text));
		
		// Create alert
		var alert = new JSAlert(text, title);
		alert.addButton(closeText, null);
		
		// Show it
		return alert.show();
		
	}
	
	/** @static Creates and shows a new confirm alert with the specified text */
	static confirm(text, title, acceptText = "OK", rejectText = "Cancel") {
		
		// Check if not in a browser
		if (typeof window === "undefined")
			return Promise.resolve(console.log("Alert: " + text));
		
		// Create alert
		var alert = new JSAlert(text, title);
		alert.addButton(acceptText, true);
		alert.addButton(rejectText, false);
		
		// Show it
		return alert.show();
		
	}
	
	/** Constructor */
	constructor(text = "", title = "") {
		super();
		
		// Setup vars
		this.elems 		= {};
		this.title		= title;
		this.text		= text;
		this.buttons	= [];
		this.result		= false;
		
	}
	
	
	/** Adds a button. Returns a Promise that is called if the button is clicked. */
	addButton(text, value, type) {
		
		// Return promise
		return new Promise((onSuccess, onFail) => {
			
			// Add button
			this.buttons.push({
				text: text,
				value: typeof value == "undefined" ? text : value,
				type: type || (this.buttons.length == 0 ? "default" : "normal"),
				callback: onSuccess
			});
			
		});
		
	}
	
	
	/** Shows the alert. */
	show() {
		
		// TODO: Check which queue to use
		var queue = JSAlert.popupQueue;
		
		// Add to show queue
		queue.add(this).then(() => {
			
			// Add close listener, to remove us from the queue
			this.when("closed").then(() => {
				queue.remove(this);
			});
			
			// Show us
			this._show();
			
		});
		
		// Return the alert
		return this;
		
	}
	
	
	/** A then function, to allow chaining with Promises */
	then(func) {
		return this.when("closed").then(func);
	}
	
	
	/** Dismisses the alert. */
	dismiss(result) {
		
		// Store result
		this.result = result;
		
		// Remove elements
		this.removeElements();
		
		// Trigger event
		this.emit("closed", result);
		return this;
		
	}
	
	
	/** Dismisses the alert some time in the future */
	dismissIn(time) {
		
		setTimeout(this.dismiss.bind(this), time);
		return this;
	
	}
	
	
	/** @private Called to actually show the alert. */
	_show() {
		
		// Create elements
		this.createBackground();
		this.createPopup();
		
	}
	
	
	/** @private Called to create the overlay element. Theme subclasses can override this. */
	createBackground() {
		
		// Create element
		this.elems.background = document.createElement("div");
		this.elems.background.style.cssText = "position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 10000; background-color: rgba(0, 0, 0, 0.1); opacity: 0; transition: opacity 0.15s; ";
		
		// Add to document
		document.body.appendChild(this.elems.background);
		
		// Do animation
		setTimeout(() => {
			this.elems.background.style.opacity = 1;
		});
		
	}
	
	
	/** @private Called to create the popup element. Theme subclasses can override this. */
	createPopup() {
		
		// Create container element
		this.elems.container = document.createElement("div");
		this.elems.container.style.cssText = "position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 10001; display: flex; justify-content: center; align-items: center; opacity: 0; transform: translateY(-40px); transition: opacity 0.15s, transform 0.15s; ";
		document.body.appendChild(this.elems.container);
		
		// Do animation
		setTimeout(() => {
			this.elems.container.style.opacity = 1;
			this.elems.container.style.transform = "translateY(0px)";
		});
		
		// Add dismiss handler
		this.addTouchHandler(this.elems.container, () => this.dismiss() );
		
		// Create window
		this.elems.window = document.createElement("div");
		this.elems.window.style.cssText = "position: relative; background-color: rgba(255, 255, 255, 0.95); box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25); border-radius: 5px; padding: 10px; min-width: 50px; min-height: 10px; max-width: 50%; max-height: 90%; ";
		this.elems.container.appendChild(this.elems.window);
		
		// Create title if there is one
		if (this.title) {
			
			this.elems.title = document.createElement("div");
			this.elems.title.style.cssText = "display: block; text-align: center; font-family: Helvetica, Arial; font-size: 17px; font-weight: bold; color: #000; cursor: default; padding: 2px 20px; ";
			this.elems.title.innerHTML = this.title;
			this.elems.window.appendChild(this.elems.title);
			
		}
		
		// Create text if there is one
		if (this.text) {
			
			this.elems.text = document.createElement("div");
			this.elems.text.style.cssText = "display: block; text-align: center; font-family: Helvetica, Arial; font-size: 15px; font-weight: normal; color: #000; cursor: default; padding: 2px 20px; ";
			this.elems.text.innerHTML = this.text;
			this.elems.window.appendChild(this.elems.text);
			
		}
		
		// Create buttons if there is one
		if (this.buttons.length > 0) {
			
			this.elems.buttons = document.createElement("div");
			this.elems.buttons.style.cssText = "display: block; display: flex; justify-content: space-around; align-items: center; text-align: right; border-top: 1px solid #EEE; margin-top: 10px; ";
			this.elems.window.appendChild(this.elems.buttons);
			
			// Add each button
			this.buttons.forEach((b) => {
				
				var btn = document.createElement("div");
				btn.style.cssText = "display: inline-block; font-family: Helvetica, Arial; font-size: 15px; font-weight: 200; color: #08F; padding: 10px 20px; padding-bottom: 0px; cursor: pointer; ";
				btn.innerText = b.text;
				this.elems.buttons.appendChild(btn);
				
				// Add button handler
				this.addTouchHandler(btn, () => {
					b.callback && b.callback(b.value);
					this.dismiss(b.value);
				});
				
			});
			
		}
		
	}
	
	
	/** @private Called to remove all elements from the screen */
	removeElements() {
		
		// Animate background away
		this.elems.background.style.opacity = 0;
		this.elems.container.style.opacity = 0;
		this.elems.container.style.transform = "translateY(40px)";
		
		// Remove elements after animation
		setTimeout(() => {
			this.removeElement(this.elems.background);
			this.removeElement(this.elems.container);
		}, 250);
		
	}
	
	/** @private Helper function to remove an element */
	removeElement(elem) {
		elem && elem.parentNode && elem.parentNode.removeChild(elem);
	}
	
	/** @private Helper function to add a click or touch event handler that doesn't bubble */
	addTouchHandler(elem, callback) {
		
		// Create handler
		var handler = (e) => {
			
			// Stop default browser action
			e.preventDefault();
			
			// Check if our element was pressed, not a child element
			if (e.target != elem)
				return;
			
			// Trigger callback
			callback();
		}
		
		// Add listeners
		this.elems.container.addEventListener("mousedown", handler, true);
		this.elems.container.addEventListener("touchstart", handler, true);
		
	}
	
}


	
// The default popup queue
JSAlert.popupQueue = new Queue();

// The toast queue
JSAlert.toastQueue = new Queue();


// In case anyone wants to use the classes of this project on their own...
JSAlert.Queue = Queue;
JSAlert.EventSource = EventSource;