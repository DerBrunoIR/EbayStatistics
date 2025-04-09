# EbayStatistics

A Firefox extension for visualizing eBay auction price data in different charts and calculating some statistics, like mean, median, and quantiles.

# Images

<img src="https://github.com/user-attachments/assets/a8019c24-bba2-4c95-bbb5-1b54c9b4d628" width="60%">
<img src="https://github.com/user-attachments/assets/a5404a97-9c22-438b-9f31-0f143df1da2b" width="60%">
<img src="https://github.com/user-attachments/assets/015acf00-6cdb-4c35-b764-fb486ae23701" width="60%">
<img src="https://github.com/user-attachments/assets/8aa4af07-e93f-4b49-bd50-bce478b74720" width="60%">
<img src="https://github.com/user-attachments/assets/6ec98e5b-6211-4c0f-b989-7d2909c1233c" width="60%">

# How to install
Currently, you have to install this extension as a temporary debug extension.
That means:
1. download this repository
2. go to `Manage Extensions`
3. settings wheel
4. debug addon
5. load temporary addon
6. select the `manifset.json` from this repository.
Then it should be installed.

# How to use
1. visit [www.ebay.de](www.ebay.de)
2. perform a search
3. open extension popup
4. press the `add listings` button
5. go back to 2 for adding more listings or take a look at the charts

I recommend using the `advanced search` and increasing the number of listings per page to 240.
Additionally, you could choose to display only sold listings and exclude terms linked to other articles.
Sorting by end time could be useful too.

# Issues
Changes made to the eBay UI could break this extension.
