//
// Main class for the JSAlert package

import Queue from './queue.js'
import EventSource from './event-source.js'
import PkgInfo from '../package.json'
import sanitize from 'light-sanitize-html'

export default class JSAlert extends EventSource {

	/** Library version */
	static get version() {
		return PkgInfo.version
	}
	
	/** @static Creates and shows a new alert with the specified text */
	static alert(text, title, icon, closeText = "Close") {
		
		// Check if not in a browser
		if (typeof window === "undefined")
			return Promise.resolve(console.log("Alert: " + text));
		
		// Create alert
		var alert = new JSAlert(text, title);
		alert.addButton(closeText, null);
		
		// Set icon
		if (icon !== false)
			alert.setIcon(icon || JSAlert.Icons.Information);
		
		// Show it
		return alert.show();
		
	}
	
	/** @static Creates and shows a new confirm alert with the specified text */
	static confirm(text, title, icon, acceptText = "OK", rejectText = "Cancel") {
		
		// Check if not in a browser
		if (typeof window === "undefined")
			return Promise.resolve(console.log("Alert: " + text));
		
		// Create alert
		var alert = new JSAlert(text, title);
		alert.addButton(acceptText, true);
		alert.addButton(rejectText, false);
		
		// Set icon
		if (icon !== false)
			alert.setIcon(icon || JSAlert.Icons.Question);
		
		// Show it
		return alert.show();
		
	}
	
	/** @static Creates and shows a new prompt, an alert with a single text field. */
	static prompt(text, defaultText, placeholderText, title, icon, acceptText = "OK", rejectText = "Cancel") {
		
		// Check if not in a browser
		if (typeof window === "undefined")
			return Promise.resolve(console.log("Alert: " + text));
		
		// Create alert
		var alert = new JSAlert(text, title);
		alert.addButton(acceptText, true, "default");
		alert.addButton(rejectText, false, "cancel");
		
		// Set icon
		if (icon !== false)
			alert.setIcon(icon || JSAlert.Icons.Question);
		
		// Add text field
		alert.addTextField(defaultText, null, placeholderText);
		
		// Show it
		return alert.show().then((result) => {
			
			// Check if cancelled
			if (alert.cancelled)
				return null;
			else
				return alert.getTextFieldValue(0);
			
		});
		
	}
	
	/** @static Creates and shows a loader, which is just an alert with no buttons. */
	static loader(text, cancelable) {
		
		// Check if not in a browser
		if (typeof window === "undefined")
			return Promise.resolve(console.log("Loading: " + text));
		
		// Create alert
		var alert = new JSAlert(text);
		alert.cancelable = cancelable;
		
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
		this.textFields	= [];
		this.result		= false;
		this.iconURL	= null;
		this.cancelable = true;
		this.cancelled	= false;
		this.dismissed	= false;
		
	}
	
	
	/** Sets an icon for the alert. `icon` is either a URL or one of `JSAlert.Icons`. */
	setIcon(icon) {
		this.iconURL = icon;
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
	
	
	/** Adds a text field. Returns a Promise that will be called when the dialog is dismissed, but not cancelled. */
	addTextField(value, type, placeholderText)  {
		
		// Add text field
		this.textFields.push({
			value: value || "",
			type: type || "text",
			placeholder: placeholderText || ""
		});
		
	}
	
	
	/** Gets a text field's value */
	getTextFieldValue(index) {
		
		// Get text field info
		var info = this.textFields[index];
		
		// Return the value
		return (info.elem ? info.elem.value : info.value);
		
	}
	
	
	/** Shows the alert. */
	show() {
		
		// Add to the queue
		JSAlert.popupQueue.add(this).then(() => {
			
			// Show us
			this._show();
			
			// Notify that we have been shown
			this.emit("opened");
			
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
		
		// Do nothing if dismissed already
		if (this.dismissed) return;
		this.dismissed = true;
		
		// Remove us from the queue
		JSAlert.popupQueue.remove(this);
		
		// Store result
		this.result = result;
		if (typeof result == "undefined")
			this.cancelled = true;
		
		// Remove elements
		this.removeElements();
		
		// Remove global keyboard listener
		window.removeEventListener("keydown", this);
		
		// Trigger cancel-specific event
		if (this.cancelled)
			this.emit("cancelled", this.result);
		else
			this.emit("complete", this.result);
		
		// Trigger closed event
		this.emit("closed", this.result);
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
		
		// Add global keyboard listener
		window.addEventListener("keydown", this);
		
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
			this.elems.background.offsetWidth;
			this.elems.background.style.opacity = 1;
		}, 0);
		
	}
	
	
	/** @private Called to create the popup element. Theme subclasses can override this. */
	createPopup() {
		
		// Create container element
		this.elems.container = document.createElement("div");
		this.elems.container.focusable = true;
		this.elems.container.style.cssText = "position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 10001; display: flex; justify-content: center; align-items: center; opacity: 0; transform: translateY(-40px); transition: opacity 0.15s, transform 0.15s; ";
		document.body.appendChild(this.elems.container);
		
		// Do animation
		setTimeout(() => {
			this.elems.container.offsetWidth;
			this.elems.container.style.opacity = 1;
			this.elems.container.style.transform = "translateY(0px)";
		}, 0);
		
		// Add dismiss handler
		this.addTouchHandler(this.elems.container, () => {
			
			// Check if cancelable
			if (!this.cancelable)
				return;
			
			// Dismiss
			this.cancelled = true;
			this.dismiss();
			
		});
		
		// Create window
		this.elems.window = document.createElement("div");
		this.elems.window.style.cssText = "position: relative; background-color: rgba(255, 255, 255, 0.95); box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.25); border-radius: 5px; padding: 10px; min-width: 50px; min-height: 10px; max-width: 50%; max-height: 90%; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); ";
		this.elems.container.appendChild(this.elems.window);
		
		// Create icon if there is one
		if (this.iconURL) {
			
			this.elems.icon = document.createElement("img");
			this.elems.icon.style.cssText = "display: block; margin: auto; max-height: 40px; text-align: center; font-family: Helvetica, Arial; font-size: 17px; font-weight: bold; color: #000; cursor: default; padding: 10px 0px; ";
			this.elems.icon.src = this.iconURL;
			this.elems.window.appendChild(this.elems.icon);
			
		}
		
		// Create title if there is one
		if (this.title) {
			
			this.elems.title = document.createElement("div");
			this.elems.title.style.cssText = "display: block; text-align: center; font-family: Helvetica, Arial; font-size: 17px; font-weight: bold; color: #000; cursor: default; padding: 2px 20px; ";
			this.elems.title.innerHTML = sanitize(this.title)
			this.elems.window.appendChild(this.elems.title);
			
		}
		
		// Create text if there is one
		if (this.text) {
			
			this.elems.text = document.createElement("div");
			this.elems.text.style.cssText = "display: block; text-align: center; font-family: Helvetica, Arial; font-size: 15px; font-weight: normal; color: #000; cursor: default; padding: 2px 20px; ";
			this.elems.text.innerHTML = sanitize(this.text)
			this.elems.window.appendChild(this.elems.text);
			
		}
		
		// Create text fields if there are any
		if (this.textFields.length > 0) {
			
			this.elems.textFields = document.createElement("div");
			this.elems.textFields.style.cssText = "display: block; ";
			this.elems.window.appendChild(this.elems.textFields);
			
			// Add each text field
			this.textFields.forEach((b, idx) => {
				
				b.elem = document.createElement("input");
				b.elem.style.cssText = "display: block; width: 90%; min-width: 250px; padding: 5px 0px; margin: 10px auto; background-color: #FFF; border: 1px solid #EEE; border-radius: 5px; text-align: center; font-family: Helvetica, Arial; font-size: 15px; color: #222; ";
				b.elem.value = b.value;
				b.elem.placeholder = b.placeholder;
				b.elem.type = b.type;
				this.elems.textFields.appendChild(b.elem);
				
				// Add keyboard listener
				b.elem.addEventListener("keypress", (e) => {
					
					// Ignore if not enter
					if (e.keyCode != 13)
						return;
					
					// Check if this is the last input field
					if (idx+1 >= this.textFields.length) {
						
						// Done
						this.dismiss("enter-pressed");
						
					} else {
						
						// Just select the next field
						this.textFields[idx+1].elem.focus();
						
					}
					
				});
				
			});
			
			// Focus on first field
			this.textFields[0].elem.focus();
			
		}
		
		// Create buttons if there are any
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
					if (b.type == "cancel") this.cancelled = true;
					this.dismiss(b.value);
				});
				
			});
			
		}
		
	}
	
	
	/** @private Called to remove all elements from the screen */
	removeElements() {
		
		// Don't do anything if not loaded
		if (!this.elems || !this.elems.container)
			return;
		
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
			
			// Stop default browser action, unless this is an input field
			if (e.target.nodeName.toLowerCase() != "input")
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
	
	/** @private Called by the browser when a keyboard event is fired on the whole window */
	handleEvent(e) {
		
		// Check if enter was pressed
		if (e.keyCode == 13) {
			
			// Find the first default button and use that value instead
			for (var i = 0 ; i < this.buttons.length ; i++) {
				if (this.buttons[i].type == "default") {
					
					// Use this button's value
					this.dismiss(this.buttons[i].value);
					e.preventDefault();
					
					// Trigger the button's callback
					this.buttons[i].callback && this.buttons[i].callback(this.result);
					return;
					
				}
			}
			
			// No default button found, cancel
			this.cancelled = true;
			this.dismiss();
			return;
			
		}
		
		// Check if escape was pressed
		if (e.keyCode == 27) {
			
			// Check if cancelable
			if (!this.cancelable)
				return;
			
			// Find the first default button and use that value instead
			this.cancelled = true;
			this.result = null;
			for (var i = 0 ; i < this.buttons.length ; i++) {
				if (this.buttons[i].type == "cancel") {
					
					// Use this button's value
					this.dismiss(this.buttons[i].value);
					e.preventDefault();
					
					// Trigger the button's callback
					this.buttons[i].callback && this.buttons[i].callback(this.result);
					return;
					
				}
			}
			
			// No cancel button found, just cancel
			this.cancelled = true;
			this.dismiss();
			return;
			
		}
		
	}
	
}



// Include theme's icons
import icons from "./icons.js";
JSAlert.Icons = icons;


	
// The default popup queue
JSAlert.popupQueue = new Queue();


// In case anyone wants to use the classes of this project on their own...
JSAlert.Queue = Queue;
JSAlert.EventSource = EventSource;