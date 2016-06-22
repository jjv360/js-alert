//
// Queue class - A queue contains a list of items. Only one item can be active
// at a time, and when one is removed the next one is activated
//
// To use this class, first add() your item. A promise will be returned that gets resolved
// when your item is ready to be activated. Once your item is finished doing what it needs
// to do, remove() it. This will trigger the next item's promise.
//
//	Example:
//
//		var queue = new Queue();
//		
//		var msgbox = new Popup();
//		queue.add(msgbox).then(() => {
//			msgbox.show();
//			msgbox.when('closed').then(() => queue.remove(msgbox));
//		}
//		
//		var msgbox2 = new Popup();
//		queue.add(msgbox2).then(() => {
//			msgbox2.show();
//			msgbox2.when('closed').then(() => queue.remove(msgbox2));
//		}
//	
//
//	In the above example, only one message box would be visible at a time.
//

import EventSource from './event-source.js'


export default class Queue extends EventSource {
	
	constructor() {
		super();
		
		// Setup vars
		this.items 				= [];
		this.current			= null;
		
	}
	
	
	/** Adds a queue item, and returns a Promise. */
	add(item) {
		
		// Return a promise
		return new Promise((onSuccess, onFail) => {
			
			// Store item and handler at the end of the queue. When this item is ready to be activated, the handler will be called to resolve the promise.
			this.items.push({
				item: item,
				activateHandler: onSuccess
			});
			
			// Emit event
			this.emit("added", item);
			
			// Check if we can activate this one now
			setTimeout(this.checkActivated.bind(this), 1);
		
		});
		
	}
	
	
	/** @private Checks if there a new item to be activated */
	checkActivated() {
		
		// Check if there's already an activated item
		if (this.current)
			return;
		
		// Check if we have any items
		if (this.items.length == 0) {
			
			// No more items
			this.emit("empty");
			return;
			
		}
		
		// We can activate the next item now
		this.current = this.items[0];
		
		// Create promise resolve response. DO NOT directly pass a thenable, it won't work!
		var resp = {
			item: this.current.item
		}
		
		// Resolve promise
		this.current.activateHandler && this.current.activateHandler(resp);
		
		// Trigger event
		this.emit("activated", resp);
		
	}
	
	/** Removes a queued item. If the item is the currently activated one, the next item in the queue will be activated. */
	remove(item) {
		
		// Remove item from queue
		for (var i = 0 ; i < this.items.length ; i++)
			if (this.items[i].item == item)
				this.items.splice(i--, 1);
			
		// Emit event
		this.emit("removed", item);
			
		// Check if this was the current item
		if (this.current && this.current.item == item)
			this.current = null;
		
		// Possibly activate the next item
		setTimeout(this.checkActivated.bind(this), 1);
		
	}
	
}