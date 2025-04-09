console.log('Content script started.');


/**
	* Determines sellers username, rating and the number of ratings from a ebay seller info text.
	* @param {string} s - follow the pattern '<username> (<times_rated>) <rating>%'
	* @return [{string} username, {number} times_rated, {number} rating]
	* @throws {Error} if s contains no match
*/
function parse_seller_info(s) {
	let match = s.match(/\s*(?<username>\S+)\s+\((?<times_rated>(?:\d+\.)*\d+)\)\s(?<rating>\d+(?:,\d+)?)%/);
	if (match == null) {
		throw Error(`'${s}' does not follow the pattern '<username> (<times_rated>) <rating>%'!`);
	}
	let groups = match.groups,
		username = groups.username,
		times_rated = Number(groups.times_rated.replace('.','')),
		rating = Number(groups.rating.replace(',','.'));
	return [username, times_rated, rating];
}

function test_parse_seller_info() {
	assert(parse_seller_info("alexander_1337 (305) 100%").equals(["alexander_1337", 305, 100]));
	assert(parse_seller_info("sellcraft (0) 0%").equals(["sellcraft", 0, 0]));
	assert(parse_seller_info("shaadar (1.509) 99,9%").equals(["shaadar", 1509, 99.9]));
}

/** 
	* Determines the auction end date-time from a string in ebays time notation.
	* @param {string} s - follows the patterns:
	* P1: 'Noch <hours> h <minutes> Min'
	* P2: 'Noch <day>d <hours>h (<weekday>, <hour>:<minute>)'
	* @param {Date} now - when the DOM was scraped
	* @returns {Date} auction_end
	* @throws {Error} if s contains no match
*/
function parse_auction_end_date(s, now) {
	let days_left = s.match(/(?<days_left>\d+)\s*T/),
		hours_left = s.match(/(?<hours_left>\d+)\s*Std/),
		minutes_left = s.match(/(?<minutes_left>\d+)\s*Min/);
		weekday_hour_min = s.match(/\((?<weekday>\w+),\s(?<hour>\d\d):(?<minute>\d\d)\)/);
	let	auction_end,
		ms_left;
	
	if (days_left != null && hours_left != null && weekday_hour_min != null) {
		// '<days_left>T <hours_left>Std (<weekday>, <hour>:<min>)'
		days_left = Number(days_left.groups.days_left); 
		hours_left = Number(hours_left.groups.hours_left);
		minute = Number(weekday_hour_min.groups.minute);

		ms_left = (24 * days_left + hours_left) * 60 * 60 * 1000;
		auction_end = new Date(now.getTime() + ms_left);
		auction_end.setMinutes(minute);


	} else if (hours_left != null && minutes_left != null) {
		// '<hours_left>Std <minutes_left> Min'
		hours_left = Number(hours_left.groups.hours_left),
		minutes_left = Number(minutes_left.groups.minutes_left),

		ms_left = (hours_left * 60 + minutes_left) * 60 * 1000,
		auction_end = new Date(now.getTime() + ms_left);

	} else if (days_left != null) {
		// '<days_left>T'
		days_left = Number(days_left.groups.days_left);

		ms_left = days_left * 24 * 60 * 60 * 1000;
		auction_end = new Date(now.getTime() + ms_left);
		
	} else if (hours_left != null) {
		// '<hours_left>Std'
		hours_left = Number(hours_left.groups.hours_left);

		ms_left = hours_left * 60 * 60 * 1000;
		auction_end = new Date(now.getTime() + ms_left);

	} else {
		throw Error(`'${s}' does not match any pattern.`);
	}
	return auction_end;
}

function test_parse_auction_end_date() {
	let now = new Date(2025, 0, 1, 0, 0); // 1 Januar 2025 wtf
	assert(parse_auction_end_date("Noch 17Std 40 Min", now).getTime() == new Date(2025, 0, 1, 17, 40).getTime());
	assert(parse_auction_end_date("Noch 6T 16Std (Sa, 16:10)", now).getTime() == new Date(2025, 0, 7, 16, 10).getTime());
	assert(parse_auction_end_date("Noch 366T 11Std (Mo, 11:54)", now).getTime() == new Date(2026, 0, 2, 11, 54).getTime());
	assert(parse_auction_end_date("Noch 11Std", now).getTime() == new Date(2025, 0, 1, 11, 0).getTime());
}

/**
	* Determines when an article was auctioned off.
	* @param {string} s - follows the pattern 'Vekauft <day>. <Month> <Year>'
	* @returns {Date}
	*/
function parse_auction_finish_caption(s) {
	let match = s.match(/Verkauft\s+(?<day>\d+)\.\s*(?<month>\w+)\s(?<year>\d+)/);
	if (match == null) {
		throw Error(`'${s}' does not follow the pattern 'Vekauft <day>. <Month> <Year>'`);
	}
	let groups = match.groups,
		day = Number(groups.day),
		year = Number(groups.year),
		month_short_form = groups.month,
		months = ['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']; // idk if this are the correct short forms ebay is using
		month = months.indexOf(month_short_form);
	if (month < 0) {
		throw Error(`Unkown month '${month_short_form}' detected! Please contact a developer of this extension.`);
	}
	return new Date(year, month, day);
}

function test_parse_auction_finish_caption(s) {
	assert(parse_auction_finish_caption("Verkauft 30. Mrz 2025").getTime() == new Date(2025, 3-1, 30).getTime());
	assert(parse_auction_finish_caption("Verkauft 25. Feb 2025").getTime() == new Date(2025, 2-1, 25).getTime());
}

/**
	* Determines article condition and weather the article is sold comercially from an ebay article subtitle string.
	* @param {string} s - follows the pattern '<article_condition>|<comercial>'
	* @returns [{string} article_condition, {string} is_comercial]
	* @throws {Error} if s contains no match
*/
function parse_subtitle(s) {
	let match = s.match(/(?<condition>\S.*\S)\s?\|\s?(?<is_comercial>\S.*\S)/);
	if (match == null) {
		throw Error(`'${s}' does not follow the pattern '<article_condition> | <comercial>'!`);
	}
	let groups = match.groups;
	return [groups.condition, groups.is_comercial == 'Gewerblich'];
}

function test_parse_subtitle() {
	//console.log(parse_subtitle("Nur Ersatzteile | Privat"));
	assert(parse_subtitle("Nur Ersatzteile | Privat").equals(["Nur Ersatzteile", false]));
	assert(parse_subtitle("Brandneu | Gewerblich").equals(["Brandneu", true]));
	assert(parse_subtitle("Neu (Sonstige) | Privat").equals(["Neu (Sonstige)", false]));
}

/**
	* Outputs the first currency notated price found in s.
	* @param {string} s - contains a currency notated price
	* @returns {number} price
	* @throws {Error} if s contains no match
*/
function parse_price(s) {
	let match = s.match(/(?<currency>EUR)\s(?<price>(?:\d+\.)*(?:\d+)(?:,\d+)?)/)
	if (match == null) {
		throw Error(`'${s}' did not contain a currency notated price`);
	}
	let groups = match.groups;
	let price = Number(groups.price.replace('.', '').replace(',','.')); // german notation
	return price;
}

function test_parse_price() {
	assert(parse_price("EUR 5.000,00") == 5000)
	assert(parse_price("EUR 55,00") == 55)
	assert(parse_price("+EUR 800,00") == 800)
	assert(parse_price("+EUR 3,90") == 3.90)
}


/**
	* Determines the country name from an ebay listing country string.
	* @param {string} s - follows the pattern 'aus <country>'
	* @return {string} country
	*/
function parse_item_location(s) {
	let match = s.match(/aus\s+(?<country>\S+)/);
	if (match == null) {
		throw Error(`'${s}' does not follow the pattern 'aus <country>'!`)
	}
	return match.groups.country;
}

function test_parse_item_location(s) {
	assert(parse_item_location("aus Niederlande") == "Niederlande");
	assert(parse_item_location("aus China") == "China");
}
	
/** Creates a AuctionListing object from an ebay DOM listing element
	* @param {HTMLElement} listing_elem
	* @param {Date} scrape_date - when the HTML response was received
	* @return {AuctionListing} listing or null if listing_elem is of format 'buy it now' or an advertisement.
	* @throws {Error} if listing_elem is not an listing_elem
	*/
function scrape_listing(listing_elem, scrape_date) {
	assert(listing_elem instanceof HTMLElement, `Expected '${listing_elem}' to be instanceof HTMLElement!`)
	assert(scrape_date instanceof Date, `Expected '${scrape_date}' to be instanceof Date!`)
	//console.log(listing_elem);
	let article_id = listing_elem.getAttribute('id');
	let article_name_elem = listing_elem.querySelector('span[role="heading"]');
	let article_name = article_name_elem.innerText;

	let buy_it_now_elem = listing_elem.querySelector('.s-item__formatBuyItNow');
	if (buy_it_now_elem != null) {
		// this is a 'buy it now' listining and therefore no auction.
		return null;
	}

	let ad_elems = listing_elem.querySelector('.data-w');
	if (ad_elems != null) {
		// this is an ad, and we ignore ads
		return null;
	}
	// let best_offer_enabled_elem = listing_elem.querySelector('.s-item__formatBestofferEnabled');

	// get (possibly future) auction end date
	let time_elem = listing_elem.querySelector('.s-item__time');
	let finish_elem = listing_elem.querySelector('.s-item__caption--signal.POSITIVE');
	let auction_end;
	let is_finished;
	if (time_elem != null) {
		// auction not yet finished
		auction_end = parse_auction_end_date(time_elem.innerText, scrape_date);
		is_finished = false;
	} else if (finish_elem != null) {
		// auction already finished
		auction_end = parse_auction_finish_caption(finish_elem.innerText);
		is_finished = true;
	} else {
		// auction has ended without any bid
		// we ignore such listings
		return null;
	}

	// let subtitle_elem = listing_elem.querySelector('.s-item__subtitle:has(.SECONDARY_INFO)');
	//let [article_condition, is_comercial] = parse_subtitle(subtitle_elem.innerText);
	// not for every article a condition or comercial statement can be found therefore we ignore it for all.
	let [article_condition, is_comercial] = ["unkown", false];

	let item_location_elem = listing_elem.querySelector('.s-item__itemLocation'),
		article_origin;
	if (item_location_elem == null) {
		// ebay omits item_location for our current country.
		article_origin = "Deutschland";
	} else {
		article_origin = parse_item_location(item_location_elem.innerText);
	}

	let seller_info_elem = listing_elem.querySelector('.s-item__seller-info');
	let user_name, user_times_rated, user_rating;
	if (seller_info_elem != null) {
		[user_name, user_times_rated, user_rating] = parse_seller_info(seller_info_elem.innerText);
	} else {
		return null;
	}

	let price_elem = listing_elem.querySelector('.s-item__price');
	let price_current = parse_price(price_elem.innerText);

	//console.log(listing_elem);
	/*
	let logistics_cost_elem = listing_elem.querySelector('.s-item__logisticsCost'),
		price_delivery;
	if (logistics_cost_elem == null) {
		logistics_cost_elem = listing_elem.querySelector('.s-item__paidDeliveryInfo');
	}
	if (logistics_cost_elem.innerText.includes('Gratis')) {
		price_delivery = 0;
	} else {
		price_delivery = parse_price(logistics_cost_elem.innerText);
	}
	*/
	let price_delivery = NaN; // we ignore delivery, since not every article can be delivered
	
	return new AuctionListingBuilder().user(
		user_name,
		user_rating,
		user_times_rated,
		is_comercial,
	).article(
		article_id,
		article_name,
		article_condition,
	).auction(
		is_finished,
		price_current,
		price_delivery,
		auction_end,
		article_origin,
	).build()
}

/**
	* Find all auction listings in current DOM.
	* @returns {Array<AuctionListing>} all auction listings
	*/
function scrape_listings_from_current_page() {
	let scrape_date = new Date(document.lastModified), 
		listing_elems = document.querySelectorAll('.srp-results > .s-item'),
		listings = [];
	for ( listing_elem of listing_elems) {
		try {
			listings.push(scrape_listing(listing_elem, scrape_date));
		} catch (error) {
			console.log(listing_elem);
			console.log(error);
		}
	}
	listings = listings.filter(x => x != null);
	return listings;
}

// testing
console.log("testing:");
try {
	test_parse_price()
	test_parse_subtitle()
	test_parse_seller_info()
	test_parse_auction_end_date()
	test_parse_item_location()
	test_parse_auction_finish_caption()
	console.log("all test successfull, waiting for requests ...")
} catch(error) {
	console.log("test failed with error:")
	console.log(error);
}

// request handler
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (typeof msg != "object" || !msg.type ) {
		throw Error(`Received invalid message '${JSON.stringify(msg)}'.`); 
	}
	console.log(`Received message ${JSON.stringify(msg)}.`);
	let type = msg.type,
		data = msg.data;

	if (type == 'dummy') {
		console.log(`dummy data: ${data}.`);

	} else if (type == 'get listings') {
		let listings = scrape_listings_from_current_page();
		console.log(`Found ${listings.length} listings on current page.`);
		console.log(sendResponse);
		sendResponse({ type: "return listings", data: listings });

	} else {
		throw Error(`Received unexpected message '${msg}'.`);
	}
})
