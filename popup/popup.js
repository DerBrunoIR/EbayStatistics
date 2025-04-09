
console.log('popup.js started');
let listings = [];


document.addEventListener('DOMContentLoaded', () => {
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
	let chartSellingPrices, chartSellingPricesVsTime, chartSellingPricesVsRating;


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

		// update stats
		let prices = listings.map((listing) => listing.price_current)
		avg.innerText = Math.round(ss.mean(prices));
		median.innerText = Math.round(ss.median(prices));
		std.innerText = Math.round(ss.standardDeviation(prices));
		p100.innerText = Math.round(ss.quantile(prices, 1));
		p75.innerText = Math.round(ss.quantile(prices, .75));
		p50.innerText = Math.round(ss.quantile(prices, .50));
		p25.innerText = Math.round(ss.quantile(prices, .25));

		// update distribution of sellingPrices
		let max = ss.max(prices);
		max = max + 100 - max % 100;
		let min = ss.min(prices);
		min = min - min % 100;
		if (chartSellingPrices) chartSellingPrices.destroy();
		chartSellingPrices = new Chart(sellingPrices, {
			type: 'bar',
			data: {
			labels: Array.from({length: Math.round((max - min)/100)}).map((_, idx) => min + 100 * idx),
			  datasets: [{
				label: 'Count',
				data: prices,
				borderWidth: 1,
			  }]
			},
			options: {
				scales: {
					y: {
						beginAtZero: true
					}
				}
			}
		});

		// update prices vs time
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
			labels: days,
			options: {
				y: {
					beginAtZero: true
				}
			}
		});

		// update prices vs user rating
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
					label: 'EUR',
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

	// load locally stored listings 
	browser.storage.local.get({ listings: [] })
		.then((res) => {
			if (listings.length == 0 && res.listings.length > 0) 
				enableClearListingsBtn();
			listings = res.listings;
			updatePopup(listings);
		})


	// communicate to content script
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

		// listen for add listings button clicks
		addListingsBtn.addEventListener('click', (event) => {
			if (!event.isPrimary) {
				// we ignore non primary clicks
				return;
			}
			// send request to listing scraper
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
					console.log(`Received ${data.length} listings.`);
					if (listings.length == 0 && data.length > 0) 
						enableClearListingsBtn();
					console.log(listings);
					listings = listings.concat(data);
					updatePopup(listings);
					browser.storage.local.set({listings: listings});
				} else {
					throw Error(`Received unexpected message '${response}'`);
				}
			});
		});

		// listen for clear btn clicks
		clearListingsBtn.addEventListener('click', (event) => {
			if (!event.isPrimary) {
				// we ignore non primary clicks
				return;
			}
			console.log('clearing listings');
			listings = [];
			browser.storage.local.set({listings: listings});
			disableClearListingsBtn();
		});
	});
});
