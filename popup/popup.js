
console.log('popup.js alive');
let listings = [];

/**
	* Sorts all values from array ascending into k buckets.
	* @param {Array<Number>} array - non negative numbers
	* @param {Number} k - non negative bucket count 
	* @returns {Array<Array<Number>>} 
	*/
function bucketSort(array, k) {
	assert(k > 0, "Expected k to be non negative!");
	let buckets = new Array(k);
		max = ss.max(array) + 1;
	for (let i = 0; i < k; i++) {
		buckets[i] = [];
	}
	for (const val of array) {
		assert(val >= 0, `Expected '${val}' to be non negative.`)
		let idx = Math.floor(k * val / max);
		//console.log(`idx = floor(${k} * ${val} / ${max}) = ${idx}`)
		buckets[idx].push(val);
	}
	return buckets;
}


// first js project ends up in a callback hell, next time I will try async await.
document.addEventListener('DOMContentLoaded', () => {

	// page elements
	let sellingPrices = document.querySelector('#SellingPrices'),
		sellingPricesVsTime = document.querySelector('#SellingPricesVsTime'),
		sellingPricesVsRating = document.querySelector('#SellingPricesVsRating'),
		addListingsBtn = document.querySelector('#addListingsBtn'),
		clearListingsBtn = document.querySelector('#clearListingsBtn'),
		listingTableBody = document.querySelector('#listingTableBody'),
		avg = document.querySelector('#avg'),
		media = document.querySelector('#median'),
		std = document.querySelector('#std'),
		p100 = document.querySelector('#p100'),
		p75 = document.querySelector('#p75'),
		p50 = document.querySelector('#p50'),
		p25 = document.querySelector('#p25'),
		countListings = document.querySelector('#countListings');
	// chart variables
	let chartSellingPrices, chartSellingPricesVsTime, chartSellingPricesVsRating;
	

	// AddListingBtn
	function enableAddListingsBtn() {
		addListingsBtn.classList.remove('disabled');
		addListingsBtn.classList.remove('btn-grey');
		addListingsBtn.classList.add('btn-primary');
	}
	function disableAddListingsBtn() {
		addListingsBtn.classList.add('disabled');
		addListingsBtn.classList.add('btn-grey');
		addListingsBtn.classList.remove('btn-primary');
	}

	// ClearListingsBtn
	function enableClearListingsBtn() {
		clearListingsBtn.classList.remove('disabled');
		clearListingsBtn.classList.remove('btn-grey');
		clearListingsBtn.classList.add('btn-danger');
	}
	function disableClearListingsBtn() {
		clearListingsBtn.classList.add('disabled');
		clearListingsBtn.classList.add('btn-grey');
		clearListingsBtn.classList.remove('btn-danger');
	}

	/**
		* Display given listings in DOM.
		* @param {Array<AuctionListing>} listings - to be displayed
		* @affects all previously declard page elements, chart variables and the DOM.
		*/
	function updatePopup(listings) {
		// update listing count
		countListings.innerText = listings.length

		// update listing data
		let newListingTableBody = listingTableBody.cloneNode(false);
		listings
			.slice(0, 100)
			.forEach((listing) => {
			let tr = document.createElement('tr');
			let date = listing.date_auction_end;
			tr.innerHTML = `
					<td>${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}</td>
					<td>${listing.user_name}</td>
					<td>(${listing.user_times_rated})</td>
					<td>${listing.user_rating}%</td>
					<td>${listing.price_current}</td>
					`;
			newListingTableBody.appendChild(tr);
		});
		listingTableBody.replaceWith(newListingTableBody);
		listingTableBody = newListingTableBody;

		// update statistics
		let prices = listings.map((listing) => listing.price_current)
		avg.innerText = prices.length > 0? Math.round(ss.mean(prices)): NaN;
		median.innerText = Math.round(ss.median(prices));
		std.innerText = Math.round(ss.standardDeviation(prices));
		p100.innerText = Math.round(ss.quantile(prices, 1));
		p75.innerText = Math.round(ss.quantile(prices, .75));
		p50.innerText = Math.round(ss.quantile(prices, .50));
		p25.innerText = Math.round(ss.quantile(prices, .25));

		// update selling price historgram
		let bucketCount = 10;
		let buckets = bucketSort(prices, bucketCount);
		if (chartSellingPrices) chartSellingPrices.destroy();
		chartSellingPrices = new Chart(sellingPrices, {
			type: 'bar',
			data: {
				labels: buckets.map((bucket) => bucket.length > 0 ? `${Math.round(ss.min(bucket))}-${Math.round(ss.max(bucket))}` : ""),
				datasets: [{
					label: 'Count',
					data: buckets.map((bucket) => bucket.length),
					borderWidth: 1,
				}]
			},
			options: {
				y: {
					beginAtZero: true
				}
			}
		});

		// update prices vs time line diagram
		let days = [...new Set(listings.map((listing) => listing.date_auction_end))].sort((a, b) => a > b);
		let median_daily_selling_price = days.map((day) => {
			return {
				x: `${day.getDate()}.${day.getMonth()+1}.${day.getFullYear()}`,
				y: ss.median(listings.filter(
					(listing) => listing.date_auction_end.toDateString() == day.toDateString()
				).map((listing) => listing.price_current))
			}
		});
		if (chartSellingPricesVsTime) chartSellingPricesVsTime.destroy();
		chartSellingPricesVsTime = new Chart(sellingPricesVsTime, {
			type: 'line',
			data: {
				datasets: [{
					label: 'EUR',
					data: median_daily_selling_price,
					pointRadius: 0
				}],
			},
			options: {
				y: {
					beginAtZero: true
				}
			}
		});

		// update prices vs user rating scatter plot
		let rating_selling_price = listings.map((listing) => {
			return {
				x: listing.user_rating,
				y: listing.price_current
			}
		});
		if (chartSellingPricesVsRating) chartSellingPricesVsRating.destroy();
		chartSellingPricesVsRating = new Chart(sellingPricesVsRating, {
			type: 'scatter',
			data: {
				datasets: [{
					label: '(rating, price)',
					data: rating_selling_price,
				}],
			},
			options: {
				scales: {
					x: {
						suggestedMin: -10,
						suggestedMax: 110,
					}, 
					y: {
						suggestedMin: 0,
					}
				}
			}
		});
	}
	// we are back in the 'DOMContentLoaded' listener


	// load previously locally stored listings 
	browser.storage.local.get({ listings: [] })
		.then((res) => {
			if (listings.length == 0 && res.listings.length > 0) 
				enableClearListingsBtn();
			listings = res.listings;
			updatePopup(listings);
		})


	// interact with content script
	browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
		let tab = tabs[0];
		if (!tab || !tab.id) {
			throw Error("Could not determine active tab.");
		}
		// an acitve tab exists
		browser.tabs.sendMessage(
			tab.id,
			{
				type: "dummy",
				data: "check if scraper is alive",
			},
		).then(enableAddListingsBtn)
		.catch((error) => {
			console.log("No scraper found.");
			disableAddListingsBtn();
		});


		// user wants to add listings
		addListingsBtn.addEventListener('click', (event) => {
			if (!event.isPrimary) {
				// we ignore non primary clicks
				return;
			}
			// ask scraper.js for listings
			console.log('requesting listings')
			browser.tabs.sendMessage(
				tab.id,
				{
					type: "get listings",
					data: null,
				},
			).then((response) => {
				if (typeof response != "object" || !response.type || !response.data) {
					throw Error(`Received invalid message '${JSON.stringify(response)}'`);
				}
				console.log(`Received message: ${JSON.stringify(response)}`);
				let type = response.type,
					data = response.data;
				if (type == "return listings") {
					// we received listings
					console.log(`Received ${data.length} listings.`);
					listings = listings.concat(data);
					if (listings.length > 0)
						enableClearListingsBtn();
					updatePopup(listings);
					browser.storage.local.set({listings: listings});
				} else {
					// we did not receive listings
					throw Error(`Received unexpected message '${response}'`);
				}
			});
		});


		// user wants to clear listings
		clearListingsBtn.addEventListener('click', (event) => {
			if (!event.isPrimary) {
				// we ignore non primary clicks
				return;
			}
			console.log('clearing listings');
			listings = [];
			browser.storage.local.set({listings: []});
			disableClearListingsBtn();
		});
	});
});
