

document.addEventListener('DOMContentLoaded', () => {

	let SellingPricesHistogram = document.querySelector('#SellingPrices'),
		SellingPricesVsTime = document.querySelector('#SellingPricesVsTime'),
		SellingPricesVsRating = document.querySelector('#SellingPricesVsRating');

	for (ctx of [SellingPricesHistogram, SellingPricesVsTime, SellingPricesVsRating]) {
	  new Chart(ctx, {
		type: 'bar',
		data: {
		  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
		  datasets: [{
			label: '# of Votes',
			data: [12, 19, 3, 5, 2, 3],
			borderWidth: 1
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
	}
});

