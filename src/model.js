
/** Throws Error(msg) if condition is false */
function assert(condition, msg) {
	if (condition == false) {
		throw Error(msg);
	}
}

/** Not reusable builder for AuctionListings */
class AuctionListingBuilder {
	constructor(date_scraped = new Date()) {
		this.listing = new AuctionListing();
		this.listing.date_scraped = date_scraped;
	}

	user(name, rating, times_rated, is_comercial) {
		assert(typeof name == 'string' && name.length > 0, 'Expected name to be a non empty string!');
		assert(typeof rating == 'number' && 0 <= rating <= 100, `Expected rating '${rating}' to be in [0, 100]!`);
		assert(typeof times_rated == 'number' && times_rated >= 0 && Number.isInteger(times_rated), `Expected times_rated '${times_rated}' to be non negative integer!`);
		assert(typeof is_comercial == 'boolean', 'Expected is_comercial to be a boolean!');
		this.listing.user_name = name;
		this.listing.user_rating = rating;
		this.listing.user_times_rated = times_rated;
		this.listing.user_is_comercial = is_comercial;
		return this;
	}

	auction(is_finished, price_current, price_delivery, auction_end, article_origin) {
		assert(typeof is_finished == 'boolean', `Expected '${is_finished}' to be a boolean!`);
		assert(typeof price_current == 'number' && price_current >= 0, 'Expected price_current to be a non negative number!');
		assert(typeof price_delivery == 'number' && (price_delivery >= 0 || Number.isNaN(price_delivery)), 'Expected price_delivery to be a non negative number or NaN!');
		assert(auction_end instanceof Date, 'Expected auction_end to be a Date');
		assert(typeof article_origin == 'string' && article_origin.length > 0, 'Expected article_origin to be a non empty string!');
		this.listing.is_finished = is_finished;
		this.listing.price_current = price_current;
		this.listing.price_delivery = price_delivery;
		this.listing.date_auction_end = auction_end;
		this.listing.article_origin = article_origin;
		return this;
	}

	article(article_id, article_name, article_condition) {
		assert(typeof article_id == 'string' && article_id.length == 14, `Expected '${article_id}' to be a string of length 14!`);
		assert(typeof article_name == 'string' && article_name.length > 0, 'Expected article_name to be a non empty string!');
		assert(typeof article_condition == 'string' && article_name.length > 0, 'Expected article_condition to be a non empty string!');
		this.listing.article_id = article_id;
		this.listing.article_name = article_name;
		this.listing.article_condition = article_condition;
		return this;
	}

	build() {
		this.listing.assert_init()
		return this.listing;
	}
}

/** Represents a ebay auction listing at a specific point of time */
class AuctionListing {
	date_scraped;
	date_auction_end;
	

	article_id;
	article_name;
	article_condition; // should be ignored, not every listing states the condition // new, open_box, used, for_parts_not_working 
	article_origin;

	user_name;
	user_rating; // number between 0 and 100
	user_times_rated; // non negative
	user_is_comercial; // should be ignored, not every listing states comercial status
	
	is_finished;
	price_current;
	price_delivery; // should be ignored, not every article can be delivered

	/** constructs an AuctionListing with all fields initialized to null */
	constructor() {
		this.article_id = null;
		this.date_scraped = null;
		this.date_auction_end = null;
		this.article_name = null;
		this.article_condition = null; //  new, open_box, used, for_parts_not_working
		this.article_origin = null;
		this.user_name = null;
		this.user_rating = null; // number between 0 and 100
		this.user_times_rated = null; // non negative
		this.user_is_commercial = null;
		this.price_current = null;
		this.price_delivery = null;
	}

	/** asserts that all fields are not neither null nor undefined */
	assert_init() {
		assert(
			this.article_id != null &&
			this.date_scraped != null &&
			this.date_auction_end != null &&
			this.article_name != null &&
			this.article_condition != null &&
			this.article_origin != null &&
			this.user_name != null &&
			this.user_rating != null &&
			this.user_times_rated != null &&
			this.user_is_comercial != null &&
			this.price_current != null &&
			this.price_delivery != null,
			'Some fields of AuctionListing are not initialized and equal to either null or undefined!',
		);
	}

	clone() {
		let copy = new AuctionListing();
		copy.article_id = this.article_id;
		copy.date_scraped = this.date_scraped;
		copy.date_auction_end = this.date_auction_end;
		copy.article_name = this.article_name;
		copy.article_condition = this.article_condition;
		copy.article_origin = this.article_origin;
		copy.user_name = this.user_name;
		copy.user_rating = this.user_rating;
		copy.user_times_rated = this.user_times_rated;
		copy.user_is_commercial = this.user_is_commercial;
		copy.price_current = this.price_current;
		copy.price_delivery = this.price_delivery;
		return copy;
	}

	toString() {
		return `<AuctionListing ${this.article_id} EUR${this.price_current}>`
	}
}


class Message {
	type;
	data;

	/**
		* Represents a message
		* @param {string} type - type of the message
		* @param {any} data - data contained by the message
		*/
	constructor(type, data) {
		this.type = type;
		this.data = data;
	}
}
